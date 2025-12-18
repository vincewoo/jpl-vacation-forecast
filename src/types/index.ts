// Schedule Types
export type ScheduleType = '5/40' | '9/80';

export type RDOPattern = 'even-fridays' | 'odd-fridays';

export interface WorkSchedule {
  type: ScheduleType;
  rdoPattern?: RDOPattern; // Only for 9/80 schedules
}

// User Profile
export interface UserProfile {
  startDate: string; // ISO date string for serialization
  currentBalance: number; // in hours
  balanceAsOfDate: string; // ISO date string - when the current balance was taken (should be start of a week)
  workSchedule: WorkSchedule;
}

// Accrual Information
export interface AccrualRate {
  yearsOfService: number;
  hoursPerMonth: number;
}

// Holiday Entry (from JSON configuration)
export interface HolidayEntry {
  name: string;
  date: string; // ISO date string
  type?: 'federal' | 'jpl' | 'other';
  notes?: string;
}

// Holiday Data Structure (from JSON file)
export interface HolidayData {
  version: string;
  lastUpdated: string;
  holidays: {
    [year: string]: HolidayEntry[];
  };
}

// Holiday (enriched with hours for use in application)
export interface Holiday {
  name: string;
  date: string; // ISO date string for serialization
  hours: number; // Hours for this holiday (typically 8 or 9 depending on schedule)
}

// Planned Vacation
export interface PlannedVacation {
  id: string;
  startDate: string; // ISO date string for serialization
  endDate: string; // ISO date string for serialization
  hours: number; // Total hours of vacation used
  description?: string;
}

// Weekly Balance Record
export interface WeeklyBalance {
  weekStartDate: string; // ISO date string for serialization
  weekEndDate: string; // ISO date string for serialization
  startingBalance: number;
  accrued: number;
  used: number;
  endingBalance: number;
  plannedVacations: PlannedVacation[];
  holidays: Holiday[];
  rdoDays: string[]; // ISO date strings for 9/80 schedules
}

// Annual Summary
export interface AnnualSummary {
  year: number;
  startingBalance: number;
  totalAccrued: number;
  totalUsed: number;
  endingBalance: number;
  totalPlannedVacations: number;
  totalHolidayHours: number;
}

// Day Type for Calendar Visualization
export enum DayType {
  REGULAR = 'regular',
  RDO = 'rdo',
  HOLIDAY = 'holiday',
  PLANNED_VACATION = 'planned_vacation',
  WEEKEND = 'weekend'
}

export interface CalendarDay {
  date: Date;
  types: DayType[];
  hours?: number; // Work hours for this day
  vacationHours?: number; // Vacation hours used
}

export interface CalendarDayInfo extends CalendarDay {
  balance?: number; // Only for Sundays - ending balance for the week
  accrualRate?: number; // Only for Sundays - accrual rate for that week in hours
  isInVacation?: boolean;
  vacationId?: string; // For clicking to edit
  isHoliday?: boolean;
  holidayName?: string;
  isRDO?: boolean;
}
