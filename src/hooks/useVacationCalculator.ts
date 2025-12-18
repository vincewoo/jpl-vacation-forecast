import { useMemo } from 'react';
import {
  UserProfile,
  PlannedVacation,
  Holiday,
  WeeklyBalance,
  AnnualSummary
} from '../types';
import { calculateWeeklyBalances, calculateAnnualSummary, calculateProjectedBalance } from '../utils/balanceCalculator';
import { parseDate } from '../utils/dateUtils';
import { useLocalStorage } from './useLocalStorage';

export const useVacationCalculator = () => {
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>(
    'jpl-vacation-user-profile',
    null
  );

  const [plannedVacations, setPlannedVacations] = useLocalStorage<PlannedVacation[]>(
    'jpl-vacation-planned-vacations',
    []
  );

  const [holidays, setHolidays] = useLocalStorage<Holiday[]>(
    'jpl-vacation-holidays',
    []
  );

  // Calculate start and end dates for the forecast period
  const forecastPeriod = useMemo(() => {
    if (!userProfile) {
      const today = new Date();
      return {
        startDate: new Date(today.getFullYear(), 0, 1),
        endDate: new Date(today.getFullYear() + 1, 11, 31)
      };
    }

    // Start from the balanceAsOfDate and forecast for 2 years
    const startDate = parseDate(userProfile.balanceAsOfDate);
    const endDate = new Date(startDate.getFullYear() + 2, 11, 31); // End of year, 2 years from start
    return { startDate, endDate };
  }, [userProfile]);

  // Calculate weekly balances
  const weeklyBalances = useMemo<WeeklyBalance[]>(() => {
    if (!userProfile) return [];

    return calculateWeeklyBalances(
      userProfile,
      forecastPeriod.startDate,
      forecastPeriod.endDate,
      plannedVacations,
      holidays
    );
  }, [userProfile, forecastPeriod, plannedVacations, holidays]);

  // Calculate annual summaries
  const annualSummaries = useMemo<AnnualSummary[]>(() => {
    if (weeklyBalances.length === 0) return [];

    const currentYear = new Date().getFullYear();
    return [
      calculateAnnualSummary(weeklyBalances, currentYear),
      calculateAnnualSummary(weeklyBalances, currentYear + 1),
    ];
  }, [weeklyBalances]);

  // CRUD operations for planned vacations
  const addPlannedVacation = (vacation: Omit<PlannedVacation, 'id'>) => {
    const newVacation: PlannedVacation = {
      ...vacation,
      id: crypto.randomUUID(),
    };
    setPlannedVacations([...plannedVacations, newVacation]);
  };

  const updatePlannedVacation = (id: string, updates: Partial<PlannedVacation>) => {
    setPlannedVacations(
      plannedVacations.map(v => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  const deletePlannedVacation = (id: string) => {
    setPlannedVacations(plannedVacations.filter(v => v.id !== id));
  };

  // Validation helper - check if a vacation can be afforded
  const canAffordVacation = (vacation: Omit<PlannedVacation, 'id'>): { canAfford: boolean; projectedBalance: number } => {
    if (!userProfile) return { canAfford: false, projectedBalance: 0 };

    const vacationEndDate = parseDate(vacation.endDate);
    const projectedBalance = calculateProjectedBalance(
      userProfile,
      vacationEndDate,
      [...plannedVacations, { ...vacation, id: 'temp' }]
    );

    return {
      canAfford: projectedBalance >= 0,
      projectedBalance
    };
  };

  return {
    userProfile,
    setUserProfile,
    plannedVacations,
    addPlannedVacation,
    updatePlannedVacation,
    deletePlannedVacation,
    holidays,
    setHolidays,
    weeklyBalances,
    annualSummaries,
    forecastPeriod,
    canAffordVacation,
  };
};
