import { describe, it, expect } from 'vitest';
import {
  calculateWeeklyBalances,
  calculateProjectedBalance,
  calculateAnnualSummary,
  MAX_VACATION_BALANCE,
} from '../balanceCalculator';
import type { UserProfile, PlannedVacation, Holiday } from '../../types';

const baseProfile: UserProfile = {
  startDate: '2020-01-15', // 6 yrs by 2026 → tier 1, rate 12 hrs/mo
  currentBalance: 100,
  balanceAsOfDate: '2026-01-05', // Monday
  workSchedule: { type: '5/40' },
};

describe('calculateProjectedBalance', () => {
  it('accrues from balanceAsOfDate to the target date (regression: prior bug used today)', () => {
    // balanceAsOfDate is months in the past. The buggy version returned currentBalance
    // because it accrued from "today" forward; the correct behaviour accrues the gap.
    const target = new Date(2026, 3, 5); // Apr 5, 2026 — ~91 days after balanceAsOfDate
    const projected = calculateProjectedBalance(baseProfile, target, [], []);
    // Tier 1: 12 hrs/mo. ~3 months ≈ 36 hours.
    expect(projected).toBeGreaterThan(baseProfile.currentBalance + 30);
    expect(projected).toBeLessThan(baseProfile.currentBalance + 45);
  });

  it('returns approximately currentBalance when target equals balanceAsOfDate', () => {
    // The accrual range is inclusive, so a single day still earns ~0.4 hours.
    const target = new Date(2026, 0, 5);
    const projected = calculateProjectedBalance(baseProfile, target, [], []);
    expect(projected - baseProfile.currentBalance).toBeLessThan(1);
  });

  it('does not accrue when target is before balanceAsOfDate', () => {
    const target = new Date(2025, 11, 1);
    const projected = calculateProjectedBalance(baseProfile, target, [], []);
    expect(projected).toBe(baseProfile.currentBalance);
  });

  it('subtracts vacation hours that end on or before the target date', () => {
    const vacations: PlannedVacation[] = [
      { id: '1', startDate: '2026-02-02', endDate: '2026-02-06' }, // Mon-Fri = 40 hrs
    ];
    const target = new Date(2026, 2, 1);
    const withVacation = calculateProjectedBalance(baseProfile, target, vacations, []);
    const withoutVacation = calculateProjectedBalance(baseProfile, target, [], []);
    expect(withoutVacation - withVacation).toBe(40);
  });

  it('does not subtract vacations that end after the target date', () => {
    const vacations: PlannedVacation[] = [
      { id: '1', startDate: '2026-04-06', endDate: '2026-04-10' },
    ];
    const target = new Date(2026, 2, 1); // before the vacation
    const projected = calculateProjectedBalance(baseProfile, target, vacations, []);
    const baseline = calculateProjectedBalance(baseProfile, target, [], []);
    expect(projected).toBe(baseline);
  });

  it('applies the 8-hour Personal Day deduction once per vacation', () => {
    const vacations: PlannedVacation[] = [
      {
        id: '1',
        startDate: '2026-02-02',
        endDate: '2026-02-06',
        personalDayUsed: true,
      },
    ];
    const target = new Date(2026, 2, 1);
    const withPersonalDay = calculateProjectedBalance(baseProfile, target, vacations, []);
    const withoutPersonalDay = calculateProjectedBalance(
      baseProfile,
      target,
      [{ ...vacations[0]!, personalDayUsed: false }],
      []
    );
    // Using the Personal Day costs 8 fewer hours, so the projected balance is 8 higher.
    expect(withPersonalDay - withoutPersonalDay).toBe(8);
  });
});

