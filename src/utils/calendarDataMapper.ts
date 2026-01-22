import {
  WeeklyBalance,
  PlannedVacation,
  Holiday,
  WorkSchedule,
  CalendarDayInfo,
  DayType
} from '../types';
import {
  parseDate,
  formatDate
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

  // Optimize lookups
  const holidayMap = new Map<string, Holiday>();
  holidays.forEach(h => holidayMap.set(h.date, h));

  const weeklyBalanceMap = new Map<string, WeeklyBalance>();
  weeklyBalances.forEach(wb => {
    // We map by week end date string as that's what's queried for Sundays
    const key = formatDate(parseDate(wb.weekEndDate));
    weeklyBalanceMap.set(key, wb);
  });

  // Optimize vacation lookups using Sweep Line algorithm
  // Pre-process and sort by start date
  const sortedVacations = plannedVacations
    .map((v, index) => {
      const start = parseDate(v.startDate);
      // Pre-calculate total hours for the vacation once
      const totalHours = getVacationHours(v, workSchedule, holidays);

      return {
        original: v,
        originalIndex: index,
        start: start.getTime(),
        end: parseDate(v.endDate).getTime(),
        startDateKey: formatDate(start), // Pre-calculate for isPersonalDayStart check
        totalHours
      };
    })
    .sort((a, b) => a.start - b.start);

  // Active vacations for the current day (usually 0 or 1)
  const activeVacations: typeof sortedVacations = [];
  let nextVacationIdx = 0;

  // Iterate through dates without creating intermediate array
  // Optimization: Use a while loop instead of getDatesInRange to avoid allocating
  // a large array of Date objects, reducing garbage collection pressure.
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // Create new Date instance for the map value
    const date = new Date(currentDate);
    const dateKey = formatDate(date);
    const dateTime = date.getTime();
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

    // Check if holiday
    const holiday = holidayMap.get(dateKey);
    if (holiday) {
      types.push(DayType.HOLIDAY);
    }

    // Check if in vacation (Sweep Line)
    // 1. Add new started vacations to active set
    while (nextVacationIdx < sortedVacations.length && sortedVacations[nextVacationIdx].start <= dateTime) {
      activeVacations.push(sortedVacations[nextVacationIdx]);
      nextVacationIdx++;
    }

    // 2. Remove ended vacations from active set
    // Iterate backwards to safely splice
    for (let i = activeVacations.length - 1; i >= 0; i--) {
      if (activeVacations[i].end < dateTime) {
        activeVacations.splice(i, 1);
      }
    }

    // 3. Find the applicable vacation (lowest originalIndex wins)
    let vacation: typeof sortedVacations[0] | undefined;
    if (activeVacations.length > 0) {
      vacation = activeVacations[0];
      // If multiple overlap, find the one that appeared first in the original list
      if (activeVacations.length > 1) {
        for (let i = 1; i < activeVacations.length; i++) {
          if (activeVacations[i].originalIndex < vacation.originalIndex) {
            vacation = activeVacations[i];
          }
        }
      }
    }

    if (vacation) {
      types.push(DayType.PLANNED_VACATION);
    }

    // Get balance and accrual rate if Sunday (end of week)
    let balance: number | undefined;
    let accrualRate: number | undefined;
    if (date.getDay() === 0) { // Sunday
      const weekBalance = weeklyBalanceMap.get(dateKey);
      balance = weekBalance?.endingBalance;
      accrualRate = weekBalance?.accrued;
    }

    dayMap.set(dateKey, {
      date,
      types,
      hours: getWorkHoursForDay(date, workSchedule),
      vacationHours: vacation ? vacation.totalHours : undefined,
      balance,
      accrualRate,
      isInVacation: !!vacation,
      vacationId: vacation?.original.id,
      isHoliday: !!holiday,
      holidayName: holiday?.name,
      isRDO: isRDODay,
      isPersonalDayStart: vacation?.original.personalDayUsed && vacation.startDateKey === dateKey,
    });

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dayMap;
};
