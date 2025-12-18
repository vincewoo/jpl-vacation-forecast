import React from 'react';

const CalendarLegend: React.FC = () => {
  return (
    <div className="calendar-legend">
      <h3>Legend</h3>
      <div className="legend-items">
        <div className="legend-item">
          <span className="legend-indicator vacation">V</span>
          <span className="legend-label">Planned Vacation</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator holiday">H</span>
          <span className="legend-label">Holiday</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator rdo">R</span>
          <span className="legend-label">RDO (9/80)</span>
        </div>
        <div className="legend-item">
          <span className="legend-box weekend"></span>
          <span className="legend-label">Weekend</span>
        </div>
        <div className="legend-item">
          <span className="legend-box balance-positive"></span>
          <span className="legend-label">Balance (on Saturdays)</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarLegend;
