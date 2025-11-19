import React, { useState, useEffect } from 'react';
import './App.css';
import MainScreen from './components/MainScreen';
import ScheduleManager from './components/ScheduleManager';
import MuteScheduleManager from './components/MuteScheduleManager';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

function App() {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'schedule', or 'mute-schedule'
  const [muted, setMuted] = useState(false);
  const [mutedBySchedule, setMutedBySchedule] = useState(false);
  const [activeMuteSchedules, setActiveMuteSchedules] = useState([]);
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

    // Poll status every 10 seconds to check for active mute schedules
    const statusInterval = setInterval(() => {
      loadStatus();
    }, 10000);

    return () => clearInterval(statusInterval);
  }, []);

  const loadStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/status`);
      setMuted(response.data.muted);
      setMutedBySchedule(response.data.muted_by_schedule || false);
      setActiveMuteSchedules(response.data.active_mute_schedules || []);
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

  const handleRingBell = async (numRings = 15) => {
    try {
      await axios.post(`${API_BASE}/ring`, { num_rings: numRings });
    } catch (error) {
      console.error('Error ringing bell:', error);
      alert('Error ringing bell');
    }
  };

  const handleToggleMute = async (overrideSchedule = false) => {
    try {
      const newMuted = !muted;

      // If unmuting while a schedule is active, ask for confirmation (unless override already confirmed)
      if (!newMuted && mutedBySchedule && !overrideSchedule) {
        const scheduleNames = activeMuteSchedules.map(ms => ms.name).join(', ');
        const confirmed = window.confirm(
          `The following mute schedule${activeMuteSchedules.length > 1 ? 's are' : ' is'} currently active:\n\n${scheduleNames}\n\nDo you want to override ${activeMuteSchedules.length > 1 ? 'these schedules' : 'this schedule'} and unmute?`
        );

        if (!confirmed) {
          return; // User cancelled
        }

        // User confirmed, unmute and override the schedule
        await axios.post(`${API_BASE}/mute`, { muted: newMuted, override_schedule: true });
      } else {
        // Normal toggle without override
        await axios.post(`${API_BASE}/mute`, { muted: newMuted, override_schedule: false });
      }

      setMuted(newMuted);
      // Reload status to update mutedBySchedule and activeMuteSchedules
      loadStatus();
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
          mutedBySchedule={mutedBySchedule}
          activeMuteSchedules={activeMuteSchedules}
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
