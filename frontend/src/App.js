import React, { useState, useEffect } from 'react';
import './App.css';
import MainScreen from './components/MainScreen';
import ScheduleManager from './components/ScheduleManager';
import MuteScheduleManager from './components/MuteScheduleManager';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'schedule', or 'mute-schedule'
  const [muted, setMuted] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [muteSchedules, setMuteSchedules] = useState([]);
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
    loadMuteSchedules();
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

  const loadMuteSchedules = async () => {
    try {
      const response = await axios.get(`${API_BASE}/mute-schedules`);
      setMuteSchedules(response.data);
    } catch (error) {
      console.error('Error loading mute schedules:', error);
    }
  };

  const handleRingBell = async () => {
    try {
      await axios.post(`${API_BASE}/ring`, { num_rings: 15 });
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

  const handleAddMuteSchedule = async (muteSchedule) => {
    try {
      await axios.post(`${API_BASE}/mute-schedules`, muteSchedule);
      loadMuteSchedules();
    } catch (error) {
      console.error('Error adding mute schedule:', error);
      alert('Error adding mute schedule');
    }
  };

  const handleUpdateMuteSchedule = async (id, muteSchedule) => {
    try {
      await axios.put(`${API_BASE}/mute-schedules/${id}`, muteSchedule);
      loadMuteSchedules();
    } catch (error) {
      console.error('Error updating mute schedule:', error);
      alert('Error updating mute schedule');
    }
  };

  const handleDeleteMuteSchedule = async (id) => {
    try {
      await axios.delete(`${API_BASE}/mute-schedules/${id}`);
      loadMuteSchedules();
    } catch (error) {
      console.error('Error deleting mute schedule:', error);
      alert('Error deleting mute schedule');
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
          onManageMuteSchedules={() => setCurrentView('mute-schedule')}
        />
      ) : currentView === 'schedule' ? (
        <ScheduleManager
          schedules={schedules}
          onBack={() => setCurrentView('main')}
          onAddSchedule={handleAddSchedule}
          onUpdateSchedule={handleUpdateSchedule}
          onDeleteSchedule={handleDeleteSchedule}
        />
      ) : (
        <MuteScheduleManager
          muteSchedules={muteSchedules}
          onBack={() => setCurrentView('main')}
          onAddMuteSchedule={handleAddMuteSchedule}
          onUpdateMuteSchedule={handleUpdateMuteSchedule}
          onDeleteMuteSchedule={handleDeleteMuteSchedule}
        />
      )}
    </div>
  );
}

export default App;
