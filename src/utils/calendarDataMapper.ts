import {
  WeeklyBalance,
  PlannedVacation,
  Holiday,
  WorkSchedule,
  CalendarDayInfo,
  DayType
} from '../types';
import {
  getDatesInRange,
  formatDate,
} from './dateUtils';
import { isWeekend, isRDO, getWorkHoursForDay, getVacationHours } from './workScheduleUtils';

/**
 * Maps weekly balances, vacations, and holidays to calendar day information
 * for rendering in the calendar view
 */
export const mapWeeklyBalancesToDays = (
  weeklyBalances: WeeklyBalance[],
  plannedVacations: PlannedVacation[],
  holidays: Holiday[],
  workSchedule: WorkSchedule,
  startDate: Date,
  endDate: Date
): Map<string, CalendarDayInfo> => {
  const dayMap = new Map<string, CalendarDayInfo>();

  // Get all dates in the range
  const dates = getDatesInRange(startDate, endDate);

  // Pre-process holidays into a Map for O(1) lookup
  const holidayMap = new Map<string, Holiday>();
  for (const h of holidays) {
    holidayMap.set(h.date, h);
  }

  // Pre-process weekly balances for faster lookup
  // We only care about matching the weekEndDate string to the current dateKey
  // Since we only look up by dateKey (which is YYYY-MM-DD), and weekEndDate is also YYYY-MM-DD,
  // we can use a Map.
  const balanceMap = new Map<string, WeeklyBalance>();
  for (const wb of weeklyBalances) {
    balanceMap.set(wb.weekEndDate, wb);
  }

  for (const date of dates) {
    const dateKey = formatDate(date);
    const types: DayType[] = [];

    // Check if weekend
    if (isWeekend(date)) {
      types.push(DayType.WEEKEND);
    }

    // Check if RDO
    const isRDODay = isRDO(date, workSchedule);
    if (isRDODay) {
      types.push(DayType.RDO);
    }

    // Check if holiday (O(1) lookup)
    const holiday = holidayMap.get(dateKey);
    if (holiday) {
      types.push(DayType.HOLIDAY);
    }

    // Check if in vacation
    // Optimization: Use string comparison instead of parsing dates
    // startDate and endDate in PlannedVacation are ISO strings (YYYY-MM-DD)
    // dateKey is also YYYY-MM-DD. Lexicographical comparison works correctly.
    const vacation = plannedVacations.find(v => {
      return dateKey >= v.startDate && dateKey <= v.endDate;
    });

    if (vacation) {
      types.push(DayType.PLANNED_VACATION);
    }

    // Get balance and accrual rate if Sunday (end of week)
    let balance: number | undefined;
    let accrualRate: number | undefined;
    if (date.getDay() === 0) { // Sunday
      // Optimization: O(1) lookup
      const weekBalance = balanceMap.get(dateKey);

      balance = weekBalance?.endingBalance;
      accrualRate = weekBalance?.accrued;
    }

    dayMap.set(dateKey, {
      date,
      types,
      hours: getWorkHoursForDay(date, workSchedule),
      vacationHours: vacation ? getVacationHours(vacation, workSchedule, holidays) : undefined,
      balance,
      accrualRate,
      isInVacation: !!vacation,
      vacationId: vacation?.id,
      isHoliday: !!holiday,
      holidayName: holiday?.name,
      isRDO: isRDODay,
      isPersonalDayStart: vacation?.personalDayUsed && vacation.startDate === dateKey,
    });
  }

  return dayMap;
};
