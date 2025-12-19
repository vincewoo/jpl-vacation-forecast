# Design Decisions & Implementation Notes

This document captures key design decisions, architectural choices, and implementation patterns used in the JPL Vacation Forecast application.

## Architecture Overview

### Component Structure
The application follows a hierarchical component structure:
- **App.tsx**: Top-level state management and data flow orchestration
- **WelcomeScreen**: Initial entry point for new or returning users
- **LoadingScreen**: Shows while authentication/sync is in progress
- **UserInputForm**: Initial profile setup and configuration
- **VacationPlanner**: Vacation entry management (list view)
- **CalendarView**: Visual calendar interface for vacation planning
- **BalanceTracker**: Week-by-week balance forecasting and annual summaries
- **CloudSync**: Optional Google sign-in for cross-device data synchronization

### State Management
- **Local Storage**: All user data persists in browser localStorage for simplicity and privacy
- **Cloud Sync (Optional)**: Firebase integration for syncing data across devices via Google sign-in
- **No Backend Required**: Completely client-side application with optional cloud sync
- **Custom Hooks**: Business logic encapsulated in hooks (`useVacationCalculator`, `useHolidays`, `useLocalStorage`, `useAuth`)

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
**Decision**: Use ISO week numbers to determine RDO Fridays, enforced to "odd-fridays" pattern for JPL.

**Rationale**:
- ISO weeks provide a consistent, internationally-recognized standard
- Week numbering starts on Monday, which aligns well with the 9/80 two-week cycle
- Provides predictable, reproducible results
- **JPL Standard**: JPL uses the "odd-fridays" RDO pattern organization-wide

