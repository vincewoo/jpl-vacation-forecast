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

// Cache for first Thursday timestamps to avoid Date construction in loop
const firstThursdayCache = new Map<number, number>();

/**
 * Get the timestamp of the first Thursday of the ISO year.
 * Optimized with caching.
 */
const getFirstThursdayOfYearTimestamp = (year: number): number => {
  const cached = firstThursdayCache.get(year);
  if (cached !== undefined) {
    return cached;
  }

  // ISO Week 1 is the week containing Jan 4.
  // We need the Thursday of that week.
  // 1. Find Jan 4.
  const jan4 = new Date(year, 0, 4);

  // 2. Find day of week of Jan 4 (0=Sun, 1=Mon, ..., 6=Sat).
  // Note: getDay() returns 0 for Sunday, but ISO treats Monday as 1, Sunday as 7.
  const jan4Day = jan4.getDay() || 7;

  // 3. The Thursday (4) is relative to Jan 4.
  // If Jan 4 is Thu (4), offset is 0.
  // If Jan 4 is Mon (1), Thursday is +3 days.
  // If Jan 4 is Sun (7), Thursday was -3 days (Jan 1).
  // Offset = 4 - jan4Day.
  const offsetDays = 4 - jan4Day;

  // 4. Calculate timestamp directly.
  const firstThursdayTs = jan4.getTime() + (offsetDays * 86400000);

  firstThursdayCache.set(year, firstThursdayTs);
  return firstThursdayTs;
};

const ONE_WEEK_MS = 604800000; // 7 * 24 * 60 * 60 * 1000

/**
 * Check if a Friday is an RDO based on the pattern
 * Optimized to avoid Date allocations and fix edge case bugs in original implementation.
 * Uses ISO week numbering logic (Week 1 is the week containing Jan 4).
 */
export const isRDOFriday = (date: Date, rdoPattern: string): boolean => {
  if (date.getDay() !== 5) return false; // Not a Friday

  // We need to find the ISO Week Number.
  // ISO Week Number = 1 + round((ThursdayOfThisWeek - ThursdayOfWeek1) / 7 days)

  // 1. Find the Thursday of the current week.
  // Since input is Friday, Thursday is 1 day before.
  // Note: date.getTime() is UTC timestamp. This is safe for diffing.
  const thursdayTs = date.getTime() - 86400000; // -24 hours

  // 2. Determine the ISO Year.
  // The ISO Year is the year of the Thursday.
  // Usually this is date.getFullYear().
  // Exception: If date is Jan 1 (Friday), Thursday is Dec 31 (Prev Year).
  let isoYear = date.getFullYear();
  if (date.getMonth() === 0 && date.getDate() === 1) {
    isoYear--;
  }

  // 3. Get the First Thursday of the ISO Year.
  const firstThursdayTs = getFirstThursdayOfYearTimestamp(isoYear);

  // 4. Calculate week number.
  // Math.round is used to handle potential DST shifts if crossing boundaries,
  // although diffing timestamps usually works if aligned.
  // Note: timestamps are consistent (UTC-based).
  const diff = thursdayTs - firstThursdayTs;
  const weekNumber = 1 + Math.round(diff / ONE_WEEK_MS);

  const isEvenWeek = weekNumber % 2 === 0;

  // For "odd-fridays" pattern, RDOs are on even ISO weeks.
  // For "even-fridays" pattern (deprecated), RDOs are on odd ISO weeks.
  return rdoPattern === 'even-fridays' ? !isEvenWeek : isEvenWeek;
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
  // Optimization: Allow passing a pre-calculated Set of holiday integers (YYYYMMDD) to avoid re-creation in loops
  precalculatedHolidayIntegers?: Set<number>
): number => {
  let totalHours = 0;
  const currentDate = new Date(startDate);

  // Optimize: Use pre-calculated set if available, otherwise create one
  const holidayDates = precalculatedHolidayIntegers || new Set(holidays.map(h => parseDateToInteger(h.date)));

  // Loop without allocating array
  while (currentDate <= endDate) {
    // Use optimized integer conversion
    const dateInt = dateToInteger(currentDate);

    // Skip this date if it's a holiday
    if (!holidayDates.has(dateInt)) {
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
