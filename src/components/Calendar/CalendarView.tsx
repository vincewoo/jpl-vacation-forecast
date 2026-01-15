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
import { formatDate, parseDate } from '../../utils/dateUtils';
import { mapWeeklyBalancesToDays } from '../../utils/calendarDataMapper';
import { calculateVacationHoursForRange } from '../../utils/workScheduleUtils';
import CalendarTile from './CalendarTile';
import VacationEditModal from './VacationEditModal';
import VacationListByYear from './VacationListByYear';
import VacationRecommender from '../VacationRecommender/VacationRecommender';
import { VacationRecommendation } from '../../utils/vacationRecommender';

interface CalendarViewProps {
  weeklyBalances: WeeklyBalance[];
  plannedVacations: PlannedVacation[];
  holidays: Holiday[];
  userProfile: UserProfile;
  onAddVacation: (vacation: Omit<PlannedVacation, 'id'>) => void;
  onUpdateVacation: (id: string, updates: Partial<PlannedVacation>) => void;
  onDeleteVacation: (id: string) => void;
  canAffordVacation: (vacation: Omit<PlannedVacation, 'id'> & { id?: string }, excludeVacationId?: string) => {
    canAfford: boolean;
    projectedBalance: number;
  };
}

type SelectionMode = 'idle' | 'selecting';
type ViewMode = '2-month' | '6-month' | '12-month';

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
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const savedViewMode = localStorage.getItem('jpl-vacation-calendar-view-mode');
    return (savedViewMode as ViewMode) || '2-month';
  });
  const [isDoubleView, setIsDoubleView] = useState(window.innerWidth >= 768);
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date());
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward' | null>(null);

  // Handle window resize for responsive double view (only for 2-month mode)
  useEffect(() => {
    const handleResize = () => {
      if (viewMode === '2-month') {
        setIsDoubleView(window.innerWidth >= 768);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

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
      start: parseDate(firstWeek.weekStartDate),
      end: parseDate(lastWeek.weekEndDate),
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'Escape') {
        cancelSelection();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setTransitionDirection('backward');
        setActiveStartDate(
          (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
        );
        setTimeout(() => setTransitionDirection(null), 600);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setTransitionDirection('forward');
        setActiveStartDate(
          (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
        );
        setTimeout(() => setTransitionDirection(null), 600);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cache for month boundaries to avoid repeated Date calculations in render loops
  const boundsCache = useMemo(() => new Map<number, { monthStart: number; monthEnd: number; lastSaturdayOfWeek: number }>(), []);

  const getMonthBounds = useCallback((activeStartDate: Date) => {
    const time = activeStartDate.getTime();
    if (boundsCache.has(time)) {
      return boundsCache.get(time)!;
    }

    const displayMonth = activeStartDate.getMonth();
    const displayYear = activeStartDate.getFullYear();

    const monthStart = new Date(displayYear, displayMonth, 1).getTime();
    const lastDayOfMonth = new Date(displayYear, displayMonth + 1, 0);
    const monthEnd = lastDayOfMonth.getTime();

    const lastDay = lastDayOfMonth.getDay();
    const daysUntilSaturday = lastDay === 6 ? 0 : (6 - lastDay + 7) % 7;
    const lastSaturdayOfWeek = new Date(displayYear, displayMonth, lastDayOfMonth.getDate() + daysUntilSaturday).getTime();

    const bounds = { monthStart, monthEnd, lastSaturdayOfWeek };
    boundsCache.set(time, bounds);
    return bounds;
  }, [boundsCache]);

  // Helper function to check if a date should be hidden (beyond the last week of the month)
  const shouldHideTile = useCallback(({ date, view, activeStartDate }: { date: Date; view: string; activeStartDate: Date }) => {
    if (view !== 'month') return false;

    const bounds = getMonthBounds(activeStartDate);
    const dateTime = date.getTime();

    // Hide dates before the first of the month or after the last Saturday
    return dateTime < bounds.monthStart || dateTime > bounds.lastSaturdayOfWeek;
  }, [getMonthBounds]);

  // Helper function to check if a date is from the next month
  const isNextMonthDay = useCallback(({ date, activeStartDate }: { date: Date; activeStartDate: Date }) => {
    const bounds = getMonthBounds(activeStartDate);
    return date.getTime() > bounds.monthEnd;
  }, [getMonthBounds]);

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

  // Handle view mode changes
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('jpl-vacation-calendar-view-mode', mode);
    if (mode === '2-month') {
      setIsDoubleView(window.innerWidth >= 768);
    }
  };

  // Handle recommendation selection
  const handleSelectRecommendation = (recommendation: VacationRecommendation) => {
    // Validate affordability
    const { canAfford, projectedBalance } = canAffordVacation({
      startDate: recommendation.startDate,
      endDate: recommendation.endDate,
    });

    if (!canAfford) {
      setError(
        `Insufficient balance. Need ${recommendation.vacationHours}h, will have ${projectedBalance.toFixed(2)}h`
      );
      return;
    }

    // Add the vacation
    onAddVacation({
      startDate: recommendation.startDate,
      endDate: recommendation.endDate,
      description: `Recommended: ${recommendation.context}`,
    });

    // Jump to the vacation date on the calendar
    setActiveStartDate(parseDate(recommendation.startDate));
  };

  // Generate array of months for multi-month views
  const generateMonthDates = useMemo(() => {
    const count =
      viewMode === '12-month'
        ? 12
        : viewMode === '6-month'
        ? 6
        : 2;
    const dates: Date[] = [];
    const baseDate = new Date(activeStartDate);

    for (let i = 0; i < count; i++) {
      const date = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      dates.push(date);
    }

    return dates;
  }, [activeStartDate, viewMode, isDoubleView]);

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
          <div className="error-banner" role="alert">
            {error}
            <button onClick={() => setError('')} className="close-error">
              ×
            </button>
          </div>
        )}
      </div>

      <div className="calendar-header-controls">
        <div className="view-toggle-buttons" role="group" aria-label="Calendar View Duration">
          <button
            onClick={() => handleViewModeChange('2-month')}
            className={`view-toggle-button ${viewMode === '2-month' ? 'active' : ''}`}
            aria-pressed={viewMode === '2-month'}
          >
            2-Month View
          </button>
          <button
            onClick={() => handleViewModeChange('6-month')}
            className={`view-toggle-button ${viewMode === '6-month' ? 'active' : ''}`}
            aria-pressed={viewMode === '6-month'}
          >
            6-Month View
          </button>
          <button
            onClick={() => handleViewModeChange('12-month')}
            className={`view-toggle-button ${viewMode === '12-month' ? 'active' : ''}`}
            aria-pressed={viewMode === '12-month'}
          >
            12-Month View
          </button>
        </div>
        <button
          onClick={jumpToToday}
          className="jump-to-today-button"
          disabled={isViewingCurrentMonth}
          title={isViewingCurrentMonth ? "Already viewing current month" : "Jump to current month"}
          aria-label={isViewingCurrentMonth ? "Already viewing current month" : "Jump to current month"}
        >
          Jump to Today
        </button>
      </div>

      <div className="calendar-navigation-controls">
        <button
          onClick={() => {
            const newDate = new Date(
              activeStartDate.getFullYear(),
              activeStartDate.getMonth() - 1,
              1
            );
            setTransitionDirection('backward');
            setActiveStartDate(newDate);
            setTimeout(() => setTransitionDirection(null), 600);
          }}
          className="calendar-nav-button"
          title="Previous Month (Left Arrow)"
          aria-label="Previous Month"
        >
          ‹ Previous
        </button>
        <button
          onClick={() => {
            const newDate = new Date(
              activeStartDate.getFullYear(),
              activeStartDate.getMonth() + 1,
              1
            );
            setTransitionDirection('forward');
            setActiveStartDate(newDate);
            setTimeout(() => setTransitionDirection(null), 600);
          }}
          className="calendar-nav-button"
          title="Next Month (Right Arrow)"
          aria-label="Next Month"
        >
          Next ›
        </button>
      </div>

      <div
        className={`${
          viewMode === '12-month'
            ? 'twelve-month-grid'
            : viewMode === '6-month'
            ? 'six-month-grid'
            : 'two-month-grid'
        } ${transitionDirection ? `slide-${transitionDirection}` : ''}`}
      >
        {generateMonthDates.map((monthDate, index) => (
          <div
            key={index}
            className={`${
              viewMode === '12-month'
                ? 'twelve-month-calendar'
                : viewMode === '6-month'
                ? 'six-month-calendar'
                : 'two-month-calendar'
            }`}
          >
            <div
              className={`${
                viewMode === '12-month'
                  ? 'twelve-month-calendar-header'
                  : viewMode === '6-month'
                  ? 'six-month-calendar-header'
                  : 'two-month-calendar-header'
              }`}
            >
              {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <Calendar
              showDoubleView={false}
              showNeighboringMonth={true}
              selectRange={false}
              tileContent={renderTileContent}
              tileClassName={getTileClassName}
              onClickDay={handleDayClick}
              minDetail="month"
              maxDetail="month"
              locale="en-US"
              activeStartDate={monthDate}
              showNavigation={false}
            />
          </div>
        ))}
      </div>

      <VacationRecommender
        userProfile={userProfile}
        holidays={holidays}
        plannedVacations={plannedVacations}
        onSelectRecommendation={handleSelectRecommendation}
      />

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
