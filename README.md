# Moody Church Bell System

Automated bell control for Raspberry Pi 4B with touchscreen.

## Features

- Touch-friendly 5" display interface
- Manual bell control (single toll or 15 rings)
- Scheduled automated ringing
- Countdown to next scheduled bell
- Mute function
- Real-time clock with activity logs
- GPIO5 control

## Hardware

- Raspberry Pi 4B
- 5" Touchscreen
- GPIO breakout hat
- Bell on GPIO5

## Default Schedule

Mon-Sat: 9am (9x), 12pm (12x), 3pm (3x), 6pm (6x)
Sunday: 9:45am (15x)

## Installation

```bash
cd setup
chmod +x install.sh
./install.sh
```

Reboot when done.

## Usage

Access at `http://localhost` or `http://<pi-ip>`

Touchscreen shows main controls. Tap buttons to ring bell, mute, or manage schedules.

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