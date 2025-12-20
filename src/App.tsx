import React, { useEffect, useState } from 'react';
import { useVacationCalculator } from './hooks/useVacationCalculator';
import { useHolidays } from './hooks/useHolidays';
import { useAuth } from './hooks/useAuth';
import UserInputForm from './components/UserInputForm/UserInputForm';
import CalendarView from './components/Calendar/CalendarView';
import CalendarLegend from './components/Calendar/CalendarLegend';
import { CloudSyncSettings } from './components/CloudSync/CloudSyncSettings';
import { SyncStatusIndicator } from './components/CloudSync/SyncStatusIndicator';
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import holidayData from './data/holidays.json';
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

  // Authentication state
  const { user, loading: authLoading, initialSyncComplete } = useAuth();

  // Theme state management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  // CloudSync panel visibility state - open by default when not signed in, closed when signed in
  const [isCloudSyncPanelOpen, setIsCloudSyncPanelOpen] = useState(true);

  // User flow state - controls whether to show UserInputForm
  const [showUserForm, setShowUserForm] = useState(false);

  // Close the CloudSync panel when user signs in (only on initial load)
  useEffect(() => {
    if (user && initialSyncComplete) {
      setIsCloudSyncPanelOpen(false);
    }
  }, [user, initialSyncComplete]);

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

    const HOLIDAY_VERSION_KEY = 'jpl-vacation-holidays-version';
    const storedVersion = localStorage.getItem(HOLIDAY_VERSION_KEY);
    const currentVersion = holidayData.version;

    const updateHolidays = () => {
      setHolidays(defaultHolidays);
      localStorage.setItem(HOLIDAY_VERSION_KEY, currentVersion);
    };

    // Initialize holidays if none exist
    if (holidays.length === 0) {
      updateHolidays();
      return;
    }

    // Check version match
    if (storedVersion !== currentVersion) {
      console.log(`Holiday version mismatch (stored: ${storedVersion}, current: ${currentVersion}). Updating...`);
      updateHolidays();
      return;
    }

    // Check if schedule changed (by comparing hours of first holiday if exists)
    // This handles cases where user changes schedule but version is same
    // We compare cached holidays vs defaultHolidays (which are computed from current schedule)
    const hasDifferentHours = holidays.length !== defaultHolidays.length ||
      holidays.some((h, i) => {
        const defaultH = defaultHolidays[i];
        return !defaultH || h.date !== defaultH.date || h.hours !== defaultH.hours;
      });

    if (hasDifferentHours) {
      console.log('Work schedule mismatch detected in holidays. Updating...');
      updateHolidays();
      return;
    }

    // Update if current holidays don't include multi-year data
    // (simple heuristic: check if we have any 2027+ holidays)
    const hasMultiYearHolidays = holidays.some((h) =>
      h.date && h.date.startsWith('2027')
    );

    if (!hasMultiYearHolidays) {
      updateHolidays();
    }
  }, [userProfile, holidays, defaultHolidays, setHolidays]);

  // Determine what to render based on auth state and user profile
  const renderMainContent = () => {
    // Show loading while checking authentication
    if (authLoading) {
      return <LoadingScreen message="Checking authentication..." />;
    }

    // User has profile - show dashboard
    if (userProfile) {
      return (
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
      );
    }

    // User is signed in but no profile yet
    if (user && !userProfile) {
      // If sync is still in progress, show loading
      if (!initialSyncComplete) {
        return <LoadingScreen message="Loading your data..." />;
      }
      // Sync complete but no profile found - show form
      return (
        <UserInputForm
          onSubmit={setUserProfile}
          onBack={() => setShowUserForm(false)}
        />
      );
    }

    // Show user input form if user chose to be a new user
    if (showUserForm) {
      return (
        <UserInputForm
          onSubmit={setUserProfile}
          onBack={() => setShowUserForm(false)}
        />
      );
    }

    // No profile, not signed in - show welcome screen
    return <WelcomeScreen onNewUser={() => setShowUserForm(true)} />;
  };

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <h1>JPL Vacation Forecast 🌴</h1>
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
        {renderMainContent()}
      </main>
    </div>
  );
};

export default App;
