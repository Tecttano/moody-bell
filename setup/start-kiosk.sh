#!/bin/bash

# Kiosk mode script for Raspberry Pi
# This script starts Chromium in kiosk mode displaying the bell control interface

# Disable screen blanking
xset s off
xset s noblank
xset -dpms

# Hide mouse cursor after 5 seconds of inactivity
unclutter -idle 5 &

# Start Chromium in kiosk mode
chromium-browser \
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
