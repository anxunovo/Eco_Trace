# Milestone v2.0 — Complete

**Project:** 碳循校园 EcoTrace
**Completed:** 2026-05-08
**Commit:** 3cbea00

## What Changed

### Phase 8: Data & Impact Visualization
- **carbon-stats API** — period filter (week/month/all), daily trend aggregation, campus comparison via listings join
- **Chart.js 4.x** — loaded via CDN, no build step
- **charts.js** — 3 reusable Vue components (TrendChart, CategoryDoughnut, CampusBar) with proper Chart.js lifecycle
- **Impact page** — trend line chart, category doughnut, campus bar chart, period filter tabs, existing leaderboard/recent preserved
- **Homepage** — AnimatedNumber component with ease-out cubic rAF animation on all stat cards (desktop + mobile)

### Phase 9: PWA Foundation
- **manifest.json** — standalone, theme_color #3f9451, SVG icons, zh-CN
- **sw.js** — precaches 27 static files, network-first for API/CDN, cache-first for static, old cache cleanup
- **offline-db.js** — IndexedDB wrapper: cacheListings, cacheDashboard, getCachedListings, getCachedDashboard
- **index.html** — manifest link, theme-color meta, apple-mobile-web-app meta, SVG favicon, SW registration
- **netlify.toml** — no-cache for sw.js, 1hr for manifest.json

## UAT Results
- Phase 8: 5/5 criteria PASS
- Phase 9: 3/4 PASS (iOS SVG icon limitation — cosmetic only)
- 0 blocking issues, 2 minor cosmetic items documented

## Deployment
- Pushed to master: `3cbea00`
- Netlify auto-deploy should trigger
- Live at: https://stu-eco-trace.netlify.app

## Backlog (deferred to v2.1)
- Timeline API endpoint (STAT-04)
- Leaderboard page + API (STAT-05)
- Data export CSV/JSON (EXPR-01)
- Social share cards (ENG-01)
- Achievement/badge system (ENG-02)
- QR scan publish (ENG-03)
- Web Push notifications (ENG-04)
