# Bolt's Journal

## 2024-05-23 - Date Utils Optimization
**Learning:** `formatDate` and `parseDate` are hot paths in the application, called inside loops (e.g., `mapWeeklyBalancesToDays`) and render methods (`CalendarView` tile rendering). Optimizing these functions to avoid unnecessary array allocations (`split`, `map`) and string padding (`padStart`) yields significant gains (~30-40% faster execution for these functions).
**Action:** When working with frequent date conversions, especially in render loops or data mapping, prefer manual string construction/parsing over built-in methods that allocate arrays if performance is a bottleneck.

## 2024-05-24 - Calendar Grid Optimization
**Learning:** `react-calendar` invokes `tileClassName` and `tileContent` callbacks for every tile on every render. Complex logic or object allocation (like `new Date()`) inside these callbacks creates significant GC pressure, especially when hovering or interacting.
**Action:** Memoize boundary calculations (e.g., month start/end timestamps) outside the render loop or using a cache. Use numeric timestamp comparisons instead of creating Date objects for simple range checks in these hot paths.
