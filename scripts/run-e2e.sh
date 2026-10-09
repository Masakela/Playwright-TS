#!/usr/bin/env bash
# Start the reference agent, run the Playwright suite against it, then stop it.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-8080}"
export AGENT_BASE_URL="http://localhost:${PORT}"
export ALLURE=1

# Corporate-proxy guard: make the local agent bypass any HTTP(S)_PROXY (which
# otherwise intercepts localhost and answers 403). Merge, don't clobber.
LOCALS="localhost,127.0.0.1,::1"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}$LOCALS"
export no_proxy="$NO_PROXY"

echo "Starting reference agent on ${AGENT_BASE_URL} ..."
PORT="$PORT" node agent-server/server.js &
AGENT_PID=$!
trap 'kill "$AGENT_PID" 2>/dev/null || true' EXIT

for i in $(seq 1 30); do curl -sf "${AGENT_BASE_URL}/health" >/dev/null 2>&1 && break || sleep 0.5; done

[ -d node_modules ] || npm install
npx playwright install >/dev/null 2>&1 || true
npx playwright test

node scripts/kpi-report.js --pw test-results/results.json --out kpis-out || true
echo "Done. KPI dashboard: kpis-out/index.html"
