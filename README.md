# JPL Vacation Forecast

A web application for forecasting vacation hours at JPL (Jet Propulsion Laboratory). Track your vacation balance week-by-week with automatic accrual calculations based on years of service, plan future vacations, and ensure you never run out of vacation hours.

## Features

- **Smart Accrual Calculation**: Automatically calculates vacation accrual based on JPL's tiered system:
  - Years 0-3: 10 hours/month
  - Years 4-8: 12 hours/month
  - Years 9+: 14 hours/month

- **Work Schedule Support**:
  - 5/40 schedule (five 8-hour days per week)
  - 9/80 schedule (nine 9-hour days + one 8-hour day over 2 weeks, with alternating Friday off)

- **Interactive Calendar View**:
  - Visual calendar interface for planning vacations
  - Two-click selection with hover preview
  - Edit existing vacations by clicking on them
  - Double-month view on larger screens
  - Color-coded tiles for vacations, holidays, RDOs, and weekends
  - Real-time balance display on each day

- **Vacation Planning**:
  - Add, edit, and delete planned vacations
  - Automatic hour calculation based on work schedule
  - Validation to prevent negative balance
  - Smart exclusion of weekends, holidays, and RDOs

- **Balance Tracking**:
  - Week-by-week balance forecast
  - Annual summaries with totals
  - Visual indicators for current week and negative balances
  - Toggle between recent weeks and full forecast

- **Data Persistence**: All data saved in browser localStorage

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

## Usage

### Initial Setup

1. When you first open the app, you'll be prompted to set up your profile:
   - **JPL Start Date**: Enter your start date at JPL (determines accrual rate)
   - **Current Vacation Balance**: Enter your current balance including any carryover
   - **Work Schedule**: Select either 5/40 or 9/80
   - **RDO Pattern** (for 9/80 only): Choose which Fridays are your regular days off

2. Click "Start Forecasting" to save your profile

### Planning Vacations

1. Click "Add Vacation" in the Vacation Planner section
2. Select start and end dates
3. Optionally add a description (e.g., "Summer vacation")
4. The app will automatically calculate required hours
5. If you don't have enough hours by that date, you'll see an error message
6. Click "Add Vacation" to save

### Viewing Balance Forecast

- **Annual Summary**: View year-end projections at the top of the Balance Tracker
- **Weekly Table**: See week-by-week breakdown of accrual and usage
  - Green numbers show accrual
  - Red numbers show usage
  - Current week is highlighted in blue
  - Weeks with negative balance are highlighted in red

### Managing Data

- **Reset Profile**: Click the "Reset Profile" button in the header to start over
- **Edit Vacation**: Click "Delete" on any vacation entry to remove it
- All data is saved automatically in your browser

## JPL-Specific Rules

### Accrual Rates

Vacation hours accrue monthly based on years of service:
- 0-3 years: 10 hours per month
- 4-8 years: 12 hours per month
- 9+ years: 14 hours per month

### Work Schedules

**5/40 Schedule**:
- 5 days per week, 8 hours per day
- Standard Monday-Friday workweek

**9/80 Schedule**:
- 9-hour days Monday-Thursday
- Alternating Fridays: 8 hours or RDO (Regular Day Off)
- Total of 80 hours over 2 weeks
- RDO pattern based on ISO week numbers (even or odd)

### Holidays

The app comes pre-configured with JPL holidays for 2026-2030, including:
- Federal holidays (New Year's Day, MLK Jr. Day, Presidents' Day, Memorial Day, Juneteenth, Independence Day, Labor Day, Indigenous Peoples' Day, Veterans Day, Thanksgiving, Christmas)
- JPL-specific holidays (Day After Thanksgiving, Christmas Eve, floating holidays)

Holiday hours are automatically calculated based on your work schedule and excluded from vacation hour calculations.

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **CSS** for styling
- **localStorage** for data persistence

## Project Structure

```
src/
├── components/          # React components
│   ├── UserInputForm/   # Initial profile setup
│   ├── VacationPlanner/ # Vacation management (list view)
│   ├── Calendar/        # Interactive calendar interface
│   │   ├── CalendarView.tsx        # Main calendar component
│   │   ├── CalendarTile.tsx        # Individual day tiles
│   │   ├── VacationEditModal.tsx   # Edit vacation modal
│   │   └── Calendar.css            # Calendar styling
│   └── BalanceTracker/  # Balance display and summaries
├── hooks/               # Custom React hooks
│   ├── useLocalStorage.ts
│   ├── useVacationCalculator.ts
│   └── useHolidays.ts
├── utils/               # Business logic
│   ├── accrualCalculator.ts    # Monthly accrual calculations
│   ├── balanceCalculator.ts    # Week-by-week projections
│   ├── dateUtils.ts            # Date formatting/parsing (local time)
│   ├── workScheduleUtils.ts    # RDO and work hours
│   └── calendarDataMapper.ts   # Map weekly data to daily tiles
├── data/                # Static data
│   └── holidays.json    # Holiday definitions (2026-2030)
├── types/               # TypeScript interfaces
├── constants/           # JPL-specific constants
└── App.tsx             # Main application
```

## Recent Improvements

### Bug Fixes
- **Fixed Saturday balance display**: Resolved timezone issue where users in timezones behind UTC (e.g., Pacific Time) would not see their Saturday balances in the calendar. Updated date handling to use local time components instead of UTC.
- **Fixed calendar tile layout**: Corrected overlapping issue between date numbers and balance display by implementing proper absolute positioning within calendar tiles.

### Enhancements
- Extended holiday data through 2030
- Improved calendar month boundary handling
- Added responsive double-month calendar view for larger screens
- Enhanced visual feedback during vacation selection

## Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Safari, Edge) that support:
- ES2020 JavaScript features
- localStorage
- CSS Grid

## Documentation

- [README.md](README.md) - This file, user-facing documentation
- [CLAUDE.md](CLAUDE.md) - Design decisions, architectural choices, and implementation notes for developers

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Before making changes, please review [CLAUDE.md](CLAUDE.md) to understand key design decisions and implementation patterns.