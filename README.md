# Moody Church Bell System

Automated bell control for Raspberry Pi 4B with touchscreen.

## Features

- Touch-friendly 5" display interface
- Manual bell control (15 rings)
- Scheduled automated ringing
- Mute function
- Real-time clock
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