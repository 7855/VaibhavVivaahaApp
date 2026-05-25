#!/bin/bash
# =============================================================================
# Run ALL 60 Maestro test flows
# Usage: bash run_all.sh
# Requires: maestro installed (brew install maestro)
#           App running on iOS Simulator or Android Emulator
# =============================================================================

FLOWS_DIR="$(dirname "$0")/credentials"
PASS=0
FAIL=0
FAILED_TESTS=()

echo "================================================"
echo " VaibhavVivaaha — Maestro Test Runner"
echo " Total flows: $(ls $FLOWS_DIR/*.yaml | wc -l | tr -d ' ')"
echo "================================================"

for flow in "$FLOWS_DIR"/*.yaml; do
  name=$(basename "$flow" .yaml)
  echo ""
  echo "▶ Running: $name"
  if maestro test "$flow" --no-ansi 2>&1; then
    echo "  ✅ PASS: $name"
    ((PASS++))
  else
    echo "  ❌ FAIL: $name"
    ((FAIL++))
    FAILED_TESTS+=("$name")
  fi
done

echo ""
echo "================================================"
echo " RESULTS: ✅ $PASS passed  ❌ $FAIL failed"
echo "================================================"

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
  echo ""
  echo "Failed tests:"
  for t in "${FAILED_TESTS[@]}"; do
    echo "  - $t"
  done
fi
