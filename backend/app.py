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

# Track manual overrides for mute schedules (set of mute_schedule IDs that have been manually overridden)
mute_schedule_overrides = set()

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


class MuteSchedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    start_datetime = db.Column(db.DateTime, nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=False)
    enabled = db.Column(db.Boolean, default=True)
    is_recurring = db.Column(db.Boolean, default=False)  # If True, repeats daily using time portion only

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'start_datetime': self.start_datetime.isoformat(),
            'end_datetime': self.end_datetime.isoformat(),
            'enabled': self.enabled,
            'is_recurring': self.is_recurring
        }


def get_active_mute_schedules():
    """Get list of currently active mute schedules (excluding overridden ones)"""
    global mute_schedule_overrides
    now = datetime.now()
    current_time = now.time()

    # Get all enabled mute schedules
    all_mutes = MuteSchedule.query.filter(MuteSchedule.enabled == True).all()

    active_mutes = []
    for ms in all_mutes:
        if ms.is_recurring:
            # For recurring schedules, check if current time falls in the time range
            start_time = ms.start_datetime.time()
            end_time = ms.end_datetime.time()

            # Handle schedules that span midnight (e.g., 8pm to 6am)
            if start_time <= end_time:
                # Normal range (e.g., 9am to 5pm)
                if start_time <= current_time <= end_time:
                    active_mutes.append(ms)
            else:
                # Spans midnight (e.g., 8pm to 6am)
                if current_time >= start_time or current_time <= end_time:
                    active_mutes.append(ms)
        else:
            # For one-time schedules, check exact datetime range
            if ms.start_datetime <= now <= ms.end_datetime:
                active_mutes.append(ms)

    active_ids = {ms.id for ms in active_mutes}

    # Clean up overrides for schedules that are no longer active
    mute_schedule_overrides = mute_schedule_overrides.intersection(active_ids)

    # Filter out manually overridden schedules
    return [ms for ms in active_mutes if ms.id not in mute_schedule_overrides]


def is_muted_by_schedule():
    """Check if bell is currently muted by any active mute schedule"""
    return len(get_active_mute_schedules()) > 0


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
        add_log(f"Bell muted (manual) - skipped {num_rings} rings", 'warning')
        return

    if is_muted_by_schedule():
        add_log(f"Bell muted (scheduled) - skipped {num_rings} rings", 'warning')
        return

    add_log(f"Ringing bell {num_rings} times", 'success')
    for i in range(num_rings):
        ring_once()


def ring_bell_async(num_rings):
    """Ring bell in a separate thread to not block the API"""
    def ring_with_context():
        with app.app_context():
            ring_bell(num_rings)

    thread = threading.Thread(target=ring_with_context)
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


def create_default_mute_schedules():
    """Create default recurring nighttime mute schedule (8pm - 6am daily)"""
    # Check if mute schedules already exist
    if MuteSchedule.query.count() > 0:
        return

    # Create ONE recurring nighttime mute schedule (8pm - 6am daily)
    # We use datetime just to store the time portion; date is ignored for recurring schedules
    base_date = datetime.now().date()
    from datetime import timedelta

    mute_schedule = MuteSchedule(
        name="Nighttime Quiet Hours",
        start_datetime=datetime.combine(base_date, dt_time(20, 0)),  # 8:00 PM
        end_datetime=datetime.combine(base_date + timedelta(days=1), dt_time(6, 0)),  # 6:00 AM next day
        enabled=True,
        is_recurring=True
    )
    db.session.add(mute_schedule)

    db.session.commit()
    print("Default recurring nighttime mute schedule created (8pm-6am daily)")


