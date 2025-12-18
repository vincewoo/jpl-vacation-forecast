import React from 'react';
import { AnnualSummary } from '../../types';
import './BalanceTracker.css';

interface AnnualSummaryCardProps {
  summary: AnnualSummary;
}

const AnnualSummaryCard: React.FC<AnnualSummaryCardProps> = ({ summary }) => {
  return (
    <div className="annual-summary-card">
      <h3>{summary.year} Summary</h3>
      <div className="summary-grid">
        <div className="summary-item">
          <span className="summary-label">Starting Balance</span>
          <span className="summary-value">{summary.startingBalance.toFixed(2)} hrs</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Accrued</span>
          <span className="summary-value positive">+{summary.totalAccrued.toFixed(2)} hrs</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Used</span>
          <span className="summary-value negative">-{summary.totalUsed.toFixed(2)} hrs</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Ending Balance</span>
          <span className={`summary-value ${summary.endingBalance < 0 ? 'text-negative' : 'text-positive'}`}>
            {summary.endingBalance.toFixed(2)} hrs
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Planned Vacations</span>
          <span className="summary-value">{summary.totalPlannedVacations}</span>
        </div>
      </div>
    </div>
  );
};

export default AnnualSummaryCard;
