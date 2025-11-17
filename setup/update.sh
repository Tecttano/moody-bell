#!/bin/bash
set -e

REPO_DIR="$HOME/moody-bell"
APP_DIR="/opt/moody-bell"
FORCE=false

# Check for --force flag
if [ "$1" = "--force" ]; then
    FORCE=true
fi

echo "=== Moody Bell Update Script ==="

cd $REPO_DIR

# Reset any local changes to avoid conflicts
echo "Resetting local changes..."
git reset --hard HEAD
git clean -fd

# Pull latest changes
echo "Pulling latest changes..."
BEFORE_PULL=$(git rev-parse HEAD)
git pull
AFTER_PULL=$(git rev-parse HEAD)

# Ensure scripts are executable after pull
chmod +x setup/*.sh 2>/dev/null || true

# Determine what changed
if [ "$BEFORE_PULL" = "$AFTER_PULL" ]; then
    if [ "$FORCE" = false ]; then
        echo "Already up to date! Use --force to rebuild anyway."
        exit 0
    fi
    echo "No git changes, but rebuilding due to --force..."
    CHANGED_FILES="backend/ frontend/"
else
    echo "Changes detected in git"
    CHANGED_FILES=$(git diff --name-only $BEFORE_PULL $AFTER_PULL)
fi

# Update backend if needed
if echo "$CHANGED_FILES" | grep -q "backend"; then
    echo "Updating backend..."

    # Check if requirements changed or force
    if echo "$CHANGED_FILES" | grep -q "requirements.txt" || [ "$FORCE" = true ]; then
        echo "Installing backend dependencies..."
        sudo $APP_DIR/venv/bin/pip install -r backend/requirements.txt
    fi

    # Copy backend files and restart
    sudo cp backend/app.py $APP_DIR/backend/
    sudo systemctl restart moody-bell
    echo "Backend service restarted"
fi

# Update frontend if needed
if echo "$CHANGED_FILES" | grep -q "frontend"; then
    echo "Updating frontend..."

    # Check if package.json changed or force
    if echo "$CHANGED_FILES" | grep -q "package.json" || [ "$FORCE" = true ]; then
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
