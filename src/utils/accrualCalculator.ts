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
 * Calculate accrual for a date range (prorated if partial month)
 */
export const calculateAccrualForRange = (
  startDate: Date,
  rangeStart: Date,
  rangeEnd: Date
): number => {
  let totalAccrual = 0;

  // Iterate through each month in the range
  const currentDate = new Date(rangeStart);

  while (currentDate <= rangeEnd) {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const effectiveStart = monthStart > rangeStart ? monthStart : rangeStart;
    const effectiveEnd = monthEnd < rangeEnd ? monthEnd : rangeEnd;

    const daysInMonth = monthEnd.getDate();
    const daysInRange = Math.ceil(
      (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    const monthlyRate = calculateMonthlyAccrual(startDate, currentDate);
    const proratedAccrual = (monthlyRate / daysInMonth) * daysInRange;

    totalAccrual += proratedAccrual;

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    currentDate.setDate(1);
  }

  return Math.round(totalAccrual * 100) / 100; // Round to 2 decimal places
};
