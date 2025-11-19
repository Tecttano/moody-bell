#!/bin/bash
set -e

REPO_DIR="$HOME/moody-bell"
APP_DIR="/opt/moody-bell"

echo "=== Moody Bell Restart Script ==="

cd $REPO_DIR

# Rebuild frontend
echo "Rebuilding frontend..."
cd frontend
npm run build
sudo cp -r build/* $APP_DIR/frontend/build/
cd ..

# Copy backend and restart service
echo "Restarting backend..."
sudo cp backend/app.py $APP_DIR/backend/
sudo systemctl restart moody-bell

# Reload nginx
echo "Reloading nginx..."
sudo systemctl reload nginx

echo "=== Restart complete! ==="
echo "Frontend rebuilt and backend restarted"
