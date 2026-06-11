# Phase 8: Data & Impact Visualization

## Goal
Users see their carbon impact through interactive charts and real-time statistics.

## Success Criteria
1. Carbon reduction trend line chart with daily/weekly/monthly data
2. Category breakdown doughnut chart
3. Campus comparison bar chart (桑浦山 vs 东海岸)
4. Homepage animated number counters pulling real API data
5. All chart data updates on time period filter change (week/month/all)

## Implementation Plan

### Step 1: Backend — Extend carbon-stats API
- Add `period` query param (week/month/all) filtering carbon_records by created_at
- Add `trend` response: daily aggregated carbon data for line chart
- Add `campus` scope: campus-level carbon comparison via listings join
- Keep backward compatible with existing responses

### Step 2: Frontend — Chart.js vendor
- Add Chart.js 4.x CDN script to index.html (before other scripts)
- No build step needed; Chart.js auto-registers

### Step 3: Frontend — api-adapter update
- Add `fetchCarbonTrend(period)` function
- Support period parameter in dashboard call

### Step 4: Frontend — charts.js module
- Create `new-site/public/assets/charts.js`
- Export Vue components: TrendChart, CategoryDoughnut, CampusBar
- Each wraps a Chart.js instance with proper lifecycle (create/destroy)

### Step 5: Frontend — Rewrite impact.js
- Add period filter tabs (本周/本月/全部)
- Replace CSS bars with CategoryDoughnut
- Add TrendChart (line) at top
- Add CampusBar comparison chart
- Keep leaderboard and recent activity sections
- Fetch data from API with period param; fallback to local data

### Step 6: Frontend — Animated counters on home.js
- Create AnimatedCounter directive/component
- Apply to the 4 stat cards (desktop + mobile)
- Animate from 0 → target value on mount with requestAnimationFrame
- Format with appropriate precision

### Step 7: Update state tracking
- Update STATE.md: Phase 8 complete
- Update ROADMAP.md: mark Phase 8 done

## Files Changed
- `netlify/functions/carbon-stats.mjs` — period filter, trend, campus comparison
- `new-site/public/index.html` — Chart.js script
- `new-site/public/assets/api-adapter.js` — fetchCarbonTrend
- `new-site/public/assets/charts.js` — NEW: chart wrapper components
- `new-site/public/assets/pages/impact.js` — rewrite with charts
- `new-site/public/assets/pages/home.js` — animated counters
- `.planning/STATE.md` — progress update
- `.planning/ROADMAP.md` — progress update

## Risks
- Chart.js bundle size (~200KB) — acceptable for feature value
- Turso query performance on date range — use indexed created_at column
- Mobile chart rendering — Chart.js responsive option handles this
