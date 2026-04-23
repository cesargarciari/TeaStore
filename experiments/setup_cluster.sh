#!/usr/bin/env bash
# Deploy TeaStore to an existing k3d cluster and verify it is reachable.
# Run this once before starting experiments.
#
# Prerequisites:
#   - k3d cluster running:  k3d cluster create teastore
#   - kubectl pointing at it (k3d does this automatically)
#
# Usage:
#   ./experiments/setup_cluster.sh

set -e

REPO="$(cd "$(dirname "$0")/.." && pwd)"

echo "--- Deploying TeaStore ---"
kubectl apply -f "$REPO/examples/kubernetes/teastore-clusterip.yaml"

echo "--- Waiting for all pods to be ready ---"
for svc in teastore-db teastore-registry teastore-persistence \
           teastore-auth teastore-image teastore-recommender teastore-webui; do
  kubectl rollout status deployment/$svc --timeout=180s
done

echo "--- Verifying WebUI via port-forward ---"
# Kill any leftover port-forward on 8080 first
fuser -k 8080/tcp 2>/dev/null || lsof -ti:8080 | xargs kill 2>/dev/null || true

kubectl port-forward svc/teastore-webui 8080:8080 >/dev/null 2>&1 &
PF=$!
sleep 5

CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/tools.descartes.teastore.webui/) || true

kill $PF 2>/dev/null || true
wait $PF 2>/dev/null || true

if [ "$CODE" = "200" ]; then
  echo ""
  echo "✓ TeaStore is ready (HTTP 200)."
  echo "  Run experiments: ./experiments/run_experiments.sh"
else
  echo ""
  echo "✗ WebUI returned HTTP $CODE — pods may still be initialising."
  echo "  Check: kubectl get pods"
  echo "  Retry: ./experiments/setup_cluster.sh"
  exit 1
fi
