# JPL Vacation Forecast

A web application for forecasting vacation hours at JPL (Jet Propulsion Laboratory). Track your vacation balance week-by-week with automatic accrual calculations based on years of service, plan future vacations, and ensure you never run out of vacation hours.

## Features

- **Smart Accrual Calculation**: Automatically calculates vacation accrual based on JPL's tiered system:
  - Years 0-3: 10 hours/month
  - Years 4-8: 12 hours/month
  - Years 9+: 14 hours/month
  - Continuous accrual throughout the year (calculated weekly)
  - Automatic rate adjustment when crossing service milestones

- **Work Schedule Support**:
  - **5/40 schedule**: Five 8-hour days per week with schedule-specific holidays
  - **9/80 schedule**: Nine 9-hour days + one 8-hour day over 2 weeks, with odd-Friday RDOs
    - RDO pattern automatically set to JPL standard (odd-numbered ISO weeks)

- **Personal Day Management**:
  - 8-hour annual Personal Day that can be applied to any vacation
  - Reduces vacation cost by 8 hours when used
  - Automatic rollover: unused Personal Day adds 8 hours to balance on December 31
  - Visual 'P' indicator on calendar for vacations using Personal Day
  - Option to mark if Personal Day already used in starting year

- **Interactive Calendar View**:
  - **Multiple view options**: 1-month, 2-month, 6-month, or 12-month view
  - Visual calendar interface for planning vacations
  - Two-click selection with hover preview
  - Edit existing vacations by clicking on them
  - Color-coded tiles for vacations, holidays, RDOs, and weekends
  - Real-time balance display on each day
  - Comprehensive legend showing all day types

- **Vacation Planning**:
  - Add, edit, and delete planned vacations
  - Automatic hour calculation based on work schedule
  - Validation to prevent negative balance
  - Smart exclusion of weekends, holidays, and RDOs
  - Apply Personal Day to reduce vacation hours

- **Balance Tracking**:
  - Week-by-week balance forecast
  - Annual summaries with totals
  - Visual indicators for current week and negative balances
  - Toggle between recent weeks and full forecast
  - Personal Day rollover tracking

- **Data Persistence**:
  - All data saved in browser localStorage
  - **Optional cloud sync**: Sign in with Google to sync data across devices
  - Seamless transition between local-only and cloud-synced modes

