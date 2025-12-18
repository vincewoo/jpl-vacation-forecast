import { WorkSchedule, Holiday } from '../types';
import { SCHEDULE_CONFIGS } from '../constants/jplConstants';
import { getDatesInRange, parseDate } from './dateUtils';

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

/**
 * Check if a Friday is an RDO based on the pattern
 * Uses ISO week numbering for consistency
 */
export const isRDOFriday = (date: Date, rdoPattern: string): boolean => {
  if (date.getDay() !== 5) return false; // Not a Friday

  // Get ISO week number (week starts on Monday)
  const getISOWeekNumber = (d: Date): number => {
    const target = new Date(d.valueOf());
    const dayNumber = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNumber + 3);
    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const diff = target.getTime() - firstThursday.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return 1 + Math.floor(diff / oneWeek);
  };

  const weekNumber = getISOWeekNumber(date);
  const isEvenWeek = weekNumber % 2 === 0;

  return rdoPattern === 'even-fridays' ? isEvenWeek : !isEvenWeek;
};

/**
 * Calculate work hours for a specific day
 */
export const getWorkHoursForDay = (
  date: Date,
  workSchedule: WorkSchedule
): number => {
  if (isWeekend(date)) return 0;

  if (workSchedule.type === '5/40') {
    return SCHEDULE_CONFIGS['5/40'].hoursPerDay;
  }

  // 9/80 schedule
  if (date.getDay() === 5) { // Friday
    if (workSchedule.rdoPattern && isRDOFriday(date, workSchedule.rdoPattern)) {
      return 0; // RDO
    }
    return SCHEDULE_CONFIGS['9/80'].hoursPerNonRDOFriday;
  }

  return SCHEDULE_CONFIGS['9/80'].hoursPerRegularDay;
};

/**
 * Get all RDO dates in a date range for 9/80 schedule
 */
export const getRDODatesInRange = (
  startDate: Date,
  endDate: Date,
  rdoPattern: string
): Date[] => {
  const rdoDates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (currentDate.getDay() === 5 && isRDOFriday(currentDate, rdoPattern)) {
      rdoDates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return rdoDates;
};

/**
 * Calculate total vacation hours needed for a date range
 * Excludes weekends, RDOs, and holidays - only counts actual work days
 */
export const calculateVacationHoursForRange = (
  startDate: Date,
  endDate: Date,
  workSchedule: WorkSchedule,
  holidays: Holiday[] = []
): number => {
  let totalHours = 0;
  const dates = getDatesInRange(startDate, endDate);

  // Create a Set of holiday date strings for fast lookup
  const holidayDates = new Set(
    holidays.map(h => parseDate(h.date).toISOString().split('T')[0])
  );

  for (const date of dates) {
    // Skip this date if it's a holiday
    const dateStr = date.toISOString().split('T')[0];
    if (holidayDates.has(dateStr)) {
      continue;
    }

    totalHours += getWorkHoursForDay(date, workSchedule);
  }

  return totalHours;
};

/**
 * Check if a specific date is an RDO
 */
export const isRDO = (date: Date, workSchedule: WorkSchedule): boolean => {
  if (workSchedule.type !== '9/80' || !workSchedule.rdoPattern) {
    return false;
  }
  return isRDOFriday(date, workSchedule.rdoPattern);
};

/**
 * Get vacation hours for a PlannedVacation object dynamically
 * This calculates hours based on current work schedule and holiday data
 */
export const getVacationHours = (
  vacation: { startDate: string; endDate: string },
  workSchedule: WorkSchedule,
  holidays: Holiday[] = []
): number => {
  const startDate = parseDate(vacation.startDate);
  const endDate = parseDate(vacation.endDate);
  return calculateVacationHoursForRange(startDate, endDate, workSchedule, holidays);
};
