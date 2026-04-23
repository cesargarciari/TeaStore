#!/usr/bin/env bash
# Cluster setup and recovery script for TeaStore experiments — k3d edition.
# Handles: cluster creation/restart, context switch, TeaStore deployment,
# metrics-server installation, and end-to-end readiness verification.
#
# Usage:
#   ./experiments/setup_cluster.sh [--restart] [--redeploy] [--cluster-name NAME]
#
#   --restart          Stop and restart the k3d cluster before deploying
#   --redeploy         Tear down and re-apply all TeaStore manifests
#   --cluster-name X   k3d cluster name to create/use (default: teastore)

set -euo pipefail

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
RESTART=false
REDEPLOY=false
K3D_CLUSTER_NAME="teastore"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --restart)               RESTART=true ;;
    --redeploy)              REDEPLOY=true ;;
    --cluster-name)          K3D_CLUSTER_NAME="$2"; shift ;;
    --cluster-name=*)        K3D_CLUSTER_NAME="${1#*=}" ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
  shift
done

K8S_DIR="$(cd "$(dirname "$0")/../examples/kubernetes" && pwd)"
METRICS_SERVER_URL="https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"
WEBUI_NODEPORT=30080

log()  { echo "[$(date '+%H:%M:%S')] $*"; }
ok()   { echo "[$(date '+%H:%M:%S')] ✓  $*"; }
warn() { echo "[$(date '+%H:%M:%S')] ⚠  $*" >&2; }
die()  { echo "[$(date '+%H:%M:%S')] ✗  $*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Step 1 — Locate required binaries
# ---------------------------------------------------------------------------
locate_binaries() {
  # kubectl — check common macOS paths if not on PATH
  if ! command -v kubectl &>/dev/null; then
    for p in /usr/local/bin/kubectl "$HOME/.rd/bin/kubectl" \
              /opt/homebrew/bin/kubectl "$HOME/.docker/bin/kubectl"; do
      if [[ -x "$p" ]]; then
        export PATH="$(dirname "$p"):$PATH"
        ok "kubectl found at $p"
        break
      fi
    done
  fi
  command -v kubectl &>/dev/null || \
    die "kubectl not found. Install: brew install kubectl"

  # k3d
  command -v k3d &>/dev/null || \
    die "k3d not found. Install: brew install k3d  OR  curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash"

  ok "kubectl: $(kubectl version --client --short 2>/dev/null | head -1)"
  ok "k3d:     $(k3d version | head -1)"
}

# ---------------------------------------------------------------------------
# Step 2 — k3d cluster: create or start
# ---------------------------------------------------------------------------
k3d_cluster_exists() {
  # k3d cluster list --no-headers prints one line per cluster; check by name
  k3d cluster list --no-headers 2>/dev/null | awk '{print $1}' | grep -qx "$K3D_CLUSTER_NAME"
}

k3d_cluster_running() {
  # Each server node shows as "1/1" when running vs "0/1" when stopped
  local servers
  servers=$(k3d cluster list --no-headers 2>/dev/null \
            | awk -v n="$K3D_CLUSTER_NAME" '$1==n {print $2}')
  # servers field is "X/Y"; running when X == Y and X > 0
  local running total
  running=$(echo "$servers" | cut -d/ -f1)
  total=$(echo "$servers"   | cut -d/ -f2)
  [[ -n "$total" && "$running" == "$total" && "$total" -gt 0 ]]
}

k3d_port_mapped() {
  # k3d names the loadbalancer container "k3d-<cluster>-serverlb".
  # docker inspect HostConfig.PortBindings contains "<port>/tcp" only if the
  # cluster was created with --port <port>:<port>@loadbalancer.
  docker inspect "k3d-${K3D_CLUSTER_NAME}-serverlb" 2>/dev/null \
    | grep -q "\"${WEBUI_NODEPORT}/tcp\""
}

setup_k3d_cluster() {
  if $RESTART && k3d_cluster_exists; then
    log "Stopping k3d cluster '${K3D_CLUSTER_NAME}'..."
    k3d cluster stop "$K3D_CLUSTER_NAME"
    log "Waiting 5s for Docker containers to exit..."
    sleep 5
  fi

  # If the cluster exists but was created without the NodePort mapping, it must
  # be deleted and recreated — k3d does not support adding port maps post-creation.
  if k3d_cluster_exists && ! k3d_port_mapped; then
    warn "Cluster '${K3D_CLUSTER_NAME}' exists but port ${WEBUI_NODEPORT} is not mapped to localhost."
    warn "This happens when the cluster was created before this script added --port to the create command."
    log "Deleting cluster '${K3D_CLUSTER_NAME}' so it can be recreated with the correct port mapping..."
    k3d cluster delete "$K3D_CLUSTER_NAME"
  fi

  if ! k3d_cluster_exists; then
    log "Creating k3d cluster '${K3D_CLUSTER_NAME}' with NodePort ${WEBUI_NODEPORT} mapped to localhost..."
    # --port maps host:30080 → container:30080 on the k3d loadbalancer so
    # JMeter (running on the host) can reach the webui NodePort via localhost.
    k3d cluster create "$K3D_CLUSTER_NAME" \
      --port "${WEBUI_NODEPORT}:${WEBUI_NODEPORT}@loadbalancer" \
      --wait
    ok "Cluster '${K3D_CLUSTER_NAME}' created."
  elif ! k3d_cluster_running; then
    log "Starting stopped k3d cluster '${K3D_CLUSTER_NAME}'..."
    k3d cluster start "$K3D_CLUSTER_NAME" --wait
    ok "Cluster '${K3D_CLUSTER_NAME}' started."
  else
    ok "k3d cluster '${K3D_CLUSTER_NAME}' is already running."
  fi

  # k3d writes the kubeconfig automatically; make sure the right context is active
  local ctx="k3d-${K3D_CLUSTER_NAME}"
  log "Switching kubectl context to '${ctx}'..."
  kubectl config use-context "$ctx" || \
    die "Context '${ctx}' not found. Run: k3d kubeconfig merge ${K3D_CLUSTER_NAME} --kubeconfig-switch-context"
  ok "Active context: ${ctx}"
}

# ---------------------------------------------------------------------------
# Step 3 — Verify API server connectivity
# ---------------------------------------------------------------------------
verify_connectivity() {
  log "Verifying kubectl connectivity..."

  local retries=8
  local wait=4
  for i in $(seq 1 $retries); do
    if kubectl cluster-info &>/dev/null; then
      ok "kubectl can reach the cluster."
      return
    fi
    warn "Attempt $i/$retries failed — waiting ${wait}s..."
    sleep $wait
    wait=$((wait * 2 > 30 ? 30 : wait * 2))
  done

  log ""
  log "=== CONNECTIVITY FAILURE DIAGNOSTICS ==="
  kubectl config current-context 2>&1 || true
  kubectl config get-contexts       2>&1 || true
  log ""
  log "Common fixes:"
  log "  1. Docker daemon not running:  open Docker Desktop, wait for whale icon"
  log "  2. Cluster stopped:            k3d cluster start ${K3D_CLUSTER_NAME}"
  log "  3. Wrong context:              kubectl config use-context k3d-${K3D_CLUSTER_NAME}"
  log "  4. Recreate from scratch:      k3d cluster delete ${K3D_CLUSTER_NAME} && ./experiments/setup_cluster.sh"
  die "Cannot connect to cluster."
}

# ---------------------------------------------------------------------------
# Step 4 — Verify or install metrics-server
# ---------------------------------------------------------------------------
ensure_metrics_server() {
  log "Checking for metrics-server..."

  if kubectl get deployment metrics-server -n kube-system &>/dev/null; then
    ok "metrics-server already deployed."
    return
  fi

  log "Installing metrics-server..."
  kubectl apply -f "$METRICS_SERVER_URL"

  # k3d uses self-signed kubelet certificates — patch in --kubelet-insecure-tls
  log "Patching metrics-server for k3d (--kubelet-insecure-tls)..."
  kubectl patch deployment metrics-server \
    -n kube-system \
    --type=json \
    -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'

  log "Waiting up to 90s for metrics-server to become ready..."
  kubectl rollout status deployment/metrics-server -n kube-system --timeout=90s \
    || warn "metrics-server not ready yet — HPA may show <unknown> for a minute or two after deploy."

  ok "metrics-server installed."
}

# ---------------------------------------------------------------------------
# Step 5 — Deploy or re-deploy TeaStore
# ---------------------------------------------------------------------------
deploy_teastore() {
  if $REDEPLOY; then
    log "Tearing down existing TeaStore deployment (--redeploy)..."
    kubectl delete -f "$K8S_DIR/teastore-hpa.yaml"         --ignore-not-found=true
    kubectl delete -f "$K8S_DIR/teastore-clusterip.yaml"   --ignore-not-found=true
    log "Waiting 15s for resources to terminate..."
    sleep 15
  fi

  log "Applying TeaStore manifests..."
  kubectl apply -f "$K8S_DIR/teastore-clusterip.yaml"
  ok "Manifests applied."
}

# ---------------------------------------------------------------------------
# Step 6 — Wait for all deployments to be ready
# ---------------------------------------------------------------------------
wait_for_teastore() {
  local services=(teastore-db teastore-registry teastore-persistence
                  teastore-auth teastore-image teastore-recommender teastore-webui)

  log "Waiting for all TeaStore pods (timeout 3 min per service)..."
  for svc in "${services[@]}"; do
    kubectl rollout status "deployment/$svc" --timeout=180s || {
      warn "${svc} did not become ready in time. Diagnostics:"
      kubectl describe deployment "$svc" | grep -A 10 'Events:'
      kubectl get pods -l "run=${svc}" -o wide
      die "${svc} failed to start. See events above."
    }
  done
  ok "All TeaStore services are Running."
}

# ---------------------------------------------------------------------------
# Step 7 — Verify WebUI is reachable on localhost:30080
# ---------------------------------------------------------------------------
verify_webui() {
  local url="http://localhost:${WEBUI_NODEPORT}/tools.descartes.teastore.webui/"
  log "Probing WebUI at ${url} ..."

  local retries=18   # 18 × 10s = 3 min — TeaStore needs time for DB init
  for i in $(seq 1 $retries); do
    local http_code
    # Use || true instead of || echo "000": curl already writes "000" via -w when
    # it can't connect; a second echo would produce "000000" in the variable.
    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
      --connect-timeout 5 --max-time 10 "${url}" 2>/dev/null) || true

    if [[ "$http_code" == "200" ]]; then
      ok "WebUI is responding (HTTP 200)."
      echo ""
      echo "  NODE_IP   = localhost"
      echo "  WEBUI_URL = ${url}"
      echo ""
      echo "Run experiments with:"
      echo "  ./experiments/run_experiments.sh localhost ${WEBUI_NODEPORT}"
      return
    fi

    warn "Attempt $i/$retries — HTTP ${http_code}. Waiting 10s (application may still be initialising)..."
    sleep 10
  done

  warn "WebUI did not respond after 3 minutes."
  warn "Check pod status:  kubectl get pods"
  warn "Check webui logs:  kubectl logs deployment/teastore-webui"
  warn "Check port mapping: k3d cluster list (LOADBALANCER column must be 'true')"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
log "=== TeaStore Cluster Setup (k3d) — SENG 533 Group 19 ==="
locate_binaries
setup_k3d_cluster
verify_connectivity
ensure_metrics_server
deploy_teastore
wait_for_teastore
verify_webui
log "=== Setup complete ==="
