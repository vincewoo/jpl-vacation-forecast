# Bolt's Journal

## 2024-05-23 - Date Utils Optimization
**Learning:** `formatDate` and `parseDate` are hot paths in the application, called inside loops (e.g., `mapWeeklyBalancesToDays`) and render methods (`CalendarView` tile rendering). Optimizing these functions to avoid unnecessary array allocations (`split`, `map`) and string padding (`padStart`) yields significant gains (~30-40% faster execution for these functions).
**Action:** When working with frequent date conversions, especially in render loops or data mapping, prefer manual string construction/parsing over built-in methods that allocate arrays if performance is a bottleneck.

## 2024-05-23 - Calendar Data Mapper Discrepancy
**Learning:** The memory stated that `mapWeeklyBalancesToDays` used a Sweep Line algorithm, but the code actually used an O(N*M) `.find()` inside the loop. Always verify code state against documentation/memory.
**Action:** Implemented the Sweep Line algorithm (sorting vacations by start date and maintaining an active set), reducing complexity to O(N + M).
