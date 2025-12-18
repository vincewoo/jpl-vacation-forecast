# Design Decisions & Implementation Notes

This document captures key design decisions, architectural choices, and implementation patterns used in the JPL Vacation Forecast application.

## Architecture Overview

### Component Structure
The application follows a hierarchical component structure:
- **App.tsx**: Top-level state management and data flow orchestration
- **UserInputForm**: Initial profile setup and configuration
- **VacationPlanner**: Vacation entry management (list view)
- **CalendarView**: Visual calendar interface for vacation planning
- **BalanceTracker**: Week-by-week balance forecasting and annual summaries

### State Management
- **Local Storage**: All user data persists in browser localStorage for simplicity and privacy
- **No Backend**: Completely client-side application - no server required
- **Custom Hooks**: Business logic encapsulated in hooks (`useVacationCalculator`, `useHolidays`, `useLocalStorage`)

## Critical Date Handling

### Local Time vs UTC (Important!)
**Decision**: Use local time components exclusively throughout the application.

**Rationale**:
- Users in timezones behind UTC (e.g., Pacific Time) experienced a bug where Saturday balances would disappear from the calendar
- The issue occurred because date parsing/formatting used UTC, causing a day-shift for users behind UTC
- **Fix implemented in commit 10f5a3f**: Updated `dateUtils.ts` to use local time components:
  - `formatDate()`: Uses `getFullYear()`, `getMonth()`, `getDate()` (not UTC equivalents)
  - `parseDate()`: Constructs dates using `new Date(year, month-1, day)` (local time constructor)

**Implementation Details**:
```typescript
// src/utils/dateUtils.ts
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  return new Date(year, month - 1, day);
};
```

**Key Principle**: Never use UTC date methods. Always work with local date components to ensure consistent behavior across all timezones.

## Work Schedule Implementation

### 9/80 Schedule RDO Pattern
**Decision**: Use ISO week numbers to determine RDO Fridays.

**Rationale**:
- ISO weeks provide a consistent, internationally-recognized standard
- Week numbering starts on Monday, which aligns well with the 9/80 two-week cycle
- Provides predictable, reproducible results

