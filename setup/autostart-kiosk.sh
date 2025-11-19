#!/bin/bash

# Script to setup autostart for kiosk mode
# Run this to make the touchscreen automatically show the interface on boot

echo "Setting up kiosk mode autostart..."

# Create autostart directory if it doesn't exist
mkdir -p ~/.config/lxsession/LXDE-pi

# Create LXDE autostart file
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

# Create labwc autostart directory and file (for Wayland-based systems)
mkdir -p ~/.config/labwc

cat > ~/.config/labwc/autostart << 'EOF'
#!/bin/bash

# labwc autostart for Moody Church Bell System
# This configures the kiosk mode for the touchscreen display

# Set environment variables for display
export DISPLAY=:0
export XDG_RUNTIME_DIR=${XDG_RUNTIME_DIR:-/run/user/1000}
export WAYLAND_DISPLAY=wayland-0

# Wait a moment for display server to be ready
sleep 2

# Enable screen timeout after 5 minutes of inactivity (saves display lifespan)
# Using swayidle for Wayland idle detection and wlopm to control display power
swayidle -w \
    timeout 300 'wlopm --off "*"' \
    resume 'wlopm --on "*"' &

# Hide mouse cursor after 5 seconds of inactivity
unclutter -idle 5 &

# Start Chromium in kiosk mode displaying the bell control interface
# Use exec to replace this process with chromium, maintaining the environment
exec chromium \
    --password-store=basic \
    --no-sandbox \
    --enable-features=UseOzonePlatform \
    --ozone-platform=wayland \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --no-first-run \
    --fast \
    --fast-start \
    --disable-translate \
    --disable-features=TranslateUI \
    --disable-session-crashed-bubble \
    --check-for-update-interval=604800 \
    --app=http://localhost
EOF

chmod +x ~/.config/labwc/autostart

echo "Kiosk mode autostart configured!"
echo "Configured for both LXDE and labwc (Wayland) environments."
echo "The touchscreen will automatically display the bell interface after reboot."
