import { WorkSchedule, Holiday } from '../types';
import { SCHEDULE_CONFIGS } from '../constants/jplConstants';
import { parseDate, dateToInteger, parseDateToInteger } from './dateUtils';

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

const ONE_WEEK_MS = 604800000; // 7 * 24 * 60 * 60 * 1000

// Jan 10, 2025 is a verified RDO Friday under JPL's "odd-fridays" pattern.
// Using a fixed reference avoids the ISO week parity break that occurs when a year
// has 53 weeks (e.g. 2026), which would otherwise produce two consecutive non-RDO Fridays
// at the year boundary.
const REFERENCE_RDO_FRIDAY_TS = new Date(2025, 0, 10).getTime();

/**
 * Check if a Friday is an RDO based on the pattern.
 * Uses absolute week count from a fixed reference RDO Friday so the alternating
 * pattern never breaks across year boundaries.
 */
export const isRDOFriday = (date: Date, rdoPattern: string): boolean => {
  if (date.getDay() !== 5) return false; // Not a Friday

  // Count weeks from reference RDO Friday. Even distance (0, ±2, ±4, ...) = RDO.
  const weeksElapsed = Math.round((date.getTime() - REFERENCE_RDO_FRIDAY_TS) / ONE_WEEK_MS);
  return weeksElapsed % 2 === 0;
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
  holidays: Holiday[] = [],
  // Optimization: Allow passing a pre-calculated Set of holiday dates to avoid re-creation in loops
  precalculatedHolidayDates?: Set<string>,
  // Optimization: Allow passing a pre-calculated Set of holiday integers (YYYYMMDD)
  precalculatedHolidayIntegers?: Set<number>
): number => {
  let totalHours = 0;
  const currentDate = new Date(startDate);

  // Optimize: Use pre-calculated integer set if available.
  // If not, build it from the string set or the holidays array.
  let holidayIntegers: Set<number>;

  if (precalculatedHolidayIntegers) {
    holidayIntegers = precalculatedHolidayIntegers;
  } else if (precalculatedHolidayDates) {
    holidayIntegers = new Set();
    precalculatedHolidayDates.forEach(d => holidayIntegers.add(parseDateToInteger(d)));
  } else {
    holidayIntegers = new Set(holidays.map(h => parseDateToInteger(h.date)));
  }

  // Loop without allocating array
  while (currentDate <= endDate) {
    // Use optimized dateToInteger
    const dateInt = dateToInteger(currentDate);

    // Skip this date if it's a holiday
    if (!holidayIntegers.has(dateInt)) {
      totalHours += getWorkHoursForDay(currentDate, workSchedule);
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
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
