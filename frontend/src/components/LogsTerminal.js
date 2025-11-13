import React, { useState, useEffect, useRef } from 'react';
import './LogsTerminal.css';

const LogsTerminal = () => {
  const [logs, setLogs] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const logsEndRef = useRef(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Fetch logs initially
    fetchLogs();

    // Poll for new logs every 2 seconds
    const interval = setInterval(fetchLogs, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs?limit=30');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info':
      default: return '#3b82f6';
    }
  };

  const getTypeSymbol = (type) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      case 'info':
      default: return 'ℹ';
    }
  };

  return (
    <div className={`logs-terminal ${isMinimized ? 'minimized' : ''}`}>
      <div className="logs-header">
        <div className="logs-title">
          <span className="logs-icon">▸</span>
          System Logs
        </div>
        <div className="logs-controls">
          <button
            className="logs-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button
            className="logs-btn"
            onClick={fetchLogs}
            title="Refresh"
          >
            ↻
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="logs-content">
          {logs.length === 0 ? (
            <div className="logs-empty">No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`log-entry log-${log.type}`}>
                <span className="log-time">{formatTimestamp(log.timestamp)}</span>
                <span
                  className="log-type"
                  style={{ color: getTypeColor(log.type) }}
                >
                  {getTypeSymbol(log.type)}
                </span>
                <span className="log-message">{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
};

export default LogsTerminal;
