# Technology Stack — v2.2 Green Impact & Education

**Project:** 碳循校园 EcoTrace
**Researched:** 2026-05-09
**Focus:** Carbon contribution reports, eco knowledge module, carbon footprint calculator

## Current Stack (No Changes Needed)

| Technology | Status | Notes |
|------------|--------|-------|
| Vue 3 ESM (no build) | Keep | All new features are Vue components |
| Netlify Functions | Keep | 3 new endpoints needed |
| Turso libSQL | Keep | Schema extensions + new tables |
| Chart.js 4.x | Keep | Reuse for footprint visualizations |
| html2canvas | Keep | Reuse for report share cards |
| PWA Service Worker | Keep | New pages auto-cached |

## New Stack Additions: None Required

All 3 features are achievable with the existing stack:
- **Carbon equivalent math** — pure arithmetic formulas, no library
- **Eco tips content** — structured data in Turso, Vue template rendering
- **Footprint calculator** — Vue reactive state + arithmetic, Chart.js for breakdown chart

## Integration Points

| Feature | Frontend File | Backend Function | DB Table(s) |
|---------|--------------|-------------------|-------------|
| Carbon report | impact.js (extend) or new report.js | `carbon-report` | carbon_records, listings, users |
| Eco tips | new eco-tips.js page | `eco-tips` | eco_tips (new) |
| Footprint calculator | new footprint.js page | `carbon-footprint` | carbon_footprint_records (new), carbon_coefficients (extend) |

## What NOT to Add

| Rejected | Why |
|----------|-----|
| jsPDF / PDF-lib | Too heavy; html2canvas PNG is sufficient for competition sharing |
| Markdown parser | Eco tips are simple structured data, not markdown content |
| Headless CMS | Overkill; admin creates tips via existing admin page pattern |
| Build tool migration | Must maintain no-build Vue 3 ESM pattern |
| i18n library | Single language (Chinese) for campus competition |

## Key Stack Decision

**Zero new dependencies.** All work is:
1. Schema design (2 new tables + seed emission factors)
2. 3 new Netlify Functions
3. 2-3 new Vue page components
4. Extensions to existing pages (impact.js, admin.js)
