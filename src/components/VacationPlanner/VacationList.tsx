import React from 'react';
import { PlannedVacation } from '../../types';
import VacationEntry from './VacationEntry';
import './VacationPlanner.css';

interface VacationListProps {
  vacations: PlannedVacation[];
  onUpdate: (id: string, updates: Partial<PlannedVacation>) => void;
  onDelete: (id: string) => void;
}

const VacationList: React.FC<VacationListProps> = ({ vacations, onUpdate, onDelete }) => {
  if (vacations.length === 0) {
    return (
      <div className="empty-state">
        <p>No vacations planned yet.</p>
        <p>Click "Add Vacation" to get started!</p>
      </div>
    );
  }

  // Sort vacations by start date
  const sortedVacations = [...vacations].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );

  return (
    <div className="vacation-list">
      {sortedVacations.map((vacation) => (
        <VacationEntry
          key={vacation.id}
          vacation={vacation}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default VacationList;
