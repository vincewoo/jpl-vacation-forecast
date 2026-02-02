import { UserProfile, PlannedVacation, Holiday, ScheduleType } from '../types';

export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_VACATION_BALANCE = 2000;
export const MAX_ID_LENGTH = 100;
export const MAX_DATE_LENGTH = 10;
export const MAX_NAME_LENGTH = 100;
export const MAX_VACATION_DURATION_DAYS = 60;
export const MIN_YEAR = 1970;
export const MAX_YEAR = 2100;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidDate = (dateStr: string): boolean => {
  if (!DATE_REGEX.test(dateStr)) return false;

  const parts = dateStr.split('-');
  // This check is technically redundant due to regex but satisfies TS
  if (parts.length !== 3) return false;

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  // Basic range check
  if (year < MIN_YEAR || year > MAX_YEAR) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Check days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return false;

  return true;
};

/**
 * Type guard for UserProfile
 */
export const isValidUserProfile = (data: any): data is UserProfile => {
  if (!data || typeof data !== 'object') return false;

  // Check required fields
  if (typeof data.startDate !== 'string' || !isValidDate(data.startDate)) return false;
  if (typeof data.currentBalance !== 'number' || data.currentBalance < 0 || data.currentBalance > MAX_VACATION_BALANCE) return false;
  if (typeof data.balanceAsOfDate !== 'string' || !isValidDate(data.balanceAsOfDate)) return false;

  // Check workSchedule
  if (!data.workSchedule || typeof data.workSchedule !== 'object') return false;
  const validScheduleTypes: ScheduleType[] = ['5/40', '9/80'];
  if (!validScheduleTypes.includes(data.workSchedule.type)) return false;

  // Optional fields check
  if (data.personalDayUsedInStartYear !== undefined && typeof data.personalDayUsedInStartYear !== 'boolean') return false;

  return true;
};

/**
 * Type guard for PlannedVacation
 */
export const isValidPlannedVacation = (data: any): data is PlannedVacation => {
  if (!data || typeof data !== 'object') return false;

  if (typeof data.id !== 'string' || data.id.length > MAX_ID_LENGTH) return false;

  // Validate dates
  if (typeof data.startDate !== 'string' || !isValidDate(data.startDate)) return false;
  if (typeof data.endDate !== 'string' || !isValidDate(data.endDate)) return false;

  // Validate date logic
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  if (end < start) return false;

  // Validate duration (DoS protection)
  const durationMs = end.getTime() - start.getTime();
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
  if (durationDays > MAX_VACATION_DURATION_DAYS) return false;

  // Optional fields
  if (data.description !== undefined) {
    if (typeof data.description !== 'string') return false;
    if (data.description.length > MAX_DESCRIPTION_LENGTH) return false;
  }

  if (data.personalDayUsed !== undefined && typeof data.personalDayUsed !== 'boolean') return false;

  return true;
};

/**
 * Type guard for PlannedVacation array
 */
export const isValidPlannedVacationArray = (data: any): data is PlannedVacation[] => {
  if (!Array.isArray(data)) return false;
  return data.every(isValidPlannedVacation);
};

/**
 * Type guard for Holiday
 */
export const isValidHoliday = (data: any): data is Holiday => {
  if (!data || typeof data !== 'object') return false;

  if (typeof data.name !== 'string' || data.name.length > MAX_NAME_LENGTH) return false;
  if (typeof data.date !== 'string' || !isValidDate(data.date)) return false;
  if (typeof data.hours !== 'number' || data.hours < 0 || data.hours > 24) return false;

  return true;
};

/**
 * Type guard for Holiday array
 */
export const isValidHolidayArray = (data: any): data is Holiday[] => {
  if (!Array.isArray(data)) return false;
  return data.every(isValidHoliday);
};
