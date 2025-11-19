import React, { useState } from 'react';
import './ScheduleManager.css';

const MuteScheduleManager = ({ muteSchedules, onBack, onAddMuteSchedule, onUpdateMuteSchedule, onDeleteMuteSchedule }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    start_datetime: '',
    end_datetime: '',
    enabled: true
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSchedule) {
      onUpdateMuteSchedule(editingSchedule.id, formData);
    } else {
      onAddMuteSchedule(formData);
    }
    resetForm();
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      start_datetime: schedule.start_datetime.slice(0, 16),
      end_datetime: schedule.end_datetime.slice(0, 16),
      enabled: schedule.enabled
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this mute schedule?')) {
      onDeleteMuteSchedule(id);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSchedule(null);
    setFormData({
      name: '',
      start_datetime: '',
      end_datetime: '',
      enabled: true
    });
  };

  const formatDateTime = (datetime) => {
    return new Date(datetime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isActive = (schedule) => {
    const now = new Date();
    const start = new Date(schedule.start_datetime);
    const end = new Date(schedule.end_datetime);
    return schedule.enabled && now >= start && now <= end;
  };

  return (
    <div className="schedule-manager">
      <div className="schedule-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h2>Mute Schedules</h2>
        <button
          className="add-button"
          onClick={() => setShowForm(true)}
        >
          + Add
        </button>
      </div>

      {showForm && (
        <div className="schedule-form-overlay">
          <div className="schedule-form">
            <h3>{editingSchedule ? 'Edit Mute Schedule' : 'New Mute Schedule'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Christmas Concert"
                  required
                />
              </div>

              <div className="form-group">
                <label>Start:</label>
                <input
                  type="datetime-local"
                  name="start_datetime"
                  value={formData.start_datetime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>End:</label>
                <input
                  type="datetime-local"
                  name="end_datetime"
                  value={formData.end_datetime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="enabled"
                    checked={formData.enabled}
                    onChange={handleInputChange}
                  />
                  Enabled
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingSchedule ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="schedule-list">
        {muteSchedules.length === 0 ? (
          <div className="empty-state">
            <p>No mute schedules configured.</p>
            <p>Use the + Add button to create one.</p>
          </div>
        ) : (
          muteSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`schedule-card ${isActive(schedule) ? 'schedule-active' : ''}`}
            >
              <div className="schedule-info">
                <div className="schedule-name">
                  {schedule.name}
                  {isActive(schedule) && <span className="active-badge">ACTIVE NOW</span>}
                </div>
                <div className="schedule-time-range">
                  <div>Start: {formatDateTime(schedule.start_datetime)}</div>
                  <div>End: {formatDateTime(schedule.end_datetime)}</div>
                </div>
                <div className="schedule-status">
                  {schedule.enabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <div className="schedule-actions">
                <button
                  onClick={() => handleEdit(schedule)}
                  className="btn-edit"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MuteScheduleManager;
