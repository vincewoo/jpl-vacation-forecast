import { useMemo } from 'react';
import { Holiday, WorkSchedule } from '../types';
import { getHolidaysForYearRange } from '../utils/holidayLoader';
import { getWorkHoursForDay } from '../utils/workScheduleUtils';
import { parseDate } from '../utils/dateUtils';

/**
 * Hook to manage JPL holidays with work schedule-specific hours
 * Supports multi-year holidays loaded from JSON configuration
 */
export const useHolidays = (
  workSchedule: WorkSchedule | null,
  startDate?: Date,
  endDate?: Date
) => {
  const defaultHolidays = useMemo<Holiday[]>(() => {
    if (!workSchedule) return [];

    // Determine year range
    const now = new Date();
    const start = startDate || now;
    const end = endDate || new Date(now.getFullYear() + 10, 11, 31);

    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    // Load holidays from JSON for the year range
    const holidayEntries = getHolidaysForYearRange(startYear, endYear);

    // Enrich with work hours based on schedule
    return holidayEntries.map((holiday) => ({
      ...holiday,
      hours: getWorkHoursForDay(parseDate(holiday.date), workSchedule),
    }));
  }, [workSchedule, startDate, endDate]);

  return { defaultHolidays };
};
