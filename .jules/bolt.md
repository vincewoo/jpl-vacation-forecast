# Bolt's Journal

## 2024-05-23 - Date Utils Optimization
**Learning:** `formatDate` and `parseDate` are hot paths in the application, called inside loops (e.g., `mapWeeklyBalancesToDays`) and render methods (`CalendarView` tile rendering). Optimizing these functions to avoid unnecessary array allocations (`split`, `map`) and string padding (`padStart`) yields significant gains (~30-40% faster execution for these functions).
**Action:** When working with frequent date conversions, especially in render loops or data mapping, prefer manual string construction/parsing over built-in methods that allocate arrays if performance is a bottleneck.

## 2025-01-28 - Work Schedule Iteration Optimization
**Learning:** `getRDODatesInRange` was iterating every day in a range (O(N)) to check for Fridays. For long forecasts (10 years), this resulted in ~3650 iterations. Optimizing it to jump directly to the next Friday and iterate by 7 days (O(N/7)) improved performance by ~3.6x for large ranges and ~2.6x for repetitive small ranges.
**Action:** When iterating dates to find specific weekdays (e.g., "all Fridays"), always calculate the first occurrence and jump by 7 days instead of iterating day-by-day.
