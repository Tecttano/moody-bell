import React, { useState } from 'react';
import './MainScreen.css';
import LogsTerminal from './LogsTerminal';

const MainScreen = ({ currentTime, muted, mutedBySchedule, activeMuteSchedules, onRingBell, onToggleMute, onManageSchedules, onManageMuteSchedules }) => {
  const [customTollsOpen, setCustomTollsOpen] = useState(false);
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="dashboard-container">
      {/* Top Status Bar */}
      <div className="status-bar-top">
        <div className="status-item">
          <div className="status-label">Time</div>
          <div className="status-value">{formatTime(currentTime)}</div>
        </div>
        <div className="status-item center">
          <div className="status-label">Date</div>
          <div className="status-value">{formatDate(currentTime)}</div>
        </div>
        <div className={`status-item ${(muted || mutedBySchedule) ? 'status-muted' : 'status-active'}`}>
          <div className="status-label">System</div>
          <div className="status-value">
            {muted ? 'MUTED' : mutedBySchedule ? 'SCHEDULED' : 'ACTIVE'}
          </div>
        </div>
      </div>

      {/* Hero Section - Main Bell Control */}
      <div className="hero-section">
        <button className="bell-hero-button" onClick={() => onRingBell(1)}>
          <div className="bell-ripple"></div>
          <div className="bell-circle">
            <div className="bell-icon-hero">🔔</div>
            <div className="bell-label">RING BELL</div>
            <div className="bell-sublabel">Tap for single toll</div>
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
              className={`widget-btn ${(muted || mutedBySchedule) ? 'btn-unmute' : 'btn-mute'} ${mutedBySchedule ? 'btn-schedule-muted' : ''}`}
              onClick={onToggleMute}
            >
              <span className="widget-btn-icon">
                {mutedBySchedule ? '🔴' : (muted ? '🔊' : '🔇')}
              </span>
              <span className="widget-btn-text">
                {mutedBySchedule ? 'Scheduled Mute' : (muted ? 'Unmute' : 'Mute')}
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
            <button className="widget-btn btn-mute-schedule" onClick={onManageMuteSchedules}>
              <span className="widget-btn-icon">⏰</span>
              <span className="widget-btn-text">Mute Schedules</span>
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
    </div>
  );
};

export default MainScreen;