- **Welcome Screen**:
  - Clear entry point for new users to get started
  - Existing users can sign in to sync their data
  - Graceful handling when cloud sync is unavailable

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd jpl-vacation-forecast
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview  # Preview the production build
```

### Deploying to GitHub Pages

This project is configured to deploy to GitHub Pages using the `gh-pages` package.

1. **Prerequisites**:
   - Ensure you have a GitHub repository set up for this project
   - The `homepage` field in [package.json](package.json) should match your GitHub Pages URL:
     ```json
     "homepage": "https://yourusername.github.io/jpl-vacation-forecast"
     ```

2. **Deploy**:
   ```bash
   npm run deploy
   ```

   This command will:
   - Build the production bundle (`npm run build`)
   - Deploy the `dist` folder to the `gh-pages` branch
   - Push to GitHub

3. **Configure GitHub Pages** (first-time setup):
   - Go to your repository settings on GitHub
   - Navigate to **Settings > Pages**
   - Under "Source", select the `gh-pages` branch
   - Click Save
   - Your site will be live at the URL specified in `homepage` within a few minutes

4. **Subsequent deployments**:
   - Simply run `npm run deploy` to update the live site
   - Changes will be live within a few minutes

## Usage

### Getting Started

1. **Welcome Screen**:
   - **New User**: Click "Get Started" to set up your profile with local storage only
   - **Existing User**: Click "Sign in with Google" to sync your data across devices

2. **Profile Setup** (for new users):
   - **JPL Start Date**: Enter your start date at JPL (determines accrual rate)
   - **Current Vacation Balance**: Enter your current balance including any carryover
   - **Balance As Of Date**: The date when you checked your balance (defaults to today)
   - **Work Schedule**: Select either 5/40 or 9/80
     - 9/80 schedule automatically uses odd-Friday RDO pattern (JPL standard)
   - **Personal Day**: Check if you've already used your Personal Day this year

3. Click "Start Forecasting" to save your profile

### Planning Vacations

**Option 1: Calendar Selection** (Recommended)
1. Click on a start date in the calendar
2. Hover over dates to preview your selection
3. Click on an end date to complete the selection
4. A modal will appear where you can:
   - Add a description (optional)
   - Toggle "Use Personal Day" to apply your 8-hour Personal Day (one per year)
   - See the calculated vacation hours required
5. Click "Add Vacation" to save

**Option 2: Vacation Planner Form**
1. Click "Add Vacation" in the Vacation Planner section
2. Select start and end dates
3. Optionally add a description and apply Personal Day
4. The app will automatically calculate required hours
5. If you don't have enough hours by that date, you'll see an error message
6. Click "Add Vacation" to save

**Editing Vacations**:
- Click on any vacation day in the calendar to open the edit modal
- Modify dates, description, or Personal Day usage
- Delete the vacation if needed

### Viewing Balance Forecast

- **Calendar Views**: Switch between 1, 2, 6, or 12-month views using the view controls
- **Balance Display**: Each Saturday shows your projected balance for that week
- **Annual Summary**: View year-end projections at the top of the Balance Tracker
  - Shows total accrued hours including Personal Day rollover
- **Weekly Table**: See week-by-week breakdown of accrual and usage
  - Green numbers show accrual
  - Red numbers show usage
  - Current week is highlighted in blue
  - Weeks with negative balance are highlighted in red
- **Legend**: Reference the calendar legend for color meanings
  - 'P' indicates first day of vacation using Personal Day

### Managing Data

- **Reset Profile**: Click the "Reset Profile" button in the header to start over
- **Cloud Sync** (if enabled): Sign in with Google to sync across devices
  - Sync status indicator shows in the header
  - Data syncs automatically when signed in
- All data is saved automatically (locally or to cloud)

## JPL-Specific Rules

### Accrual Rates

Vacation hours accrue continuously throughout the year based on years of service:
- 0-3 years: 10 hours per month (approximately 2.3 hours per week)
- 4-8 years: 12 hours per month (approximately 2.8 hours per week)
- 9+ years: 14 hours per month (approximately 3.2 hours per week)

Accrual rates automatically adjust when you cross service milestones (3-year and 8-year anniversaries).

### Personal Day

Each JPL employee receives one 8-hour Personal Day per calendar year:
- Can be applied to any vacation to reduce the vacation hour cost by 8 hours
- **Only one Personal Day can be used per calendar year**
- **Rollover**: If unused by December 31, automatically adds 8 hours to your vacation balance
- When setting up your profile, you can indicate if you already used your Personal Day this year

### Work Schedules

**5/40 Schedule**:
- 5 days per week, 8 hours per day
- Standard Monday-Friday workweek
- Includes schedule-specific compensation holidays

**9/80 Schedule**:
- 9-hour days Monday-Thursday
- Alternating Fridays: 8 hours or RDO (Regular Day Off)
- Total of 80 hours over 2 weeks
- **RDO pattern**: Odd-numbered ISO weeks (JPL standard)
  - This means Fridays in odd-numbered weeks are RDOs
  - The app automatically calculates which Fridays are RDOs

### Holidays

The app comes pre-configured with JPL holidays for 2025-2028, including:
- **Federal holidays**: New Year's Day, MLK Jr. Day, Presidents' Day, Memorial Day, Juneteenth, Independence Day, Labor Day, Indigenous Peoples' Day, Veterans Day, Thanksgiving, Christmas
- **JPL-specific holidays**: Day After Thanksgiving, Christmas Eve, floating holidays

**Schedule-Specific Filtering**:
- 5/40 employees see additional compensation holidays not available to 9/80 employees
- Holiday hours are automatically calculated based on your work schedule (8 hours for 5/40, 9 hours for 9/80)
- Holidays are excluded from vacation hour calculations

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **CSS** for styling
- **localStorage** for local data persistence
- **Firebase** (optional) for cloud sync and authentication
- **react-calendar** for calendar UI component

## Project Structure

```
src/
├── components/          # React components
│   ├── WelcomeScreen/   # Initial user entry point
│   ├── LoadingScreen/   # Loading state during auth/sync
│   ├── UserInputForm/   # Initial profile setup
│   ├── VacationPlanner/ # Vacation management (list view)
│   ├── Calendar/        # Interactive calendar interface
│   │   ├── CalendarView.tsx        # Main calendar component (multi-month views)
│   │   ├── CalendarTile.tsx        # Individual day tiles
│   │   ├── CalendarLegend.tsx      # Legend with day type indicators
│   │   ├── VacationEditModal.tsx   # Edit vacation modal
│   │   └── Calendar.css            # Calendar styling
│   ├── BalanceTracker/  # Balance display and summaries
│   └── CloudSync/       # Google authentication and sync
├── hooks/               # Custom React hooks
│   ├── useLocalStorage.ts
│   ├── useVacationCalculator.ts  # Main calculator with data migration
│   ├── useHolidays.ts
│   └── useAuth.ts                # Google authentication
├── utils/               # Business logic
│   ├── accrualCalculator.ts    # Continuous accrual with anniversary handling
│   ├── balanceCalculator.ts    # Week-by-week projections with Personal Day rollover
│   ├── dateUtils.ts            # Date formatting/parsing (local time)
│   ├── workScheduleUtils.ts    # RDO and work hours
│   ├── holidayLoader.ts        # Schedule-aware holiday filtering
│   └── calendarDataMapper.ts   # Map weekly data to daily tiles
├── data/                # Static data
│   └── holidays.json    # Holiday definitions (2025-2028)
├── types/               # TypeScript interfaces
├── constants/           # JPL-specific constants
└── App.tsx             # Main application
```

## Recent Improvements

### Major Features Added
- **Personal Day Management** (Dec 2025): Full implementation of JPL's 8-hour Personal Day with automatic rollover
- **12-Month Calendar View** (Dec 2025): Added ability to view full year for long-term planning
- **Welcome Screen** (Dec 2025): New user onboarding flow with options for new vs. existing users
- **Cloud Sync** (Dec 2025): Optional Google sign-in for cross-device data synchronization
- **Schedule-Specific Holidays** (Dec 2025): Different holiday sets for 5/40 vs. 9/80 employees
- **RDO Pattern Enforcement** (Dec 2025): Standardized to JPL's odd-Friday pattern for 9/80 schedules

### Bug Fixes
- **Anniversary boundary handling** (Dec 2025): Fixed accrual rate calculation when anniversaries occur mid-week
- **Holiday data versioning** (Dec 2025): Implemented version checking to ensure returning users get updated holidays
- **Timezone-related vacation styling** (Dec 2025): Fixed issue where last day of vacation wasn't styled correctly
- **Saturday balance display**: Resolved timezone issue where users in timezones behind UTC would not see Saturday balances
- **Calendar tile layout**: Corrected overlapping between date numbers and balance display

### Enhancements
- Extended holiday data through 2028 (including 2025)
- Improved calendar month boundary handling
- Added 6-month calendar view option
- Enhanced visual feedback during vacation selection
- Added 'P' indicator for Personal Day usage in calendar legend
- Automatic data migration for profile schema changes

## Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Safari, Edge) that support:
- ES2020 JavaScript features
- localStorage
- CSS Grid

## Documentation

- [README.md](README.md) - This file, user-facing documentation
- [CLAUDE.md](CLAUDE.md) - Design decisions, architectural choices, and implementation notes for developers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Before making changes, please review [CLAUDE.md](CLAUDE.md) to understand key design decisions and implementation patterns.