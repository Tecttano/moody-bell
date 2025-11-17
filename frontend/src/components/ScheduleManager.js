import React, { useState } from 'react';
import './ScheduleManager.css';

const DAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
  { value: 'all', label: 'Every Day' }
];

const ScheduleManager = ({ schedules, onBack, onAddSchedule, onUpdateSchedule, onDeleteSchedule }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    day_of_week: 'monday',
    hour: 9,
    minute: 0,
    num_rings: 9,
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
      onUpdateSchedule(editingSchedule.id, formData);
    } else {
      onAddSchedule(formData);
    }
    resetForm();
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      day_of_week: schedule.day_of_week,
      hour: schedule.hour,
      minute: schedule.minute,
      num_rings: schedule.num_rings,
      enabled: schedule.enabled
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      onDeleteSchedule(id);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSchedule(null);
    setFormData({
      day_of_week: 'monday',
      hour: 9,
      minute: 0,
      num_rings: 9,
      enabled: true
    });
  };

  const formatTime = (hour, minute) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const groupSchedulesByDay = () => {
    const grouped = {};
    schedules.forEach(schedule => {
      const day = schedule.day_of_week;
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(schedule);
    });

    // Sort schedules within each day by time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        if (a.hour !== b.hour) return a.hour - b.hour;
        return a.minute - b.minute;
      });
    });

    return grouped;
  };

  const groupedSchedules = groupSchedulesByDay();

  return (
    <div className="schedule-manager">
      <div className="manager-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h2 className="manager-title">Schedule Manager</h2>
        <button className="add-button" onClick={() => setShowForm(true)}>
          + Add
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="schedule-form">
            <h3>{editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Day of Week:</label>
                <select
                  name="day_of_week"
                  value={formData.day_of_week}
                  onChange={handleInputChange}
                  required
                >
                  {DAYS.map(day => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hour (0-23):</label>
                  <input
                    type="number"
                    name="hour"
                    min="0"
                    max="23"
                    value={formData.hour}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Minute (0-59):</label>
                  <input
                    type="number"
                    name="minute"
                    min="0"
                    max="59"
                    value={formData.minute}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Number of Rings:</label>
                <input
                  type="number"
                  name="num_rings"
                  min="1"
                  max="100"
                  value={formData.num_rings}
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
                <button type="button" className="cancel-button" onClick={resetForm}>
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
        {Object.keys(groupedSchedules).length === 0 ? (
          <div className="no-schedules">No schedules configured</div>
        ) : (
          DAYS.map(day => {
            if (!groupedSchedules[day.value]) return null;
            return (
              <div key={day.value} className="day-group">
                <h3 className="day-header">{day.label}</h3>
                {groupedSchedules[day.value].map(schedule => (
                  <div
                    key={schedule.id}
                    className={`schedule-item ${!schedule.enabled ? 'disabled' : ''}`}
                  >
                    <div className="schedule-info">
                      <div className="schedule-time">
                        {formatTime(schedule.hour, schedule.minute)}
                      </div>
                      <div className="schedule-rings">
                        {schedule.num_rings} ring{schedule.num_rings !== 1 ? 's' : ''}
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
            );
          })
        )}
      </div>
    </div>
  );
};

export default ScheduleManager;
