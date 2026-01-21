import { UserProfile, PlannedVacation, Holiday, ScheduleType } from '../types';

/**
 * Helper to validate ISO date strings
 */
const isValidDateString = (dateStr: string): boolean => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2200;
};

/**
 * Type guard for UserProfile with logic validation
 * Enforces data integrity to prevent corrupt state from storage/sync.
 */
export const isValidUserProfile = (data: any): data is UserProfile => {
  if (!data || typeof data !== 'object') return false;

  // Check required fields types
  if (typeof data.startDate !== 'string') return false;
  if (typeof data.currentBalance !== 'number') return false;
  if (typeof data.balanceAsOfDate !== 'string') return false;

  // Logic validation (Security/Integrity)
  if (!isValidDateString(data.startDate)) return false;
  if (!isValidDateString(data.balanceAsOfDate)) return false;

  // Balance sanity check: 0 to 5000 hours (prevents negative or overflow attacks)
  if (data.currentBalance < 0 || data.currentBalance > 5000 || !Number.isFinite(data.currentBalance)) return false;

  // Check workSchedule
  if (!data.workSchedule || typeof data.workSchedule !== 'object') return false;
  const validScheduleTypes: ScheduleType[] = ['5/40', '9/80'];
  if (!validScheduleTypes.includes(data.workSchedule.type)) return false;

  // Optional fields check
  if (data.personalDayUsedInStartYear !== undefined && typeof data.personalDayUsedInStartYear !== 'boolean') return false;

  return true;
};

/**
 * Type guard for PlannedVacation with logic validation
 */
export const isValidPlannedVacation = (data: any): data is PlannedVacation => {
  if (!data || typeof data !== 'object') return false;

  if (typeof data.id !== 'string') return false;
  if (typeof data.startDate !== 'string') return false;
  if (typeof data.endDate !== 'string') return false;

  // Logic validation
  if (!isValidDateString(data.startDate)) return false;
  if (!isValidDateString(data.endDate)) return false;

  // Optional fields
  if (data.description !== undefined && typeof data.description !== 'string') return false;
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
 * Type guard for Holiday with logic validation
 */
export const isValidHoliday = (data: any): data is Holiday => {
  if (!data || typeof data !== 'object') return false;

  if (typeof data.name !== 'string') return false;
  if (typeof data.date !== 'string') return false;
  if (typeof data.hours !== 'number') return false;

  // Logic validation
  if (!isValidDateString(data.date)) return false;
  if (data.hours < 0 || data.hours > 24 || !Number.isFinite(data.hours)) return false;

  return true;
};

/**
 * Type guard for Holiday array
 */
export const isValidHolidayArray = (data: any): data is Holiday[] => {
  if (!Array.isArray(data)) return false;
  return data.every(isValidHoliday);
};
