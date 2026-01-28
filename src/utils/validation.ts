import { UserProfile, PlannedVacation, Holiday, ScheduleType } from '../types';

/**
 * Type guard for UserProfile
 */
export const isValidUserProfile = (data: any): data is UserProfile => {
  if (!data || typeof data !== 'object') return false;

  // Check required fields
  // Enforce date format length (YYYY-MM-DD) to prevent storage abuse
  if (typeof data.startDate !== 'string' || data.startDate.length !== 10) return false;
  if (typeof data.currentBalance !== 'number') return false;
  if (typeof data.balanceAsOfDate !== 'string' || data.balanceAsOfDate.length !== 10) return false;

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

  // Validate fields and enforce length limits for security
  if (typeof data.id !== 'string' || data.id.length > 100) return false;
  if (typeof data.startDate !== 'string' || data.startDate.length !== 10) return false;
  if (typeof data.endDate !== 'string' || data.endDate.length !== 10) return false;

  // Optional fields
  if (data.description !== undefined) {
    if (typeof data.description !== 'string') return false;
    // Limit description length to prevent DoS/storage exhaustion
    if (data.description.length > 500) return false;
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

  // Validate fields and enforce length limits
  if (typeof data.name !== 'string' || data.name.length > 100) return false;
  if (typeof data.date !== 'string' || data.date.length !== 10) return false;
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
