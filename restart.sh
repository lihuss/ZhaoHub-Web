#!/usr/bin/env bash
set -e

pkill -f "node server.js" || true
sleep 2
node server.js

echo "Restart script finished."
