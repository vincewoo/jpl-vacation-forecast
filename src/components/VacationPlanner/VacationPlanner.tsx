import React, { useState } from 'react';
import { PlannedVacation, WorkSchedule, Holiday } from '../../types';
import { parseDate } from '../../utils/dateUtils';
import { calculateVacationHoursForRange } from '../../utils/workScheduleUtils';
import VacationList from './VacationList';
import './VacationPlanner.css';

interface VacationPlannerProps {
  plannedVacations: PlannedVacation[];
  workSchedule: WorkSchedule;
  holidays: Holiday[];
  onAdd: (vacation: Omit<PlannedVacation, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<PlannedVacation>) => void;
  onDelete: (id: string) => void;
  canAffordVacation: (vacation: Omit<PlannedVacation, 'id'>) => { canAfford: boolean; projectedBalance: number };
}

const VacationPlanner: React.FC<VacationPlannerProps> = ({
  plannedVacations,
  workSchedule,
  holidays,
  onAdd,
  onUpdate,
  onDelete,
  canAffordVacation,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate) {
      setError('Please enter both start and end dates');
      return;
    }

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (end < start) {
      setError('End date must be after start date');
      return;
    }

    const newVacation = {
      startDate,
      endDate,
      description: description.trim() || undefined,
    };

    // Check if vacation can be afforded
    const { canAfford, projectedBalance } = canAffordVacation(newVacation);

    if (!canAfford) {
      const hours = calculateVacationHoursForRange(start, end, workSchedule, holidays);
      setError(
        `Insufficient vacation hours. This vacation requires ${hours.toFixed(2)} hours, but you will only have ${projectedBalance.toFixed(2)} hours available by ${endDate}.`
      );
      return;
    }

    onAdd(newVacation);
    setShowForm(false);
    setStartDate('');
    setEndDate('');
    setDescription('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setStartDate('');
    setEndDate('');
    setDescription('');
    setError('');
  };

  return (
    <div className="vacation-planner">
      <div className="vacation-planner-header">
        <h2>Planned Vacations</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="add-vacation-button">
            Add Vacation
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="vacation-form">
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="description">Description (optional)</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Summer vacation, Holiday trip"
            />
          </div>

          {startDate && endDate && parseDate(endDate) >= parseDate(startDate) && (
            <div className="hours-estimate">
              Estimated hours needed: {calculateVacationHoursForRange(parseDate(startDate), parseDate(endDate), workSchedule, holidays).toFixed(2)}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button">
              Add Vacation
            </button>
          </div>
        </form>
      )}

      <VacationList
        vacations={plannedVacations}
        workSchedule={workSchedule}
        holidays={holidays}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
};

export default VacationPlanner;
