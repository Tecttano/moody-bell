#!/bin/bash

# Moody Church Bell System Installation Script
# Run this on your Raspberry Pi

set -e

# Detect script directory and repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

echo "======================================"
echo "Church Bell System Installer"
echo "======================================"
echo ""
echo "Repository location: $REPO_DIR"
echo ""

# Check if running on Raspberry Pi
if [ ! -f /proc/device-tree/model ] || ! grep -q "Raspberry Pi" /proc/device-tree/model; then
    echo "Warning: This script is designed for Raspberry Pi"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required system packages
echo "Installing system dependencies..."
sudo apt-get install -y python3 python3-pip python3-venv nodejs npm nginx sqlite3

# Create application directory
APP_DIR="/opt/moody-bell"
echo "Creating application directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Copy application files
echo "Copying application files..."
cp -r "$REPO_DIR/backend" $APP_DIR/
cp -r "$REPO_DIR/frontend" $APP_DIR/
cp -r "$REPO_DIR/setup" $APP_DIR/
chmod +x $APP_DIR/setup/*.sh

# Setup Python backend
echo "Setting up Python backend..."
cd $APP_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# Build React frontend
echo "Building React frontend..."
cd $APP_DIR/frontend
npm install
npm run build

# Configure nginx
echo "Configuring nginx..."
sudo cp "$APP_DIR/setup/nginx-config" /etc/nginx/sites-available/moody-bell
sudo ln -sf /etc/nginx/sites-available/moody-bell /etc/nginx/sites-enabled/moody-bell
sudo rm -f /etc/nginx/sites-enabled/default

# Install systemd service
echo "Installing systemd service..."
sudo cp "$APP_DIR/setup/moody-bell.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable moody-bell.service

# Setup WiFi (optional - can be done manually)
echo ""
read -p "Configure WiFi now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "WiFi SSID: " WIFI_SSID
    read -sp "WiFi Password: " WIFI_PASS
    echo
    echo "Configuring WiFi..."
    sudo bash -c "cat >> /etc/wpa_supplicant/wpa_supplicant.conf << EOF

network={
    ssid=\"$WIFI_SSID\"
    psk=\"$WIFI_PASS\"
    key_mgmt=WPA-PSK
}
EOF"
    echo "WiFi configured. Will connect on next reboot."
fi

# Enable NTP time sync
echo "Enabling NTP time sync..."
sudo timedatectl set-ntp true
sudo systemctl enable systemd-timesyncd
sudo systemctl start systemd-timesyncd

# Configure touchscreen orientation (if needed)
echo ""
read -p "Configure touchscreen for portrait mode? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo bash -c 'cat >> /boot/config.txt << EOF

# Touchscreen rotation
lcd_rotate=2
EOF'
    echo "Touchscreen configured for 180-degree rotation."
fi

# Start services
echo "Starting services..."
sudo systemctl restart nginx
sudo systemctl start moody-bell.service

# Check service status
echo ""
echo "Checking service status..."
sudo systemctl status moody-bell.service --no-pager

echo ""
echo "======================================"
echo "Installation Complete!"
echo "======================================"
echo ""
echo "The church bell system is now running."
echo "Access the web interface at: http://localhost"
echo ""
echo "Useful commands:"
echo "  - Check status: sudo systemctl status moody-bell"
echo "  - View logs: sudo journalctl -u moody-bell -f"
echo "  - Restart: sudo systemctl restart moody-bell"
echo "  - Stop: sudo systemctl stop moody-bell"
echo ""
echo "The system will start automatically on boot."
echo ""
read -p "Reboot now to apply all changes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo reboot
fi
