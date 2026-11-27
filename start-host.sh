#!/bin/sh
set -e
export NEXT_TELEMETRY_DISABLED=1

if [ ! -d node_modules ]; then
  echo "Installing bot dependencies..."
  npm install --no-fund --no-audit
fi

if [ ! -f dist/index.js ]; then
  echo "Building bot..."
  npm run build
else
  echo "Bot build found. Skipping build."
fi

echo "Starting bot..."
node dist/index.js &
BOT_PID=$!

echo "Starting lightweight dashboard..."
DASHBOARD_PORT="${SERVER_PORT:-${PORT:-3000}}"
echo "SERVER_PORT=${SERVER_PORT:-<unset>} PORT=${PORT:-<unset>}"
echo "Lite dashboard listening on 0.0.0.0:${DASHBOARD_PORT}"
node dashboard-lite/server.js &
WEB_PID=$!

wait
