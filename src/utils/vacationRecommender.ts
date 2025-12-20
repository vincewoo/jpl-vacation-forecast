import { WorkSchedule, Holiday, PlannedVacation } from '../types';
import { parseDate, formatDate, getDatesInRange } from './dateUtils';
import { isWeekend, isRDO, calculateVacationHoursForRange } from './workScheduleUtils';

export interface VacationRecommendation {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  vacationHours: number;
  efficiency: number; // days off per vacation hour
  score: number; // composite score for ranking
  isBracketed: boolean; // whether vacation is bracketed by free days
  context: string; // Human-readable explanation
  freeDays: {
    weekends: number;
    holidays: number;
    rdos: number;
  };
}

/**
 * Check if a date is a holiday
 */
const isHoliday = (date: Date, holidays: Holiday[]): boolean => {
  const dateStr = formatDate(date);
  return holidays.some(h => h.date === dateStr);
};

/**
 * Check if a day is a free day (weekend, RDO, or holiday)
 */
const isFreeDayOrHoliday = (date: Date, workSchedule: WorkSchedule, holidays: Holiday[]): boolean => {
  if (isWeekend(date)) return true;
  if (isRDO(date, workSchedule)) return true;
  return isHoliday(date, holidays);
};

/**
 * Check if a vacation is "bracketed" (starts on free day after workday, ends on free day before workday)
 */
const isBracketedVacation = (
  startDate: Date,
  endDate: Date,
  workSchedule: WorkSchedule,
  holidays: Holiday[]
): boolean => {
  // Check if start date is a free day with a workday before it
  const dayBeforeStart = new Date(startDate);
  dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
  const startsOnFreeDayAfterWorkday = isFreeDayOrHoliday(startDate, workSchedule, holidays) &&
                                      !isFreeDayOrHoliday(dayBeforeStart, workSchedule, holidays);

  // Check if end date is a free day with a workday after it
  const dayAfterEnd = new Date(endDate);
  dayAfterEnd.setDate(dayAfterEnd.getDate() + 1);
  const endsOnFreeDayBeforeWorkday = isFreeDayOrHoliday(endDate, workSchedule, holidays) &&
                                     !isFreeDayOrHoliday(dayAfterEnd, workSchedule, holidays);

  return startsOnFreeDayAfterWorkday && endsOnFreeDayBeforeWorkday;
};

/**
 * Calculate composite score for ranking recommendations
 * Score = 50% efficiency + 25% bracketing bonus + 25% length bonus
 */
const calculateScore = (
  efficiency: number,
  isBracketed: boolean,
  totalDays: number,
  vacationHours: number
): number => {
  // Normalize efficiency to 0-100 scale
  // Cap efficiency at 5x for normalization (anything higher gets same treatment)
  // For zero-hour vacations, we already set efficiency to 999 or 10,
  // but we'll cap it here to prevent flooding the top results
  let normalizedEfficiency: number;
  if (vacationHours === 0) {
    // Zero-hour vacations get a good but not overwhelming efficiency score
    // 4+ days get 3.0 efficiency, 3 days get 1.5 efficiency for scoring purposes
    normalizedEfficiency = totalDays >= 4 ? 3.0 : 1.5;
  } else {
    normalizedEfficiency = Math.min(efficiency, 5.0);
  }
  const efficiencyScore = (normalizedEfficiency / 5.0) * 50; // 0-50 points

  // Bracketing bonus: 25 points if bracketed
  const bracketingScore = isBracketed ? 25 : 0;

  // Length bonus: normalize to 0-25 based on total days
  // Use logarithmic scale to reward longer trips but with diminishing returns
  // 3 days = ~10 points, 7 days = ~20 points, 14+ days = 25 points
  const lengthScore = Math.min((Math.log(totalDays) / Math.log(14)) * 25, 25);

  return efficiencyScore + bracketingScore + lengthScore;
};

/**
 * Get holiday name for a date
 */
