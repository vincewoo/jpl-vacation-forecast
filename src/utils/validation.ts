import { UserProfile, PlannedVacation, Holiday, ScheduleType } from '../types';

export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_VACATION_BALANCE = 2000;
export const MAX_ID_LENGTH = 100;
export const MAX_DATE_LENGTH = 10;
export const MAX_NAME_LENGTH = 100;

/**
 * Type guard for UserProfile
 */
export const isValidUserProfile = (data: any): data is UserProfile => {
  if (!data || typeof data !== 'object') return false;

  // Check required fields
  if (typeof data.startDate !== 'string' || data.startDate.length > MAX_DATE_LENGTH) return false;
  if (typeof data.currentBalance !== 'number' || data.currentBalance > MAX_VACATION_BALANCE) return false;
  if (typeof data.balanceAsOfDate !== 'string' || data.balanceAsOfDate.length > MAX_DATE_LENGTH) return false;

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
  if (typeof data.startDate !== 'string' || data.startDate.length > MAX_DATE_LENGTH) return false;
  if (typeof data.endDate !== 'string' || data.endDate.length > MAX_DATE_LENGTH) return false;

  // Logical check
  if (data.startDate > data.endDate) return false;

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
  if (typeof data.date !== 'string' || data.date.length > MAX_DATE_LENGTH) return false;
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
