import {
  WeeklyBalance,
  PlannedVacation,
  Holiday,
  UserProfile,
  AnnualSummary
} from '../types';
import {
  getWeeksInRange,
  getWeekEnd,
  parseDate,
  formatDate,
  parseDateToInteger
} from './dateUtils';
import { calculateAccrualForRange } from './accrualCalculator';
import { getRDODatesInRange, calculateVacationHoursForRange, getVacationHours } from './workScheduleUtils';

// JPL vacation balance limits
export const MAX_VACATION_BALANCE = 320; // Maximum accrual cap in hours
export const BALANCE_WARNING_THRESHOLD = 280; // Warning threshold (approaching max) in hours
export const LOW_BALANCE_WARNING_THRESHOLD = 40; // Warning threshold (approaching zero) in hours

/**
 * Calculate weekly balances for a date range
 */
export const calculateWeeklyBalances = (
  userProfile: UserProfile,
  startDate: Date,
  endDate: Date,
  plannedVacations: PlannedVacation[],
  holidays: Holiday[]
): WeeklyBalance[] => {
  const weeks = getWeeksInRange(startDate, endDate);
  const balances: WeeklyBalance[] = [];
  let runningBalance = userProfile.currentBalance;
  const profileStartDate = parseDate(userProfile.startDate);
  const balanceAsOfDate = parseDate(userProfile.balanceAsOfDate);

  // Optimization: Integer-based holiday set for faster lookups in loop (avoids string allocation)
  const holidayIntegersSet = new Set(holidays.map(h => parseDateToInteger(h.date)));

  // Optimization: Pre-process holidays with timestamps to avoid repeated parsing in loop
  const processedHolidays = holidays.map(h => ({
    original: h,
    timestamp: parseDate(h.date).getTime()
  }));

  // Optimization: Pre-process vacations with timestamps to avoid repeated parsing in loop
  const processedVacations = plannedVacations.map(v => ({
    original: v,
    start: parseDate(v.startDate),
    end: parseDate(v.endDate),
    startTimestamp: parseDate(v.startDate).getTime(),
    endTimestamp: parseDate(v.endDate).getTime(),
    startYear: parseDate(v.startDate).getFullYear()
  }));

  // Identify years where the personal day was used
  const yearsWithPersonalDay = new Set(
    processedVacations
      .filter(v => v.original.personalDayUsed)
      .map(v => v.startYear)
  );

  // Add the start year if user indicated they used personal day before balance date
  if (userProfile.personalDayUsedInStartYear) {
    const balanceYear = parseDate(userProfile.balanceAsOfDate).getFullYear();
    yearsWithPersonalDay.add(balanceYear);
  }

  for (const weekStart of weeks) {
    const weekEnd = getWeekEnd(weekStart);
    const weekStartTs = weekStart.getTime();
    const weekEndTs = weekEnd.getTime();

    // Calculate accrual for this week, but only if the week starts on or after the balanceAsOfDate
    // The balanceAsOfDate represents the starting balance at the beginning of that date
    let accrued = weekStart >= balanceAsOfDate
      ? calculateAccrualForRange(profileStartDate, weekStart, weekEnd)
      : 0;

    // Check for year-end rollover of unused Personal Day
    // Logic: If we are at the end of the year (week crosses year boundary or ends on Dec 31)
    // and the personal day for that year wasn't used, add 8 hours.
    // We check if the week contains Dec 31st of the current year.
    // Or simpler: check if the year changes from start of week to end of week?
    // Weeks can cross years. e.g. Dec 29 - Jan 4.
    // If the week contains the transition, we check the year that is ending.
    const yearStart = weekStart.getFullYear();
    const yearEnd = weekEnd.getFullYear();

    // If we cross a year boundary
    if (yearEnd > yearStart) {
      if (!yearsWithPersonalDay.has(yearStart)) {
        // Add 8 hours credit for unused personal day of the previous year
        accrued += 8;
      }
    } else {
      // Also handle the case where the week ends exactly on Dec 31st (rare, but possible if weeks align)
      // Actually getWeekEnd usually returns Saturday/Sunday.
      // If the week ends exactly on Dec 31st, we should credit it then.
      // But typically weeks are 7 days.
      // If the week is Dec 25 - Dec 31.
      if (weekEnd.getMonth() === 11 && weekEnd.getDate() === 31) {
         if (!yearsWithPersonalDay.has(yearStart)) {
           accrued += 8;
         }
      }
    }

    // Find vacations in this week using numeric comparisons
    // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
    const weekVacations = processedVacations.filter(vacation => {
      return (vacation.startTimestamp <= weekEndTs) && (vacation.endTimestamp >= weekStartTs);
    });

    // Find holidays in this week using numeric comparisons
    const weekHolidays = processedHolidays.filter(holiday =>
      holiday.timestamp >= weekStartTs && holiday.timestamp <= weekEndTs
    ).map(h => h.original);

    // Calculate RDO days for 9/80 schedules
    const rdoDays = userProfile.workSchedule.type === '9/80' &&
                    userProfile.workSchedule.rdoPattern
      ? getRDODatesInRange(weekStart, weekEnd, userProfile.workSchedule.rdoPattern)
      : [];

    // Calculate total hours used this week (dynamically calculated from vacation dates)
    const used = weekVacations.reduce((sum, v) => {
      const vacStart = v.start;
      const vacEnd = v.end;

      // Calculate intersection of vacation and current week
      const effectiveStart = vacStart > weekStart ? vacStart : weekStart;
      const effectiveEnd = vacEnd < weekEnd ? vacEnd : weekEnd;

      const vacationHours = calculateVacationHoursForRange(
        effectiveStart,
        effectiveEnd,
        userProfile.workSchedule,
        holidays,
        undefined,
        holidayIntegersSet
      );

      // If Personal Day is used for this vacation, subtract 8 hours from the cost
      // BUT only subtract it once per vacation.
      // Since a vacation can span multiple weeks, we need to be careful not to subtract 8 hours *every week*.
      // Strategy: Apply the deduction to the FIRST week of the vacation intersection?
      // Or distribute it?
      // Logic: The "Personal Day" replaces one day of vacation.
      // If the vacation starts in this week, we apply the deduction.
      // Or simpler: Check if the vacation START date is within the current week range.
      let deduction = 0;
      if (v.original.personalDayUsed) {
        // Check if the vacation start date falls within this week
        // Note: vacStart is the vacation start date.
        // If vacStart is in [weekStart, weekEnd], apply deduction here.
        if (vacStart >= weekStart && vacStart <= weekEnd) {
           deduction = 8;
        }
      }

      // Ensure we don't reduce cost below 0 for this week, but technically the deduction is for the whole vacation.
      // If the vacation is split across weeks, and the first week has only 4 hours, and second week has 36...
      // If we deduct 8 from first week, we get -4 (capped at 0).
      // Remaining 4 hours of deduction are lost.
      // Ideally, the Personal Day replaces a specific day (the first day).
      // If the first day is in this week, we deduct the hours of that day?
      // The requirement says "reduce the 'Hours Used' by 8 hours".
      // Assuming the Personal Day is the FIRST day, we should deduct the cost of the first day?
      // Or just a flat 8?
      // If I take a 4 hour day on Monday (Personal Day), cost is 0.
      // If I take a 2 week vacation starting Monday.
      // First week cost: 40 hours. Deduction 8. Net 32.
      // It seems safe to deduct 8 from the week that contains the start date.

      const effectiveCost = Math.max(0, vacationHours - deduction);

      // Wait, if I have `vacationHours` for *this week* intersection.
      // And I subtract 8.
      // If vacation starts on Friday (8 hours) and continues next week.
      // This week: 8 hours. Deduction 8. Result 0. Correct.
      // If vacation starts Friday (4 hours) and continues.
      // This week: 4 hours. Deduction 8. Result 0. (4 hours "wasted" deduction?)
      // This matches typical "Personal Day" logic (use it or lose it for that day).

      return sum + effectiveCost;
    }, 0);

    // Calculate ending balance and cap at maximum
    const startingBalance = runningBalance;
    const uncappedEndingBalance = startingBalance + accrued - used;
    const endingBalance = Math.min(uncappedEndingBalance, MAX_VACATION_BALANCE);

    balances.push({
      weekStartDate: formatDate(weekStart),
      weekEndDate: formatDate(weekEnd),
      startingBalance,
      accrued,
      used,
      endingBalance,
      plannedVacations: weekVacations.map(v => v.original),
      holidays: weekHolidays,
      rdoDays: rdoDays.map(formatDate),
    });

    runningBalance = endingBalance;
  }

  return balances;
};

