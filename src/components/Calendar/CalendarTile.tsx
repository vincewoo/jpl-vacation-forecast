import React from 'react';
import { CalendarDayInfo } from '../../types';
import { MAX_VACATION_BALANCE, BALANCE_WARNING_THRESHOLD } from '../../utils/balanceCalculator';

interface CalendarTileProps {
  dayInfo: CalendarDayInfo | undefined;
  isInSelectionRange: boolean;
  isSelectionStart: boolean;
  isSelectionEnd: boolean;
}

const CalendarTile: React.FC<CalendarTileProps> = ({
  dayInfo,
  isInSelectionRange,
  isSelectionStart,
  isSelectionEnd,
}) => {
  if (!dayInfo) return null;

  // Debug: log if this is a Sunday with balance data
  if (dayInfo.date.getDay() === 0) {
    console.log('Sunday:', dayInfo.date.toISOString().split('T')[0], 'balance:', dayInfo.balance);
  }

  return (
    <div className="calendar-tile-content">
      {/* Day indicators */}
      <div className="day-indicators">
        {dayInfo.isInVacation && (
          <span className="indicator vacation" title="Planned Vacation">
            {dayInfo.isPersonalDayStart ? 'P' : 'V'}
          </span>
        )}
        {dayInfo.isHoliday && (
          <span className="indicator holiday" title={dayInfo.holidayName}>
            H
          </span>
        )}
        {dayInfo.isRDO && (
          <span className="indicator rdo" title="Regular Day Off">
            R
          </span>
        )}
      </div>

      {/* Sunday balance display */}
      {dayInfo.balance !== undefined && (
        <div
          className={`balance-display ${
            dayInfo.balance < 0
              ? 'negative'
              : dayInfo.balance >= MAX_VACATION_BALANCE
              ? 'at-max'
              : dayInfo.balance > BALANCE_WARNING_THRESHOLD
              ? 'warning'
              : 'positive'
          }`}
          title={dayInfo.accrualRate !== undefined ? `Accrual rate: +${dayInfo.accrualRate.toFixed(2)} hours` : undefined}
        >
          {dayInfo.balance.toFixed(1)}h
        </div>
      )}

      {/* Selection range highlighting */}
      {isInSelectionRange && <div className="selection-overlay" />}
      {isSelectionStart && <div className="selection-start-marker" />}
      {isSelectionEnd && <div className="selection-end-marker" />}
    </div>
  );
};

export default React.memo(CalendarTile);
