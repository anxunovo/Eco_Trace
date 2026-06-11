# Requirements: 碳循校园 EcoTrace v2.2

**Defined:** 2026-05-09
**Core Value:** 每一次闲置物品成功流转 → 可视化的碳减排贡献

## v2.2 Requirements

Requirements for Green Impact & Education milestone. Each maps to roadmap phases.

### Carbon Contribution Report

- [ ] **RPT-01**: User can view personal carbon report showing total CO2 saved, items participated, and active period
- [ ] **RPT-02**: User can view campus-wide carbon report with aggregate stats (total CO2, participation rate, category breakdown)
- [ ] **RPT-03**: Report displays equivalent conversions (trees absorbed, km driven equivalent, kWh electricity equivalent) with source citations
- [ ] **RPT-04**: User can share carbon report as a PNG image card via html2canvas
- [ ] **RPT-05**: Report shows per-category carbon breakdown with Chart.js doughnut chart

### Carbon Footprint Calculator

- [ ] **FTP-01**: User can input daily transport habits (mode: bus/car/bike/walk + distance km)
- [ ] **FTP-02**: User can input weekly electricity usage (kWh estimate)
- [ ] **FTP-03**: User can input dietary pattern (meat ratio via slider)
- [ ] **FTP-04**: Calculator computes total CO2 footprint using authoritative emission factors (IPCC, China Grid, FAO)
- [ ] **FTP-05**: Result shows per-category breakdown (transport/electricity/food) with Chart.js doughnut
- [ ] **FTP-06**: Calculator displays offset meter — platform carbon savings as percentage of personal footprint
- [ ] **FTP-07**: Footprint calculations are saved to history for tracking over time
- [ ] **FTP-08**: Form pre-fills campus-specific defaults (shuttle bus, dining hall) based on user campus
- [ ] **FTP-09**: Calculator shows "仅作参考" estimate disclaimer with methodology explanation link

### Eco Knowledge

- [ ] **ECO-01**: User can browse eco tips organized by category (energy, transport, food, recycle, lifestyle)
- [ ] **ECO-02**: Each tip shows title, body, action item ("你可以做什么"), and category badge
- [ ] **ECO-03**: Admin can create, edit, and delete eco tips via admin page CRUD interface
- [ ] **ECO-04**: Homepage displays a random daily eco tip in a highlight card
- [ ] **ECO-05**: Tips include platform-action-linked content ("发布闲置物品可减碳 X kg")

## Deferred (post-v2.2)

- **RPT-06**: Period comparison report (semester-over-semester growth)
- **RPT-07**: Printable report format for competition submission
- **FTP-10**: Personalized reduction suggestions linked to eco tips
- **ECO-06**: Campus-specific tips filtered by user campus
- **ECO-07**: Tips search by keyword
- 物品流转效率分析（发布→完成耗时分布）
- 数据导出（CSV/JSON）
- Web Push 推送通知（需 Netlify Pro）

## Out of Scope

| Feature | Reason |
|---------|--------|
| PDF report generation | Heavy library for marginal value; PNG share card sufficient |
| Real-time carbon tracking | Requires IoT sensors, impossible for web app |
| Precise carbon audit | User inputs are estimates; results are indicative, not audited |
| User-submitted eco tips | Moderation overhead, content quality risk |
| External carbon API | Adds dependency and latency; local factors sufficient |
| Rich text editor for tips | Short structured content doesn't need markdown/WYSIWYG |

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RPT-01 | Phase 12 | Pending |
| RPT-02 | Phase 12 | Pending |
| RPT-03 | Phase 12 | Pending |
| RPT-04 | Phase 12 | Pending |
| RPT-05 | Phase 12 | Pending |
| FTP-01 | Phase 13 | Pending |
| FTP-02 | Phase 13 | Pending |
| FTP-03 | Phase 13 | Pending |
| FTP-04 | Phase 13 | Pending |
| FTP-05 | Phase 13 | Pending |
| FTP-06 | Phase 13 | Pending |
| FTP-07 | Phase 13 | Pending |
| FTP-08 | Phase 13 | Pending |
| FTP-09 | Phase 13 | Pending |
| ECO-01 | Phase 14 | Pending |
| ECO-02 | Phase 14 | Pending |
| ECO-03 | Phase 14 | Pending |
| ECO-04 | Phase 14 | Pending |
| ECO-05 | Phase 14 | Pending |

**Coverage:**
- v2.2 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-09*
*Last updated: 2026-05-09 after initial definition*