const getHolidayName = (date: Date, holidays: Holiday[]): string | null => {
  const dateStr = formatDate(date);
  const holiday = holidays.find(h => h.date === dateStr);
  return holiday ? holiday.name : null;
};

/**
 * Count free days in a range
 */
const countFreeDays = (
  startDate: Date,
  endDate: Date,
  workSchedule: WorkSchedule,
  holidays: Holiday[]
): { weekends: number; holidays: number; rdos: number } => {
  const dates = getDatesInRange(startDate, endDate);
  let weekends = 0;
  let holidayCount = 0;
  let rdos = 0;

  for (const date of dates) {
    if (isWeekend(date)) {
      weekends++;
    } else if (isHoliday(date, holidays)) {
      holidayCount++;
    } else if (isRDO(date, workSchedule)) {
      rdos++;
    }
  }

  return { weekends, holidays: holidayCount, rdos };
};

/**
 * Generate context string explaining why this is a good vacation
 */
const generateContext = (
  startDate: Date,
  endDate: Date,
  freeDays: { weekends: number; holidays: number; rdos: number },
  holidays: Holiday[]
): string => {
  const parts: string[] = [];

  // Check for holidays at boundaries
  const dayBefore = new Date(startDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const dayAfter = new Date(endDate);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const holidayBefore = getHolidayName(dayBefore, holidays);
  const holidayAfter = getHolidayName(dayAfter, holidays);
  const holidayOnStart = getHolidayName(startDate, holidays);
  const holidayOnEnd = getHolidayName(endDate, holidays);

  if (holidayBefore) {
    parts.push(`${holidayBefore} on ${formatDate(dayBefore)}`);
  }
  if (holidayAfter) {
    parts.push(`${holidayAfter} on ${formatDate(dayAfter)}`);
  }
  if (holidayOnStart && !holidayBefore) {
    parts.push(`starts on ${holidayOnStart}`);
  }
  if (holidayOnEnd && !holidayAfter) {
    parts.push(`ends on ${holidayOnEnd}`);
  }

  if (freeDays.weekends > 0) {
    parts.push(`includes ${freeDays.weekends} weekend day${freeDays.weekends > 1 ? 's' : ''}`);
  }
  if (freeDays.holidays > 0) {
    parts.push(`${freeDays.holidays} holiday${freeDays.holidays > 1 ? 's' : ''}`);
  }
  if (freeDays.rdos > 0) {
    parts.push(`${freeDays.rdos} RDO${freeDays.rdos > 1 ? 's' : ''}`);
  }

  return parts.length > 0
    ? parts.join(', ')
    : 'Extends weekend';
};

/**
 * Find vacation opportunities around a specific anchor date (holiday, RDO, etc.)
 */
const findOpportunitiesAroundDate = (
  anchorDate: Date,
  workSchedule: WorkSchedule,
  holidays: Holiday[],
  minEfficiency: number = 1.0
): VacationRecommendation[] => {
  const recommendations: VacationRecommendation[] = [];

  // Try different vacation lengths: 1-14 days (supports up to ~2.5 week vacations)
  const maxWorkDays = 14;

  // Try extending before the anchor
  for (let daysBefore = 1; daysBefore <= maxWorkDays; daysBefore++) {
    const startDate = new Date(anchorDate);
    startDate.setDate(startDate.getDate() - daysBefore);

    // Skip if start date is in the past
    if (startDate < new Date()) continue;

    const vacationHours = calculateVacationHoursForRange(
      startDate,
      anchorDate,
      workSchedule,
      holidays
    );

    const totalDays = daysBefore + 1;

    // Calculate efficiency
    let efficiency: number;
    if (vacationHours === 0) {
      // All free days - infinitely efficient!
      // Only boost efficiency for 4+ day periods (e.g., long holiday weekends)
      // 3-day weekends are nice but shouldn't outrank efficient work-day vacations
      if (totalDays >= 4) {
        efficiency = 999;
      } else {
        // Short free periods get a good but not infinite efficiency
        efficiency = 10;
      }
    } else {
      // Calculate efficiency as: total days off / equivalent work days
      // Use standard work day hours (9 for 9/80, 8 for 5/40)
      // This properly accounts for non-RDO Fridays (8hrs) counting as 0.89 days on 9/80
      const standardHoursPerDay = workSchedule.type === '9/80' ? 9 : 8;
      const equivalentWorkDays = vacationHours / standardHoursPerDay;
      efficiency = totalDays / equivalentWorkDays;
    }

    if (efficiency >= minEfficiency) {
      const freeDays = countFreeDays(startDate, anchorDate, workSchedule, holidays);
      const context = generateContext(startDate, anchorDate, freeDays, holidays);
      const isBracketed = isBracketedVacation(startDate, anchorDate, workSchedule, holidays);
      const score = calculateScore(efficiency, isBracketed, totalDays, vacationHours);

      recommendations.push({
        id: `before-${formatDate(anchorDate)}-${daysBefore}`,
        startDate: formatDate(startDate),
        endDate: formatDate(anchorDate),
        totalDays,
        vacationHours,
        efficiency,
        score,
        isBracketed,
        context,
        freeDays
      });
    }
  }

  // Try extending after the anchor
  for (let daysAfter = 1; daysAfter <= maxWorkDays; daysAfter++) {
    const endDate = new Date(anchorDate);
    endDate.setDate(endDate.getDate() + daysAfter);

    const vacationHours = calculateVacationHoursForRange(
      anchorDate,
      endDate,
      workSchedule,
      holidays
    );

    const totalDays = daysAfter + 1;

    // Calculate efficiency
    let efficiency: number;
    if (vacationHours === 0) {
      // All free days - infinitely efficient!
      // Only boost efficiency for 4+ day periods (e.g., long holiday weekends)
      // 3-day weekends are nice but shouldn't outrank efficient work-day vacations
      if (totalDays >= 4) {
        efficiency = 999;
      } else {
        // Short free periods get a good but not infinite efficiency
        efficiency = 10;
      }
    } else {
      // Calculate efficiency as: total days off / equivalent work days
      const standardHoursPerDay = workSchedule.type === '9/80' ? 9 : 8;
      const equivalentWorkDays = vacationHours / standardHoursPerDay;
      efficiency = totalDays / equivalentWorkDays;
    }

    if (efficiency >= minEfficiency) {
      const freeDays = countFreeDays(anchorDate, endDate, workSchedule, holidays);
      const context = generateContext(anchorDate, endDate, freeDays, holidays);
      const isBracketed = isBracketedVacation(anchorDate, endDate, workSchedule, holidays);
      const score = calculateScore(efficiency, isBracketed, totalDays, vacationHours);

      recommendations.push({
        id: `after-${formatDate(anchorDate)}-${daysAfter}`,
        startDate: formatDate(anchorDate),
        endDate: formatDate(endDate),
        totalDays,
        vacationHours,
        efficiency,
        score,
        isBracketed,
        context,
        freeDays
      });
    }
  }

  // Try wrapping around the anchor (before and after)
  // Allow up to 9 days on each side for ~2.5 week vacations (9 + 9 + 1 = 19 days max)
  for (let daysBefore = 1; daysBefore <= 9; daysBefore++) {
    for (let daysAfter = 1; daysAfter <= 9; daysAfter++) {
      const startDate = new Date(anchorDate);
      startDate.setDate(startDate.getDate() - daysBefore);
      const endDate = new Date(anchorDate);
      endDate.setDate(endDate.getDate() + daysAfter);

      // Skip if start date is in the past
      if (startDate < new Date()) continue;

      const vacationHours = calculateVacationHoursForRange(
        startDate,
        endDate,
        workSchedule,
        holidays
      );

      const totalDays = daysBefore + daysAfter + 1;

      // Calculate efficiency
      let efficiency: number;
      if (vacationHours === 0) {
        // All free days - infinitely efficient!
        // Only boost efficiency for 4+ day periods (e.g., long holiday weekends)
        // 3-day weekends are nice but shouldn't outrank efficient work-day vacations
        if (totalDays >= 4) {
          efficiency = 999;
        } else {
          // Short free periods get a good but not infinite efficiency
          efficiency = 10;
        }
      } else {
        // Calculate efficiency as: total days off / equivalent work days
        const standardHoursPerDay = workSchedule.type === '9/80' ? 9 : 8;
        const equivalentWorkDays = vacationHours / standardHoursPerDay;
        efficiency = totalDays / equivalentWorkDays;
      }

      if (efficiency >= minEfficiency) {
        const freeDays = countFreeDays(startDate, endDate, workSchedule, holidays);
        const context = generateContext(startDate, endDate, freeDays, holidays);
        const isBracketed = isBracketedVacation(startDate, endDate, workSchedule, holidays);
        const score = calculateScore(efficiency, isBracketed, totalDays, vacationHours);

        recommendations.push({
          id: `around-${formatDate(anchorDate)}-${daysBefore}-${daysAfter}`,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          totalDays,
          vacationHours,
          efficiency,
          score,
          isBracketed,
          context,
          freeDays
        });
      }
    }
  }

  return recommendations;
};

/**
 * Find all RDO Fridays in a date range
 */
const findRDOsInRange = (
  startDate: Date,
  endDate: Date,
  workSchedule: WorkSchedule
): Date[] => {
  if (workSchedule.type !== '9/80' || !workSchedule.rdoPattern) {
    return [];
  }

  const rdos: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (currentDate.getDay() === 5 && isRDO(currentDate, workSchedule)) {
      rdos.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return rdos;
};

/**
 * Generate vacation recommendations for a given time period
 *
 * @param workSchedule User's work schedule
 * @param holidays List of holidays
 * @param startDate Start of period to search (defaults to today)
 * @param endDate End of period to search (defaults to 1 year from now)
 * @param existingVacations Already planned vacations to avoid
 * @param maxRecommendations Maximum number of recommendations to return
 * @returns Top vacation recommendations sorted by efficiency
 */
export const generateVacationRecommendations = (
  workSchedule: WorkSchedule,
  holidays: Holiday[],
  startDate: Date = new Date(),
  endDate: Date = new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  existingVacations: PlannedVacation[] = [],
  maxRecommendations: number = 10
): VacationRecommendation[] => {
  console.log('[Recommender] Starting generation:', {
    workSchedule,
    holidayCount: holidays.length,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    existingVacations: existingVacations.length
  });

  const allRecommendations: VacationRecommendation[] = [];

  // Find all anchor dates (holidays and RDOs)
  const anchorDates: Date[] = [];

  // Add holidays
  for (const holiday of holidays) {
    const holidayDate = parseDate(holiday.date);
    if (holidayDate >= startDate && holidayDate <= endDate) {
      anchorDates.push(holidayDate);
    }
  }

  console.log('[Recommender] Found anchor holidays:', anchorDates.length);

  // Add RDOs
  const rdos = findRDOsInRange(startDate, endDate, workSchedule);
  anchorDates.push(...rdos);

  // Add weekends (look for long weekends)
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    if (currentDate.getDay() === 5) { // Fridays
      anchorDates.push(new Date(currentDate));
    }
    if (currentDate.getDay() === 1) { // Mondays
      anchorDates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log('[Recommender] Total anchor dates:', anchorDates.length);

  // Find opportunities around each anchor
  for (const anchor of anchorDates) {
    const opportunities = findOpportunitiesAroundDate(
      anchor,
      workSchedule,
      holidays,
      1.5 // Minimum efficiency threshold: 1.5x value (e.g., 9 days off for 6 work days = 1.5x)
    );
    allRecommendations.push(...opportunities);
  }

  console.log('[Recommender] All recommendations found:', allRecommendations.length);

  // Remove duplicates (same date range) - keep the one with highest score
  const uniqueRecommendations = new Map<string, VacationRecommendation>();
  for (const rec of allRecommendations) {
    const key = `${rec.startDate}-${rec.endDate}`;
    const existing = uniqueRecommendations.get(key);
    if (!existing || rec.score > existing.score) {
      uniqueRecommendations.set(key, rec);
    }
  }

  // Debug: Check for specific high-value recommendations
  const thanksgivingRec = Array.from(uniqueRecommendations.values()).find(
    r => r.startDate === '2026-11-21' && r.endDate === '2026-11-29'
  );
  if (thanksgivingRec) {
    console.log('[Recommender] Found Nov 21-29:', thanksgivingRec);
  }

  const christmasRec = Array.from(uniqueRecommendations.values()).find(
    r => r.startDate === '2026-12-19' && r.endDate === '2026-12-28'
  );
  if (christmasRec) {
    console.log('[Recommender] Found Dec 19-28:', christmasRec);
  } else {
    // Check what December recommendations exist
    const decRecs = Array.from(uniqueRecommendations.values()).filter(
      r => r.startDate.startsWith('2026-12')
    );
    console.log('[Recommender] December 2026 recommendations:', decRecs.length);
    if (decRecs.length > 0) {
      console.log('[Recommender] Sample Dec recs:', decRecs.slice(0, 10).map(r => ({
        dates: `${r.startDate} to ${r.endDate}`,
        days: r.totalDays,
        hours: r.vacationHours,
        efficiency: r.efficiency.toFixed(2)
      })));
    }
  }

  console.log('[Recommender] Unique recommendations:', uniqueRecommendations.size);

  // Filter out recommendations that overlap with existing vacations
  const existingRanges = existingVacations.map(v => ({
    start: parseDate(v.startDate),
    end: parseDate(v.endDate)
  }));

  const nonOverlapping = Array.from(uniqueRecommendations.values()).filter(rec => {
    const recStart = parseDate(rec.startDate);
    const recEnd = parseDate(rec.endDate);

    return !existingRanges.some(existing => {
      // Check if ranges overlap
      return recStart <= existing.end && recEnd >= existing.start;
    });
  });

  console.log('[Recommender] After filtering overlaps:', nonOverlapping.length);

  // Sort by composite score (higher is better)
  const sorted = nonOverlapping.sort((a, b) => b.score - a.score);

  // Return top N
  const final = sorted.slice(0, maxRecommendations);

  console.log('[Recommender] Final recommendations:', final.length);
  if (final.length > 0) {
    console.log('[Recommender] Top 3:', final.slice(0, 3));
  }

  return final;
};

/**
 * Test the recommender with sample data
 */
export const testRecommender = () => {
  const workSchedule: WorkSchedule = { type: '9/80', rdoPattern: 'odd-fridays' };
  const holidays: Holiday[] = [
    { name: 'Thanksgiving', date: '2026-11-26', hours: 9 },
    { name: 'Day After Thanksgiving', date: '2026-11-25', hours: 9 },
    { name: 'Christmas', date: '2026-12-24', hours: 9 },
    { name: 'Christmas', date: '2026-12-25', hours: 9 }
  ];

  const startDate = new Date('2026-01-01');
  const endDate = new Date('2026-12-31');

  const recommendations = generateVacationRecommendations(
    workSchedule,
    holidays,
    startDate,
    endDate
  );

  console.log('Top 10 Vacation Recommendations:');
  recommendations.forEach((rec, i) => {
    console.log(`\n${i + 1}. ${rec.startDate} to ${rec.endDate}`);
    console.log(`   ${rec.totalDays} days off for ${rec.vacationHours} hours`);
    console.log(`   Efficiency: ${rec.efficiency.toFixed(2)} days/hour`);
    console.log(`   ${rec.context}`);
  });
};
