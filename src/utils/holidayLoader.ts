import holidayData from '../data/holidays.json';
import { Holiday, ScheduleType } from '../types';

/**
 * Get holidays for a range of years (inclusive)
 * @param startYear Starting year
 * @param endYear Ending year (inclusive)
 * @param scheduleType Optional work schedule type to filter holidays
 * @returns Array of holidays without hours (hours will be added based on work schedule)
 */
export const getHolidaysForYearRange = (
  startYear: number,
  endYear: number,
  scheduleType?: ScheduleType
): Omit<Holiday, 'hours'>[] => {
  const result: Omit<Holiday, 'hours'>[] = [];

  for (let year = startYear; year <= endYear; year++) {
    const yearKey = year.toString() as keyof typeof holidayData.holidays;
    const yearHolidays = holidayData.holidays[yearKey];
    if (yearHolidays) {
      result.push(
        ...yearHolidays
          .filter((h) => {
            // If no scheduleFilter or it's "All", include the holiday
            if (!h.scheduleFilter || h.scheduleFilter === 'All') return true;

            // If no scheduleType provided, include all holidays
            if (!scheduleType) return true;

            // Filter based on schedule type
            if (scheduleType === '5/40') return h.scheduleFilter !== '9/80-only';
            if (scheduleType === '9/80') return h.scheduleFilter !== '5/40-only';

            return true;
          })
          .map((h) => ({
            name: h.name,
            date: h.date,
          }))
      );
    }
  }

  return result;
};

