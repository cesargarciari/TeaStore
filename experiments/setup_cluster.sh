#!/usr/bin/env bash
# One-time setup: create k3d cluster, deploy TeaStore, install metrics-server.
# Run this once. Then generate the DB in the browser before running experiments.
#
# Usage:
#   ./experiments/setup_cluster.sh

set -e

echo "=== Step 1: Create k3d cluster ==="
if k3d cluster list | grep -q teastore; then
  echo "Cluster 'teastore' already exists — skipping create."
else
  k3d cluster create teastore --agents 3
fi

echo ""
echo "=== Step 2: Deploy TeaStore ==="
kubectl apply -f https://raw.githubusercontent.com/DescartesResearch/TeaStore/master/examples/kubernetes/teastore-clusterip.yaml

echo ""
echo "=== Step 3: Wait for all pods ==="
kubectl wait --for=condition=available deployment \
  teastore-db teastore-registry teastore-persistence \
  teastore-auth teastore-image teastore-recommender teastore-webui \
  --timeout=300s

echo ""
echo "=== Step 4: Install metrics-server (needed for HPA) ==="
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
# k3d uses self-signed certs — patch to skip TLS verification
kubectl patch deployment metrics-server -n kube-system \
  --type=json \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
kubectl rollout status deployment/metrics-server -n kube-system --timeout=60s

echo ""
echo "=== Step 5: Add CPU resource requests (required for HPA to measure CPU%) ==="
# Patch each scalable deployment with a CPU request so metrics-server can
# calculate a utilisation percentage for HPA decisions.
for svc in teastore-webui teastore-auth teastore-image teastore-recommender teastore-persistence; do
  kubectl patch deployment $svc --type=json -p='[
    {"op":"add","path":"/spec/template/spec/containers/0/resources","value":{
      "requests":{"cpu":"100m","memory":"128Mi"},
      "limits":  {"cpu":"500m","memory":"256Mi"}
    }}
  ]'
done
# recommender does more CPU work — give it a slightly higher request
kubectl patch deployment teastore-recommender --type=json -p='[
  {"op":"add","path":"/spec/template/spec/containers/0/resources","value":{
    "requests":{"cpu":"150m","memory":"256Mi"},
    "limits":  {"cpu":"500m","memory":"512Mi"}
  }}
]'
kubectl rollout status deployment/teastore-recommender --timeout=120s
kubectl rollout status deployment/teastore-webui       --timeout=120s

echo ""
echo "=== Step 6: Open the WebUI and generate the database ==="
echo ""
echo "  Run in a separate terminal:"
echo "    kubectl port-forward svc/teastore-webui 8080:8080"
echo ""
echo "  Then open: http://localhost:8080/tools.descartes.teastore.webui/"
echo "  Go to: Tools → Generate DB (click the button, wait for it to finish)"
echo "  The page should show the TeaStore shop with products after generation."
echo ""
echo "  Once the database is generated, run:"
echo "    ./experiments/run_experiments.sh"
