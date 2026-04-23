#!/usr/bin/env bash
# Experiment runner for SENG 533 Group 19 — TeaStore performance evaluation.
# Runs all 12 trials: 2 policies (HPA, Fixed) x 3 load levels (10, 50, 100) x 2 replications.
#
# Prerequisites:
#   - kubectl configured and pointing at the target cluster
#   - metrics-server running in the cluster (required for HPA CPU metrics)
#   - Apache JMeter installed and on PATH (or set JMETER_BIN below)
#   - TeaStore deployed via: kubectl apply -f examples/kubernetes/teastore-clusterip.yaml
#
# Usage:
#   ./experiments/run_experiments.sh [NODE_IP] [WEBUI_PORT]
#
# Defaults:
#   NODE_IP    = localhost
#   WEBUI_PORT = 30080 (NodePort exposed by teastore-webui service)

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration — edit these if your environment differs
# ---------------------------------------------------------------------------
NODE_IP="${1:-localhost}"
WEBUI_PORT="${2:-30080}"
JMETER_BIN="${JMETER_BIN:-jmeter}"
JMX_FILE="$(dirname "$0")/../examples/jmeter/teastore_browse.jmx"
RESULTS_DIR="$(dirname "$0")/results"
K8S_DIR="$(dirname "$0")/../examples/kubernetes"

RAMP_UP=30          # seconds
DURATION=600        # seconds (10-minute steady-state)
COOLDOWN=120        # seconds between runs to let the cluster stabilise
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
log() { echo "[$(date '+%H:%M:%S')] $*"; }

wait_for_deployment() {
  local name="$1"
  log "Waiting for deployment/$name to be ready..."
  kubectl rollout status "deployment/$name" --timeout=120s
}

wait_for_all_deployments() {
  for svc in "${SCALABLE_SERVICES[@]}"; do
    wait_for_deployment "$svc"
  done
}

apply_hpa_policy() {
  log "=== Applying HPA policy ==="
  kubectl apply -f "$K8S_DIR/teastore-hpa.yaml"
  log "HPA resources created. Waiting 30s for HPA to initialise..."
  sleep 30
}

apply_fixed_policy() {
  log "=== Applying Fixed policy (${FIXED_REPLICAS} replicas, no HPA) ==="

  # Remove all HPAs so the controller does not fight the fixed replica count.
  kubectl delete -f "$K8S_DIR/teastore-hpa.yaml" --ignore-not-found=true

  # Scale every scalable service to the fixed replica count.
  for svc in "${SCALABLE_SERVICES[@]}"; do
    kubectl scale deployment "$svc" --replicas="$FIXED_REPLICAS"
  done

  wait_for_all_deployments
}

reset_to_single_replica() {
  # Between runs: scale back to 1 so HPA starts from a clean baseline.
  log "Resetting all scalable services to 1 replica for clean start..."
  for svc in "${SCALABLE_SERVICES[@]}"; do
    kubectl scale deployment "$svc" --replicas=1
  done
  wait_for_all_deployments
}

collect_hpa_metrics() {
  local out_file="$1"
  # Record HPA status every 10 s in the background; caller kills the subshell.
  while true; do
    for svc in teastore-recommender teastore-webui teastore-auth teastore-image teastore-persistence; do
      kubectl get hpa "$svc-hpa" --no-headers 2>/dev/null \
        | awk -v ts="$(date '+%H:%M:%S')" -v svc="$svc" \
          '{printf "%s %-26s %-34s cpu: %s   %-5s %-5s %-5s\n", ts, svc, $2, $4, $5, $6, $7}' \
        >> "$out_file" 2>/dev/null || true
    done
    sleep 10
  done
}

