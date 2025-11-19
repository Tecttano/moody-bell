import React from 'react';
import './MainScreen.css';
import LogsTerminal from './LogsTerminal';

const MainScreen = ({ currentTime, muted, onRingBell, onToggleMute, onManageSchedules, onManageMuteSchedules }) => {
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
        <div className={`status-item ${muted ? 'status-muted' : 'status-active'}`}>
          <div className="status-label">System</div>
          <div className="status-value">{muted ? 'MUTED' : 'ACTIVE'}</div>
        </div>
      </div>

      {/* Hero Section - Main Bell Control */}
      <div className="hero-section">
        <button className="bell-hero-button" onClick={onRingBell}>
          <div className="bell-ripple"></div>
          <div className="bell-circle">
            <div className="bell-icon-hero">🔔</div>
            <div className="bell-label">RING BELL</div>
            <div className="bell-sublabel">Tap to ring 15 times</div>
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
            <button className="widget-btn btn-mute-schedule" onClick={onManageMuteSchedules}>
              <span className="widget-btn-icon">⏰</span>
              <span className="widget-btn-text">Mute Times</span>
            </button>
          </div>
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
