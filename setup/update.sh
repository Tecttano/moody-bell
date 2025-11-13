#!/bin/bash
set -e

REPO_DIR="$HOME/moody-bell"
APP_DIR="/opt/moody-bell"

echo "=== Moody Bell Update Script ==="

cd $REPO_DIR

# Pull latest changes
echo "Pulling latest changes..."
BEFORE_PULL=$(git rev-parse HEAD)
git pull
AFTER_PULL=$(git rev-parse HEAD)

# If no changes, exit early
if [ "$BEFORE_PULL" = "$AFTER_PULL" ]; then
    echo "Already up to date!"
    exit 0
fi

# Check what changed
CHANGED_FILES=$(git diff --name-only $BEFORE_PULL $AFTER_PULL)

# Update backend if needed
if echo "$CHANGED_FILES" | grep -q "^backend/"; then
    echo "Backend changes detected..."

    # Check if requirements changed
    if echo "$CHANGED_FILES" | grep -q "backend/requirements.txt"; then
        echo "Installing backend dependencies..."
        sudo $APP_DIR/venv/bin/pip install -r backend/requirements.txt
    fi

    # Copy backend files and restart
    sudo cp backend/app.py $APP_DIR/backend/
    sudo systemctl restart moody-bell
    echo "Backend service restarted"
fi

# Update frontend if needed
if echo "$CHANGED_FILES" | grep -q "^frontend/"; then
    echo "Frontend changes detected..."

    # Check if package.json changed
    if echo "$CHANGED_FILES" | grep -q "frontend/package.json"; then
        echo "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
    fi

    # Build and deploy
    cd frontend
    npm run build
    sudo cp -r build/* $APP_DIR/frontend/build/
    cd ..
    sudo systemctl reload nginx
    echo "Frontend deployed"
fi

echo "=== Update complete! ==="
