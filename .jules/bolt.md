# Bolt's Journal

## 2024-05-23 - Date Utils Optimization
**Learning:** `formatDate` and `parseDate` are hot paths in the application, called inside loops (e.g., `mapWeeklyBalancesToDays`) and render methods (`CalendarView` tile rendering). Optimizing these functions to avoid unnecessary array allocations (`split`, `map`) and string padding (`padStart`) yields significant gains (~30-40% faster execution for these functions).
**Action:** When working with frequent date conversions, especially in render loops or data mapping, prefer manual string construction/parsing over built-in methods that allocate arrays if performance is a bottleneck.

## 2026-01-24 - Integer Date Optimization
**Learning:** Replacing string-based date comparisons (YYYY-MM-DD) with integer comparisons (YYYYMMDD) in hot loops (like vacation recommendation calculations) avoids string allocation overhead and speeds up execution by ~12%.
**Action:** For performance-critical date logic involving heavy iteration, convert dates to integers (YYYYMMDD) once and use integer sets for lookups instead of string sets.