describe('calculateWeeklyBalances', () => {
  it('does not accrue before balanceAsOfDate', () => {
    const balances = calculateWeeklyBalances(
      baseProfile,
      new Date(2025, 11, 1), // before balanceAsOfDate
      new Date(2025, 11, 28),
      [],
      []
    );
    balances.forEach(b => expect(b.accrued).toBe(0));
  });

  it('starts running balance at currentBalance and accrues on or after balanceAsOfDate', () => {
    const balances = calculateWeeklyBalances(
      baseProfile,
      new Date(2026, 0, 5),
      new Date(2026, 0, 25),
      [],
      []
    );
    expect(balances[0]!.startingBalance).toBe(100);
    expect(balances[0]!.accrued).toBeGreaterThan(0);
    // Each week's ending balance becomes the next week's starting balance.
    for (let i = 1; i < balances.length; i++) {
      expect(balances[i]!.startingBalance).toBeCloseTo(balances[i - 1]!.endingBalance, 5);
    }
  });

  it('caps the ending balance at MAX_VACATION_BALANCE', () => {
    const profile: UserProfile = { ...baseProfile, currentBalance: MAX_VACATION_BALANCE };
    const balances = calculateWeeklyBalances(
      profile,
      new Date(2026, 0, 5),
      new Date(2026, 1, 28),
      [],
      []
    );
    balances.forEach(b => expect(b.endingBalance).toBeLessThanOrEqual(MAX_VACATION_BALANCE));
  });

  it('subtracts a multi-week vacation across the weeks it spans', () => {
    const vacation: PlannedVacation = {
      id: '1',
      startDate: '2026-02-02', // Mon
      endDate: '2026-02-13',   // Fri (two full work weeks)
    };
    const balances = calculateWeeklyBalances(
      baseProfile,
      new Date(2026, 1, 1),
      new Date(2026, 1, 28),
      [vacation],
      []
    );
    const totalUsed = balances.reduce((sum, b) => sum + b.used, 0);
    expect(totalUsed).toBe(80); // 2 weeks × 40 hours
  });

  it('applies the Personal Day deduction in the week containing the vacation start, not every week', () => {
    const vacation: PlannedVacation = {
      id: '1',
      startDate: '2026-02-02',
      endDate: '2026-02-13',
      personalDayUsed: true,
    };
    const balances = calculateWeeklyBalances(
      baseProfile,
      new Date(2026, 1, 1),
      new Date(2026, 1, 28),
      [vacation],
      []
    );
    const totalUsed = balances.reduce((sum, b) => sum + b.used, 0);
    expect(totalUsed).toBe(72); // 80 - 8 personal day, applied only once
  });

  it('credits 8 unused Personal Day hours on the last week of the year if no vacation used it', () => {
    const profile: UserProfile = {
      ...baseProfile,
      personalDayUsedInStartYear: false,
    };
    const balances = calculateWeeklyBalances(
      profile,
      new Date(2026, 0, 5),
      new Date(2027, 0, 11),
      [],
      []
    );
    // Find the week that crosses the year boundary (Mon Dec 28, 2026 → Sun Jan 3, 2027).
    const yearEndWeek = balances.find(
      b => b.weekStartDate.startsWith('2026-12') && b.weekEndDate.startsWith('2027-01')
    );
    expect(yearEndWeek).toBeDefined();
    // Compare against a baseline week (no vacation, same accrual rate) — the year-end
    // week should be ~8 hours higher.
    const otherWeek = balances.find(b => b.weekStartDate === '2026-06-15')!;
    expect(yearEndWeek!.accrued - otherWeek.accrued).toBeCloseTo(8, 1);
  });

  it('does NOT credit the rollover when a vacation in that year used the Personal Day', () => {
    const vacation: PlannedVacation = {
      id: '1',
      startDate: '2026-06-15',
      endDate: '2026-06-19',
      personalDayUsed: true,
    };
    const balances = calculateWeeklyBalances(
      baseProfile,
      new Date(2026, 0, 5),
      new Date(2027, 0, 11),
      [vacation],
      []
    );
    const yearEndWeek = balances.find(
      b => b.weekStartDate.startsWith('2026-12') && b.weekEndDate.startsWith('2027-01')
    )!;
    const otherWeek = balances.find(b => b.weekStartDate === '2026-08-03')!;
    // No bonus 8 hours on rollover — accruals should be roughly equal.
    expect(yearEndWeek.accrued).toBeCloseTo(otherWeek.accrued, 1);
  });

  it('respects personalDayUsedInStartYear and skips rollover for the starting year', () => {
    const profile: UserProfile = {
      ...baseProfile,
      personalDayUsedInStartYear: true,
    };
    const balances = calculateWeeklyBalances(
      profile,
      new Date(2026, 0, 5),
      new Date(2027, 0, 11),
      [],
      []
    );
    const yearEndWeek = balances.find(
      b => b.weekStartDate.startsWith('2026-12') && b.weekEndDate.startsWith('2027-01')
    )!;
    const otherWeek = balances.find(b => b.weekStartDate === '2026-08-03')!;
    expect(yearEndWeek.accrued).toBeCloseTo(otherWeek.accrued, 1);
  });
});

describe('calculateAnnualSummary', () => {
  it('aggregates accrued and used hours across the year', () => {
    const vacation: PlannedVacation = {
      id: '1',
      startDate: '2026-06-15',
      endDate: '2026-06-19',
    };
    const balances = calculateWeeklyBalances(
      baseProfile,
      new Date(2026, 0, 5),
      new Date(2026, 11, 27),
      [vacation],
      []
    );
    const summary = calculateAnnualSummary(balances, 2026);
    expect(summary.year).toBe(2026);
    expect(summary.totalUsed).toBe(40);
    expect(summary.totalAccrued).toBeGreaterThan(0);
    expect(summary.totalPlannedVacations).toBe(1);
  });

  it('returns a zeroed summary when no weekly balances fall in the year', () => {
    const summary = calculateAnnualSummary([], 2030);
    expect(summary).toEqual({
      year: 2030,
      startingBalance: 0,
      totalAccrued: 0,
      totalUsed: 0,
      endingBalance: 0,
      totalPlannedVacations: 0,
      totalHolidayHours: 0,
    });
  });

  it('sums holiday hours', () => {
    const holidays: Holiday[] = [
      { name: 'Memorial Day', date: '2026-05-25', hours: 8 },
      { name: 'Independence Day', date: '2026-07-03', hours: 8 },
    ];
    const balances = calculateWeeklyBalances(
      baseProfile,
      new Date(2026, 4, 1),
      new Date(2026, 6, 31),
      [],
      holidays
    );
    const summary = calculateAnnualSummary(balances, 2026);
    expect(summary.totalHolidayHours).toBe(16);
  });
});
