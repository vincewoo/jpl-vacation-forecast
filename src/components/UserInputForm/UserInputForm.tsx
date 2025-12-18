import React, { useState } from 'react';
import { UserProfile, ScheduleType } from '../../types';
import './UserInputForm.css';

interface UserInputFormProps {
  onSubmit: (profile: UserProfile) => void;
}

const UserInputForm: React.FC<UserInputFormProps> = ({ onSubmit }) => {
  const [startDate, setStartDate] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [balanceAsOfDate, setBalanceAsOfDate] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('5/40');

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
    };

    onSubmit(profile);
  };

  return (
    <div className="user-input-form-container">
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
          />
          <small>This determines your vacation accrual rate</small>
        </div>

        <div className="form-group">
          <label htmlFor="currentBalance">Current Vacation Balance (hours)</label>
          <input
            type="number"
            id="currentBalance"
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
            min="0"
            step="0.01"
            required
          />
          <small>Include any carryover from previous year</small>
        </div>

        <div className="form-group">
          <label htmlFor="balanceAsOfDate">Balance As Of Date</label>
          <input
            type="date"
            id="balanceAsOfDate"
            value={balanceAsOfDate}
            onChange={(e) => setBalanceAsOfDate(e.target.value)}
            required
          />
          <small>When was this balance taken? Should be the start of a week (Sunday)</small>
        </div>

        <div className="form-group">
          <label>Work Schedule</label>
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
        </div>

        <button type="submit" className="submit-button">
          Start Forecasting
        </button>
      </form>
    </div>
  );
};

export default UserInputForm;
