import React, { useEffect, useState } from 'react';
import { useVacationCalculator } from './hooks/useVacationCalculator';
import { useHolidays } from './hooks/useHolidays';
import UserInputForm from './components/UserInputForm/UserInputForm';
import CalendarView from './components/Calendar/CalendarView';
import CalendarLegend from './components/Calendar/CalendarLegend';
import { CloudSyncSettings } from './components/CloudSync/CloudSyncSettings';
import { SyncStatusIndicator } from './components/CloudSync/SyncStatusIndicator';
import './App.css';

const App: React.FC = () => {
  const {
    userProfile,
    setUserProfile,
    plannedVacations,
    addPlannedVacation,
    updatePlannedVacation,
    deletePlannedVacation,
    holidays,
    setHolidays,
    weeklyBalances,
    forecastPeriod,
    canAffordVacation,
  } = useVacationCalculator();

  const { defaultHolidays } = useHolidays(
    userProfile?.workSchedule ?? null,
    forecastPeriod.startDate,
    forecastPeriod.endDate
  );

  // Theme state management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  // CloudSync panel visibility state - default to true so users see the cloud sync option
  const [isCloudSyncPanelOpen, setIsCloudSyncPanelOpen] = useState(true);

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Initialize holidays when user profile is set
  // Also handles migration from old single-year holidays to multi-year holidays
  useEffect(() => {
    if (!userProfile || defaultHolidays.length === 0) return;

    // Initialize holidays if none exist
    if (holidays.length === 0) {
      setHolidays(defaultHolidays);
      return;
    }

    // Update if current holidays don't include multi-year data
    // (simple heuristic: check if we have any 2027+ holidays)
    const hasMultiYearHolidays = holidays.some((h) =>
      h.date && h.date.startsWith('2027')
    );

    if (!hasMultiYearHolidays) {
      setHolidays(defaultHolidays);
    }
  }, [userProfile, holidays, defaultHolidays, setHolidays]);

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <h1>JPL Vacation Forecast</h1>
          <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto', alignItems: 'center' }}>
            <SyncStatusIndicator onClick={() => setIsCloudSyncPanelOpen(!isCloudSyncPanelOpen)} />
            <button
              onClick={toggleTheme}
              className="reset-button"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {!userProfile ? (
          <UserInputForm onSubmit={setUserProfile} />
        ) : (
          <div className="dashboard">
            <div className="dashboard-header">
              <button
                onClick={() => setUserProfile(null)}
                className="reset-button"
              >
                Reset Profile
              </button>
            </div>

            <CloudSyncSettings
              isOpen={isCloudSyncPanelOpen}
              onClose={() => setIsCloudSyncPanelOpen(false)}
            />

            <CalendarLegend />

            <CalendarView
              weeklyBalances={weeklyBalances}
              plannedVacations={plannedVacations}
              holidays={holidays}
              userProfile={userProfile}
              onAddVacation={addPlannedVacation}
              onUpdateVacation={updatePlannedVacation}
              onDeleteVacation={deletePlannedVacation}
              canAffordVacation={canAffordVacation}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
