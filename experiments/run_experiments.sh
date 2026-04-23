#!/usr/bin/env bash
# Run all 12 experiment trials: HPA + Fixed x 10/50/100 users x 2 replications.
# Access is via kubectl port-forward — no NodePort setup required.
#
# Prerequisites:
#   1. ./experiments/setup_cluster.sh completed
#   2. TeaStore database generated via browser (see setup_cluster.sh output)
#   3. JMeter on PATH  (or: export JMETER=/path/to/apache-jmeter/bin/jmeter)
#
# Usage:
#   ./experiments/run_experiments.sh
#
# To rerun one trial:
#   ONLY=hpa_50u_rep1 ./experiments/run_experiments.sh

set -e

REPO="$(cd "$(dirname "$0")/.." && pwd)"
RESULTS="$(dirname "$0")/results"
JMX="$REPO/examples/jmeter/teastore_browse.jmx"
JMETER="${JMETER:-jmeter}"

DURATION=600    # 10-minute steady-state per trial
COOLDOWN=120    # 2-minute cool-down between trials

# Ramp-up scaled by user count: prevents the "too fast" crash seen with flat 30s.
# Gives ~1 new thread every 1.5 s regardless of load level.
ramp_for() { echo $(( $1 * 3 / 2 )); }   # 10→15s  50→75s  100→150s

SCALABLE="teastore-webui teastore-auth teastore-image teastore-recommender teastore-persistence"

# ---------------------------------------------------------------------------
pf_start() {
  # Kill anything already using port 8080, then start a fresh port-forward.
  lsof -ti:8080 | xargs kill -9 2>/dev/null || true
  sleep 1
  kubectl port-forward svc/teastore-webui 8080:8080 >/dev/null 2>&1 &
  echo $!
}

pf_stop() { kill "$1" 2>/dev/null || true; wait "$1" 2>/dev/null || true; }

# ---------------------------------------------------------------------------
run_trial() {
  local POLICY=$1 USERS=$2 REP=$3
  local LABEL="${POLICY}_${USERS}u_rep${REP}"
  local DIR="$RESULTS/$LABEL"

  [ -n "${ONLY:-}" ] && [ "$ONLY" != "$LABEL" ] && return 0

  echo ""
  echo "======================================================"
  echo " TRIAL: $LABEL   ($(date '+%H:%M:%S'))"
  echo "======================================================"

  mkdir -p "$DIR"
  rm -rf "$DIR/html_report"

  # ---- Configure policy ----
  if [ "$POLICY" = "hpa" ]; then
    # Remove any HPAs from a previous run, reset replicas, then re-apply
    kubectl delete hpa --all --ignore-not-found=true 2>/dev/null || true
    kubectl scale deployment $SCALABLE --replicas=1
    # Create HPA for the two CPU-intensive services (matches the known-working setup)
    kubectl autoscale deployment teastore-recommender --cpu-percent=50 --min=1 --max=5
    kubectl autoscale deployment teastore-webui       --cpu-percent=50 --min=1 --max=5
    echo "HPA created. Waiting 30s for controller to initialise..."
    sleep 30
    kubectl get hpa
  else
    kubectl delete hpa --all --ignore-not-found=true 2>/dev/null || true
    kubectl scale deployment $SCALABLE --replicas=2
    for svc in $SCALABLE; do
      kubectl rollout status deployment/$svc --timeout=60s
    done
  fi

  kubectl get pods -o wide > "$DIR/pre_pods.txt" 2>/dev/null || true

  # ---- Start port-forward ----
  PF_PID=$(pf_start)
  sleep 3   # give it time to bind

  # ---- HPA metrics in background ----
  (
    while kill -0 $PF_PID 2>/dev/null; do
      kubectl get hpa --no-headers 2>/dev/null \
        | awk -v t="$(date '+%H:%M:%S')" '{print t, $0}' >> "$DIR/hpa_metrics.txt" || true
      sleep 10
    done
  ) &
  METRICS_PID=$!

  # ---- Run JMeter ----
  # hostname and port default to localhost:8080 in the JMX — matches port-forward.
  # Only thread count and timing need to be passed.
  local RAMP
  RAMP=$(ramp_for $USERS)
  echo "JMeter: $USERS users | ramp=${RAMP}s | duration=${DURATION}s"

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
  pf_stop $PF_PID

  kubectl get pods -o wide > "$DIR/post_pods.txt" 2>/dev/null || true

  # Quick result summary
  if [ -f "$DIR/results.jtl" ]; then
    TOTAL=$(tail -n +2 "$DIR/results.jtl" | wc -l | tr -d ' ')
    ERRORS=$(tail -n +2 "$DIR/results.jtl" | awk -F',' '$8!="true"{c++}END{print c+0}')
    echo "Result: $TOTAL requests, $ERRORS errors ($(( ERRORS * 100 / (TOTAL + 1) ))% error rate)"
  fi

  echo "Cooling down ${COOLDOWN}s..."
  sleep $COOLDOWN
}

# ---------------------------------------------------------------------------
mkdir -p "$RESULTS"

echo "======================================================"
echo " TeaStore Experiments — SENG 533 Group 19"
echo " 12 trials: HPA + Fixed x 10/50/100 users x 2 reps"
echo "======================================================"

for USERS in 10 50 100; do
  for REP in 1 2; do
    run_trial hpa $USERS $REP
  done
done

for USERS in 10 50 100; do
  for REP in 1 2; do
    run_trial fixed $USERS $REP
  done
done

echo ""
echo "======================================================"
echo " All trials complete."
echo " Results: $RESULTS"
echo "======================================================"
find "$RESULTS" -maxdepth 1 -mindepth 1 -type d | sort
