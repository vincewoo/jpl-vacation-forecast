import React, { useMemo, useState } from 'react';
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

interface YearGroup {
  year: number;
  vacations: PlannedVacation[];
}

interface StatusGroup {
  status: 'upcoming' | 'past';
  years: YearGroup[];
}

const VacationListByYear: React.FC<VacationListByYearProps> = ({
  vacations,
  workSchedule,
  holidays,
  onEdit,
  onDelete,
}) => {
  // Group vacations by status (upcoming/past), then by year within each
  const groupedVacations = useMemo(() => {
    if (vacations.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const groups: { upcoming: { [year: number]: PlannedVacation[] }, past: { [year: number]: PlannedVacation[] } } = {
      upcoming: {},
      past: {},
    };

    vacations.forEach((vacation) => {
      const year = parseDate(vacation.startDate).getFullYear();
      const endDate = parseDate(vacation.endDate);
      endDate.setHours(0, 0, 0, 0);

      const status = endDate < today ? 'past' : 'upcoming';
      if (!groups[status][year]) {
        groups[status][year] = [];
      }
      groups[status][year].push(vacation);
    });

    const result: StatusGroup[] = [];

    // Build upcoming group (most recent years first)
    const upcomingYears = Object.keys(groups.upcoming)
      .map((y) => parseInt(y, 10))
      .sort((a, b) => b - a);
    if (upcomingYears.length > 0) {
      result.push({
        status: 'upcoming',
        years: upcomingYears.map((year) => ({
          year,
          vacations: (groups.upcoming[year] || []).sort((a: PlannedVacation, b: PlannedVacation) => a.startDate.localeCompare(b.startDate)),
        })),
      });
    }

    // Build past group (most recent years first)
    const pastYears = Object.keys(groups.past)
      .map((y) => parseInt(y, 10))
      .sort((a, b) => b - a);
    if (pastYears.length > 0) {
      result.push({
        status: 'past',
        years: pastYears.map((year) => ({
          year,
          vacations: (groups.past[year] || []).sort((a: PlannedVacation, b: PlannedVacation) => a.startDate.localeCompare(b.startDate)),
        })),
      });
    }

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

  if (vacations.length === 0) {
    return null;
  }

  // Helper to render a vacation table
  const renderVacationTable = (vacationList: PlannedVacation[]) => (
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
          {vacationList.map((vacation) => (
            <tr key={vacation.id}>
              <td className="vacation-dates">
                {formatDateDisplay(vacation.startDate)} - {formatDateDisplay(vacation.endDate)}
              </td>
              <td className="vacation-description">
                {vacation.description || <span className="no-description">—</span>}
              </td>
              <td className="vacation-duration">{getDuration(vacation)}</td>
              <td className="vacation-hours">{getVacationHours(vacation, workSchedule, holidays).toFixed(1)}h</td>
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
  );

  const [pastCollapsed, setPastCollapsed] = useState(true);

  return (
    <div className="vacation-list-by-year">
      <h3>Planned Vacations</h3>
      {groupedVacations.map((statusGroup) => (
        <div key={statusGroup.status} className={`vacation-status-group ${statusGroup.status}-group`}>
          {statusGroup.status === 'past' ? (
            <h4
              className={`vacation-status-header ${statusGroup.status}-header collapsible-header ${pastCollapsed ? 'collapsed' : ''}`}
              onClick={() => setPastCollapsed(!pastCollapsed)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPastCollapsed(!pastCollapsed); } }}
              aria-expanded={!pastCollapsed}
            >
              <span className="collapse-icon">{pastCollapsed ? '▶' : '▼'}</span>
              Past Vacations
            </h4>
          ) : (
            <h4 className={`vacation-status-header ${statusGroup.status}-header`}>
              Upcoming Vacations
            </h4>
          )}
          {statusGroup.status === 'past' && !pastCollapsed && (
            statusGroup.years.map((yearGroup) => (
              <div key={yearGroup.year} className="vacation-year-group">
                <h5 className="vacation-year-header">{yearGroup.year}</h5>
                {renderVacationTable(yearGroup.vacations)}
              </div>
            ))
          )}
          {statusGroup.status !== 'past' && statusGroup.years.map((yearGroup) => (
            <div key={yearGroup.year} className="vacation-year-group">
              <h5 className="vacation-year-header">{yearGroup.year}</h5>
              {renderVacationTable(yearGroup.vacations)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default VacationListByYear;
