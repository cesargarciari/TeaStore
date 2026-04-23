#!/usr/bin/env bash
# Experiment runner for SENG 533 Group 19 — TeaStore performance evaluation.
# Runs all 12 trials: 2 policies (HPA, Fixed) x 3 load levels (10, 50, 100) x 2 replications.
#
# Prerequisites:
#   - Cluster is running and kubectl is configured (run setup_cluster.sh first if unsure)
#   - metrics-server is deployed in kube-system
#   - TeaStore is deployed: kubectl apply -f examples/kubernetes/teastore-clusterip.yaml
#   - Apache JMeter is installed (or set JMETER_BIN env variable)
#
# Usage:
#   ./experiments/run_experiments.sh [NODE_IP] [WEBUI_PORT]
#
#   NODE_IP    — IP/hostname of the Kubernetes node (auto-detected if omitted)
#   WEBUI_PORT — NodePort for teastore-webui (default: 30080)
#
# Environment overrides:
#   JMETER_BIN  — path to jmeter executable (default: jmeter)
#   SKIP_POLICY — "hpa" or "fixed" to run only one policy set

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
WEBUI_PORT="${2:-30080}"
JMETER_BIN="${JMETER_BIN:-jmeter}"
JMX_FILE="$(dirname "$0")/../examples/jmeter/teastore_browse.jmx"
RESULTS_DIR="$(dirname "$0")/results"
K8S_DIR="$(dirname "$0")/../examples/kubernetes"
SKIP_POLICY="${SKIP_POLICY:-}"   # set to "hpa" or "fixed" to skip that policy

RAMP_UP=30          # seconds
DURATION=600        # seconds (10-minute steady-state)
COOLDOWN=120        # seconds between runs — allows pods to scale back down
FIXED_REPLICAS=2    # replica count for the Fixed policy

