import React, { useState } from 'react';
import './ScheduleManager.css';

const MuteScheduleManager = ({ muteSchedules, onBack, onAddMuteSchedule, onUpdateMuteSchedule, onDeleteMuteSchedule }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    start_datetime: '',
    end_datetime: '',
    enabled: true,
    is_recurring: false
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
      enabled: schedule.enabled,
      is_recurring: schedule.is_recurring || false
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
      enabled: true,
      is_recurring: false
    });
  };

  const formatDateTime = (datetime) => {
    return new Date(datetime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
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

  // Separate recurring and non-recurring schedules
  const recurringSchedules = muteSchedules.filter(s => s.is_recurring);

  const now = new Date();
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

  // Split non-recurring into next 7 days and future events
  const next7Days = muteSchedules.filter(s => {
    if (s.is_recurring) return false;
    const startDate = new Date(s.start_datetime);
    return startDate >= now && startDate <= oneWeekFromNow;
  });

  const futureEvents = muteSchedules.filter(s => {
    if (s.is_recurring) return false;
    const startDate = new Date(s.start_datetime);
    return startDate > oneWeekFromNow;
  }).sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));

  const groupSchedulesByDate = () => {
    const grouped = {};
    next7Days.forEach(schedule => {
      const startDate = new Date(schedule.start_datetime).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
      if (!grouped[startDate]) {
        grouped[startDate] = [];
      }
      grouped[startDate].push(schedule);
    });

    // Sort schedules within each date by start time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        return new Date(a.start_datetime) - new Date(b.start_datetime);
      });
    });

    return grouped;
  };

  const groupedSchedules = groupSchedulesByDate();
  const sortedDates = Object.keys(groupedSchedules).sort((a, b) => {
    const dateA = groupedSchedules[a][0].start_datetime;
    const dateB = groupedSchedules[b][0].start_datetime;
    return new Date(dateA) - new Date(dateB);
  });

  return (
    <div className="schedule-manager">
      <div className="manager-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h2 className="manager-title">Mute Schedule Manager</h2>
        <button className="add-button" onClick={() => setShowForm(true)}>
          + Add
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="schedule-form">
            <h3>{editingSchedule ? 'Edit Mute Schedule' : 'Add New Mute Schedule'}</h3>
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

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_recurring"
                    checked={formData.is_recurring}
                    onChange={handleInputChange}
                  />
                  Recurring (daily, uses time only)
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  {editingSchedule ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="schedules-list">
        {recurringSchedules.length === 0 && sortedDates.length === 0 && futureEvents.length === 0 ? (
          <div className="no-schedules">No mute schedules configured</div>
        ) : (
          <>
            {/* Recurring Schedules Section */}
            {recurringSchedules.length > 0 && (
              <div className="day-group">
                <h3 className="day-header">Recurring Schedules</h3>
                {recurringSchedules.map(schedule => (
                  <div
                    key={schedule.id}
                    className={`schedule-item ${!schedule.enabled ? 'disabled' : ''}`}
                  >
                    <div className="schedule-info">
                      <div className="schedule-time">
                        {schedule.name}
                      </div>
                      <div className="schedule-rings">
                        Daily: {new Date(schedule.start_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(schedule.end_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {!schedule.enabled && (
                        <div className="schedule-status">Disabled</div>
                      )}
                    </div>
                    <div className="schedule-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(schedule)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Next 7 Days */}
            {sortedDates.map(date => (
              <div key={date} className="day-group">
                <h3 className="day-header">{date}</h3>
                {groupedSchedules[date].map(schedule => (
                  <div
                    key={schedule.id}
                    className={`schedule-item ${!schedule.enabled ? 'disabled' : ''}`}
                  >
                    <div className="schedule-info">
                      <div className="schedule-time">
                        {schedule.name}
                      </div>
                      <div className="schedule-rings">
                        {formatDateTime(schedule.start_datetime)} - {formatDateTime(schedule.end_datetime)}
                      </div>
                      {!schedule.enabled && (
                        <div className="schedule-status">Disabled</div>
                      )}
                    </div>
                    <div className="schedule-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(schedule)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Future Events (Beyond Next 7 Days) */}
            {futureEvents.length > 0 && (
              <div className="day-group">
                <h3 className="day-header">Upcoming Events</h3>
                {futureEvents.map(schedule => (
                  <div
                    key={schedule.id}
                    className={`schedule-item ${!schedule.enabled ? 'disabled' : ''}`}
                  >
                    <div className="schedule-info">
                      <div className="schedule-time">
                        {schedule.name}
                      </div>
                      <div className="schedule-rings">
                        {new Date(schedule.start_datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}: {formatDateTime(schedule.start_datetime)} - {formatDateTime(schedule.end_datetime)}
                      </div>
                      {!schedule.enabled && (
                        <div className="schedule-status">Disabled</div>
                      )}
                    </div>
                    <div className="schedule-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(schedule)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MuteScheduleManager;
