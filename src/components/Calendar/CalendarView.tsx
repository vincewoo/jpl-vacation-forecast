import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css';
import {
  WeeklyBalance,
  PlannedVacation,
  Holiday,
  UserProfile,
  DayType,
} from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { mapWeeklyBalancesToDays } from '../../utils/calendarDataMapper';
import { calculateVacationHoursForRange } from '../../utils/workScheduleUtils';
import CalendarTile from './CalendarTile';
import VacationEditModal from './VacationEditModal';

interface CalendarViewProps {
  weeklyBalances: WeeklyBalance[];
  plannedVacations: PlannedVacation[];
  holidays: Holiday[];
  userProfile: UserProfile;
  onAddVacation: (vacation: Omit<PlannedVacation, 'id'>) => void;
  onUpdateVacation: (id: string, updates: Partial<PlannedVacation>) => void;
  onDeleteVacation: (id: string) => void;
  canAffordVacation: (vacation: Omit<PlannedVacation, 'id'>) => {
    canAfford: boolean;
    projectedBalance: number;
  };
}

type SelectionMode = 'idle' | 'selecting';

const CalendarView: React.FC<CalendarViewProps> = ({
  weeklyBalances,
  plannedVacations,
  holidays,
  userProfile,
  onAddVacation,
  onUpdateVacation,
  onDeleteVacation,
  canAffordVacation,
}) => {
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('idle');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [editingVacation, setEditingVacation] = useState<PlannedVacation | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState('');
  const [isDoubleView, setIsDoubleView] = useState(window.innerWidth >= 768);

  // Handle window resize for responsive double view
  useEffect(() => {
    const handleResize = () => {
      setIsDoubleView(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate date range (current month - 1 month to current month + 2 months)
  const dateRange = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 3, 0);
    return { start, end };
  }, []);

  // Map data to calendar days
  const dayDataMap = useMemo(
    () =>
      mapWeeklyBalancesToDays(
        weeklyBalances,
        plannedVacations,
        holidays,
        userProfile.workSchedule,
        dateRange.start,
        dateRange.end
      ),
    [
      weeklyBalances,
      plannedVacations,
      holidays,
      userProfile.workSchedule,
      dateRange,
    ]
  );

  // Get selection range for preview
  const getSelectionRange = useCallback(() => {
    if (selectionMode === 'selecting' && startDate && hoverDate) {
      return {
        start: startDate < hoverDate ? startDate : hoverDate,
        end: startDate < hoverDate ? hoverDate : startDate,
      };
    }
    return null;
  }, [selectionMode, startDate, hoverDate]);

  const selectionRange = getSelectionRange();

  // Handle day click
  const handleDayClick = (date: Date) => {
    const dateKey = formatDate(date);
    const dayInfo = dayDataMap.get(dateKey);

    // Case 1: Clicking on existing vacation -> Edit
    if (dayInfo?.isInVacation && dayInfo.vacationId) {
      const vacation = plannedVacations.find((v) => v.id === dayInfo.vacationId);
      if (vacation) {
        setEditingVacation(vacation);
        setShowEditModal(true);
        cancelSelection();
        return;
      }
    }

    // Case 2: First click of new selection
    if (selectionMode === 'idle') {
      setSelectionMode('selecting');
      setStartDate(date);
      setError('');
      return;
    }

    // Case 3: Second click -> Complete selection
    if (selectionMode === 'selecting' && startDate) {
      const [start, end] =
        date < startDate ? [date, startDate] : [startDate, date];

      // Calculate hours
      const hours = calculateVacationHoursForRange(
        start,
        end,
        userProfile.workSchedule
      );

      // Validate affordability
      const { canAfford, projectedBalance } = canAffordVacation({
        startDate: formatDate(start),
        endDate: formatDate(end),
        hours,
      });

      if (!canAfford) {
        setError(
          `Insufficient balance. Need ${hours}h, will have ${projectedBalance.toFixed(
            2
          )}h`
        );
        cancelSelection();
        return;
      }

      // Create vacation
      onAddVacation({
        startDate: formatDate(start),
        endDate: formatDate(end),
        hours,
      });

      // Reset selection
      cancelSelection();
    }
  };

  const cancelSelection = () => {
    setSelectionMode('idle');
    setStartDate(null);
    setHoverDate(null);
    setError('');
  };

  // Handle ESC key to cancel selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Generate tile class names
  const getTileClassName = useCallback(
    ({ date, view }: { date: Date; view: string }) => {
      if (view !== 'month') return '';

      const dayInfo = dayDataMap.get(formatDate(date));
      const classes: string[] = [];

      if (dayInfo?.isInVacation) classes.push('react-calendar__tile--vacation');
      if (dayInfo?.isHoliday) classes.push('react-calendar__tile--holiday');
      if (dayInfo?.isRDO) classes.push('react-calendar__tile--rdo');
      if (dayInfo?.types.includes(DayType.WEEKEND))
        classes.push('react-calendar__tile--weekend');

      // Selection states
      if (selectionRange) {
        const dateTime = date.getTime();
        const startTime = selectionRange.start.getTime();
        const endTime = selectionRange.end.getTime();

        if (dateTime >= startTime && dateTime <= endTime) {
          classes.push('react-calendar__tile--in-selection');
        }
        if (dateTime === startTime) {
          classes.push('react-calendar__tile--selection-start');
        }
        if (dateTime === endTime) {
          classes.push('react-calendar__tile--selection-end');
        }
      }

      return classes.join(' ');
    },
    [dayDataMap, selectionRange]
  );

  // Render tile content
  const renderTileContent = useCallback(
    ({ date, view }: { date: Date; view: string }) => {
      if (view !== 'month') return null;

      const dayInfo = dayDataMap.get(formatDate(date));
      const isInRange =
        selectionRange &&
        date >= selectionRange.start &&
        date <= selectionRange.end;
      const isStart = startDate && date.getTime() === startDate.getTime();
      const isEnd = hoverDate && date.getTime() === hoverDate.getTime();

      return (
        <div
          onMouseEnter={() => {
            if (selectionMode === 'selecting' && startDate) {
              setHoverDate(date);
            }
          }}
        >
          <CalendarTile
            dayInfo={dayInfo}
            isInSelectionRange={!!isInRange}
            isSelectionStart={!!isStart}
            isSelectionEnd={!!isEnd && selectionMode === 'selecting'}
          />
        </div>
      );
    },
    [dayDataMap, selectionRange, startDate, hoverDate, selectionMode]
  );

  return (
    <div className="calendar-view">
      {selectionMode === 'selecting' && (
        <div className="selection-banner">
          <span>
            Selecting vacation: Click the end date or{' '}
            <button onClick={cancelSelection} className="cancel-link">
              Cancel
            </button>
          </span>
        </div>
      )}

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')} className="close-error">
            ×
          </button>
        </div>
      )}

      <Calendar
        showDoubleView={isDoubleView}
        showNeighboringMonth={true}
        selectRange={false}
        tileContent={renderTileContent}
        tileClassName={getTileClassName}
        onClickDay={handleDayClick}
        minDetail="month"
        maxDetail="month"
        locale="en-US"
      />

      <VacationEditModal
        vacation={editingVacation}
        isOpen={showEditModal}
        workSchedule={userProfile.workSchedule}
        onSave={onUpdateVacation}
        onDelete={onDeleteVacation}
        onClose={() => {
          setShowEditModal(false);
          setEditingVacation(null);
        }}
        canAffordVacation={canAffordVacation}
      />
    </div>
  );
};

export default CalendarView;
