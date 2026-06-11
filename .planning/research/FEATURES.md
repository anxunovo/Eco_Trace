# Feature Landscape — v2.2 Green Impact & Education

**Domain:** Campus carbon tracking platform — reports, education, footprint calculator
**Researched:** 2026-05-09

## Carbon Contribution Report

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Personal carbon summary | Users want "my total impact" — total kg CO2 saved, items participated | Low | Query existing carbon_records + users |
| Campus-wide report | Judges want aggregate: total campus CO2 saved, participation rate | Med | Aggregate query + display |
| Equivalent conversions | "你的减碳 = X 棵树 / Y km 行驶 / Z 度电" — makes abstract data tangible | Low | Fixed conversion factors, simple math |
| Report sharing (PNG) | Users share their impact card on social media | Low | Reuse html2canvas from impact.js |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Period comparison (semester/term) | "本学期减碳 X kg" — competition material | Med | Date range filter on carbon_records |
| Category breakdown in report | Show which item types contributed most | Low | GROUP BY category, doughnut chart |
| Printable report format | Competition submission material — clean layout | Low | CSS @media print or separate print view |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| PDF generation | Heavy, complex library for marginal value | PNG via html2canvas is sufficient |
| Real-time report | Overkill; reports are point-in-time snapshots | Generate on demand with cache |

## Eco Knowledge / Tips Module

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Tips listing page | Central place for environmental knowledge | Low | New page, simple list/card layout |
| Category-organized tips | Users browse by topic: energy, transport, food, recycling | Low | Category field in eco_tips table |
| Tip detail with action items | Each tip has: title, body, "what you can do" action | Low | Structured content, no markdown needed |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Campus-specific tips | "桑浦山校区" specific: shuttle bus, dining hall | Med | Campus-tagged content in DB |
| Tips linked to platform actions | "发布闲置物品可减碳 X kg" — connects tips to platform | Med | Reference carbon_coefficients in tip content |
| Admin tip management | Admin creates/edits tips via existing admin page | Med | Extend admin.js with CRUD UI |
| Random daily tip (homepage) | Shows rotating eco tip on homepage — educational | Low | Random selection from DB, cached daily |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-----------|
| User-submitted tips | Moderation overhead, content quality risk | Admin-only creation |
| Rich text / markdown editor | Unnecessary complexity for short tips | Simple text fields in admin form |
| Comment / discussion | Out of scope for education module | No interaction on tips |

## Carbon Footprint Calculator

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Multi-scenario input | Transport (bus/car/bike), electricity (kWh), food (meat/veg mix) | Med | Form with sliders/selects per category |
| Emission factor calculation | Convert user inputs to CO2 equivalent using authoritative factors | Med | Extend carbon_coefficients or new table |
| Result display with breakdown | "Your weekly footprint: X kg CO2 — transport Y%, electricity Z%" | Low | Chart.js doughnut, summary cards |
| Save calculation history | Users track footprint over time | Low | carbon_footprint_records table |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Campus-specific defaults | Pre-fill common campus scenarios (shuttle bus, dining hall) | Low | Default values based on campus selection |
| Comparison vs platform savings | "你的碳足迹 X kg → 通过平台流转已抵消 Y%" — powerful competition narrative | Med | Cross-reference carbon_records with footprint |
| Reduction suggestions | After calculating, show personalized tips | Med | Link to eco_tips based on highest category |
| Visual "offset meter" | Progress bar showing how much footprint is offset by platform actions | Low | CSS progress bar, fraction display |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time carbon tracking | Requires IoT sensors, impossible for web app | Manual periodic estimation |
| Precise carbon audit | User inputs are estimates, results are indicative | Label as "估算" clearly |
| External carbon API integration | Adds dependency, cost, latency | Local emission factor lookup table |

## Equivalent Conversion Factors (Reference)

Authoritative values for Chinese context:

| Equivalent | Factor | Source |
|-----------|--------|--------|
| 1 tree absorbs | ~18.3 kg CO2/year | China Forestry Administration |
| 1 km driving (gasoline) | ~0.21 kg CO2 | IPCC, China fuel standards |
| 1 kWh electricity | ~0.581 kg CO2 | China grid emission factor (2024) |
| 1 kg beef | ~27.0 kg CO2e | FAO, livestock lifecycle |
| 1 kg vegetables | ~2.0 kg CO2e | FAO |
| 1 bus trip (10 km) | ~0.7 kg CO2 | Public transport emission factor |

## Feature Dependencies

```
carbon_records (existing) → Carbon contribution report → Equivalent conversions
carbon_coefficients (existing) → Carbon footprint calculator → Comparison vs savings
eco_tips (new table) → Tips listing → Daily tip (homepage)
Admin CRUD → Eco tips content management
Calculator results → Reduction suggestions (link to eco_tips)
```

## Competition Value Matrix

| Feature | Judge Impact | Demo-ability | Tech Depth | Priority |
|---------|-------------|--------------|------------|----------|
| Carbon report + equivalents | ★★★★★ | High (visual, shareable) | Med | Must have |
| Footprint calculator | ★★★★★ | High (interactive demo) | High | Must have |
| Footprint vs platform offset | ★★★★☆ | Very high ("ah-ha" moment) | Med | Should have |
| Eco tips module | ★★★★☆ | Med (content quality matters) | Low | Should have |
| Daily tip on homepage | ★★★☆☆ | Low (subtle) | Low | Nice to have |
| Period comparison reports | ★★★☆☆ | Med (shows growth) | Low | Nice to have |
