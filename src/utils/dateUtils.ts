/**
 * Get the start of the week (Monday) for a given date
 */
export const getWeekStart = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  // Convert Sunday (0) to 7 for easier calculation
  const dayOfWeek = day === 0 ? 7 : day;
  // Calculate days to subtract to get to Monday (1)
  const diff = dayOfWeek - 1;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get the end of the week (Sunday) for a given date
 */
export const getWeekEnd = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  // Convert Sunday (0) to 7 for easier calculation
  const dayOfWeek = day === 0 ? 7 : day;
  // Calculate days to add to get to Sunday (7)
  const diff = 7 - dayOfWeek;
  result.setDate(result.getDate() + diff);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Generate array of weeks in a date range
 */
export const getWeeksInRange = (startDate: Date, endDate: Date): Date[] => {
  const weeks: Date[] = [];
  let currentWeekStart = getWeekStart(new Date(startDate));
  const rangeEnd = getWeekStart(new Date(endDate));

  while (currentWeekStart <= rangeEnd) {
    weeks.push(new Date(currentWeekStart));
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  return weeks;
};

/**
 * Format date as YYYY-MM-DD using local time
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse ISO date string (YYYY-MM-DD) to Date object in local time
 */
export const parseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  // Ensure we have valid numbers
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return new Date(year, month - 1, day);
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Check if a date falls within a range (inclusive)
 */
export const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  const dateTime = date.getTime();
  const startTime = start.getTime();
  const endTime = end.getTime();
  return dateTime >= startTime && dateTime <= endTime;
};

/**
 * Get the number of days between two dates
 */
export const getDaysBetween = (start: Date, end: Date): number => {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const startTime = new Date(start).setHours(0, 0, 0, 0);
  const endTime = new Date(end).setHours(0, 0, 0, 0);
  return Math.round((endTime - startTime) / millisecondsPerDay);
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Get all dates in a range (inclusive)
 */
export const getDatesInRange = (start: Date, end: Date): Date[] => {
  const dates: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};
