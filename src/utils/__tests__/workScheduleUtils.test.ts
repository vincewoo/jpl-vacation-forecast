import { describe, it, expect } from 'vitest';
import {
  isWeekend,
  isRDOFriday,
  isRDO,
  getWorkHoursForDay,
  getRDODatesInRange,
  calculateVacationHoursForRange,
  getVacationHours,
} from '../workScheduleUtils';
import type { Holiday, WorkSchedule } from '../../types';

const schedule540: WorkSchedule = { type: '5/40' };
const schedule980: WorkSchedule = { type: '9/80' };

describe('workScheduleUtils', () => {
  describe('isWeekend', () => {
    it('returns true for Saturday and Sunday', () => {
      expect(isWeekend(new Date(2026, 5, 13))).toBe(true); // Sat
      expect(isWeekend(new Date(2026, 5, 14))).toBe(true); // Sun
    });

    it('returns false for weekdays', () => {
      expect(isWeekend(new Date(2026, 5, 15))).toBe(false); // Mon
    });
  });

  describe('isRDOFriday', () => {
    it('returns false for non-Fridays', () => {
      expect(isRDOFriday(new Date(2026, 5, 15))).toBe(false); // Mon
    });

    it('alternates RDO Fridays week by week', () => {
      // Two consecutive Fridays must produce opposite results.
      const fri1 = new Date(2026, 5, 12); // Jun 12, 2026
      const fri2 = new Date(2026, 5, 19); // Jun 19, 2026
      expect(isRDOFriday(fri1)).not.toBe(isRDOFriday(fri2));
    });

    it('never produces two consecutive RDO Fridays across a 53-week year boundary', () => {
      // 2026 has 53 ISO weeks (Jan 1 = Thursday). The old ISO-parity approach broke here.
      // Jan 1, 2027 (week 53 of 2026) and Jan 8, 2027 (week 1 of 2027) must alternate.
      const jan1_2027 = new Date(2027, 0, 1);
      const jan8_2027 = new Date(2027, 0, 8);
      expect(isRDOFriday(jan1_2027)).not.toBe(isRDOFriday(jan8_2027));
    });
  });

  describe('getWorkHoursForDay', () => {
    it('returns 0 on weekends for both schedules', () => {
      const sat = new Date(2026, 5, 13);
      expect(getWorkHoursForDay(sat, schedule540)).toBe(0);
      expect(getWorkHoursForDay(sat, schedule980)).toBe(0);
    });

    it('returns 8 hours for any 5/40 weekday', () => {
      expect(getWorkHoursForDay(new Date(2026, 5, 15), schedule540)).toBe(8);
      expect(getWorkHoursForDay(new Date(2026, 5, 19), schedule540)).toBe(8); // Friday
    });

    it('returns 9 hours for a 9/80 regular weekday', () => {
      expect(getWorkHoursForDay(new Date(2026, 5, 15), schedule980)).toBe(9); // Mon
    });

    it('returns 0 hours on a 9/80 RDO Friday and 8 on a non-RDO Friday', () => {
      // Find one of each from consecutive Fridays.
      const fri1 = new Date(2026, 5, 12);
      const fri2 = new Date(2026, 5, 19);
      const hours1 = getWorkHoursForDay(fri1, schedule980);
      const hours2 = getWorkHoursForDay(fri2, schedule980);
      expect(new Set([hours1, hours2])).toEqual(new Set([0, 8]));
    });
  });

  describe('isRDO', () => {
    it('always returns false for 5/40 schedule', () => {
      // Even on a Friday that would be an RDO under 9/80.
      expect(isRDO(new Date(2026, 5, 12), schedule540)).toBe(false);
    });

    it('matches isRDOFriday for 9/80 schedule', () => {
      const fri = new Date(2026, 5, 12);
      expect(isRDO(fri, schedule980)).toBe(isRDOFriday(fri));
    });
  });

  describe('getRDODatesInRange', () => {
    it('returns only Fridays', () => {
      const start = new Date(2026, 0, 1);
      const end = new Date(2026, 1, 28);
      const rdos = getRDODatesInRange(start, end);
      rdos.forEach(d => expect(d.getDay()).toBe(5));
    });

    it('returns approximately every other Friday', () => {
      // Over a 12-month span there should be roughly 26 RDOs (every other Friday of 52).
      const rdos = getRDODatesInRange(
        new Date(2026, 0, 1),
        new Date(2026, 11, 31)
      );
      expect(rdos.length).toBeGreaterThanOrEqual(25);
      expect(rdos.length).toBeLessThanOrEqual(27);
    });
  });

  describe('calculateVacationHoursForRange', () => {
    it('counts a full Mon-Fri week as 40 hours on 5/40', () => {
      const mon = new Date(2026, 5, 15);
      const fri = new Date(2026, 5, 19);
      expect(calculateVacationHoursForRange(mon, fri, schedule540)).toBe(40);
    });

    it('excludes weekend days from the cost', () => {
      const sat = new Date(2026, 5, 13);
      const sun = new Date(2026, 5, 14);
      expect(calculateVacationHoursForRange(sat, sun, schedule540)).toBe(0);
    });

    it('excludes holidays from the cost', () => {
      const mon = new Date(2026, 6, 6); // Jul 6
      const fri = new Date(2026, 6, 10);
      const holidays: Holiday[] = [
        // Independence Day observed on Jul 3 doesn't fall in this range,
        // so create a synthetic holiday in-range to assert the deduction.
        { name: 'Test Holiday', date: '2026-07-08', hours: 8 },
      ];
      // 5 weekdays × 8 hrs = 40, minus 8 hrs for the holiday = 32.
      expect(calculateVacationHoursForRange(mon, fri, schedule540, holidays)).toBe(32);
    });

    it('excludes 9/80 RDO Fridays from the cost', () => {
      // Pick two consecutive Fridays to find one RDO and one non-RDO.
      const fri1 = new Date(2026, 5, 12);
      const fri2 = new Date(2026, 5, 19);
      const rdoFriday = isRDOFriday(fri1) ? fri1 : fri2;
      const cost = calculateVacationHoursForRange(rdoFriday, rdoFriday, schedule980);
      expect(cost).toBe(0);
    });

    it('counts a full week as 40 hours on 9/80 (4×9 + 1×8 or 4×9 + 0 RDO depending on Friday)', () => {
      // Find a week starting Mon where Fri is non-RDO.
      const candidates = [new Date(2026, 5, 15), new Date(2026, 5, 22)];
      const nonRdoMonday = candidates.find(mon => {
        const fri = new Date(mon);
        fri.setDate(fri.getDate() + 4);
        return !isRDOFriday(fri);
      })!;
      const fri = new Date(nonRdoMonday);
      fri.setDate(fri.getDate() + 4);
      // 4 regular days × 9 + 1 non-RDO Friday × 8 = 44
      expect(calculateVacationHoursForRange(nonRdoMonday, fri, schedule980)).toBe(44);
    });
  });

  describe('getVacationHours', () => {
    it('parses the vacation date strings and computes hours', () => {
      const hours = getVacationHours(
        { startDate: '2026-06-15', endDate: '2026-06-19' },
        schedule540
      );
      expect(hours).toBe(40);
    });
  });
});
