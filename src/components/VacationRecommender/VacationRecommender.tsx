import React, { useState, useMemo } from 'react';
import { UserProfile, PlannedVacation, Holiday } from '../../types';
import { generateVacationRecommendations, VacationRecommendation } from '../../utils/vacationRecommender';
import { parseDate } from '../../utils/dateUtils';
import './VacationRecommender.css';

interface VacationRecommenderProps {
  userProfile: UserProfile;
  holidays: Holiday[];
  plannedVacations: PlannedVacation[];
  onSelectRecommendation: (recommendation: VacationRecommendation) => void;
}

const VacationRecommender: React.FC<VacationRecommenderProps> = ({
  userProfile,
  holidays,
  plannedVacations,
  onSelectRecommendation,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // Default to next year if we're in Q4, otherwise current year
  const defaultYear = new Date().getMonth() >= 9 ? new Date().getFullYear() + 1 : new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [tripLengthFilter, setTripLengthFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');

  // Generate recommendations for the selected year
  const recommendations = useMemo(() => {
    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31);

    // First, generate ALL recommendations without any maxRecommendations limit
    const allRecs = generateVacationRecommendations(
      userProfile.workSchedule,
      holidays,
      startDate > new Date() ? startDate : new Date(), // Don't recommend past dates
      endDate,
      plannedVacations,
      10000 // Generate a huge pool to filter from
    );

    // Apply filters to the full pool
    let filteredRecs = allRecs;

    // Filter by trip length
    // Short: ≤7 days (up to 1 week)
    // Medium: 8-14 days (1-2 weeks)
    // Long: >14 days (2+ weeks)
    if (tripLengthFilter === 'short') {
      filteredRecs = filteredRecs.filter(rec => rec.totalDays <= 7);
    } else if (tripLengthFilter === 'medium') {
      filteredRecs = filteredRecs.filter(rec => rec.totalDays >= 8 && rec.totalDays <= 14);
    } else if (tripLengthFilter === 'long') {
      filteredRecs = filteredRecs.filter(rec => rec.totalDays > 14);
    }

    // Return top 10 from the filtered results
    return filteredRecs.slice(0, 10);
  }, [userProfile.workSchedule, holidays, plannedVacations, selectedYear, tripLengthFilter]);

  const availableYears = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // If we're in Q4 (Oct-Dec), skip current year and show next 3 years
    // Otherwise show current year + next 2 years
    if (currentMonth >= 9) {
      return [currentYear + 1, currentYear + 2, currentYear + 3];
    }
    return [currentYear, currentYear + 1, currentYear + 2];
  }, []);

  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const startStr = start.toLocaleDateString('en-US', options);
    const endStr = end.toLocaleDateString('en-US', options);
    return `${startStr} - ${endStr}`;
  };

  const getScoreLabel = (score: number): { text: string; className: string } => {
    // Score is based on composite formula (max 100):
    // 50% efficiency, 25% bracketing, 25% length
    // 80+ = Excellent (top tier opportunities)
    // 65+ = Great (strong opportunities)
    // 50+ = Good (solid opportunities)
    // <50 = Fair (moderate opportunities)
    if (score >= 80) return { text: 'Excellent', className: 'excellent' };
    if (score >= 65) return { text: 'Great', className: 'great' };
    if (score >= 50) return { text: 'Good', className: 'good' };
    return { text: 'Fair', className: 'fair' };
  };

  if (!isExpanded) {
    return (
      <div className="vacation-recommender-collapsed">
        <button
          className="expand-button"
          onClick={() => setIsExpanded(true)}
          aria-label="Show vacation recommendations"
        >
          <span className="icon">💡</span>
          <span className="text">See Vince's Top Picks!</span>
          <span className="badge">{recommendations.length}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="vacation-recommender">
      <div className="recommender-header">
        <div className="header-content">
          <h2>
            <span className="icon">💡</span>
            Vince's Top Picks!
          </h2>
          <p className="subtitle">
            Maximize your time off by booking around holidays, weekends, and RDOs
          </p>
        </div>
        <button
          className="collapse-button"
          onClick={() => setIsExpanded(false)}
          aria-label="Hide recommendations"
        >
          ×
        </button>
      </div>

      <div className="year-selector">
        <label>Show recommendations for:</label>
        <div className="year-buttons" role="group" aria-label="Select year to view">
          {availableYears.map(year => (
            <button
              key={year}
              className={selectedYear === year ? 'active' : ''}
              onClick={() => setSelectedYear(year)}
              aria-pressed={selectedYear === year}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <div className="trip-length-filter">
        <label>Trip length:</label>
        <div className="filter-buttons" role="group" aria-label="Filter by trip length">
          <button
            className={tripLengthFilter === 'all' ? 'active' : ''}
            onClick={() => setTripLengthFilter('all')}
            aria-pressed={tripLengthFilter === 'all'}
          >
            All
          </button>
          <button
            className={tripLengthFilter === 'short' ? 'active' : ''}
            onClick={() => setTripLengthFilter('short')}
            aria-pressed={tripLengthFilter === 'short'}
          >
            Short (≤1 wk)
          </button>
          <button
            className={tripLengthFilter === 'medium' ? 'active' : ''}
            onClick={() => setTripLengthFilter('medium')}
            aria-pressed={tripLengthFilter === 'medium'}
          >
            Medium (1-2 wks)
          </button>
          <button
            className={tripLengthFilter === 'long' ? 'active' : ''}
            onClick={() => setTripLengthFilter('long')}
            aria-pressed={tripLengthFilter === 'long'}
          >
            Long (2+ wks)
          </button>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="no-recommendations">
          <p>No high-value vacation opportunities found for {selectedYear}.</p>
          <p className="hint">Try selecting a different year or check your holiday calendar.</p>
        </div>
      ) : (
        <div className="recommendations-list">
          <div className="list-header">
            <span className="header-label">Top {recommendations.length} Opportunities</span>
            <div className="header-definitions">
              <span className="efficiency-hint">
                Efficiency = Days off ÷ Work days used
              </span>
              <span className="bracketed-hint">
                Bracketed = Starts/ends on free day with workdays outside
              </span>
            </div>
          </div>

          {recommendations.map((rec, index) => {
            const scoreInfo = getScoreLabel(rec.score);

            // Calculate percentage widths for score bars
            const efficiencyPct = Math.min(rec.vacationHours === 0
              ? (rec.totalDays >= 4 ? 3.0 : 1.5) / 5.0 * 100
              : Math.min(rec.efficiency, 5.0) / 5.0 * 100, 100);

            const bracketingPct = rec.isBracketed ? 100 : 0;

            const lengthPct = Math.min((Math.log(rec.totalDays) / Math.log(14)) * 100, 100);

            return (
              <div key={rec.id} className="recommendation-card">
                <div className="card-header">
                  <div className="rank-badge">#{index + 1}</div>
                  <div className="date-range">
                    {formatDateRange(rec.startDate, rec.endDate)}
                  </div>
                  <div className={`efficiency-badge ${scoreInfo.className}`}>
                    {scoreInfo.text}
                  </div>
                </div>

                <div className="card-stats">
                  <div className="stat">
                    <span className="stat-value">{rec.totalDays}</span>
                    <span className="stat-label">days off</span>
                  </div>
                  <div className="stat-divider">for</div>
                  <div className="stat">
                    <span className="stat-value">{rec.vacationHours}</span>
                    <span className="stat-label">hours</span>
                  </div>
                  <div className="stat-divider">=</div>
                  <div className="stat">
                    <span className="stat-value">{rec.efficiency === 999 ? '∞' : `${rec.efficiency.toFixed(1)}x`}</span>
                    <span className="stat-label">value</span>
                  </div>
                </div>

                <div className="score-breakdown">
                  <div className="score-header">
                    <span className="score-title">Composite Score: {rec.score.toFixed(1)}</span>
                  </div>
                  <div className="score-components">
                    <div className="score-component">
                      <div
                        className="score-bar-container"
                        role="progressbar"
                        aria-valuenow={Math.round(efficiencyPct)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Efficiency score"
                      >
                        <div
                          className="score-bar efficiency-bar"
                          style={{ width: `${efficiencyPct}%` }}
                        />
                      </div>
                      <span className="score-label">Efficiency (50%)</span>
                    </div>
                    <div className="score-component">
                      <div
                        className="score-bar-container"
                        role="progressbar"
                        aria-valuenow={Math.round(bracketingPct)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Bracketing score"
                      >
                        <div
                          className="score-bar bracketing-bar"
                          style={{ width: `${bracketingPct}%` }}
                        />
                      </div>
                      <span className="score-label">Bracketing (25%)</span>
                    </div>
                    <div className="score-component">
                      <div
                        className="score-bar-container"
                        role="progressbar"
                        aria-valuenow={Math.round(lengthPct)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Length score"
                      >
                        <div
                          className="score-bar length-bar"
                          style={{ width: `${lengthPct}%` }}
                        />
                      </div>
                      <span className="score-label">Length (25%)</span>
                    </div>
                  </div>
                </div>

                {rec.context && (
                  <div className="card-context">
                    {rec.context}
                  </div>
                )}

                <div className="card-breakdown">
                  {rec.isBracketed && (
                    <span className="free-day-tag bracketed">
                      Bracketed
                    </span>
                  )}
                  {rec.freeDays.weekends > 0 && (
                    <span className="free-day-tag weekend">
                      {rec.freeDays.weekends} weekend day{rec.freeDays.weekends > 1 ? 's' : ''}
                    </span>
                  )}
                  {rec.freeDays.holidays > 0 && (
                    <span className="free-day-tag holiday">
                      {rec.freeDays.holidays} holiday{rec.freeDays.holidays > 1 ? 's' : ''}
                    </span>
                  )}
                  {rec.freeDays.rdos > 0 && (
                    <span className="free-day-tag rdo">
                      {rec.freeDays.rdos} RDO{rec.freeDays.rdos > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <button
                  className="select-button"
                  onClick={() => onSelectRecommendation(rec)}
                >
                  Add to Calendar
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="recommender-footer">
        <p className="tip">
          <strong>How it works:</strong> Recommendations are scored using a composite formula: 50% efficiency (days off ÷ work days), 25% bracketing bonus (starts/ends on a free day with workdays outside), and 25% trip length. "Bracketed" vacations maximize your time off by beginning the day after your last workday and ending the day before your next workday.
        </p>
      </div>
    </div>
  );
};

export default VacationRecommender;
