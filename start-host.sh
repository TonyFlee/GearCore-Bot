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
node node_modules/next/dist/bin/next start -p "${PORT:-8788}" &
WEB_PID=$!

wait