**Implementation** ([src/utils/workScheduleUtils.ts:21-34](src/utils/workScheduleUtils.ts#L21-L34)):
- Calculate ISO week number for any Friday
- Even-week pattern: RDO on even-numbered weeks
- Odd-week pattern: RDO on odd-numbered weeks

### Vacation Hour Calculation
**Decision**: Automatically calculate vacation hours based on workdays only.

**What's Excluded**:
- Weekends (Saturday/Sunday)
- RDO Fridays (for 9/80 schedules)
- Federal and JPL holidays

**Why**: Users shouldn't need to "spend" vacation hours on days they wouldn't work anyway.

## Calendar Interface

### Interactive Vacation Selection
**Decision**: Two-click selection interface with hover preview.

**User Flow**:
1. First click: Start selection (sets start date)
2. Hover: Preview selection range
3. Second click: Complete selection and create vacation
4. Click existing vacation: Open edit modal
5. ESC key: Cancel selection

**Benefits**:
- Intuitive drag-like selection without complex drag handlers
- Visual feedback via hover preview
- Easy to cancel or redo selections

### Calendar Tile Layout Fix
**Problem**: Balance display overlapped with date numbers (commit 14d5899).

**Solution**: Absolute positioning within relative-positioned tile wrapper
- Date number: Top-left corner
- Balance display: Bottom-right corner
- Wrapper class ensures proper positioning context

**Implementation** ([src/components/Calendar/Calendar.css](src/components/Calendar/Calendar.css)):
```css
.calendar-tile-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.balance-display {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 0.7rem;
}
```

### Month Boundary Handling
**Decision**: Show dates through the last Saturday of the week containing the month's last day.

**Rationale**:
- Prevents awkward partial weeks at month end
- Maintains visual consistency with standard calendar layouts
- Uses `react-calendar__tile--hidden` class to hide dates beyond this boundary
- Next month dates shown with dimmed styling via `react-calendar__tile--next-month`

## Balance Calculation

### Accrual Timing
**Decision**: Vacation accrues on the first day of each month.

**Implementation** ([src/utils/accrualCalculator.ts](src/utils/accrualCalculator.ts)):
- Calculate accrual rate based on years of service as of the accrual month
- Rates change immediately when service milestones are reached (3, 8 years)
- Accrual applied at the start of the month, not prorated

### Week-by-Week Projection
**Decision**: Calculate balances for each Saturday (week-end).

**Rationale**:
- Saturday represents the end of a standard work week
- Provides weekly checkpoints for balance tracking
- Aligns with common payroll and HR reporting periods

**Implementation** ([src/utils/balanceCalculator.ts](src/utils/balanceCalculator.ts)):
- Start with current balance
- For each week: Add accruals, subtract vacation usage
- Track cumulative balance with warnings for negative projections

## Holiday Management

### Holiday Data Structure
**Decision**: JSON file with holidays for multiple years ([src/data/holidays.json](src/data/holidays.json)).

**Structure**:
```json
{
  "version": "1.0",
  "lastUpdated": "2025-12-18",
  "holidays": {
    "2026": [...],
    "2027": [...],
    "2028": [...]
  }
}
```

**Holiday Types**:
- `federal`: Standard federal holidays
- `jpl`: JPL-specific holidays (Day After Thanksgiving, Christmas Eve, Floating holidays)

**Future Enhancement**: Could add UI for users to customize holidays or import their own calendar.

## Data Persistence

### LocalStorage Schema
**Keys**:
- `jpl-vacation-user-profile`: User configuration
- `jpl-vacation-planned-vacations`: Array of planned vacation objects

**Format**:
```typescript
// UserProfile
{
  jplStartDate: "2020-01-15",
  currentBalance: 120,
  workSchedule: {
    type: "9/80",
    rdoPattern: "even-fridays"
  }
}

// PlannedVacation
{
  id: "uuid",
  startDate: "2026-06-15",
  endDate: "2026-06-19",
  hours: 40,
  description?: "Summer vacation"
}
```

### Reset Functionality
**Decision**: Simple reset button that clears all localStorage data.

**Rationale**:
- Users may want to start fresh if they make errors during setup
- No server means no recovery mechanism needed
- Users should be able to easily reconfigure

## Validation and Error Handling

### Negative Balance Prevention
**Decision**: Block vacation creation if it would result in negative balance.

**Implementation**:
- Pre-validate vacation requests using `canAffordVacation()`
- Calculate projected balance at the vacation start date
- Display clear error message with required vs. available hours
- User must either adjust dates or wait for more accrual

### Date Range Validation
**Decision**: Support both forward and backward selection.

**Rationale**:
- Users may click end date before start date
- Automatically normalize to [earlier, later] range
- Provides more flexible, forgiving interface

## Styling Approach

### CSS Architecture
**Decision**: Component-scoped CSS files co-located with components.

**Benefits**:
- Easy to find styles related to specific components
- Clear organization matching component structure
- No CSS-in-JS complexity or runtime overhead

### Responsive Design
**Decision**: Single-column layout on mobile, dual-calendar view on desktop.

**Breakpoint**: 768px
- Below 768px: Single month view, stacked sections
- Above 768px: Two-month calendar view, side-by-side layouts

**Implementation**: Window resize listener updates `isDoubleView` state in CalendarView.

## Future Considerations

### Potential Enhancements
1. **Holiday Customization**: UI for adding/editing holidays
2. **Export Functionality**: Export vacation plans to iCal, Google Calendar, or Excel
3. **Multiple Scenarios**: Compare different vacation planning scenarios
4. **Accrual Caps**: Enforce maximum balance limits per JPL policy
5. **Carry-over Rules**: Model year-end carry-over limits
6. **Team View**: Share vacation schedules with team members (would require backend)

### Technical Debt
- No automated tests (consider adding Vitest + React Testing Library)
- Holiday data is static (could use a holiday API)
- No offline detection or service worker (already works offline, but no indication)
- Type safety could be enhanced with stricter TypeScript config

## Testing Recommendations

When making changes, manually test:
1. **Timezone handling**: Test in Pacific, Eastern, UTC timezones
2. **Saturday balances**: Ensure Saturday shows correct balance, not blank
3. **RDO calculation**: Verify even/odd Friday patterns across year boundaries
4. **Accrual transitions**: Test when years of service crosses 3-year or 8-year thresholds
5. **Month boundaries**: Verify calendar tiles hide/show correctly at month edges
6. **Negative balance**: Try to create vacation that exceeds available balance

## Key Files Reference

- [src/utils/dateUtils.ts](src/utils/dateUtils.ts) - Date formatting and parsing (LOCAL TIME ONLY!)
- [src/utils/workScheduleUtils.ts](src/utils/workScheduleUtils.ts) - RDO calculation and work hours
- [src/utils/accrualCalculator.ts](src/utils/accrualCalculator.ts) - Monthly vacation accrual logic
- [src/utils/balanceCalculator.ts](src/utils/balanceCalculator.ts) - Week-by-week balance projection
- [src/utils/calendarDataMapper.ts](src/utils/calendarDataMapper.ts) - Maps weekly data to daily calendar tiles
- [src/components/Calendar/CalendarView.tsx](src/components/Calendar/CalendarView.tsx) - Interactive calendar interface
- [src/data/holidays.json](src/data/holidays.json) - Holiday definitions for 2026-2030

## Lessons Learned

1. **Timezone bugs are subtle**: Always test date handling in multiple timezones, especially around boundaries
2. **Local time is simpler**: For date-only operations, local time components are more intuitive than UTC
3. **Visual feedback matters**: Hover previews and selection states make the interface more predictable
4. **Validation upfront**: Block invalid actions rather than allowing them and showing errors afterward
5. **Co-location works**: Keeping related files together (component + CSS) improves maintainability
