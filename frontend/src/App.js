import React, { useState, useEffect } from 'react';
import './App.css';
import MainScreen from './components/MainScreen';
import ScheduleManager from './components/ScheduleManager';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

function App() {
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'schedule'
  const [muted, setMuted] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Load initial status and schedules
    loadStatus();
    loadSchedules();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/status`);
      setMuted(response.data.muted);
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await axios.get(`${API_BASE}/schedules`);
      setSchedules(response.data);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const handleRingBell = async (numRings = 15) => {
    try {
      await axios.post(`${API_BASE}/ring`, { num_rings: numRings });
    } catch (error) {
      console.error('Error ringing bell:', error);
      alert('Error ringing bell');
    }
  };

  const handleToggleMute = async () => {
    try {
      const newMuted = !muted;
      await axios.post(`${API_BASE}/mute`, { muted: newMuted });
      setMuted(newMuted);
    } catch (error) {
      console.error('Error toggling mute:', error);
      alert('Error toggling mute');
    }
  };

  const handleAddSchedule = async (schedule) => {
    try {
      await axios.post(`${API_BASE}/schedules`, schedule);
      loadSchedules();
    } catch (error) {
      console.error('Error adding schedule:', error);
      alert('Error adding schedule');
    }
  };

  const handleUpdateSchedule = async (id, schedule) => {
    try {
      await axios.put(`${API_BASE}/schedules/${id}`, schedule);
      loadSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Error updating schedule');
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      await axios.delete(`${API_BASE}/schedules/${id}`);
      loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Error deleting schedule');
    }
  };

  return (
    <div className="App">
      {currentView === 'main' ? (
        <MainScreen
          currentTime={currentTime}
          muted={muted}
          onRingBell={handleRingBell}
          onToggleMute={handleToggleMute}
          onManageSchedules={() => setCurrentView('schedule')}
          schedules={schedules}
        />
      ) : (
        <ScheduleManager
          schedules={schedules}
          onBack={() => setCurrentView('main')}
          onAddSchedule={handleAddSchedule}
          onUpdateSchedule={handleUpdateSchedule}
          onDeleteSchedule={handleDeleteSchedule}
        />
      )}
    </div>
  );
}

export default App;
