# Moody Church Bell System

Automated bell control for Raspberry Pi 4B with touchscreen.

## Features

- Touch-friendly 5" display interface
- Manual bell control (custom tolls: 3, 6, 9, 12, 15 rings)
- Scheduled automated ringing
- Scheduled mute periods (auto-mutes during quiet hours)
- Manual mute override with confirmation
- Real-time clock with activity logs
- GPIO5 control
- Auto screen timeout (5 min) - touch to wake

## Hardware

- Raspberry Pi 4B
- 5" Touchscreen
- GPIO breakout hat
- Bell on GPIO5

## Default Schedules

**Bell Rings:**
- Mon-Sat: 9am (9×), 12pm (12×), 3pm (3×), 6pm (6×)
- Sunday: 9:45am (15×)

**Mute Periods:**
- Nighttime Quiet Hours: 8pm - 6am daily (recurring schedule)
- Supports one-time mute schedules for special events
- Manual override available with confirmation dialog

## Installation

```bash
cd setup
chmod +x install.sh
./install.sh
```

Reboot when done.

## Usage

Access at `http://localhost` or `http://<pi-ip>`

**Main Controls:**
- **Ring Bell**: Single toll (tap center bell)
- **Custom Tolls**: Expandable menu for 3, 6, 9, 12, 15 rings
- **Mute**: Manual mute toggle
- **Schedules**: Manage bell ring times
- **Mute Schedules**: Recurring and one-time mute periods

**Mute Schedule Features:**
- Recurring schedules repeat daily (e.g., nighttime quiet hours)
- One-time schedules for special events (shows next 7 days)
- Manual override prompts confirmation if schedule is active

## Dev

Backend: `cd backend && source venv/bin/activate && python app.py`
Frontend: `cd frontend && npm start`

## Updates

Pull and deploy from repo:
```bash
./setup/update.sh
```

Rebuild without pulling:
```bash
./setup/restart.sh
```

## Tech Stack

- Backend: Flask, APScheduler, SQLAlchemy, RPi.GPIO
- Frontend: React
- Database: SQLite
- Server: Nginx

## Troubleshooting

Check logs:
- System: `sudo journalctl -u moody-bell -f`
- Activity: `cat /opt/moody-bell/backend/bell_activity.log`

Restart: `sudo systemctl restart moody-bell`

## License

MIT