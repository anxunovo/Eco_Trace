# Roadmap: 碳循校园 EcoTrace

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-05-07)
- ✅ **v2.0 Real Campus Platform** — Phases 8-9 (shipped 2026-05-08)
- ✅ **v2.1 Engagement Features** — Phases 10-11 (shipped 2026-05-09)
- ✅ **v2.2 Green Impact & Education** — Phases 12-14 (shipped 2026-05-09)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-05-07</summary>

- [x] Phase 1: Deploy + Backend Verification
- [x] Phase 2: Auth Backend + Frontend
- [x] Phase 3: Frontend Integration
- [x] Phase 4: E2E Demo + Bug Fixes

</details>

<details>
<summary>✅ v2.0 Real Campus Platform (Phases 8-9) — SHIPPED 2026-05-08</summary>

- [x] Phase 8: Data & Impact Visualization (3/3 plans)
- [x] Phase 9: PWA Foundation (3/3 plans)

</details>

<details>
<summary>✅ v2.1 Engagement Features (Phases 10-11) — SHIPPED 2026-05-09</summary>

- [x] Phase 10: Achievement System (eco_points + 6 badges)
- [x] Phase 11: QR Scan Quick Publish (camera → AI → 1-tap)

</details>

## v2.2 Green Impact & Education

### Phase 12: Carbon Contribution Report
- [x] Phase 12: Carbon Contribution Report
- **Goal:** Users can view and share their carbon impact with intuitive equivalent conversions
- **Requirements:** RPT-01, RPT-02, RPT-03, RPT-04, RPT-05
- **Success criteria:**
  1. User sees personal carbon report with total CO2 saved and items count
  2. Campus-wide report shows aggregate stats with category breakdown
  3. Equivalent conversions display (trees, km, kWh) with cited sources
  4. Share button generates PNG card via html2canvas
  5. Category doughnut chart shows per-type carbon breakdown

### Phase 13: Carbon Footprint Calculator
- [x] Phase 13: Carbon Footprint Calculator
- **Goal:** Users estimate their daily carbon footprint and see how platform actions offset it
- **Requirements:** FTP-01, FTP-02, FTP-03, FTP-04, FTP-05, FTP-06, FTP-07, FTP-08, FTP-09
- **Success criteria:**
  1. Multi-scenario form accepts transport, electricity, and food inputs
  2. Calculator produces total CO2 footprint with authoritative emission factors
  3. Result doughnut breaks down footprint by category
  4. Offset meter shows platform savings as % of personal footprint
  5. Campus defaults pre-fill based on user's campus selection

### Phase 14: Eco Knowledge Module
- [x] Phase 14: Eco Knowledge Module
- **Goal:** Educational content system that connects environmental knowledge to platform actions
- **Requirements:** ECO-01, ECO-02, ECO-03, ECO-04, ECO-05
- **Success criteria:**
  1. Tips page displays categorized eco knowledge cards
  2. Each tip shows title, body, action item, and category badge
  3. Admin can create, edit, delete tips via admin page
  4. Homepage displays random daily eco tip
  5. Tips include platform-action-linked content with carbon numbers

## Backlog

### Deferred (post-v2.2)
- Timeline API endpoint (STAT-04)
- Data export CSV/JSON (EXPR-01)
- 物品流转效率分析（FLOW-01）
- Web Push notifications (需 Netlify Pro)
- Period comparison reports (RPT-06, RPT-07)
- Footprint reduction suggestions (FTP-10)
- Campus-filtered tips (ECO-06)
- Tips search (ECO-07)
