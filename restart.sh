#!/usr/bin/env bash
set -e

# 如果是 Node.js + pm2：
if command -v pm2 >/dev/null 2>&1; then
  pkill -f "node server.js" || true
  sleep 2
  node server.js
fi


echo "Restart script finished."
