import { AccrualRate, Holiday } from '../types';

// Accrual rates based on years of service
export const ACCRUAL_RATES: AccrualRate[] = [
  { yearsOfService: 0, hoursPerMonth: 10 },
  { yearsOfService: 4, hoursPerMonth: 12 },
  { yearsOfService: 9, hoursPerMonth: 14 },
];

// Work schedule configurations
export const SCHEDULE_CONFIGS = {
  '5/40': {
    hoursPerDay: 8,
    workDaysPerWeek: 5,
    totalHoursPerWeek: 40,
  },
  '9/80': {
    hoursPerRegularDay: 9,
    hoursPerNonRDOFriday: 8,
    hoursPerRDO: 0,
    totalHoursPer2Weeks: 80,
  },
} as const;

// JPL Holidays for 2026 (from spreadsheet cells A8:B20)
// These would be configurable by the user
export const DEFAULT_JPL_HOLIDAYS_2026: Omit<Holiday, 'hours'>[] = [
  { name: "New Year's Day", date: '2026-01-01' },
  { name: "Martin Luther King Jr. Day", date: '2026-01-19' },
  { name: "Presidents' Day", date: '2026-02-16' },
  { name: "Memorial Day", date: '2026-05-25' },
  { name: "Juneteenth", date: '2026-06-19' },
  { name: "Independence Day", date: '2026-07-03' }, // Observed
  { name: "Labor Day", date: '2026-09-07' },
  { name: "Indigenous Peoples' Day", date: '2026-10-12' },
  { name: "Veterans Day", date: '2026-11-11' },
  { name: "Thanksgiving", date: '2026-11-26' },
  { name: "Day After Thanksgiving", date: '2026-11-27' },
  { name: "Christmas Eve", date: '2026-12-24' },
  { name: "Christmas Day", date: '2026-12-25' },
];
