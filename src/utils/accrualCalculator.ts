import { ACCRUAL_RATES } from '../constants/jplConstants';

/**
 * Calculate years of service based on start date
 */
export const calculateYearsOfService = (startDate: Date, currentDate: Date): number => {
  const years = currentDate.getFullYear() - startDate.getFullYear();
  const monthDiff = currentDate.getMonth() - startDate.getMonth();
  const dayDiff = currentDate.getDate() - startDate.getDate();

  // Adjust if anniversary hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    return years - 1;
  }

  return years;
};

/**
 * Get accrual rate (hours per month) based on years of service
 */
export const getAccrualRate = (yearsOfService: number): number => {
  // Find the highest tier that applies
  const applicableRate = ACCRUAL_RATES
    .filter(rate => yearsOfService >= rate.yearsOfService)
    .sort((a, b) => b.yearsOfService - a.yearsOfService)[0];

  return applicableRate?.hoursPerMonth ?? ACCRUAL_RATES[0]?.hoursPerMonth ?? 10;
};

/**
 * Calculate accrual for a specific month
 */
export const calculateMonthlyAccrual = (
  startDate: Date,
  accrualMonth: Date
): number => {
  const yearsOfService = calculateYearsOfService(startDate, accrualMonth);
  return getAccrualRate(yearsOfService);
};

/**
 * Calculate accrual for a date range using a consistent weekly rate
 * For a full week (7 days), this ensures consistent accrual regardless of month boundaries
 */
export const calculateAccrualForRange = (
  startDate: Date,
  rangeStart: Date,
  rangeEnd: Date
): number => {
  // Normalize dates to start of day for accurate day counting
  const normalizedStart = new Date(rangeStart);
  normalizedStart.setHours(0, 0, 0, 0);

  const normalizedEnd = new Date(rangeEnd);
  normalizedEnd.setHours(0, 0, 0, 0);

  // Calculate the number of days in the range (inclusive)
  // For a week (Sunday to Saturday), this should be exactly 7 days
  const daysInRange = Math.round(
    (normalizedEnd.getTime() - normalizedStart.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // Get the monthly accrual rate based on years of service
  // Use the start of the range to determine the accrual tier
  const yearsOfService = calculateYearsOfService(startDate, rangeStart);
  const monthlyRate = getAccrualRate(yearsOfService);

  // Convert monthly rate to weekly rate
  // Using 365.25 days per year to account for leap years
  const daysPerYear = 365.25;
  const daysPerMonth = daysPerYear / 12;
  const weeklyRate = (monthlyRate / daysPerMonth) * 7;

  // Calculate accrual based on days in range
  const accrual = (weeklyRate / 7) * daysInRange;

  return Math.round(accrual * 100) / 100; // Round to 2 decimal places
};
