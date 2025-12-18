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
  isDateInRange,
  parseDate,
  formatDate
} from './dateUtils';
import { calculateAccrualForRange } from './accrualCalculator';
import { getRDODatesInRange } from './workScheduleUtils';

// JPL vacation balance limits
export const MAX_VACATION_BALANCE = 320; // Maximum accrual cap in hours
export const BALANCE_WARNING_THRESHOLD = 280; // Warning threshold in hours

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

  for (const weekStart of weeks) {
    const weekEnd = getWeekEnd(weekStart);

    // Calculate accrual for this week, but only if the week starts on or after the balanceAsOfDate
    // The balanceAsOfDate represents the starting balance at the beginning of that date
    const accrued = weekStart >= balanceAsOfDate
      ? calculateAccrualForRange(profileStartDate, weekStart, weekEnd)
      : 0;

    // Find vacations in this week
    const weekVacations = plannedVacations.filter(vacation => {
      const vacStart = parseDate(vacation.startDate);
      const vacEnd = parseDate(vacation.endDate);
      return (
        isDateInRange(vacStart, weekStart, weekEnd) ||
        isDateInRange(vacEnd, weekStart, weekEnd) ||
        (vacStart < weekStart && vacEnd > weekEnd)
      );
    });

    // Find holidays in this week
    const weekHolidays = holidays.filter(holiday =>
      isDateInRange(parseDate(holiday.date), weekStart, weekEnd)
    );

    // Calculate RDO days for 9/80 schedules
    const rdoDays = userProfile.workSchedule.type === '9/80' &&
                    userProfile.workSchedule.rdoPattern
      ? getRDODatesInRange(weekStart, weekEnd, userProfile.workSchedule.rdoPattern)
      : [];

    // Calculate total hours used this week
    const used = weekVacations.reduce((sum, v) => sum + v.hours, 0);

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
      plannedVacations: weekVacations,
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
  plannedVacations: PlannedVacation[]
): number => {
  const today = new Date();
  const profileStartDate = parseDate(userProfile.startDate);

  // Calculate accrual from today to target date
  const accrued = calculateAccrualForRange(profileStartDate, today, targetDate);

  // Calculate vacation usage from today to target date
  const used = plannedVacations
    .filter(vacation => {
      const vacEnd = parseDate(vacation.endDate);
      return vacEnd <= targetDate;
    })
    .reduce((sum, v) => sum + v.hours, 0);

  return userProfile.currentBalance + accrued - used;
};
