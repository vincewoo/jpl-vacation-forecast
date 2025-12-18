import holidayData from '../data/holidays.json';
import { Holiday } from '../types';

/**
 * Get holidays for a range of years (inclusive)
 * @param startYear Starting year
 * @param endYear Ending year (inclusive)
 * @returns Array of holidays without hours (hours will be added based on work schedule)
 */
export const getHolidaysForYearRange = (
  startYear: number,
  endYear: number
): Omit<Holiday, 'hours'>[] => {
  const result: Omit<Holiday, 'hours'>[] = [];

  for (let year = startYear; year <= endYear; year++) {
    const yearKey = year.toString() as keyof typeof holidayData.holidays;
    const yearHolidays = holidayData.holidays[yearKey];
    if (yearHolidays) {
      result.push(
        ...yearHolidays.map((h) => ({
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
 * @returns Array of holidays without hours (hours will be added based on work schedule)
 */
export const getHolidaysForDateRange = (
  startDate: Date,
  endDate: Date
): Omit<Holiday, 'hours'>[] => {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  return getHolidaysForYearRange(startYear, endYear).filter((h) => {
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