run_jmeter() {
  local users="$1"
  local report_dir="$2"
  local jtl_file="${report_dir}/results.jtl"

  mkdir -p "$report_dir"

  log "Starting JMeter: ${users} users, ramp=${RAMP_UP}s, duration=${DURATION}s"
  "$JMETER_BIN" -n \
    -t "$JMX_FILE" \
    -Jhostname="$NODE_IP" \
    -Jport="$WEBUI_PORT" \
    -JnumThreads="$users" \
    -JrampUp="$RAMP_UP" \
    -JdurationSec="$DURATION" \
    -l "$jtl_file" \
    -e -o "${report_dir}/html_report" \
    2>&1 | tee "${report_dir}/jmeter.log"

  log "JMeter finished. Results at: ${report_dir}"
}

run_trial() {
  local policy="$1"    # hpa | fixed
  local users="$2"
  local rep="$3"

  local label="${policy}_${users}users_rep${rep}"
  local report_dir="${RESULTS_DIR}/${label}"

  log "======================================================"
  log "TRIAL: policy=${policy}  users=${users}  rep=${rep}"
  log "======================================================"

  mkdir -p "$report_dir"

  # Start HPA metric collection in background (only meaningful for HPA runs,
  # but harmless for fixed — HPAs simply won't be found).
  local hpa_log="${report_dir}/hpa_metrics.txt"
  collect_hpa_metrics "$hpa_log" &
  local collector_pid=$!

  run_jmeter "$users" "$report_dir"

  # Stop metric collector.
  kill "$collector_pid" 2>/dev/null || true
  wait "$collector_pid" 2>/dev/null || true

  log "Cooling down for ${COOLDOWN}s..."
  sleep "$COOLDOWN"
}

# ---------------------------------------------------------------------------
# Preflight checks
# ---------------------------------------------------------------------------
check_prerequisites() {
  log "Checking prerequisites..."

  if ! command -v kubectl &>/dev/null; then
    echo "ERROR: kubectl not found. Install kubectl and configure it to point at your cluster." >&2
    exit 1
  fi

  if ! command -v "$JMETER_BIN" &>/dev/null; then
    echo "ERROR: jmeter not found. Install Apache JMeter and ensure it is on PATH (or set JMETER_BIN env var)." >&2
    exit 1
  fi

  if ! kubectl get nodes &>/dev/null; then
    echo "ERROR: Cannot reach Kubernetes cluster. Check your kubeconfig." >&2
    exit 1
  fi

  # Verify metrics-server is available (HPA depends on it).
  if ! kubectl get apiservice v1beta1.metrics.k8s.io &>/dev/null; then
    echo "WARNING: metrics-server API service not found. HPA CPU metrics will not work." >&2
    echo "         Install metrics-server: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml" >&2
  fi

  # Verify TeaStore is deployed.
  if ! kubectl get deployment teastore-webui &>/dev/null; then
    echo "ERROR: teastore-webui deployment not found. Deploy TeaStore first:" >&2
    echo "       kubectl apply -f examples/kubernetes/teastore-clusterip.yaml" >&2
    exit 1
  fi

  log "Prerequisites OK."
}

# ---------------------------------------------------------------------------
# Main — execute all 12 trials
# ---------------------------------------------------------------------------
main() {
  log "TeaStore experiment runner — SENG 533 Group 19"
  log "Node IP: ${NODE_IP}  WebUI port: ${WEBUI_PORT}"
  log "Results will be written to: ${RESULTS_DIR}"

  check_prerequisites
  mkdir -p "$RESULTS_DIR"

  # ------------------------------------------------------------------
  # POLICY 1: HPA
  # ------------------------------------------------------------------
  apply_hpa_policy

  for users in 10 50 100; do
    for rep in 1 2; do
      reset_to_single_replica  # clean baseline before each HPA run
      run_trial hpa "$users" "$rep"
    done
  done

  # ------------------------------------------------------------------
  # POLICY 2: Fixed (2 replicas, no HPA)
  # ------------------------------------------------------------------
  apply_fixed_policy

  for users in 10 50 100; do
    for rep in 1 2; do
      run_trial fixed "$users" "$rep"
    done
  done

  log "======================================================"
  log "All 12 trials complete. Results in: ${RESULTS_DIR}"
  log "======================================================"
}

main "$@"
