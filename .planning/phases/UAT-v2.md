# UAT — Phase 8 & 9

**Milestone:** v2.0 Real Campus Platform
**Date:** 2026-05-08
**Method:** Code-level verification + static analysis

---

## Phase 8: Data & Impact Visualization

| # | Success Criterion | Status | Evidence |
|---|-------------------|--------|----------|
| SC-1 | Trend line chart with daily data | ✅ PASS | `impact.js:55-71` trendData computed → `charts.js:19-91` TrendChart renders line with gradient fill |
| SC-2 | Category doughnut chart | ✅ PASS | `impact.js:73-96` perCategory computed → `charts.js:93-143` CategoryDoughnut with 7-color palette |
| SC-3 | Campus comparison bar chart | ✅ PASS | `impact.js:99-116` campusData computed → `charts.js:145-202` CampusBar with leaf/sky colors |
| SC-4 | Animated number counters on homepage | ✅ PASS | `home.js:10-50` AnimatedNumber (ease-out cubic rAF) applied to 4 desktop cards + 3 mobile cards |
| SC-5 | Period filter updates all charts | ✅ PASS | `impact.js:36` watch(period, loadData) re-fetches from API with period param |

### Code Quality Checks

| Check | Result | Detail |
|-------|--------|--------|
| SQL injection safety | ✅ | `periodClause()` only returns hardcoded datetime strings; user_id uses `?` param |
| Chart lifecycle (no memory leak) | ✅ | All 3 chart components destroy in `beforeUnmount` + re-render on watch |
| Backward compat (API) | ✅ | `period` param defaults to 'all'; old callers unaffected |
| Backward compat (frontend) | ✅ | `fetchCarbonStats(scope)` still works (period defaults to 'all') |
| Responsive charts | ✅ | `responsive: true, maintainAspectRatio: false` on all Chart.js instances |
| Fallback when API unavailable | ✅ | Trend, category, campus all compute from local state when no API data |

### Issues Found: **None**

---

## Phase 9: PWA Foundation

| # | Success Criterion | Status | Evidence |
|---|-------------------|--------|----------|
| SC-1 | "Add to Home Screen" prompt with icon | ⚠️ PARTIAL | manifest.json valid + icon.svg exists; iOS SVG icon limitation (see below) |
| SC-2 | App loads offline with cached data | ✅ PASS | `sw.js` precaches all static assets; `offline-db.js` stores listings+dashboard in IndexedDB |
| SC-3 | Service Worker caches static assets | ✅ PASS | `sw.js:3-30` precache list of 27 files; install event caches all |
| SC-4 | Manifest with name, icons, theme | ✅ PASS | manifest.json has name, short_name, icons (SVG), theme_color #3f9451, display standalone |

### Code Quality Checks

| Check | Result | Detail |
|-------|--------|--------|
| SW install + activate + fetch | ✅ | All 3 event handlers implemented; old cache cleanup; skipWaiting + clients.claim |
| Fetch strategy correctness | ✅ | Static: cache-first; API: network-first; CDN: network-first with cache fallback |
| SW registration | ✅ | Feature detection + graceful catch; registered on window load |
| IndexedDB transactions | ✅ | Proper readwrite/readonly transactions; error propagation |
| Cache headers | ✅ | netlify.toml: sw.js no-cache, manifest.json 1hr |
| Offline fallback path | ✅ | home.js loadApiData catches fetch error → reads from IndexedDB |

### Issues Found: **2 minor**

**ISSUE-1: iOS apple-touch-icon uses SVG (not supported)**
- **File:** `index.html:16`
- **Impact:** iOS Safari ignores SVG apple-touch-icon; home screen icon may show default
- **Severity:** Low (cosmetic, Android/Chrome works correctly)
- **Fix:** Generate PNG icon and replace SVG reference (requires image tool or build step)

**ISSUE-2: Chart.js CDN not available on first offline visit**
- **File:** `index.html:46` loads from cdn.jsdelivr.net
- **Impact:** Charts won't render on first visit if offline; SW caches after first successful load
- **Severity:** Low (edge case: first visit offline; subsequent offline visits work)
- **Fix:** None needed (acceptable for competition demo; real deployment would bundle Chart.js)

---

## Summary

| Phase | Criteria | Pass | Partial | Fail | Issues |
|-------|----------|------|---------|------|--------|
| 8 — Data & Impact Visualization | 5 | 5 | 0 | 0 | 0 |
| 9 — PWA Foundation | 4 | 3 | 1 | 0 | 2 minor |

**Overall: PASS** — All core functionality verified. 2 cosmetic/edge-case issues documented, both acceptable for competition demo scope.

### Next Steps
1. Deploy to Netlify for live verification
2. Test on Android Chrome for "Add to Home Screen"
3. Test offline mode after first visit
4. (Optional) Generate PNG icons for iOS support
