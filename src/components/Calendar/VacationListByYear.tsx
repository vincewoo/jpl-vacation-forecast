import React, { useMemo } from 'react';
import { PlannedVacation, WorkSchedule, Holiday } from '../../types';
import { parseDate } from '../../utils/dateUtils';
import { getVacationHours } from '../../utils/workScheduleUtils';
import './VacationListByYear.css';

interface VacationListByYearProps {
  vacations: PlannedVacation[];
  workSchedule: WorkSchedule;
  holidays: Holiday[];
  onEdit: (vacation: PlannedVacation) => void;
  onDelete: (id: string) => void;
}

interface GroupedVacation {
  year: number;
  vacations: PlannedVacation[];
}

const VacationListByYear: React.FC<VacationListByYearProps> = ({
  vacations,
  workSchedule,
  holidays,
  onEdit,
  onDelete,
}) => {
  // Group vacations by year and sort
  const groupedVacations = useMemo(() => {
    if (vacations.length === 0) return [];

    const groups: { [year: number]: PlannedVacation[] } = {};

    vacations.forEach((vacation) => {
      const year = parseDate(vacation.startDate).getFullYear();
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(vacation);
    });

    // Convert to array and sort by year
    const result: GroupedVacation[] = Object.keys(groups)
      .map((year) => {
        const yearNum = parseInt(year, 10);
        const yearVacations = groups[yearNum];
        return {
          year: yearNum,
          vacations: yearVacations
            ? yearVacations.sort((a, b) => a.startDate.localeCompare(b.startDate))
            : [],
        };
      })
      .sort((a, b) => a.year - b.year);

    return result;
  }, [vacations]);

  const formatDateDisplay = (dateString: string): string => {
    const date = parseDate(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDuration = (vacation: PlannedVacation): string => {
    const start = parseDate(vacation.startDate);
    const end = parseDate(vacation.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days === 1 ? '1 day' : `${days} days`;
  };

  // Optimization: Memoize holiday set to avoid recreation in render loop
  const holidayDateSet = useMemo(() => {
    return new Set(holidays.map(h => h.date));
  }, [holidays]);

  if (vacations.length === 0) {
    return null;
  }

  return (
    <div className="vacation-list-by-year">
      <h3>Planned Vacations</h3>
      {groupedVacations.map((group) => (
        <div key={group.year} className="vacation-year-group">
          <h4 className="vacation-year-header">{group.year}</h4>
          <div className="vacation-table-wrapper">
            <table className="vacation-table">
              <thead>
                <tr>
                  <th>Dates</th>
                  <th>Description</th>
                  <th>Duration</th>
                  <th>Vacation Hours</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {group.vacations.map((vacation) => (
                  <tr key={vacation.id}>
                    <td className="vacation-dates">
                      {formatDateDisplay(vacation.startDate)} - {formatDateDisplay(vacation.endDate)}
                    </td>
                    <td className="vacation-description">
                      {vacation.description || <span className="no-description">—</span>}
                    </td>
                    <td className="vacation-duration">{getDuration(vacation)}</td>
                    <td className="vacation-hours">{getVacationHours(vacation, workSchedule, holidays, holidayDateSet).toFixed(1)}h</td>
                    <td className="vacation-actions">
                      <button
                        onClick={() => onEdit(vacation)}
                        className="action-button edit-button"
                        title="Edit vacation"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(vacation.id)}
                        className="action-button delete-button"
                        title="Delete vacation"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VacationListByYear;
