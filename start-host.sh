#!/bin/sh
set -e

npm install
npm run build

cd dashboard
npm install
npm run build
cd ..

node dist/index.js &
BOT_PID=$!

cd dashboard
DASHBOARD_PORT="${SERVER_PORT:-${PORT:-3000}}"
echo "Dashboard listening on 0.0.0.0:${DASHBOARD_PORT}"
node node_modules/next/dist/bin/next start -H 0.0.0.0 -p "$DASHBOARD_PORT" &
WEB_PID=$!

wait