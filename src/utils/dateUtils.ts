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
 * Optimized to avoid intermediate string allocations and padding overhead
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
};

/**
 * Parse ISO date string (YYYY-MM-DD) to Date object in local time
 * Optimized with a fast path for standard YYYY-MM-DD format
 */
export const parseDate = (dateString: string): Date => {
  // Fast path for standard YYYY-MM-DD format
  // This avoids array allocation (split) and mapping
  if (dateString.length === 10 && dateString.charAt(4) === '-' && dateString.charAt(7) === '-') {
    const year = +dateString.substring(0, 4);
    const month = +dateString.substring(5, 7);
    const day = +dateString.substring(8, 10);
    return new Date(year, month - 1, day);
  }

  // Fallback for other formats (e.g. 2023-1-1)
  const [year, month, day] = dateString.split('-').map(Number);
  // Ensure we have valid numbers
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return new Date(year, month - 1, day);
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

/**
 * Convert Date to integer YYYYMMDD
 * Optimized for performance to avoid string allocation
 */
export const dateToInteger = (date: Date): number => {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
};

/**
 * Parse YYYY-MM-DD string to integer YYYYMMDD
 * Optimized to avoid string splitting/allocations
 */
export const parseDateToInteger = (dateString: string): number => {
  // Fast path for standard YYYY-MM-DD format
  if (dateString.length === 10 && dateString.charAt(4) === '-' && dateString.charAt(7) === '-') {
    const year = +dateString.substring(0, 4);
    const month = +dateString.substring(5, 7);
    const day = +dateString.substring(8, 10);
    return year * 10000 + month * 100 + day;
  }

  // Fallback using parseDate
  const date = parseDate(dateString);
  return dateToInteger(date);
};
