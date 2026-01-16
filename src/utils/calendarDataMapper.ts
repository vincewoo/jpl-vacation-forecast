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
import { isWeekend, isRDO, getWorkHoursForDay } from './workScheduleUtils';

// Helper interface for processed vacation data
interface ProcessedVacation {
  original: PlannedVacation;
  totalHours: number;
  startDateKey: string;
}

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
  const holidayDateSet = new Set<string>();
  holidays.forEach(h => {
    holidayMap.set(h.date, h);
    holidayDateSet.add(h.date);
  });

  const weeklyBalanceMap = new Map<string, WeeklyBalance>();
  weeklyBalances.forEach(wb => {
    // We map by week end date string as that's what's queried for Sundays
    const key = formatDate(parseDate(wb.weekEndDate));
    weeklyBalanceMap.set(key, wb);
  });

  // Optimize vacation ranges
  // Map<timestamp, ProcessedVacation> for O(1) lookup
  const vacationDayMap = new Map<number, ProcessedVacation>();

  // To preserve "first match wins" behavior of original find(),
  // we iterate in reverse so that earlier vacations in the array overwrite later ones in the map.
  // Original logic: processedVacations.find(...) returns the first element.
  // New logic: map.get() returns value. If multiple vacations cover the same day,
  // the one that appears first in plannedVacations should remain in the map.
  // So we populate from last to first.
  for (let i = plannedVacations.length - 1; i >= 0; i--) {
    const v = plannedVacations[i];
    if (!v) continue;

    const start = parseDate(v.startDate);
    const end = parseDate(v.endDate);

    // Optimization: Calculate total hours while iterating to populate the map.
    // This avoids a second iteration over the days that getVacationHours would perform.
    let totalHours = 0;

    const processed: ProcessedVacation = {
      original: v,
      totalHours: 0, // Will be updated after calculation
      startDateKey: formatDate(start)
    };

    const current = new Date(start);
    // Loop through each day of the vacation and add to map
    while (current <= end) {
      const dateTime = current.getTime();
      const dateStr = formatDate(current);

      vacationDayMap.set(dateTime, processed);

      // Calculate hours for this day (logic inlined from calculateVacationHoursForRange)
      if (!holidayDateSet.has(dateStr)) {
        totalHours += getWorkHoursForDay(current, workSchedule);
      }

      current.setDate(current.getDate() + 1);
    }

    // Update the total hours for the vacation object
    processed.totalHours = totalHours;
  }

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

    // Check if in vacation (O(1) lookup)
    const vacation = vacationDayMap.get(dateTime);

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
