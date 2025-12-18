import { useMemo } from 'react';
import { Holiday, WorkSchedule } from '../types';
import { DEFAULT_JPL_HOLIDAYS_2026 } from '../constants/jplConstants';
import { getWorkHoursForDay } from '../utils/workScheduleUtils';
import { parseDate } from '../utils/dateUtils';

/**
 * Hook to manage JPL holidays with work schedule-specific hours
 */
export const useHolidays = (workSchedule: WorkSchedule | null) => {
  const defaultHolidays = useMemo<Holiday[]>(() => {
    if (!workSchedule) return [];

    return DEFAULT_JPL_HOLIDAYS_2026.map(holiday => ({
      ...holiday,
      hours: getWorkHoursForDay(parseDate(holiday.date), workSchedule),
    }));
  }, [workSchedule]);

  return { defaultHolidays };
};
