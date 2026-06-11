# Architecture Patterns — v2.2 Green Impact & Education

**Domain:** Carbon reports, eco knowledge, carbon footprint calculator
**Researched:** 2026-05-09

## New Components

| Component | Responsibility | Type |
|-----------|---------------|------|
| `pages/report.js` | Carbon contribution report page (personal + campus) | Frontend page |
| `pages/eco-tips.js` | Eco knowledge listing + detail | Frontend page |
| `pages/footprint.js` | Carbon footprint calculator with multi-scenario inputs | Frontend page |
| `components.js` extensions | Report card template, tip card, footprint result chart | Frontend components |
| `carbon-report` function | Aggregate carbon data + compute equivalents | Netlify Function |
| `eco-tips` function | CRUD for eco tips content | Netlify Function |
| `carbon-footprint` function | Calculate footprint from user inputs + store record | Netlify Function |

## Data Flow — Carbon Contribution Report

```
User visits /report
  → report.js calls GET /api/carbon-report?type=personal&period=all
  → Function queries carbon_records WHERE user_id=X
  → Sums total CO2, counts items, groups by category
  → Applies equivalent conversions (trees, km, kWh)
  → Returns { totalKg, items, categoryBreakdown, equivalents }
  → report.js renders summary cards + Chart.js doughnut + share card
  → User clicks "分享" → html2canvas generates PNG
```

## Data Flow — Eco Knowledge Module

```
User visits /eco-tips
  → eco-tips.js calls GET /api/eco-tips
  → Function queries eco_tips table, ordered by category + sort_order
  → Returns array of tips
  → eco-tips.js renders categorized cards

Homepage loads
  → home.js calls GET /api/eco-tips?random=1
  → Shows daily tip in a highlight card

Admin visits /admin → tips tab
  → admin.js calls GET/POST/PUT/DELETE /api/eco-tips
  → CRUD operations on eco_tips table
```

## Data Flow — Carbon Footprint Calculator

```
User visits /footprint
  → footprint.js renders form: transport, electricity, food, lifestyle
  → User fills inputs (km driven, kWh used, meals with meat, etc.)
  → User clicks "计算"
  → footprint.js calls POST /api/carbon-footprint
    { transport: { mode, distance }, electricity: { kwh }, food: { meatRatio } }
  → Function looks up emission factors from carbon_coefficients
  → Calculates total CO2 per category
  → Saves to carbon_footprint_records
  → Returns { totalKg, breakdown: { transport, electricity, food }, equivalents }
  → footprint.js renders doughnut chart + comparison vs platform savings
  → Shows "offset percentage": platform carbon saved / footprint total
```

## Database Schema Additions

```sql
-- Eco knowledge tips
CREATE TABLE IF NOT EXISTS eco_tips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL,          -- 'energy', 'transport', 'food', 'recycle', 'lifestyle'
  action_text TEXT,                 -- "你可以做什么" action item
  campus TEXT,                      -- NULL for general, '桑浦山' or '东海岸' for specific
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Carbon footprint calculation records
CREATE TABLE IF NOT EXISTS carbon_footprint_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  transport_kg REAL DEFAULT 0,      -- CO2 from transport
  electricity_kg REAL DEFAULT 0,    -- CO2 from electricity
  food_kg REAL DEFAULT 0,          -- CO2 from food
  lifestyle_kg REAL DEFAULT 0,     -- CO2 from other lifestyle
  total_kg REAL NOT NULL,          -- Total footprint
  period_type TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Seed equivalent conversion factors (use in code, not DB table)
-- These are constants in the report function:
-- TREE_ABSORPTION_KG_PER_YEAR = 18.3
-- CAR_KM_CO2_KG = 0.21
-- ELECTRICITY_KWH_CO2_KG = 0.581

-- Extend carbon_coefficients for footprint calculator
INSERT INTO carbon_coefficients (category, subcategory, factor, mode, source, source_ref)
VALUES
  ('TRANSPORT', 'bus', 0.07, 'per_km', 'IPCC', '公共交通排放因子'),
  ('TRANSPORT', 'car', 0.21, 'per_km', 'IPCC', '汽油车排放因子'),
  ('TRANSPORT', 'bike', 0.0, 'per_km', 'IPCC', '零排放'),
  ('TRANSPORT', 'walking', 0.0, 'per_km', 'IPCC', '零排放'),
  ('ELECTRICITY', 'grid', 0.581, 'per_kwh', 'China Grid', '2024电网排放因子'),
  ('FOOD', 'heavy_meat', 3.3, 'per_meal', 'FAO', '高肉饮食'),
  ('FOOD', 'balanced', 1.5, 'per_meal', 'FAO', '荤素均衡'),
  ('FOOD', 'vegetarian', 0.7, 'per_meal', 'FAO', '素食');
```

## Route Additions

```javascript
// app.js routes to add:
{ path: '/report',     component: ReportPage,     meta: { title: '减碳报告' } },
{ path: '/eco-tips',   component: EcoTipsPage,    meta: { title: '环保知识' } },
{ path: '/footprint',  component: FootprintPage,  meta: { title: '碳足迹' } },
```

## Integration with Existing Components

| Existing | Extension Required |
|----------|-------------------|
| `impact.js` | Add link to /report from impact page |
| `home.js` | Add daily eco tip card component |
| `me.js` | Show "my carbon report" link + footprint offset |
| `admin.js` | Add eco tips CRUD tab |
| `components.js` | Add ReportCard, TipCard, FootprintResult components |
| `navbar.js` / MobileTabBar | Add navigation links for new pages |
| `api-adapter.js` | Add fetch functions for 3 new APIs |
| `store.js` | No changes needed (uses existing auth/user state) |

## Build Order (Recommended)

1. **DB schema + seed data** — Foundation for all features
2. **Carbon report API + page** — Leverages existing carbon_records, high competition value
3. **Carbon footprint calculator** — Extends carbon_coefficients, requires new form + calculation
4. **Eco tips API + admin CRUD** — Content management first, then display
5. **Eco tips page + homepage daily tip** — Consumes tips from DB
6. **Cross-feature integration** — Footprint vs platform offset, reduction suggestions from tips

## Anti-Patterns to Avoid

| Anti-Pattern | Why Bad | Instead |
|-------------|---------|---------|
| Computing equivalents in frontend | Logic duplication, hard to update | Compute in API function, frontend just displays |
| Hardcoding eco tips in JS | Not maintainable, can't update without deploy | Store in Turso, admin-managed |
| Storing conversion factors in DB | They rarely change, adds query overhead | Constants in API function code |
| Single massive footprint form | Overwhelming, poor mobile UX | Multi-step or accordion per category |
