# Domain Pitfalls — v2.2 Green Impact & Education

**Domain:** Carbon reports, eco knowledge, carbon footprint calculator for 节能减排比赛
**Researched:** 2026-05-09

## Critical Pitfalls

### Pitfall 1: Inaccurate Carbon Equivalent Conversions
**What goes wrong:** Using wrong or outdated conversion factors → judges question data credibility
**Why it happens:** Copying factors from random blog posts instead of authoritative sources
**Consequences:** Competition judges spot errors, undermines entire platform credibility
**Prevention:** Use China-specific authoritative sources:
- Grid emission factor: 0.581 kg CO2/kWh (China Energy Statistical Yearbook 2024)
- Car emission: 0.21 kg CO2/km (IPCC + China fuel standards)
- Tree absorption: 18.3 kg CO2/year (China Forestry Administration)
**Detection:** Cross-reference with at least 2 authoritative sources before committing
**Phase:** Address in Phase 12 (Carbon Report) — embed factors as verified constants

### Pitfall 2: "Carbon Footprint" vs "Carbon Reduction" Confusion
**What goes wrong:** Platform conflates footprint (emissions) with reduction (savings) → confusing data
**Why it happens:** Both use CO2 units, easy to mix in UI text and calculations
**Consequences:** Users confused, judges see inconsistency, "你减碳 5kg 但碳足迹 20kg" doesn't make sense
**Prevention:** Clear visual + textual distinction:
- 碳减排 (carbon reduction/savings) → green color, upward trend
- 碳足迹 (carbon footprint/emissions) → amber/red color, downward trend
- "offset" = 减排 / 足迹 — meaningful comparison metric
**Detection:** Review every screen for consistent use of 减排 vs 足迹 terminology
**Phase:** Address in Phase 13 (Footprint Calculator) — enforce in component design

### Pitfall 3: Footprint Calculator Gives Unrealistic Results
**What goes wrong:** Calculator returns "your footprint is 500 kg CO2/week" — clearly wrong
**Why it happens:** Wrong emission factors, wrong unit conversion (daily vs weekly vs monthly)
**Consequences:** Users dismiss the tool, competition credibility lost
**Prevention:**
- Use realistic Chinese campus lifestyle defaults
- Validate against known benchmarks (Chinese avg ~7.4 tons CO2/year)
- Show "估算" (estimate) label prominently
- Include "仅作参考" disclaimer
**Detection:** Test with realistic inputs, compare against national averages
**Phase:** Address in Phase 13 (Footprint Calculator) — validation in testing

## Moderate Pitfalls

### Pitfall 4: Eco Tips Content Quality
**What goes wrong:** Tips are generic ("节约用水") → no competition value, looks like filler
**Why it happens:** Writing tips as afterthought, no campus-specific content
**Prevention:** Tips must be:
- Campus-specific (汕头大学 context)
- Actionable with specific numbers ("步行代替公交 1 km 减碳 0.14 kg")
- Linked to platform features ("发布闲置 → 减碳 X kg")
- Competition-relevant (demonstrates environmental education)
**Detection:** Review tips for specificity — reject any that could apply to any platform
**Phase:** Address in Phase 14 (Eco Tips) — content creation with quality gate

### Pitfall 5: Report Page Performance on Large Data
**What goes wrong:** Report generation slow when carbon_records grows
**Why it happens:** Full table scan without proper indexes
**Prevention:** Ensure carbon_records has indexes on (user_id, created_at) — should exist from v2.0
**How to apply:** Phase 12 (Carbon Report) — verify indexes, add if missing

### Pitfall 6: Footprint vs Platform Offset Misleading
**What goes wrong:** "你已抵消 150% 碳足迹" — mathematically possible but misleading
**Why it happens:** Platform carbon savings (cumulative) vs footprint (period estimate) are different time scales
**Prevention:**
- Compare same period: "本周碳足迹 X kg → 通过平台减碳 Y kg → 抵消 Z%"
- Cap display at 100% with "已实现碳中和!" celebration
- Clearly show the time periods being compared
**How to apply:** Phase 13 (Footprint Calculator) — comparison logic must align time periods

### Pitfall 7: Mobile Form UX for Footprint Calculator
**What goes wrong:** Long form on mobile is unusable, users abandon
**Why it happens:** Trying to capture too many inputs on one screen
**Prevention:**
- Use accordion/stepper for each category (transport → electricity → food → result)
- Smart defaults pre-filled based on campus selection
- Slider inputs where possible (meat ratio: 0-100%)
- Show running total at each step
**How to apply:** Phase 13 (Footprint Calculator) — mobile-first form design

## Minor Pitfalls

### Pitfall 8: Share Card Rendering Issues
**What goes wrong:** Carbon report share card has broken layout in PNG
**Why it happens:** html2canvas doesn't handle all CSS perfectly (flexbox gaps, border-radius)
**Prevention:** Use simple CSS for share card template, test with html2canvas specifically
**How to apply:** Phase 12 (Carbon Report) — test share card rendering

### Pitfall 9: Tips Content Goes Stale
**What goes wrong:** Eco tips feel outdated after competition
**Why it happens:** Hard-coded content can't be updated
**Prevention:** Admin CRUD for tips (planned) + seed data for initial content
**How to apply:** Phase 14 (Eco Tips) — admin UI for content management

### Pitfall 10: Missing "Estimate" Disclaimer
**What goes wrong:** Judges treat numbers as precise carbon audit
**Why it happens:** UI doesn't clearly indicate values are estimates
**Prevention:** Every carbon number shows "≈" or "估算" label, methodology page explains assumptions
**How to apply:** All phases — consistent labeling in every display

## Competition-Specific Pitfalls

### Competition Pitfall 1: "Where's the Innovation?"
**Risk:** Report + calculator + tips may seem like "just adding pages"
**Mitigation:** The innovation is the **offset meter** — connecting footprint (emissions) to platform savings (reductions) in a single view. This is the "ah-ha" moment for judges. Make it prominent.

### Competition Pitfall 2: Data Credibility
**Risk:** Judges question "how do you know this carbon number is accurate?"
**Mitigation:** Show methodology page with sources. Every factor cites its source (IPCC, FAO, China Grid). This is what separates a student project from a credible tool.

### Competition Pitfall 3: Demo Flow
**Risk:** Too many features, demo becomes unfocused
**Mitigation:** Design demo flow: open calculator → show footprint → show platform savings → show offset meter → "已抵消 X%!" moment. Carbon report is the takeaway (share card).
