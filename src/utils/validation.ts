import { UserProfile, PlannedVacation, Holiday, ScheduleType } from '../types';

// Security / Sanity Limits
// These prevent DoS attacks via storage and logic errors from extreme values
export const MAX_DESCRIPTION_LENGTH_SANITY = 1000;
export const MAX_BALANCE_SANITY = 10000;
export const MIN_BALANCE_SANITY = -1000;
export const MAX_HOLIDAY_HOURS_SANITY = 24;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Type guard for UserProfile
 */
export const isValidUserProfile = (data: any): data is UserProfile => {
  if (!data || typeof data !== 'object') return false;

  // Check required fields
  if (typeof data.startDate !== 'string') return false;
  if (!DATE_REGEX.test(data.startDate)) return false;

  if (typeof data.currentBalance !== 'number') return false;
  if (!Number.isFinite(data.currentBalance)) return false;
  if (data.currentBalance > MAX_BALANCE_SANITY || data.currentBalance < MIN_BALANCE_SANITY) return false;

  if (typeof data.balanceAsOfDate !== 'string') return false;
  if (!DATE_REGEX.test(data.balanceAsOfDate)) return false;

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

  if (typeof data.id !== 'string') return false;
  if (typeof data.startDate !== 'string') return false;
  if (!DATE_REGEX.test(data.startDate)) return false;

  if (typeof data.endDate !== 'string') return false;
  if (!DATE_REGEX.test(data.endDate)) return false;

  // Optional fields
  if (data.description !== undefined) {
    if (typeof data.description !== 'string') return false;
    if (data.description.length > MAX_DESCRIPTION_LENGTH_SANITY) return false;
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

  if (typeof data.name !== 'string') return false;
  // Basic length check for holiday name to prevent massive strings
  if (data.name.length > MAX_DESCRIPTION_LENGTH_SANITY) return false;

  if (typeof data.date !== 'string') return false;
  if (!DATE_REGEX.test(data.date)) return false;

  if (typeof data.hours !== 'number') return false;
  if (!Number.isFinite(data.hours)) return false;
  if (data.hours < 0 || data.hours > MAX_HOLIDAY_HOURS_SANITY) return false;

  return true;
};

/**
 * Type guard for Holiday array
 */
export const isValidHolidayArray = (data: any): data is Holiday[] => {
  if (!Array.isArray(data)) return false;
  return data.every(isValidHoliday);
};