SCALABLE_SERVICES=(
  teastore-webui
  teastore-auth
  teastore-image
  teastore-recommender
  teastore-persistence
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()  { echo "[$(date '+%H:%M:%S')] $*"; }
ok()   { echo "[$(date '+%H:%M:%S')] ✓  $*"; }
warn() { echo "[$(date '+%H:%M:%S')] ⚠  $*" >&2; }
die()  { echo "[$(date '+%H:%M:%S')] ✗  $*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# NODE_IP resolution — use arg, then auto-detect by cluster type
# ---------------------------------------------------------------------------
resolve_node_ip() {
  if [[ -n "${1:-}" ]]; then
    NODE_IP="$1"
    log "Using provided NODE_IP: ${NODE_IP}"
    return
  fi

  log "Auto-detecting NODE_IP..."

  # k3d routes NodePort traffic through its loadbalancer container, which is
  # mapped to localhost via --port at cluster creation time.
  # Detection: k3d is installed AND at least one cluster exists (no 'k3s' grep —
  # that word never appears in k3d cluster list output).
  if command -v k3d &>/dev/null && \
     k3d cluster list --no-headers 2>/dev/null | grep -q '.'; then
    NODE_IP="localhost"
    ok "k3d detected — NODE_IP=localhost"
    return
  fi

  # minikube reports its own IP
  if command -v minikube &>/dev/null; then
    NODE_IP=$(minikube ip 2>/dev/null || echo "")
    if [[ -n "$NODE_IP" ]]; then
      ok "minikube detected — NODE_IP=${NODE_IP}"
      return
    fi
  fi

  # Generic: use the InternalIP of the first node
  NODE_IP=$(kubectl get nodes \
    -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' \
    2>/dev/null || echo "")

  if [[ -z "$NODE_IP" ]]; then
    NODE_IP="localhost"
    warn "Could not auto-detect node IP — defaulting to localhost."
  else
    ok "Node IP from kubectl: ${NODE_IP}"
  fi
}

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
check_prerequisites() {
  log "Running pre-flight checks..."

  # kubectl
  if ! command -v kubectl &>/dev/null; then
    die "kubectl not found. Run setup_cluster.sh first or add kubectl to PATH."
  fi

  # JMeter
  if ! command -v "$JMETER_BIN" &>/dev/null; then
    die "jmeter not found. Install Apache JMeter and ensure it is on PATH, or set JMETER_BIN=/path/to/jmeter."
  fi

  # Cluster connectivity with retries
  log "Verifying cluster connectivity..."
  local retries=3
  local wait=5
  for i in $(seq 1 $retries); do
    if kubectl cluster-info &>/dev/null; then
      ok "Cluster is reachable."
      break
    fi
    if [[ $i -eq $retries ]]; then
      die "Cannot reach cluster after $retries attempts.
  Run: ./experiments/setup_cluster.sh --restart
  Then retry this script."
    fi
    warn "Connectivity attempt $i/$retries failed — retrying in ${wait}s..."
    sleep $wait
    wait=$((wait * 2))
  done

  # metrics-server
  if ! kubectl get apiservice v1beta1.metrics.k8s.io &>/dev/null; then
    warn "metrics-server API service not found — HPA CPU metrics will show <unknown>."
    warn "Fix: ./experiments/setup_cluster.sh   (installs metrics-server automatically)"
  fi

  # TeaStore deployed
  if ! kubectl get deployment teastore-webui &>/dev/null; then
    die "teastore-webui deployment not found.
  Run: kubectl apply -f examples/kubernetes/teastore-clusterip.yaml"
  fi

  # WebUI reachable
  log "Probing WebUI at http://${NODE_IP}:${WEBUI_PORT}/tools.descartes.teastore.webui/ ..."
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    --connect-timeout 5 --max-time 10 \
    "http://${NODE_IP}:${WEBUI_PORT}/tools.descartes.teastore.webui/" 2>/dev/null) || true
  if [[ "$http_code" != "200" ]]; then
    die "WebUI returned HTTP ${http_code} (expected 200).
  Check: kubectl get pods
  Check: kubectl logs deployment/teastore-webui
  Verify NODE_IP (${NODE_IP}) and WEBUI_PORT (${WEBUI_PORT}) are correct."
  fi
  ok "WebUI is reachable (HTTP 200)."

  ok "All pre-flight checks passed."
}

# ---------------------------------------------------------------------------
# Cluster management
# ---------------------------------------------------------------------------
wait_for_deployment() {
  local name="$1"
  kubectl rollout status "deployment/$name" --timeout=120s
}

wait_for_all_scalable() {
  for svc in "${SCALABLE_SERVICES[@]}"; do
    wait_for_deployment "$svc"
  done
}

apply_hpa_policy() {
  log "=== Applying HPA policy ==="
  kubectl apply -f "$K8S_DIR/teastore-hpa.yaml"
  log "HPA resources created. Waiting 30s for HPA controller to initialise..."
  sleep 30
  kubectl get hpa 2>/dev/null || true
}

apply_fixed_policy() {
  log "=== Applying Fixed policy (${FIXED_REPLICAS} replicas, no HPA) ==="

  # Remove HPAs so they don't fight the fixed replica count.
  kubectl delete -f "$K8S_DIR/teastore-hpa.yaml" --ignore-not-found=true

  for svc in "${SCALABLE_SERVICES[@]}"; do
    kubectl scale deployment "$svc" --replicas="$FIXED_REPLICAS"
  done

  wait_for_all_scalable
  ok "Fixed policy applied — all services at ${FIXED_REPLICAS} replicas."
}

reset_to_baseline() {
  # Scale back to 1 replica so each HPA run starts from a clean state.
  log "Resetting scalable services to 1 replica (HPA baseline)..."
  for svc in "${SCALABLE_SERVICES[@]}"; do
    kubectl scale deployment "$svc" --replicas=1
  done
  wait_for_all_scalable
}

# ---------------------------------------------------------------------------
# HPA metric collector (background)
# ---------------------------------------------------------------------------
collect_hpa_metrics() {
  local out_file="$1"
  while true; do
    for svc in teastore-recommender teastore-webui teastore-auth \
                teastore-image teastore-persistence; do
      local hpa_name="${svc}-hpa"
      kubectl get hpa "$hpa_name" --no-headers 2>/dev/null \
        | awk -v ts="$(date '+%H:%M:%S')" -v svc="$svc" \
          '{printf "%s %-26s %-34s cpu: %s   desired=%-2s current=%-2s ready=%-2s\n",
             ts, svc, $2, $4, $5, $6, $7}' \
        >> "$out_file" 2>/dev/null || true
    done
    sleep 10
  done
}

# ---------------------------------------------------------------------------
# JMeter invocation
# ---------------------------------------------------------------------------
run_jmeter() {
  local users="$1"
  local report_dir="$2"
  local jtl_file="${report_dir}/results.jtl"

  rm -rf "${report_dir}/html_report"   # jmeter refuses to write to an existing dir
  mkdir -p "$report_dir"

  log "JMeter: ${users} users | ramp=${RAMP_UP}s | duration=${DURATION}s | target=http://${NODE_IP}:${WEBUI_PORT}"

  "$JMETER_BIN" -n \
    -t "$JMX_FILE" \
    -Jhostname="${NODE_IP}" \
    -Jport="${WEBUI_PORT}" \
    -JnumThreads="${users}" \
    -JrampUp="${RAMP_UP}" \
    -JdurationSec="${DURATION}" \
    -l "$jtl_file" \
    -e -o "${report_dir}/html_report" \
    2>&1 | tee "${report_dir}/jmeter.log"

  # Emit a quick summary from the JTL
  if [[ -f "$jtl_file" ]]; then
    local total errors
    total=$(tail -n +2 "$jtl_file" | wc -l | tr -d ' ')
    errors=$(tail -n +2 "$jtl_file" | awk -F',' '$8 != "true"' | wc -l | tr -d ' ')
    log "JMeter summary: total=${total} errors=${errors} error_rate=$(awk "BEGIN{printf \"%.1f%%\", ${errors}/${total}*100}")"
  fi
}

# ---------------------------------------------------------------------------
# Single trial
# ---------------------------------------------------------------------------
run_trial() {
  local policy="$1"   # hpa | fixed
  local users="$2"
  local rep="$3"

  local label="${policy}_${users}users_rep${rep}"
  local report_dir="${RESULTS_DIR}/${label}"

  log "======================================================"
  log "TRIAL START  policy=${policy}  users=${users}  rep=${rep}"
  log "======================================================"

  mkdir -p "$report_dir"

  # Snapshot replica counts before the run
  kubectl get deployments -o wide > "${report_dir}/pre_run_pods.txt" 2>/dev/null || true

  # Start HPA metric collection in the background
  local hpa_log="${report_dir}/hpa_metrics.txt"
  collect_hpa_metrics "$hpa_log" &
  local collector_pid=$!

  run_jmeter "$users" "$report_dir"

  kill "$collector_pid" 2>/dev/null || true
  wait "$collector_pid" 2>/dev/null || true

  # Snapshot replica counts after the run
  kubectl get deployments -o wide > "${report_dir}/post_run_pods.txt" 2>/dev/null || true

  log "Trial ${label} complete. Cooling down for ${COOLDOWN}s..."
  sleep "$COOLDOWN"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  resolve_node_ip "${1:-}"
  log "NODE_IP=${NODE_IP}  WEBUI_PORT=${WEBUI_PORT}"

  check_prerequisites
  mkdir -p "$RESULTS_DIR"

  # ------------------------------------------------------------------
  # POLICY 1: HPA (skip if SKIP_POLICY=hpa)
  # ------------------------------------------------------------------
  if [[ "$SKIP_POLICY" != "hpa" ]]; then
    apply_hpa_policy

    for users in 10 50 100; do
      for rep in 1 2; do
        reset_to_baseline
        run_trial hpa "$users" "$rep"
      done
    done
  else
    log "Skipping HPA trials (SKIP_POLICY=hpa)"
  fi

  # ------------------------------------------------------------------
  # POLICY 2: Fixed (skip if SKIP_POLICY=fixed)
  # ------------------------------------------------------------------
  if [[ "$SKIP_POLICY" != "fixed" ]]; then
    apply_fixed_policy

    for users in 10 50 100; do
      for rep in 1 2; do
        run_trial fixed "$users" "$rep"
      done
    done
  else
    log "Skipping Fixed trials (SKIP_POLICY=fixed)"
  fi

  log "======================================================"
  log "All trials complete. Results in: ${RESULTS_DIR}"
  log "======================================================"

  # Print result directory tree
  find "$RESULTS_DIR" -maxdepth 2 -type d | sort
}

main "$@"
