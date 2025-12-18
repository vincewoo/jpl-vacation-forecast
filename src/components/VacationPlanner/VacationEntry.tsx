import React from 'react';
import { PlannedVacation, WorkSchedule, Holiday } from '../../types';
import { parseDate } from '../../utils/dateUtils';
import { getVacationHours } from '../../utils/workScheduleUtils';
import './VacationPlanner.css';

interface VacationEntryProps {
  vacation: PlannedVacation;
  workSchedule: WorkSchedule;
  holidays: Holiday[];
  onUpdate: (id: string, updates: Partial<PlannedVacation>) => void;
  onDelete: (id: string) => void;
}

const VacationEntry: React.FC<VacationEntryProps> = ({ vacation, workSchedule, holidays, onDelete }) => {
  const formatDateDisplay = (dateString: string): string => {
    const date = parseDate(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDuration = (): string => {
    const start = parseDate(vacation.startDate);
    const end = parseDate(vacation.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days === 1 ? '1 day' : `${days} days`;
  };

  return (
    <div className="vacation-entry">
      <div className="vacation-entry-content">
        <div className="vacation-entry-dates">
          <span className="date-range">
            {formatDateDisplay(vacation.startDate)} - {formatDateDisplay(vacation.endDate)}
          </span>
          <span className="duration">{getDuration()}</span>
        </div>
        {vacation.description && (
          <div className="vacation-entry-description">{vacation.description}</div>
        )}
        <div className="vacation-entry-hours">
          {getVacationHours(vacation, workSchedule, holidays).toFixed(2)} hours
        </div>
      </div>
      <div className="vacation-entry-actions">
        <button
          onClick={() => onDelete(vacation.id)}
          className="delete-button"
          title="Delete vacation"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default VacationEntry;
