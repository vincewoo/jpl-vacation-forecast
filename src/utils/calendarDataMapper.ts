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

  // Optimize vacation ranges
  // Store start/end as timestamps for fast comparison
  const processedVacations = plannedVacations.map(v => {
    const start = parseDate(v.startDate);

    // Pre-calculate total hours for the vacation once
    const totalHours = getVacationHours(v, workSchedule, holidays);

    return {
      original: v,
      start: start.getTime(),
      end: parseDate(v.endDate).getTime(),
      startDateKey: formatDate(start), // Pre-calculate for isPersonalDayStart check
      totalHours
    };
  });

  // Get all dates in the range
  const dates = getDatesInRange(startDate, endDate);

  for (const date of dates) {
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

    // Check if in vacation
    const vacation = processedVacations.find(v => {
      return dateTime >= v.start && dateTime <= v.end;
    });

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
  }

  return dayMap;
};
