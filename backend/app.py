import os
import json
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime, time as dt_time
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import threading
import time
import pytz

# Import GPIO only if running on Raspberry Pi
try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
except (ImportError, RuntimeError):
    GPIO_AVAILABLE = False
    print("GPIO not available - running in simulation mode")

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bell_schedule.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Setup file logging (erases on restart)
log_file = 'bell_activity.log'
if os.path.exists(log_file):
    os.remove(log_file)
file_handler = RotatingFileHandler(log_file, maxBytes=100000, backupCount=0)
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
))
logger = logging.getLogger('bell')
logger.setLevel(logging.INFO)
logger.addHandler(file_handler)

# GPIO Configuration
BELL_PIN = 5
if GPIO_AVAILABLE:
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(BELL_PIN, GPIO.OUT)
    GPIO.output(BELL_PIN, GPIO.LOW)

# Global state
muted = False
scheduler = BackgroundScheduler(timezone=pytz.timezone('America/Chicago'))

# Activity logs (circular buffer, last 100 entries)
activity_logs = []
MAX_LOGS = 100

def add_log(message, log_type='info'):
    """Add activity log entry"""
    global activity_logs
    entry = {
        'timestamp': datetime.now().isoformat(),
        'message': message,
        'type': log_type  # info, success, warning, error
    }
    activity_logs.append(entry)
    if len(activity_logs) > MAX_LOGS:
        activity_logs.pop(0)
    print(f"[{log_type.upper()}] {message}")

    # Also log to file
    log_level = {
        'info': logging.INFO,
        'success': logging.INFO,
        'warning': logging.WARNING,
        'error': logging.ERROR
    }.get(log_type, logging.INFO)
    logger.log(log_level, message)


class Schedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    day_of_week = db.Column(db.String(10), nullable=False)  # monday, tuesday, etc., or "all"
    hour = db.Column(db.Integer, nullable=False)
    minute = db.Column(db.Integer, nullable=False)
    num_rings = db.Column(db.Integer, nullable=False)
    enabled = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'day_of_week': self.day_of_week,
            'hour': self.hour,
            'minute': self.minute,
            'num_rings': self.num_rings,
            'enabled': self.enabled
        }


def ring_once():
    """Execute one ring: single toll with 3 second spacing"""
    if GPIO_AVAILABLE:
        GPIO.output(BELL_PIN, GPIO.HIGH)
        time.sleep(0.1)  # 100ms pulse
        GPIO.output(BELL_PIN, GPIO.LOW)
        time.sleep(2.9)  # 2.9s off (total = 3 seconds)
    else:
        print("RING! (simulated)")
        time.sleep(3.0)  # Total time for one ring


def ring_bell(num_rings):
    """Ring the bell specified number of times"""
    if muted:
        add_log(f"Bell muted - skipped {num_rings} rings", 'warning')
        return

    add_log(f"Ringing bell {num_rings} times", 'success')
    for i in range(num_rings):
        ring_once()


def ring_bell_async(num_rings):
    """Ring bell in a separate thread to not block the API"""
    thread = threading.Thread(target=ring_bell, args=(num_rings,))
    thread.start()


def scheduled_ring(schedule_id, num_rings):
    """Called by scheduler to ring bell"""
    add_log(f"Scheduled ring triggered (ID: {schedule_id}, {num_rings} rings)", 'info')
    ring_bell_async(num_rings)


def load_schedules_into_scheduler():
    """Load all enabled schedules into APScheduler"""
    scheduler.remove_all_jobs()
    schedules = Schedule.query.filter_by(enabled=True).all()

    # Mapping from full weekday names to APScheduler abbreviations
    weekday_map = {
        'monday': 'mon',
        'tuesday': 'tue',
        'wednesday': 'wed',
        'thursday': 'thu',
        'friday': 'fri',
        'saturday': 'sat',
        'sunday': 'sun'
    }

    for sched in schedules:
        if sched.day_of_week == 'all':
            # Ring every day
            trigger = CronTrigger(hour=sched.hour, minute=sched.minute)
        elif sched.day_of_week in weekday_map:
            # Ring on specific day - convert to APScheduler format
            day_abbrev = weekday_map[sched.day_of_week]
            trigger = CronTrigger(day_of_week=day_abbrev, hour=sched.hour, minute=sched.minute)
        else:
            continue

        scheduler.add_job(
            scheduled_ring,
            trigger=trigger,
            args=[sched.id, sched.num_rings],
            id=f'schedule_{sched.id}',
            replace_existing=True,
            misfire_grace_time=60
        )

    print(f"Loaded {len(schedules)} schedules into scheduler")


