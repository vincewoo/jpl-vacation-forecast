import { AccrualRate } from '../types';

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

// JPL Holidays are now configured in src/data/holidays.json
// This allows for multi-year holiday data and easier updates.
// The holidays are loaded dynamically by the useHolidays hook,
// which reads from the JSON file and enriches holidays with
// work hours based on the user's schedule (5/40 or 9/80).