/**
 * Calculate annual summary
 */
export const calculateAnnualSummary = (
  weeklyBalances: WeeklyBalance[],
  year: number
): AnnualSummary => {
  const yearBalances = weeklyBalances.filter(
    wb => parseDate(wb.weekStartDate).getFullYear() === year
  );

  if (yearBalances.length === 0) {
    return {
      year,
      startingBalance: 0,
      totalAccrued: 0,
      totalUsed: 0,
      endingBalance: 0,
      totalPlannedVacations: 0,
      totalHolidayHours: 0,
    };
  }

  const startingBalance = yearBalances[0]?.startingBalance ?? 0;
  const totalAccrued = yearBalances.reduce((sum, wb) => sum + wb.accrued, 0);
  const totalUsed = yearBalances.reduce((sum, wb) => sum + wb.used, 0);
  const endingBalance = yearBalances[yearBalances.length - 1]?.endingBalance ?? 0;

  const allVacations = new Set(
    yearBalances.flatMap(wb => wb.plannedVacations.map(pv => pv.id))
  );

  const totalHolidayHours = yearBalances.reduce(
    (sum, wb) => sum + wb.holidays.reduce((hSum, h) => hSum + h.hours, 0),
    0
  );

  return {
    year,
    startingBalance,
    totalAccrued,
    totalUsed,
    endingBalance,
    totalPlannedVacations: allVacations.size,
    totalHolidayHours,
  };
};

/**
 * Calculate projected balance at a future date
 * Useful for validation (checking if vacation can be afforded)
 */
export const calculateProjectedBalance = (
  userProfile: UserProfile,
  targetDate: Date,
  plannedVacations: PlannedVacation[],
  holidays: Holiday[] = []
): number => {
  const today = new Date();
  const profileStartDate = parseDate(userProfile.startDate);

  // Calculate accrual from today to target date
  const accrued = calculateAccrualForRange(profileStartDate, today, targetDate);

  // Calculate vacation usage from today to target date (dynamically calculated)
  const used = plannedVacations
    .filter(vacation => {
      const vacEnd = parseDate(vacation.endDate);
      return vacEnd <= targetDate;
    })
    .reduce((sum, v) => {
      const vacationHours = getVacationHours(v, userProfile.workSchedule, holidays);
      // Apply Personal Day deduction
      const deduction = v.personalDayUsed ? 8 : 0;
      return sum + Math.max(0, vacationHours - deduction);
    }, 0);

  return userProfile.currentBalance + accrued - used;
};