def create_default_schedules():
    """Create the default church bell schedules"""
    # Check if schedules already exist
    if Schedule.query.count() > 0:
        return

    # Monday - Saturday schedules
    weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    default_times = [
        (9, 0, 9),   # 9:00 AM - 9 rings
        (12, 0, 12), # 12:00 PM - 12 rings
        (15, 0, 3),  # 3:00 PM - 3 rings
        (18, 0, 6)   # 6:00 PM - 6 rings
    ]

    for day in weekdays:
        for hour, minute, rings in default_times:
            schedule = Schedule(
                day_of_week=day,
                hour=hour,
                minute=minute,
                num_rings=rings,
                enabled=True
            )
            db.session.add(schedule)

    # Sunday schedule
    sunday_schedule = Schedule(
        day_of_week='sunday',
        hour=9,
        minute=45,
        num_rings=15,
        enabled=True
    )
    db.session.add(sunday_schedule)

    db.session.commit()
    print("Default schedules created")


# API Routes

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get system status including mute state and current time"""
    return jsonify({
        'muted': muted,
        'current_time': datetime.now().isoformat(),
        'gpio_available': GPIO_AVAILABLE
    })


@app.route('/api/mute', methods=['POST'])
def set_mute():
    """Toggle mute state"""
    global muted
    data = request.get_json()
    muted = data.get('muted', False)
    status = "enabled" if muted else "disabled"
    add_log(f"Mute {status}", 'info')
    return jsonify({'muted': muted})


@app.route('/api/ring', methods=['POST'])
def manual_ring():
    """Manually trigger bell ringing"""
    data = request.get_json()
    num_rings = data.get('num_rings', 15)
    add_log(f"Manual ring requested ({num_rings} rings)", 'info')
    ring_bell_async(num_rings)
    return jsonify({'status': 'ringing', 'num_rings': num_rings})


@app.route('/api/logs', methods=['GET'])
def get_logs():
    """Get recent activity logs"""
    limit = request.args.get('limit', 50, type=int)
    return jsonify(activity_logs[-limit:])


@app.route('/api/schedules', methods=['GET'])
def get_schedules():
    """Get all schedules"""
    schedules = Schedule.query.all()
    return jsonify([s.to_dict() for s in schedules])


@app.route('/api/schedules', methods=['POST'])
def create_schedule():
    """Create a new schedule"""
    data = request.get_json()

    schedule = Schedule(
        day_of_week=data['day_of_week'],
        hour=int(data['hour']),
        minute=int(data['minute']),
        num_rings=int(data['num_rings']),
        enabled=data.get('enabled', True)
    )

    db.session.add(schedule)
    db.session.commit()

    load_schedules_into_scheduler()

    return jsonify(schedule.to_dict()), 201


@app.route('/api/schedules/<int:schedule_id>', methods=['PUT'])
def update_schedule(schedule_id):
    """Update an existing schedule"""
    schedule = Schedule.query.get_or_404(schedule_id)
    data = request.get_json()

    schedule.day_of_week = data.get('day_of_week', schedule.day_of_week)
    schedule.hour = int(data.get('hour', schedule.hour))
    schedule.minute = int(data.get('minute', schedule.minute))
    schedule.num_rings = int(data.get('num_rings', schedule.num_rings))
    schedule.enabled = data.get('enabled', schedule.enabled)

    db.session.commit()

    load_schedules_into_scheduler()

    return jsonify(schedule.to_dict())


@app.route('/api/schedules/<int:schedule_id>', methods=['DELETE'])
def delete_schedule(schedule_id):
    """Delete a schedule"""
    schedule = Schedule.query.get_or_404(schedule_id)
    db.session.delete(schedule)
    db.session.commit()

    load_schedules_into_scheduler()

    return jsonify({'status': 'deleted'})


# Initialize database and scheduler
with app.app_context():
    db.create_all()
    create_default_schedules()
    load_schedules_into_scheduler()
    schedule_count = Schedule.query.count()

scheduler.start()

# Add initial system startup log
add_log("Moody Bell system started", 'success')
add_log(f"GPIO mode: {'Hardware' if GPIO_AVAILABLE else 'Simulation'}", 'info')
add_log(f"Loaded {schedule_count} schedules", 'info')

# Note: NTP time sync is handled by system cron job (configured in setup/install.sh)
# Runs every Sunday at 3 AM via /etc/cron.d/ntp-sync

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000, debug=False)
    finally:
        if GPIO_AVAILABLE:
            GPIO.cleanup()
