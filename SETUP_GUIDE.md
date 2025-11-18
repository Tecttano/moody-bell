# Setup Guide

Quick setup instructions for the bell system.

## Hardware

- Raspberry Pi 4B with 5.1V 3A power supply
- 5" touchscreen
- GPIO breakout hat
- 16GB+ microSD card with Raspberry Pi OS
- Bell interface circuit

### OS Setup

Flash Raspberry Pi OS with:
- SSH enabled
- WiFi configured
- Timezone: Set to your local timezone (system auto-detects)

## GPIO

- Pin 29: GPIO5 (BCM) - Bell control
- 3.3V logic, 16mA max
- Ring pattern: Single 100ms pulse, 3 seconds between rings

## Installation

```bash
# Clone the repository
git clone https://github.com/Tecttano/moody-bell.git
cd moody-bell/setup

# Run installer
chmod +x install.sh
./install.sh
sudo reboot
```

For kiosk mode:
```bash
cd setup
chmod +x autostart-kiosk.sh
./autostart-kiosk.sh
```

## Testing

Check services:
```bash
sudo systemctl status moody-bell
curl http://localhost/api/status
```

Open `http://localhost` - should see interface with clock and bell button.

Test GPIO manually by tapping "Ring Bell" button. Should hear relay clicks and bell rings.

## Maintenance

View logs:
- System: `sudo journalctl -u moody-bell -f`
- Activity: `cat /opt/moody-bell/backend/bell_activity.log`

Update from repo:
```bash
./setup/update.sh
```

Rebuild without pulling:
```bash
./setup/restart.sh
```

Backup database:
```bash
cp /opt/moody-bell/backend/instance/bell_schedule.db ~/backup.db
```

Monthly system updates:
```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo reboot
```

## Troubleshooting

**Bell doesn't ring:**
- Check if muted
- Check logs: `sudo journalctl -u moody-bell -n 20`
- Check GPIO connections
- Restart: `sudo systemctl restart moody-bell`

**Interface not loading:**
```bash
sudo systemctl restart moody-bell
sudo systemctl restart nginx
```

**Wrong time:**
```bash
sudo timedatectl set-timezone America/New_York  # Or your timezone
sudo timedatectl set-ntp true
```

**Service errors:**
```bash
sudo journalctl -u moody-bell -n 50
```
