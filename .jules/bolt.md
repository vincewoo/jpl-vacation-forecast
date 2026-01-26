# Bolt's Journal

## 2024-05-23 - Date Utils Optimization
**Learning:** `formatDate` and `parseDate` are hot paths in the application, called inside loops (e.g., `mapWeeklyBalancesToDays`) and render methods (`CalendarView` tile rendering). Optimizing these functions to avoid unnecessary array allocations (`split`, `map`) and string padding (`padStart`) yields significant gains (~30-40% faster execution for these functions).
**Action:** When working with frequent date conversions, especially in render loops or data mapping, prefer manual string construction/parsing over built-in methods that allocate arrays if performance is a bottleneck.

## 2025-01-27 - Integer Date Optimization
**Learning:** Replacing string-based date comparisons (using `formatDate` and `Set<string>`) with integer-based comparisons (YYYYMMDD using `Set<number>`) in tight date loops (`calculateVacationHoursForRange`) reduced execution time by ~40% (74ms -> 42ms for 100k iterations).
**Action:** Use `dateToInteger` and `Set<number>` for date lookups inside frequent loops instead of string formatting.
