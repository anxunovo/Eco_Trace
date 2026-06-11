# Research Summary: 碳循校园 EcoTrace v2.2

**Domain:** Carbon reports, eco knowledge, carbon footprint calculator
**Researched:** 2026-05-09
**Overall confidence:** HIGH

## Executive Summary

v2.2 adds three competition-critical features with **zero new dependencies**. All features build on the existing Vue 3 + Netlify Functions + Turso stack. The work is primarily schema design + 3 new API functions + 2-3 new frontend pages.

The **killer feature for competition** is the "offset meter" — connecting personal carbon footprint (emissions) to platform carbon savings (reductions). This single view demonstrates the platform's real-world impact and creates the "ah-ha" moment judges remember.

## Key Findings

**Stack:** No new libraries. Carbon equivalent math is pure arithmetic. Eco tips are structured data in Turso. Footprint calculator uses Vue reactive state + existing Chart.js.

**Feature priority (by competition impact):**
1. Carbon report + equivalents — visual, shareable, judge-friendly
2. Footprint calculator — interactive demo, highest tech depth
3. Footprint vs platform offset — the "ah-ha" moment
4. Eco tips — education value for judges

**Critical pitfall:** Data credibility. Every carbon number must cite its source (IPCC, FAO, China Grid). Without this, judges dismiss the numbers. Use "估算" labels consistently.

**Key architectural decision:** 2 new Turso tables (eco_tips, carbon_footprint_records) + extend carbon_coefficients with transport/electricity/food factors. Report equivalents are code constants (not DB) since they rarely change.

## Implications for Roadmap

**Recommended 3 phases (Phase 12-14):**

1. **Phase 12: Carbon Contribution Report** — High competition value, leverages existing carbon_records
   - Personal + campus report API
   - Equivalent conversions (trees / km / kWh)
   - Share card via html2canvas
   - Category breakdown chart

2. **Phase 13: Carbon Footprint Calculator** — Interactive demo, highest tech depth
   - Multi-scenario form (transport/electricity/food)
   - Emission factor lookup + calculation
   - Result breakdown chart
   - **Offset meter**: platform savings vs footprint
   - Comparison + reduction suggestions

3. **Phase 14: Eco Knowledge Module** — Education value
   - Tips DB + admin CRUD
   - Tips listing page
   - Homepage daily tip
   - Campus-specific content

**Phase ordering rationale:**
- Report first: builds on existing data, high visual impact for demo
- Calculator second: extends carbon engine, the offset meter connects to report data
- Tips last: content module, depends on having good content linked to platform features

**Research flags for phases:**
- Phase 12: Verify China-specific emission factors against 2+ authoritative sources
- Phase 13: Test footprint with realistic campus inputs against national averages
- Phase 14: Content quality gate — reject generic tips, require campus-specific content

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new deps, all existing proven tech |
| Features | HIGH | Clear scope, well-defined table stakes |
| Architecture | HIGH | Clean integration with existing patterns |
| Pitfalls | HIGH | Competition-specific risks identified with mitigations |

## Competition Strategy

**Demo flow (recommendation):**
1. Open footprint calculator → show weekly carbon footprint
2. Switch to carbon report → show platform savings
3. Show offset meter → "已抵消 X% 碳足迹!"
4. Share the report card → "下载我的减碳报告"

**Data credibility plan:**
- Every emission factor cites source in UI
- Methodology section visible to judges
- "估算" labels on all calculated values
- Comparison against national benchmarks for validation
