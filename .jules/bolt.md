# Bolt's Journal

## 2024-05-23 - Date Utils Optimization
**Learning:** `formatDate` and `parseDate` are hot paths in the application, called inside loops (e.g., `mapWeeklyBalancesToDays`) and render methods (`CalendarView` tile rendering). Optimizing these functions to avoid unnecessary array allocations (`split`, `map`) and string padding (`padStart`) yields significant gains (~30-40% faster execution for these functions).
**Action:** When working with frequent date conversions, especially in render loops or data mapping, prefer manual string construction/parsing over built-in methods that allocate arrays if performance is a bottleneck.

## 2026-01-20 - Week Stride Optimization
**Learning:** When iterating through dates to find a specific day of the week (e.g., Fridays) over a large range, iterating day-by-day is inefficient (O(N)). Calculating the first occurrence and then "striding" by 7 days reduces the complexity to O(N/7), which is significantly faster for long date ranges (e.g., ~5x speedup verified).
**Action:** Identify loops that search for weekly recurring events and optimize them to skip non-matching days using modulo arithmetic to find the first match and then incrementing by 7.
