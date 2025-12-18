import React, { useState } from 'react';
import { WeeklyBalance, AnnualSummary, UserProfile } from '../../types';
import { parseDate } from '../../utils/dateUtils';
import AnnualSummaryCard from './AnnualSummary';
import './BalanceTracker.css';

interface BalanceTrackerProps {
  weeklyBalances: WeeklyBalance[];
  annualSummaries: AnnualSummary[];
  userProfile: UserProfile;
}

const BalanceTracker: React.FC<BalanceTrackerProps> = ({
  weeklyBalances,
  annualSummaries,
}) => {
  const [showAllWeeks, setShowAllWeeks] = useState(false);

  // Get current week's balance
  const today = new Date();
  const currentWeekBalance = weeklyBalances.find(wb => {
    const weekStart = parseDate(wb.weekStartDate);
    const weekEnd = parseDate(wb.weekEndDate);
    return today >= weekStart && today <= weekEnd;
  });

  // Filter to show only recent and upcoming weeks (or all if toggled)
  const displayedWeeks = showAllWeeks
    ? weeklyBalances
    : weeklyBalances.filter(wb => {
        const weekStart = parseDate(wb.weekStartDate);
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        const twelveWeeksAhead = new Date();
        twelveWeeksAhead.setDate(twelveWeeksAhead.getDate() + 84);
        return weekStart >= fourWeeksAgo && weekStart <= twelveWeeksAhead;
      });

  const formatWeekRange = (startDate: string, endDate: string): string => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="balance-tracker">
      <div className="balance-tracker-header">
        <h2>Balance Tracker</h2>
      </div>

      <div className="annual-summaries">
        {annualSummaries.map(summary => (
          <AnnualSummaryCard key={summary.year} summary={summary} />
        ))}
      </div>

      <div className="weekly-balance-section">
        <div className="section-header">
          <h3>Weekly Balance Forecast</h3>
          <button
            onClick={() => setShowAllWeeks(!showAllWeeks)}
            className="toggle-button"
          >
            {showAllWeeks ? 'Show Recent Only' : 'Show All Weeks'}
          </button>
        </div>

        <div className="table-container">
          <table className="weekly-balance-table">
            <thead>
              <tr>
                <th>Week</th>
                <th>Starting Balance</th>
                <th>Accrued</th>
                <th>Used</th>
                <th>Ending Balance</th>
              </tr>
            </thead>
            <tbody>
              {displayedWeeks.map((wb, index) => {
                const isCurrentWeek = wb === currentWeekBalance;
                const isNegative = wb.endingBalance < 0;

                return (
                  <tr
                    key={`${wb.weekStartDate}-${index}`}
                    className={`${isCurrentWeek ? 'current-week' : ''} ${isNegative ? 'negative-balance' : ''}`}
                  >
                    <td className="week-column">
                      {formatWeekRange(wb.weekStartDate, wb.weekEndDate)}
                      {isCurrentWeek && <span className="current-label">Current</span>}
                    </td>
                    <td className="number-column">{wb.startingBalance.toFixed(2)}</td>
                    <td className="number-column positive">+{wb.accrued.toFixed(2)}</td>
                    <td className="number-column negative">
                      {wb.used > 0 && '-'}{wb.used.toFixed(2)}
                    </td>
                    <td className={`number-column ending-balance ${isNegative ? 'text-negative' : ''}`}>
                      {wb.endingBalance.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!showAllWeeks && weeklyBalances.length > displayedWeeks.length && (
          <div className="showing-info">
            Showing {displayedWeeks.length} of {weeklyBalances.length} weeks
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceTracker;
