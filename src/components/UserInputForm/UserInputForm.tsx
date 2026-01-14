import React, { useState } from 'react';
import { UserProfile, ScheduleType } from '../../types';
import { parseDate } from '../../utils/dateUtils';
import './UserInputForm.css';

interface UserInputFormProps {
  onSubmit: (profile: UserProfile) => void;
  onBack?: () => void;
}

const UserInputForm: React.FC<UserInputFormProps> = ({ onSubmit, onBack }) => {
  const [startDate, setStartDate] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [balanceAsOfDate, setBalanceAsOfDate] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('5/40');
  const [personalDayUsedInStartYear, setPersonalDayUsedInStartYear] = useState(false);

  // Check if selected balanceAsOfDate is a Sunday
  const isSunday = (dateStr: string) => {
    if (!dateStr) return true;
    try {
      const date = parseDate(dateStr);
      return date.getDay() === 0;
    } catch {
      return true; // Ignore parse errors for UI warning
    }
  };

  const showSundayWarning = balanceAsOfDate && !isSunday(balanceAsOfDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const profile: UserProfile = {
      startDate,
      currentBalance: parseFloat(currentBalance),
      balanceAsOfDate,
      workSchedule: {
        type: scheduleType,
        rdoPattern: scheduleType === '9/80' ? 'odd-fridays' : undefined,
      },
      personalDayUsedInStartYear,
    };

    onSubmit(profile);
  };

  return (
    <div className="user-input-form-container">
      {onBack && (
        <button onClick={onBack} className="back-button" type="button">
          ← Back
        </button>
      )}
      <h2>Welcome to JPL Vacation Forecast</h2>
      <p>Let's set up your vacation tracking profile</p>

      <form onSubmit={handleSubmit} className="user-input-form">
        <div className="form-group">
          <label htmlFor="startDate">JPL Start Date</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            autoFocus
            aria-describedby="startDate-help"
          />
          <small id="startDate-help">This determines your vacation accrual rate</small>
        </div>

        <div className="form-group">
          <label htmlFor="currentBalance">Current Vacation Balance (hours)</label>
          <input
            type="number"
            id="currentBalance"
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
            min="0"
            max="1000"
            step="0.01"
            required
            aria-describedby="currentBalance-help"
          />
          <small id="currentBalance-help">Include any carryover from previous year</small>
        </div>

        <div className="form-group">
          <label htmlFor="balanceAsOfDate">Balance As Of Date</label>
          <input
            type="date"
            id="balanceAsOfDate"
            value={balanceAsOfDate}
            onChange={(e) => setBalanceAsOfDate(e.target.value)}
            required
            aria-invalid={showSundayWarning ? 'true' : 'false'}
            aria-describedby={showSundayWarning ? 'sunday-warning' : 'balanceAsOfDate-help'}
          />
          {showSundayWarning ? (
            <small
              id="sunday-warning"
              className="warning-text"
              role="alert"
            >
              ⚠️ Warning: Selected date is not a Sunday. Weekly calculations may be inaccurate.
            </small>
          ) : (
            <small id="balanceAsOfDate-help">When was this balance taken? Should be the start of a week (Sunday)</small>
          )}
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={personalDayUsedInStartYear}
              onChange={(e) => setPersonalDayUsedInStartYear(e.target.checked)}
              aria-describedby="personalDay-help"
            />
            <span>I already used my Personal Day this year</span>
          </label>
          <small id="personalDay-help">
            Check this if you took a personal day before {balanceAsOfDate || 'your balance date'}
          </small>
        </div>

        <fieldset className="form-group radio-fieldset">
          <legend>Work Schedule</legend>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="scheduleType"
                value="5/40"
                checked={scheduleType === '5/40'}
                onChange={() => setScheduleType('5/40')}
              />
              <span>5/40 (Five 8-hour days per week)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="scheduleType"
                value="9/80"
                checked={scheduleType === '9/80'}
                onChange={() => setScheduleType('9/80')}
              />
              <span>9/80 (Nine 9-hour days + one 8-hour day over 2 weeks, alternating Friday off)</span>
            </label>
          </div>
        </fieldset>

        <button type="submit" className="submit-button">
          Start Forecasting
        </button>
      </form>
    </div>
  );
};

export default UserInputForm;