# API Routes

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get system status including mute state and current time"""
    active_mute_schedules = get_active_mute_schedules()
    return jsonify({
        'muted': muted,
        'muted_by_schedule': len(active_mute_schedules) > 0,
        'active_mute_schedules': [ms.to_dict() for ms in active_mute_schedules],
        'current_time': datetime.now().isoformat(),
        'gpio_available': GPIO_AVAILABLE
    })


@app.route('/api/mute', methods=['POST'])
def set_mute():
    """Toggle mute state"""
    global muted, mute_schedule_overrides
    data = request.get_json()
    muted = data.get('muted', False)
    override_schedule = data.get('override_schedule', False)

    # If unmuting and there are active mute schedules, override them
    if not muted and override_schedule:
        active_mutes = get_active_mute_schedules()
        for ms in active_mutes:
            mute_schedule_overrides.add(ms.id)
            add_log(f"Mute schedule overridden: {ms.name}", 'warning')

    status = "enabled" if muted else "disabled"
    add_log(f"Mute {status} (manual)", 'info')
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


@app.route('/api/mute-schedules', methods=['GET'])
def get_mute_schedules():
    """Get all mute schedules"""
    mute_schedules = MuteSchedule.query.all()
    return jsonify([ms.to_dict() for ms in mute_schedules])


@app.route('/api/mute-schedules', methods=['POST'])
def create_mute_schedule():
    """Create a new mute schedule"""
    data = request.get_json()

    mute_schedule = MuteSchedule(
        name=data['name'],
        start_datetime=datetime.fromisoformat(data['start_datetime']),
        end_datetime=datetime.fromisoformat(data['end_datetime']),
        enabled=data.get('enabled', True),
        is_recurring=data.get('is_recurring', False)
    )

    db.session.add(mute_schedule)
    db.session.commit()

    add_log(f"Mute schedule created: {mute_schedule.name}", 'info')

    return jsonify(mute_schedule.to_dict()), 201


@app.route('/api/mute-schedules/<int:mute_id>', methods=['PUT'])
def update_mute_schedule(mute_id):
    """Update an existing mute schedule"""
    mute_schedule = MuteSchedule.query.get_or_404(mute_id)
    data = request.get_json()

    mute_schedule.name = data.get('name', mute_schedule.name)
    mute_schedule.start_datetime = datetime.fromisoformat(data.get('start_datetime', mute_schedule.start_datetime.isoformat()))
    mute_schedule.end_datetime = datetime.fromisoformat(data.get('end_datetime', mute_schedule.end_datetime.isoformat()))
    mute_schedule.enabled = data.get('enabled', mute_schedule.enabled)
    mute_schedule.is_recurring = data.get('is_recurring', mute_schedule.is_recurring)

    db.session.commit()

    add_log(f"Mute schedule updated: {mute_schedule.name}", 'info')

    return jsonify(mute_schedule.to_dict())


@app.route('/api/mute-schedules/<int:mute_id>', methods=['DELETE'])
def delete_mute_schedule(mute_id):
    """Delete a mute schedule"""
    mute_schedule = MuteSchedule.query.get_or_404(mute_id)
    name = mute_schedule.name
    db.session.delete(mute_schedule)
    db.session.commit()

    add_log(f"Mute schedule deleted: {name}", 'info')

    return jsonify({'status': 'deleted'})


# Initialize database and scheduler
with app.app_context():
    db.create_all()
    create_default_schedules()
    create_default_mute_schedules()
    load_schedules_into_scheduler()
    schedule_count = Schedule.query.count()
    mute_schedule_count = MuteSchedule.query.count()

scheduler.start()

# Add initial system startup log
add_log("Moody Bell system started", 'success')
add_log(f"GPIO mode: {'Hardware' if GPIO_AVAILABLE else 'Simulation'}", 'info')
add_log(f"Loaded {schedule_count} schedules", 'info')
add_log(f"Loaded {mute_schedule_count} mute schedules", 'info')

# Note: NTP time sync is handled by system cron job (configured in setup/install.sh)
# Runs every Sunday at 3 AM via /etc/cron.d/ntp-sync

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000, debug=False)
    finally:
        if GPIO_AVAILABLE:
            GPIO.cleanup()
