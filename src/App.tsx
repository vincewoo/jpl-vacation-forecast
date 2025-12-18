import React, { useEffect } from 'react';
import { useVacationCalculator } from './hooks/useVacationCalculator';
import { useHolidays } from './hooks/useHolidays';
import UserInputForm from './components/UserInputForm/UserInputForm';
import CalendarView from './components/Calendar/CalendarView';
import CalendarLegend from './components/Calendar/CalendarLegend';
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
    annualSummaries,
    canAffordVacation,
  } = useVacationCalculator();

  const { defaultHolidays } = useHolidays(userProfile?.workSchedule ?? null);

  // Initialize holidays when user profile is set
  useEffect(() => {
    if (userProfile && holidays.length === 0 && defaultHolidays.length > 0) {
      setHolidays(defaultHolidays);
    }
  }, [userProfile, holidays.length, defaultHolidays, setHolidays]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>JPL Vacation Forecast</h1>
      </header>

      <main className="app-main">
        {!userProfile ? (
          <UserInputForm onSubmit={setUserProfile} />
        ) : (
          <div className="dashboard">
            <div className="dashboard-header">
              <h2>Welcome back!</h2>
              <button
                onClick={() => setUserProfile(null)}
                className="reset-button"
              >
                Reset Profile
              </button>
            </div>

            <div className="summary-cards">
              <div className="summary-card">
                <h3>Current Balance</h3>
                <div className="balance-value">
                  {userProfile.currentBalance.toFixed(2)} hours
                </div>
              </div>

              <div className="summary-card">
                <h3>Work Schedule</h3>
                <div className="schedule-value">
                  {userProfile.workSchedule.type}
                  {userProfile.workSchedule.rdoPattern && (
                    <div className="schedule-detail">
                      RDO: {userProfile.workSchedule.rdoPattern === 'even-fridays' ? 'Even' : 'Odd'} Week Fridays
                    </div>
                  )}
                </div>
              </div>

              <div className="summary-card">
                <h3>Planned Vacations</h3>
                <div className="vacation-count">
                  {plannedVacations.length} planned
                </div>
              </div>

              {annualSummaries.map(summary => (
                <div key={summary.year} className="summary-card">
                  <h3>{summary.year} Summary</h3>
                  <div className="summary-stats">
                    <div className="summary-stat">
                      <span className="stat-label">Accrued:</span>
                      <span className="stat-value positive">{summary.totalAccrued.toFixed(1)}h</span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">Used:</span>
                      <span className="stat-value negative">{summary.totalUsed.toFixed(1)}h</span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">Ending:</span>
                      <span className={`stat-value ${summary.endingBalance >= 0 ? 'positive' : 'negative'}`}>
                        {summary.endingBalance.toFixed(1)}h
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
