#!/usr/bin/env bash
# Cluster setup and recovery script for TeaStore experiments.
# Handles: cluster restart, context verification, TeaStore deployment,
# metrics-server installation, and readiness verification.
#
# Usage:
#   ./experiments/setup_cluster.sh [--restart] [--redeploy]
#
#   --restart   Attempt to restart the local cluster before deploying
#   --redeploy  Tear down and re-apply all TeaStore manifests

set -euo pipefail

RESTART=false
REDEPLOY=false
for arg in "$@"; do
  case "$arg" in
    --restart)  RESTART=true ;;
    --redeploy) REDEPLOY=true ;;
  esac
done

K8S_DIR="$(dirname "$0")/../examples/kubernetes"
METRICS_SERVER_URL="https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"

log()  { echo "[$(date '+%H:%M:%S')] $*"; }
ok()   { echo "[$(date '+%H:%M:%S')] ✓  $*"; }
warn() { echo "[$(date '+%H:%M:%S')] ⚠  $*" >&2; }
die()  { echo "[$(date '+%H:%M:%S')] ✗  $*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Step 1 — Locate kubectl
# ---------------------------------------------------------------------------
locate_kubectl() {
  if command -v kubectl &>/dev/null; then
    ok "kubectl found: $(command -v kubectl)"
    return
  fi

  # Common non-PATH locations on macOS
  for p in /usr/local/bin/kubectl "$HOME/.rd/bin/kubectl" \
            /opt/homebrew/bin/kubectl "$HOME/.docker/bin/kubectl"; do
    if [[ -x "$p" ]]; then
      export PATH="$(dirname "$p"):$PATH"
      ok "kubectl found at $p — added to PATH"
      return
    fi
  done

  die "kubectl not found. Install it:
  macOS:  brew install kubectl
  Linux:  curl -LO https://dl.k8s.io/release/\$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl && chmod +x kubectl && sudo mv kubectl /usr/local/bin/"
}

# ---------------------------------------------------------------------------
# Step 2 — Detect cluster type and optionally restart it
# ---------------------------------------------------------------------------
detect_and_restart_cluster() {
  log "Detecting local cluster type..."

  # k3d
  if command -v k3d &>/dev/null && k3d cluster list 2>/dev/null | grep -q 'k3s'; then
    CLUSTER_TYPE="k3d"
    CLUSTER_NAME=$(k3d cluster list --no-headers 2>/dev/null | awk '{print $1}' | head -1)
    log "Detected k3d cluster: ${CLUSTER_NAME}"
    if $RESTART; then
      log "Restarting k3d cluster '${CLUSTER_NAME}'..."
      k3d cluster stop  "${CLUSTER_NAME}" || true
      sleep 3
      k3d cluster start "${CLUSTER_NAME}"
      log "Waiting 15s for API server to come up..."
      sleep 15
    fi
    return
  fi

  # minikube
  if command -v minikube &>/dev/null; then
    CLUSTER_TYPE="minikube"
    log "Detected minikube"
    if $RESTART; then
      log "Restarting minikube..."
      minikube stop  || true
      sleep 3
      minikube start
    fi
    return
  fi

  # kind
  if command -v kind &>/dev/null && kind get clusters 2>/dev/null | grep -q '.'; then
    CLUSTER_TYPE="kind"
    CLUSTER_NAME=$(kind get clusters 2>/dev/null | head -1)
    log "Detected kind cluster: ${CLUSTER_NAME}"
    if $RESTART; then
      warn "kind clusters cannot be restarted (they're Docker containers). Delete and recreate:"
      warn "  kind delete cluster --name ${CLUSTER_NAME}"
      warn "  kind create cluster --name ${CLUSTER_NAME}"
      die "Restart not supported for kind — recreate the cluster manually then re-run without --restart."
    fi
    return
  fi

  # Docker Desktop
  if kubectl config get-contexts 2>/dev/null | grep -q 'docker-desktop'; then
    CLUSTER_TYPE="docker-desktop"
    log "Detected Docker Desktop cluster"
    if $RESTART; then
      warn "To restart Docker Desktop Kubernetes: open Docker Desktop → Settings → Kubernetes → Reset Kubernetes Cluster."
      warn "Then re-run this script without --restart."
      die "Cannot restart Docker Desktop from the CLI."
    fi
    return
  fi

  warn "Could not detect cluster type automatically."
  CLUSTER_TYPE="unknown"
}

# ---------------------------------------------------------------------------
# Step 3 — Verify kubectl can reach the API server
# ---------------------------------------------------------------------------
verify_connectivity() {
  log "Verifying kubectl connectivity..."

  local retries=5
  local wait=4
  for i in $(seq 1 $retries); do
    if kubectl cluster-info &>/dev/null; then
      ok "kubectl can reach the cluster."
      return
    fi
    warn "Attempt $i/$retries failed — waiting ${wait}s..."
    sleep $wait
    wait=$((wait * 2))
  done

  log ""
  log "=== CONNECTIVITY FAILURE DIAGNOSTICS ==="
  log ""
  log "Active kubeconfig context:"
  kubectl config current-context 2>&1 || true
  log ""
  log "All available contexts:"
  kubectl config get-contexts 2>&1 || true
  log ""
  log "Possible causes and fixes:"
  log "  1. Cluster VM/container has stopped:"
  log "       k3d:       k3d cluster start <name>"
  log "       minikube:  minikube start"
  log "       kind:      kind get clusters   (then recreate if empty)"
  log "  2. Wrong context:"
  log "       kubectl config use-context <correct-context>"
  log "  3. Docker daemon not running (k3d/kind depend on it):"
  log "       macOS: open Docker Desktop app"
  log "       Linux: sudo systemctl start docker"
  log "  4. VPN blocking the loopback route to the API server:"
  log "       Disconnect VPN, then retry."
  log "  5. Stale TLS certificate after IP change:"
  log "       minikube: minikube delete && minikube start"
  log "       k3d:      k3d cluster delete <name> && k3d cluster create <name>"
  die "Cannot connect to cluster. Fix the issue above and re-run."
}

# ---------------------------------------------------------------------------
# Step 4 — Verify or install metrics-server
# ---------------------------------------------------------------------------
ensure_metrics_server() {
  log "Checking for metrics-server..."

  if kubectl get deployment metrics-server -n kube-system &>/dev/null; then
    ok "metrics-server is already deployed."
  else
    log "metrics-server not found — installing..."
    # For local clusters (k3d, minikube, kind) the kubelet certificate is self-signed,
    # so metrics-server needs --kubelet-insecure-tls. We patch it in after applying.
    kubectl apply -f "$METRICS_SERVER_URL"
    log "Patching metrics-server to allow insecure TLS (required for local clusters)..."
    kubectl patch deployment metrics-server \
      -n kube-system \
      --type=json \
      -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
    ok "metrics-server installed and patched."
  fi

  log "Waiting up to 60s for metrics-server to become ready..."
  kubectl rollout status deployment/metrics-server -n kube-system --timeout=60s || \
    warn "metrics-server not ready yet — HPA may show <unknown> for a minute or two."
}

# ---------------------------------------------------------------------------
# Step 5 — Deploy or re-deploy TeaStore
# ---------------------------------------------------------------------------
deploy_teastore() {
  if $REDEPLOY; then
    log "Tearing down existing TeaStore deployment (--redeploy)..."
    kubectl delete -f "$K8S_DIR/teastore-hpa.yaml"    --ignore-not-found=true
    kubectl delete -f "$K8S_DIR/teastore-clusterip.yaml" --ignore-not-found=true
    log "Waiting 10s for resources to terminate..."
    sleep 10
  fi

  if kubectl get deployment teastore-webui &>/dev/null && ! $REDEPLOY; then
    ok "TeaStore is already deployed. Applying any manifest changes..."
    kubectl apply -f "$K8S_DIR/teastore-clusterip.yaml"
  else
    log "Deploying TeaStore..."
    kubectl apply -f "$K8S_DIR/teastore-clusterip.yaml"
  fi
}

# ---------------------------------------------------------------------------
# Step 6 — Wait for all deployments to be ready
# ---------------------------------------------------------------------------
wait_for_teastore() {
  local services=(teastore-db teastore-registry teastore-persistence
                  teastore-auth teastore-image teastore-recommender teastore-webui)

  log "Waiting for all TeaStore pods to reach Running state (timeout 3 min)..."
  for svc in "${services[@]}"; do
    kubectl rollout status "deployment/$svc" --timeout=180s || {
      warn "$svc did not become ready in time. Checking events..."
      kubectl describe deployment "$svc" | tail -20
      kubectl get pods -l "run=$svc" -o wide
      die "$svc failed to start. Inspect the events above. Common cause: insufficient CPU/memory on the node."
    }
  done
  ok "All TeaStore services are Running."
}

# ---------------------------------------------------------------------------
# Step 7 — Determine NODE_IP and verify WebUI is reachable
# ---------------------------------------------------------------------------
verify_webui() {
  local node_ip=""

  case "${CLUSTER_TYPE:-unknown}" in
    k3d)
      # k3d exposes the NodePort on localhost by default
      node_ip="localhost"
      ;;
    minikube)
      node_ip=$(minikube ip 2>/dev/null || echo "")
      ;;
    *)
      # Try to get the internal IP of the first node
      node_ip=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo "localhost")
      ;;
  esac

  node_ip="${node_ip:-localhost}"
  log "Probing WebUI at http://${node_ip}:30080/tools.descartes.teastore.webui/ ..."

  local retries=12
  for i in $(seq 1 $retries); do
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
      --connect-timeout 5 --max-time 10 \
      "http://${node_ip}:30080/tools.descartes.teastore.webui/" 2>/dev/null || echo "000")

    if [[ "$http_code" == "200" ]]; then
      ok "WebUI is responding (HTTP 200) at http://${node_ip}:30080"
      echo ""
      echo "  NODE_IP   = ${node_ip}"
      echo "  WEBUI_URL = http://${node_ip}:30080/tools.descartes.teastore.webui/"
      echo ""
      echo "Run experiments with:"
      echo "  ./experiments/run_experiments.sh ${node_ip} 30080"
      return
    fi

    warn "Attempt $i/$retries — HTTP ${http_code}. Waiting 10s for application to warm up..."
    sleep 10
  done

  warn "WebUI did not respond after 2 minutes. The pods may still be initialising."
  warn "Check pod status with: kubectl get pods"
  warn "Then retry: curl http://${node_ip}:30080/tools.descartes.teastore.webui/"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
log "=== TeaStore Cluster Setup — SENG 533 Group 19 ==="
locate_kubectl
detect_and_restart_cluster
verify_connectivity
ensure_metrics_server
deploy_teastore
wait_for_teastore
verify_webui
log "=== Setup complete ==="
