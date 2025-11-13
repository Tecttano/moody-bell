#!/bin/bash

# Script to setup autostart for kiosk mode
# Run this to make the touchscreen automatically show the interface on boot

echo "Setting up kiosk mode autostart..."

# Create autostart directory if it doesn't exist
mkdir -p ~/.config/lxsession/LXDE-pi

# Create autostart file
cat > ~/.config/lxsession/LXDE-pi/autostart << 'EOF'
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash

# Disable screen blanking
@xset s off
@xset -dpms
@xset s noblank

# Start bell control interface in kiosk mode
@/opt/moody-bell/setup/start-kiosk.sh
EOF

echo "Kiosk mode autostart configured!"
echo "The touchscreen will automatically display the bell interface after reboot."
