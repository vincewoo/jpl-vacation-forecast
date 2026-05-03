import { describe, it, expect } from 'vitest';
import {
  calculateYearsOfService,
  getAccrualRate,
  calculateAccrualForRange,
} from '../accrualCalculator';

describe('accrualCalculator', () => {
  describe('calculateYearsOfService', () => {
    it('returns full years when anniversary has passed', () => {
      const start = new Date(2020, 0, 15);
      const current = new Date(2026, 5, 1);
      expect(calculateYearsOfService(start, current)).toBe(6);
    });

    it('subtracts one year when anniversary has not yet occurred', () => {
      const start = new Date(2020, 5, 15); // Jun 15, 2020
      const current = new Date(2026, 2, 1); // Mar 1, 2026 (anniversary not yet)
      expect(calculateYearsOfService(start, current)).toBe(5);
    });

    it('counts the year on the exact anniversary date', () => {
      const start = new Date(2020, 5, 15);
      const current = new Date(2026, 5, 15);
      expect(calculateYearsOfService(start, current)).toBe(6);
    });
  });

  describe('getAccrualRate', () => {
    it('returns base rate (10) for fewer than 4 years of service', () => {
      expect(getAccrualRate(0)).toBe(10);
      expect(getAccrualRate(3)).toBe(10);
    });

    it('returns mid-tier rate (12) for 4-8 years of service', () => {
      expect(getAccrualRate(4)).toBe(12);
      expect(getAccrualRate(8)).toBe(12);
    });

    it('returns top-tier rate (14) for 9+ years of service', () => {
      expect(getAccrualRate(9)).toBe(14);
      expect(getAccrualRate(25)).toBe(14);
    });
  });

  describe('calculateAccrualForRange', () => {
    it('accrues one full week at base rate for a new employee', () => {
      const start = new Date(2025, 0, 1);
      // Mon-Sun week
      const weekStart = new Date(2026, 0, 5);
      const weekEnd = new Date(2026, 0, 11);
      // weeklyRate = 10/(365.25/12)*7 ≈ 2.30
      expect(calculateAccrualForRange(start, weekStart, weekEnd)).toBeCloseTo(2.3, 2);
    });

    it('accrues at the higher rate for the entire week if an anniversary falls within it', () => {
      // Service starts Jan 8, 2022 — 4-year anniversary on Thu Jan 8, 2026
      const start = new Date(2022, 0, 8);
      const weekStart = new Date(2026, 0, 5); // Mon
      const weekEnd = new Date(2026, 0, 11); // Sun
      // Without anniversary boost we'd be in tier 0 (years=3 at start of week).
      // With boost, the whole week uses tier 1 (years=4, rate=12).
      const expectedWeekly = (12 / (365.25 / 12)) * 7;
      expect(calculateAccrualForRange(start, weekStart, weekEnd)).toBeCloseTo(
        Math.round(expectedWeekly * 100) / 100,
        2
      );
    });

    it('scales linearly with the number of days in the range', () => {
      const start = new Date(2020, 0, 1); // 6+ years by 2026 → tier 1, rate 12
      const oneWeek = calculateAccrualForRange(
        start,
        new Date(2026, 0, 5),
        new Date(2026, 0, 11)
      );
      const twoWeeks = calculateAccrualForRange(
        start,
        new Date(2026, 0, 5),
        new Date(2026, 0, 18)
      );
      expect(twoWeeks).toBeCloseTo(oneWeek * 2, 1);
    });
  });
});
