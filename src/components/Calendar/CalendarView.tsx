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
import VacationListByYear from './VacationListByYear';

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
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date());
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward' | null>(null);

  // Handle window resize for responsive double view
  useEffect(() => {
    const handleResize = () => {
      setIsDoubleView(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate date range based on available weekly balances
  const dateRange = useMemo(() => {
    if (weeklyBalances.length === 0) {
      const today = new Date();
      return {
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        end: new Date(today.getFullYear(), today.getMonth() + 3, 0),
      };
    }

    // Use the full range of available balance data
    const firstWeek = weeklyBalances[0]!;
    const lastWeek = weeklyBalances[weeklyBalances.length - 1]!;

    return {
      start: new Date(firstWeek.weekStartDate),
      end: new Date(lastWeek.weekEndDate),
    };
  }, [weeklyBalances]);

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

      // Validate affordability
      const { canAfford, projectedBalance } = canAffordVacation({
        startDate: formatDate(start),
        endDate: formatDate(end),
      });

      if (!canAfford) {
        const hours = calculateVacationHoursForRange(
          start,
          end,
          userProfile.workSchedule,
          holidays
        );
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

  // Helper function to check if a date should be hidden (beyond the last week of the month)
  const shouldHideTile = useCallback(({ date, view, activeStartDate }: { date: Date; view: string; activeStartDate: Date }) => {
    if (view !== 'month') return false;

    // Get the month being displayed
    const displayMonth = activeStartDate.getMonth();
    const displayYear = activeStartDate.getFullYear();

    // Get the last day of the display month
    const lastDayOfMonth = new Date(displayYear, displayMonth + 1, 0);

    // Hide dates before the first of the month
    if (date < new Date(displayYear, displayMonth, 1)) {
      return true;
    }

    // Find the Saturday that ends the week containing the last day of the month
    const lastDay = lastDayOfMonth.getDay();
    const daysUntilSaturday = lastDay === 6 ? 0 : (6 - lastDay + 7) % 7;
    const lastSaturdayOfWeek = new Date(displayYear, displayMonth, lastDayOfMonth.getDate() + daysUntilSaturday);

    // Hide dates after that Saturday
    if (date > lastSaturdayOfWeek) {
      return true;
    }

    return false;
  }, []);

  // Helper function to check if a date is from the next month
  const isNextMonthDay = useCallback(({ date, activeStartDate }: { date: Date; activeStartDate: Date }) => {
    const displayMonth = activeStartDate.getMonth();
    const displayYear = activeStartDate.getFullYear();
    const lastDayOfMonth = new Date(displayYear, displayMonth + 1, 0);

    return date > lastDayOfMonth;
  }, []);

  // Generate tile class names
  const getTileClassName = useCallback(
    ({ date, view, activeStartDate }: { date: Date; view: string; activeStartDate: Date }) => {
      if (view !== 'month') return '';

      const classes: string[] = [];

      // Hide tiles outside the month's last week
      if (shouldHideTile({ date, view, activeStartDate })) {
        classes.push('react-calendar__tile--hidden');
        return classes.join(' ');
      }

      // Mark tiles from the next month with a different style
      if (isNextMonthDay({ date, activeStartDate })) {
        classes.push('react-calendar__tile--next-month');
      }

      const dayInfo = dayDataMap.get(formatDate(date));

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
    [dayDataMap, selectionRange, shouldHideTile, isNextMonthDay]
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
          className="calendar-tile-wrapper"
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

  // Jump to today function
  const jumpToToday = () => {
    setActiveStartDate(new Date());
  };

  // Check if we're currently viewing today's month
  const isViewingCurrentMonth = useMemo(() => {
    const today = new Date();
    const viewMonth = activeStartDate.getMonth();
    const viewYear = activeStartDate.getFullYear();
    return viewMonth === today.getMonth() && viewYear === today.getFullYear();
  }, [activeStartDate]);

  return (
    <div className="calendar-view">
      <div className="banner-container">
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
      </div>

      <div className="calendar-header-controls">
        <button
          onClick={jumpToToday}
          className="jump-to-today-button"
          disabled={isViewingCurrentMonth}
        >
          Jump to Today
        </button>
      </div>

      <div className={`calendar-container ${transitionDirection ? `slide-${transitionDirection}` : ''}`}>
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
          activeStartDate={activeStartDate}
          onActiveStartDateChange={({ activeStartDate: newDate }: { activeStartDate: Date | null }) => {
            if (newDate) {
              // Determine transition direction
              const currentMonth = activeStartDate.getMonth();
              const currentYear = activeStartDate.getFullYear();
              const newMonth = newDate.getMonth();
              const newYear = newDate.getFullYear();

              if (newYear > currentYear || (newYear === currentYear && newMonth > currentMonth)) {
                setTransitionDirection('forward');
              } else if (newYear < currentYear || (newYear === currentYear && newMonth < currentMonth)) {
                setTransitionDirection('backward');
              } else {
                setTransitionDirection(null);
              }

              setActiveStartDate(newDate);

              // Clear transition direction after animation completes
              setTimeout(() => setTransitionDirection(null), 600);
            }
          }}
        />
      </div>

      <VacationEditModal
        vacation={editingVacation}
        isOpen={showEditModal}
        workSchedule={userProfile.workSchedule}
        holidays={holidays}
        onSave={onUpdateVacation}
        onDelete={onDeleteVacation}
        onClose={() => {
          setShowEditModal(false);
          setEditingVacation(null);
        }}
        canAffordVacation={canAffordVacation}
      />

      <VacationListByYear
        vacations={plannedVacations}
        workSchedule={userProfile.workSchedule}
        holidays={holidays}
        onEdit={(vacation) => {
          setEditingVacation(vacation);
          setShowEditModal(true);
        }}
        onDelete={onDeleteVacation}
      />
    </div>
  );
};

export default CalendarView;
