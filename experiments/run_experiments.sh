#!/usr/bin/env bash
# Run all 12 TeaStore experiment trials.
# 2 policies (hpa, fixed) x 3 load levels (10, 50, 100 users) x 2 replications.
#
# Access to TeaStore is via kubectl port-forward — no NodePort or cluster
# configuration required.
#
# Prerequisites:
#   - TeaStore deployed: ./experiments/setup_cluster.sh
#   - JMeter on PATH (or: export JMETER=/path/to/jmeter)
#
# Usage:
#   ./experiments/run_experiments.sh
#
# To run a single trial manually:
#   ONLY="hpa_50u_rep1" ./experiments/run_experiments.sh

set -e

REPO="$(cd "$(dirname "$0")/.." && pwd)"
RESULTS="$(dirname "$0")/results"
JMX="$REPO/examples/jmeter/teastore_browse.jmx"
K8S="$REPO/examples/kubernetes"
JMETER="${JMETER:-jmeter}"

RAMP=30       # seconds ramp-up
DURATION=600  # seconds steady-state load
COOLDOWN=120  # seconds between trials (lets HPA scale back down)

SERVICES="teastore-webui teastore-auth teastore-image teastore-recommender teastore-persistence"

# ---------------------------------------------------------------------------
run_trial() {
  local POLICY=$1 USERS=$2 REP=$3
  local LABEL="${POLICY}_${USERS}u_rep${REP}"
  local DIR="$RESULTS/$LABEL"

  # Skip if user asked to run only one trial
  if [ -n "${ONLY:-}" ] && [ "$ONLY" != "$LABEL" ]; then
    return
  fi

  echo ""
  echo "======================================================"
  echo " TRIAL: $LABEL"
  echo "======================================================"

  mkdir -p "$DIR"
  rm -rf "$DIR/html_report"   # JMeter refuses to overwrite an existing report dir

  # ---- Configure policy ----
  if [ "$POLICY" = "hpa" ]; then
    # Reset to 1 replica so HPA starts from a clean baseline
    kubectl scale deployment $SERVICES --replicas=1
    kubectl apply -f "$K8S/teastore-hpa.yaml"
    echo "Waiting 30s for HPA to initialise..."
    sleep 30
  else
    # Remove HPAs, set fixed 2 replicas
    kubectl delete -f "$K8S/teastore-hpa.yaml" --ignore-not-found=true
    kubectl scale deployment $SERVICES --replicas=2
    for svc in $SERVICES; do
      kubectl rollout status deployment/$svc --timeout=60s
    done
  fi

  kubectl get pods -o wide > "$DIR/pre_pods.txt" 2>/dev/null || true

  # ---- Start port-forward ----
  # Kill any leftover port-forward on 8080
  fuser -k 8080/tcp 2>/dev/null || lsof -ti:8080 | xargs kill 2>/dev/null || true
  sleep 1

  kubectl port-forward svc/teastore-webui 8080:8080 > "$DIR/portforward.log" 2>&1 &
  PF_PID=$!
  sleep 4

  # Quick sanity check before handing off to JMeter
  CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/tools.descartes.teastore.webui/) || true
  if [ "$CODE" != "200" ]; then
    echo "WARNING: WebUI returned HTTP $CODE before JMeter start. Continuing anyway."
  fi

  # ---- HPA metrics in background ----
  (
    while kill -0 $PF_PID 2>/dev/null; do
      kubectl get hpa --no-headers 2>/dev/null \
        | awk -v t="$(date '+%H:%M:%S')" '{print t, $0}' \
        >> "$DIR/hpa_metrics.txt" || true
      sleep 10
    done
  ) &
  METRICS_PID=$!

  # ---- Run JMeter ----
  # hostname/port default to localhost/8080 in the JMX (matches port-forward).
  # Only numThreads, rampUp, durationSec need to be passed.
  "$JMETER" -n \
    -t "$JMX" \
    -JnumThreads="$USERS" \
    -JrampUp="$RAMP" \
    -JdurationSec="$DURATION" \
    -l "$DIR/results.jtl" \
    -e -o "$DIR/html_report" \
    2>&1 | tee "$DIR/jmeter.log"

  # ---- Cleanup ----
  kill $METRICS_PID 2>/dev/null || true
  kill $PF_PID      2>/dev/null || true
  wait $PF_PID      2>/dev/null || true

  kubectl get pods -o wide > "$DIR/post_pods.txt" 2>/dev/null || true

  # Print a quick error-rate summary
  if [ -f "$DIR/results.jtl" ]; then
    TOTAL=$(tail -n +2 "$DIR/results.jtl" | wc -l | tr -d ' ')
    ERRORS=$(tail -n +2 "$DIR/results.jtl" | awk -F',' '$8!="true"{c++}END{print c+0}')
    echo "Result: $TOTAL requests, $ERRORS errors"
  fi

  echo "Cooling down for ${COOLDOWN}s..."
  sleep $COOLDOWN
}

# ---------------------------------------------------------------------------
mkdir -p "$RESULTS"

echo "======================================================"
echo " TeaStore Experiments — SENG 533 Group 19"
echo " 12 trials: HPA + Fixed x 10/50/100 users x 2 reps"
echo "======================================================"

# HPA policy
for USERS in 10 50 100; do
  for REP in 1 2; do
    run_trial hpa $USERS $REP
  done
done

# Fixed policy
for USERS in 10 50 100; do
  for REP in 1 2; do
    run_trial fixed $USERS $REP
  done
done

echo ""
echo "======================================================"
echo " All trials complete. Results: $RESULTS"
echo "======================================================"
find "$RESULTS" -maxdepth 1 -mindepth 1 -type d | sort
