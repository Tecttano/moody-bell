import React, { useState } from 'react';
import './MainScreen.css';
import LogsTerminal from './LogsTerminal';

const MainScreen = ({ currentTime, muted, onRingBell, onToggleMute, onManageSchedules, schedules }) => {
  const [customTollsOpen, setCustomTollsOpen] = useState(false);
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getNextBell = () => {
    if (!schedules || schedules.length === 0) return null;

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayIndex = dayOrder.indexOf(currentDay);

    let nextBell = null;
    let minDiff = Infinity;

    schedules.filter(s => s.enabled).forEach(schedule => {
      const schedSeconds = schedule.hour * 3600 + schedule.minute * 60;

      if (schedule.day_of_week === 'all' || schedule.day_of_week === currentDay) {
        if (schedSeconds > currentSeconds) {
          const diff = schedSeconds - currentSeconds;
          if (diff < minDiff) {
            minDiff = diff;
            nextBell = { ...schedule, secondsUntil: diff };
          }
        }
      }

      if (schedule.day_of_week !== 'all') {
        const schedDayIndex = dayOrder.indexOf(schedule.day_of_week);
        let dayDiff = schedDayIndex - currentDayIndex;
        if (dayDiff < 0) dayDiff += 7;
        if (dayDiff === 0 && schedSeconds <= currentSeconds) dayDiff = 7;

        const totalSeconds = dayDiff * 24 * 3600 + schedSeconds - currentSeconds;
        if (totalSeconds < minDiff) {
          minDiff = totalSeconds;
          nextBell = { ...schedule, secondsUntil: totalSeconds };
        }
      }
    });

    return nextBell;
  };

  const formatCountdown = (seconds) => {
    if (seconds < 60) return `${seconds}s`;

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins < 60) return `${mins}m ${secs}s`;

    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    if (hours < 24) return `${hours}h ${remainingMins}m ${secs}s`;

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h ${remainingMins}m`;
  };

  const nextBell = getNextBell();

  return (
    <div className="dashboard-container">
      {/* Top Status Bar */}
      <div className="status-bar-top">
        <div className="status-item">
          <div className="status-label">Time</div>
          <div className="status-value">{formatTime(currentTime)}</div>
        </div>
        <div className="status-item center">
          <div className="status-label">Next Bell</div>
          <div className="status-value">
            {nextBell ? `${formatCountdown(nextBell.secondsUntil)} (${nextBell.num_rings}×)` : '--'}
          </div>
        </div>
        <div className={`status-item ${muted ? 'status-muted' : 'status-active'}`}>
          <div className="status-label">System</div>
          <div className="status-value">{muted ? 'MUTED' : 'ACTIVE'}</div>
        </div>
      </div>

      {/* Hero Section - Main Bell Control */}
      <div className="hero-section">
        <button className="bell-hero-button" onClick={() => onRingBell(1)}>
          <div className="bell-ripple"></div>
          <div className="bell-circle">
            <div className="bell-icon-hero">🔔</div>
            <div className="bell-label">RING BELL</div>
            <div className="bell-sublabel">Single toll</div>
          </div>
        </button>
      </div>

      {/* Bottom Grid - Widgets */}
      <div className="widget-grid">
        {/* Controls Widget */}
        <div className="widget controls-widget">
          <div className="widget-header">
            <h3 className="widget-title">Quick Controls</h3>
          </div>
          <div className="widget-body">
            <button
              className={`widget-btn ${muted ? 'btn-unmute' : 'btn-mute'}`}
              onClick={onToggleMute}
            >
              <span className="widget-btn-icon">{muted ? '🔊' : '🔇'}</span>
              <span className="widget-btn-text">
                {muted ? 'Unmute' : 'Mute'}
              </span>
            </button>
            <button className="widget-btn btn-schedule" onClick={onManageSchedules}>
              <span className="widget-btn-icon">📅</span>
              <span className="widget-btn-text">Schedules</span>
            </button>
            <button
              className="widget-btn btn-custom-tolls"
              onClick={() => setCustomTollsOpen(!customTollsOpen)}
            >
              <span className="widget-btn-icon">{customTollsOpen ? '▼' : '▶'}</span>
              <span className="widget-btn-text">Custom Tolls</span>
            </button>
          </div>

          {/* Custom Tolls Drawer */}
          {customTollsOpen && (
            <div className="custom-tolls-drawer">
              <button className="toll-option" onClick={() => onRingBell(3)}>
                <span className="toll-count">3</span>
                <span className="toll-label">Tolls</span>
              </button>
              <button className="toll-option" onClick={() => onRingBell(6)}>
                <span className="toll-count">6</span>
                <span className="toll-label">Tolls</span>
              </button>
              <button className="toll-option" onClick={() => onRingBell(9)}>
                <span className="toll-count">9</span>
                <span className="toll-label">Tolls</span>
              </button>
              <button className="toll-option" onClick={() => onRingBell(12)}>
                <span className="toll-count">12</span>
                <span className="toll-label">Tolls</span>
              </button>
              <button className="toll-option toll-option-highlight" onClick={() => onRingBell(15)}>
                <span className="toll-count">15</span>
                <span className="toll-label">Sunday Bell</span>
              </button>
            </div>
          )}
        </div>

        {/* Activity Feed Widget */}
        <div className="widget activity-widget">
          <div className="widget-header">
            <h3 className="widget-title">Live Activity</h3>
          </div>
          <div className="widget-body activity-feed">
            <LogsTerminal />
          </div>
        </div>
      </div>

      {/* Credit Footer */}
      <div className="credit-footer">
        © 2025 Christopher Ferrari
      </div>
    </div>
  );
};

export default MainScreen;