**Implementation** ([src/utils/workScheduleUtils.ts:21-34](src/utils/workScheduleUtils.ts#L21-L34)):
- Calculate ISO week number for any Friday
- Odd-week pattern: RDO on odd-numbered weeks (JPL standard)
- Pattern is automatically set when selecting 9/80 schedule (no user choice)
- **Data Migration** (commit b189b88): Existing profiles with "even-fridays" are automatically converted to "odd-fridays" to match JPL policy

### Vacation Hour Calculation
**Decision**: Automatically calculate vacation hours based on workdays only.

**What's Excluded**:
- Weekends (Saturday/Sunday)
- RDO Fridays (for 9/80 schedules)
- Federal and JPL holidays

**Why**: Users shouldn't need to "spend" vacation hours on days they wouldn't work anyway.

## Calendar Interface

### Multi-Month Calendar Views
**Decision**: Provide multiple calendar view options (1, 2, 6, or 12 months).

**Rationale**:
- Single month: Focused view for detailed planning
- Two months (default on desktop): Balance between overview and detail
- Six months: Mid-range planning view
- **Twelve months** (commit 3fd5782): Full year overview for long-term planning

**Implementation** ([src/components/Calendar/CalendarView.tsx](src/components/Calendar/CalendarView.tsx)):
- View controls allow switching between 1, 2, 6, and 12-month views
- Responsive layout: 3 columns on desktop, 2 on tablet, 1 on mobile
- Compact tile size for multi-month views to fit more information

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
**Decision**: Vacation accrues continuously throughout the year, calculated weekly.

**Implementation** ([src/utils/accrualCalculator.ts](src/utils/accrualCalculator.ts)):
- Calculate accrual rate based on years of service as of the accrual period
- Rates change immediately when service milestones are reached (3, 8 years)
- **Anniversary Boundary Handling** (commit 8796afa): When an anniversary occurs within a week, the higher accrual rate applies to the entire week to ensure the milestone is properly captured
- Weekly accrual calculated from monthly rate: `(monthlyRate / daysPerMonth) * 7`
- Uses 365.25 days per year to account for leap years

### Personal Day Feature
**Decision**: Implement JPL's 8-hour annual Personal Day with year-end rollover.

**How It Works** (commits 1892275, 97f7ba5, 7d81108, 290de29, e942c57):
- Each employee receives one 8-hour Personal Day per calendar year
- Can be applied to any vacation to reduce vacation hour cost by 8 hours
- **Rollover Logic**: If unused by December 31, automatically adds 8 hours to vacation balance
- **Visual Indicator**: Calendar shows 'P' marker on first day of vacation using Personal Day
- **User Control** (commit e942c57): Checkbox in profile setup to indicate if Personal Day was already used in the starting year (prevents double-counting on rollover)

**Implementation** ([src/utils/balanceCalculator.ts](src/utils/balanceCalculator.ts)):
- Track Personal Day usage via `personalDayUsed` flag on PlannedVacation
- Year-end calculation checks if any vacation in that year used Personal Day
- If unused, add 8 hours to accrued balance on December 31
- VacationEditModal allows toggling Personal Day usage per vacation

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
  "version": "1.1",
  "lastUpdated": "2025-12-18",
  "holidays": {
    "2025": [...],
    "2026": [...],
    "2027": [...],
    "2028": [...]
  }
}
```

**Holiday Types**:
- `federal`: Standard federal holidays
- `jpl`: JPL-specific holidays (Day After Thanksgiving, Christmas Eve, Floating holidays)

### Schedule-Specific Holidays
**Decision**: Filter holidays based on work schedule type (commit 676fc12).

**Rationale**:
- 5/40 employees get additional compensation holidays not available to 9/80 employees
- Prevents incorrect hour calculations for users on different schedules

**Implementation** ([src/utils/holidayLoader.ts](src/utils/holidayLoader.ts)):
- Each holiday entry can specify `scheduleFilter`:
  - `'All'`: Available to both 5/40 and 9/80 (default)
  - `'5/40-only'`: Only for 5/40 employees
  - `'9/80-only'`: Only for 9/80 employees
- Holiday loader filters based on user's work schedule
- Hours calculated based on schedule (8 hours for 5/40, 9 hours for 9/80)

### Holiday Data Versioning and Sync
**Decision**: Version holiday data to trigger refresh when updated (commit 9baa0cb).

**Problem Solved**:
- Returning users with cached holiday data wouldn't see new holidays
- Schedule changes didn't trigger holiday hour recalculation

**Solution** ([src/App.tsx](src/App.tsx)):
- Holiday data includes version number
- App checks stored version against current version
- If mismatch detected, force refresh of holidays
- Also refreshes holidays if work schedule type changes
- Ensures all users get updated holiday information without clearing all data

**Current Coverage**: Holidays defined for 2025-2028

## Data Persistence

### LocalStorage Schema
**Keys**:
- `jpl-vacation-user-profile`: User configuration
- `jpl-vacation-planned-vacations`: Array of planned vacation objects
- `jpl-vacation-holidays`: Cached holiday data with version tracking

**Format**:
```typescript
// UserProfile
{
  startDate: "2020-01-15",
  currentBalance: 120,
  balanceAsOfDate: "2025-12-15",
  workSchedule: {
    type: "9/80",
    rdoPattern: "odd-fridays"  // Always "odd-fridays" for 9/80
  },
  personalDayUsedInStartYear?: true  // If Personal Day already used at balanceAsOfDate
}

// PlannedVacation
{
  id: "uuid",
  startDate: "2026-06-15",
  endDate: "2026-06-19",
  description?: "Summer vacation",
  personalDayUsed?: true  // If this vacation uses the 8-hour Personal Day
  // Note: hours calculated dynamically, not stored
}
```

### Cloud Sync (Optional)
**Decision**: Optional Firebase integration for cross-device synchronization (commit 32a45a5).

**Features**:
- Google sign-in authentication
- Automatic sync of profile and vacation data
- Seamless transition between devices
- Falls back gracefully if Firebase not configured
- Data remains in localStorage even with cloud sync enabled

**User Flow** (commit dc89755):
- **WelcomeScreen**: New users choose "Get Started" or existing users "Sign in with Google"
- **LoadingScreen**: Shows during authentication and initial sync
- **Sync Indicator**: Shows sync status in app header when enabled

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
1. **Timezone handling**: Test in Pacific, Eastern, UTC timezones (especially around DST transitions)
2. **Saturday balances**: Ensure Saturday shows correct balance, not blank
3. **RDO calculation**: Verify odd-Friday pattern across year boundaries for 9/80 schedules
4. **Accrual transitions**: Test when years of service crosses 3-year or 8-year thresholds
5. **Anniversary boundaries**: Ensure weeks containing anniversaries get correct accrual rate
6. **Month boundaries**: Verify calendar tiles hide/show correctly at month edges
7. **Negative balance**: Try to create vacation that exceeds available balance
8. **Personal Day**:
   - Apply Personal Day to vacation, verify 8-hour reduction
   - Verify only one Personal Day can be used per year
   - Test year-end rollover (unused Personal Day adds 8 hours on Dec 31)
   - Test "already used" checkbox prevents double-counting
9. **Schedule-specific holidays**: Verify 5/40 and 9/80 employees see correct holidays
10. **Holiday versioning**: Update holiday version and verify existing users get new data
11. **Data migration**: Test that old profiles auto-migrate (e.g., even-fridays → odd-fridays)
12. **Multi-month views**: Test 1, 2, 6, and 12-month calendar views on various screen sizes

## Key Files Reference

### Core Utilities
- [src/utils/dateUtils.ts](src/utils/dateUtils.ts) - Date formatting and parsing (LOCAL TIME ONLY!)
- [src/utils/workScheduleUtils.ts](src/utils/workScheduleUtils.ts) - RDO calculation and work hours
- [src/utils/accrualCalculator.ts](src/utils/accrualCalculator.ts) - Continuous accrual logic with anniversary handling
- [src/utils/balanceCalculator.ts](src/utils/balanceCalculator.ts) - Week-by-week balance projection with Personal Day rollover
- [src/utils/calendarDataMapper.ts](src/utils/calendarDataMapper.ts) - Maps weekly data to daily calendar tiles
- [src/utils/holidayLoader.ts](src/utils/holidayLoader.ts) - Schedule-aware holiday filtering

### Components
- [src/components/WelcomeScreen/WelcomeScreen.tsx](src/components/WelcomeScreen/WelcomeScreen.tsx) - Initial user entry point
- [src/components/UserInputForm/UserInputForm.tsx](src/components/UserInputForm/UserInputForm.tsx) - Profile setup with Personal Day option
- [src/components/Calendar/CalendarView.tsx](src/components/Calendar/CalendarView.tsx) - Multi-month interactive calendar
- [src/components/Calendar/VacationEditModal.tsx](src/components/Calendar/VacationEditModal.tsx) - Vacation editor with Personal Day toggle
- [src/components/Calendar/CalendarLegend.tsx](src/components/Calendar/CalendarLegend.tsx) - Legend including 'P' indicator

### Data & Configuration
- [src/data/holidays.json](src/data/holidays.json) - Holiday definitions for 2025-2028
- [src/types/index.ts](src/types/index.ts) - TypeScript interfaces including Personal Day fields

### Hooks
- [src/hooks/useVacationCalculator.ts](src/hooks/useVacationCalculator.ts) - Main calculation hook with data migration logic
- [src/hooks/useAuth.ts](src/hooks/useAuth.ts) - Google authentication for cloud sync

## Lessons Learned

1. **Timezone bugs are subtle**: Always test date handling in multiple timezones, especially around boundaries and DST transitions
2. **Local time is simpler**: For date-only operations, local time components are more intuitive than UTC
3. **Visual feedback matters**: Hover previews, selection states, and visual indicators (like 'P' for Personal Day) make the interface more predictable
4. **Validation upfront**: Block invalid actions rather than allowing them and showing errors afterward
5. **Co-location works**: Keeping related files together (component + CSS) improves maintainability
6. **Data migration is critical**: When changing data schemas or business rules (like RDO patterns), implement automatic migration to avoid breaking existing users
7. **Versioning enables updates**: Holiday data versioning allows pushing updates to existing users without forcing a full reset
8. **Boundary conditions matter**: Anniversary dates, year-end rollovers, and week boundaries need special handling to ensure accurate calculations
9. **User onboarding sets the tone**: WelcomeScreen provides clear entry points for new vs. returning users
10. **Optional features should degrade gracefully**: Cloud sync works when available but doesn't prevent app usage when unavailable
