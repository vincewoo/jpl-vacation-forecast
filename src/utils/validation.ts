import { UserProfile, PlannedVacation, Holiday, ScheduleType } from '../types';

// Sanity limits to prevent excessive data size or processing
export const MAX_DESCRIPTION_LENGTH_SANITY = 2000;
export const MAX_BALANCE_SANITY = 10000;

/**
 * Type guard for UserProfile
 */
export const isValidUserProfile = (data: any): data is UserProfile => {
  if (!data || typeof data !== 'object') return false;

  // Check required fields
  if (typeof data.startDate !== 'string') return false;
  if (typeof data.currentBalance !== 'number') return false;
  // Sanity check for balance
  if (data.currentBalance < -1000 || data.currentBalance > MAX_BALANCE_SANITY) return false;

  if (typeof data.balanceAsOfDate !== 'string') return false;

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
  if (typeof data.endDate !== 'string') return false;

  // Optional fields
  if (data.description !== undefined) {
    if (typeof data.description !== 'string') return false;
    // Sanity check for description length
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
  if (typeof data.date !== 'string') return false;
  if (typeof data.hours !== 'number') return false;

  return true;
};

/**
 * Type guard for Holiday array
 */
export const isValidHolidayArray = (data: any): data is Holiday[] => {
  if (!Array.isArray(data)) return false;
  return data.every(isValidHoliday);
};
