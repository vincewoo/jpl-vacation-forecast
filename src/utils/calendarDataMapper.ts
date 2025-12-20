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
  formatDate,
  isDateInRange
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

    // Check if holiday
    const holiday = holidays.find(h => h.date === dateKey);
    if (holiday) {
      types.push(DayType.HOLIDAY);
    }

    // Check if in vacation
    const vacation = plannedVacations.find(v => {
      const vacStart = parseDate(v.startDate);
      const vacEnd = parseDate(v.endDate);
      return isDateInRange(date, vacStart, vacEnd);
    });

    if (vacation) {
      types.push(DayType.PLANNED_VACATION);
    }

    // Get balance and accrual rate if Sunday (end of week)
    let balance: number | undefined;
    let accrualRate: number | undefined;
    if (date.getDay() === 0) { // Sunday
      const weekBalance = weeklyBalances.find(wb => {
        const weekEndDate = parseDate(wb.weekEndDate);
        const match = formatDate(weekEndDate) === dateKey;
        return match;
      });
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
      isPersonalDayStart: vacation?.personalDayUsed && formatDate(parseDate(vacation.startDate)) === dateKey,
    });
  }

  return dayMap;
};
