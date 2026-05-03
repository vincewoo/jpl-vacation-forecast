import { describe, it, expect } from 'vitest';
import { formatDate, parseDate, getWeekStart, getWeekEnd, getWeeksInRange } from '../dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats a local date as YYYY-MM-DD with zero-padded month and day', () => {
      const date = new Date(2026, 0, 5); // Jan 5, 2026 local
      expect(formatDate(date)).toBe('2026-01-05');
    });

    it('uses local time components, not UTC (regression: Saturday-balance bug)', () => {
      // A Date constructed at local midnight in a timezone behind UTC would be
      // the previous day in UTC. formatDate must use local components.
      const date = new Date(2026, 5, 15, 0, 0, 0); // Local midnight Jun 15
      expect(formatDate(date)).toBe('2026-06-15');
    });

    it('roundtrips with parseDate', () => {
      const original = '2027-11-25';
      expect(formatDate(parseDate(original))).toBe(original);
    });
  });

  describe('parseDate', () => {
    it('parses YYYY-MM-DD into a local-time Date', () => {
      const parsed = parseDate('2026-03-14');
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(2); // March
      expect(parsed.getDate()).toBe(14);
      expect(parsed.getHours()).toBe(0);
    });

    it('throws when the string cannot be split into year/month/day', () => {
      expect(() => parseDate('abc')).toThrow();
    });
  });

  describe('getWeekStart / getWeekEnd', () => {
    it('returns Monday for any day in the week', () => {
      // Wed Jun 17, 2026
      const weekStart = getWeekStart(new Date(2026, 5, 17));
      expect(weekStart.getDay()).toBe(1); // Monday
      expect(formatDate(weekStart)).toBe('2026-06-15');
    });

    it('returns Sunday at end-of-day for any day in the week', () => {
      const weekEnd = getWeekEnd(new Date(2026, 5, 17)); // Wed
      expect(weekEnd.getDay()).toBe(0); // Sunday
      expect(formatDate(weekEnd)).toBe('2026-06-21');
    });

    it('handles Sunday correctly (treats it as the last day of the week)', () => {
      const sunday = new Date(2026, 5, 21); // Sun
      expect(formatDate(getWeekStart(sunday))).toBe('2026-06-15');
      expect(formatDate(getWeekEnd(sunday))).toBe('2026-06-21');
    });
  });

  describe('getWeeksInRange', () => {
    it('returns one Monday per week in the range', () => {
      const weeks = getWeeksInRange(new Date(2026, 0, 1), new Date(2026, 0, 31));
      expect(weeks.length).toBe(5);
      weeks.forEach(w => expect(w.getDay()).toBe(1));
    });

    it('handles a single-week range', () => {
      const weeks = getWeeksInRange(new Date(2026, 5, 16), new Date(2026, 5, 18));
      expect(weeks.length).toBe(1);
      expect(formatDate(weeks[0]!)).toBe('2026-06-15');
    });
  });
});
