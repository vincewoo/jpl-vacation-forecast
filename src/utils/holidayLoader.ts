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

/**
 * Get holidays within a specific date range
 * @param startDate Start date
 * @param endDate End date
 * @param scheduleType Optional work schedule type to filter holidays
 * @returns Array of holidays without hours (hours will be added based on work schedule)
 */
export const getHolidaysForDateRange = (
  startDate: Date,
  endDate: Date,
  scheduleType?: ScheduleType
): Omit<Holiday, 'hours'>[] => {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  return getHolidaysForYearRange(startYear, endYear, scheduleType).filter((h) => {
    const holidayDate = new Date(h.date);
    return holidayDate >= startDate && holidayDate <= endDate;
  });
};

/**
 * Get all years available in the holiday data
 * @returns Sorted array of years
 */
export const getAllAvailableYears = (): number[] => {
  return Object.keys(holidayData.holidays)
    .map(Number)
    .sort((a, b) => a - b);
};
