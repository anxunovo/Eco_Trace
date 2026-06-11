# Phase 1: Deploy + Backend Verification - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy EcoTrace to Netlify and verify all 16 backend API endpoints respond correctly in production. This phase covers site setup, environment variable configuration, first deploy, and a comprehensive smoke test to confirm the endpoints work as expected (including CORS preflight, carbon estimation, listing lifecycle).

</domain>

<decisions>
## Implementation Decisions

### Netlify Site Setup
- **D-01:** Create a new Netlify site linked to GitHub repo `Yuuqq/Eco_Trace`
- **D-02:** Use default Netlify subdomain (no custom domain for MVP)
- **D-03:** Environment variables: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `ZHIPUAI_API_KEY` — set in Netlify Dashboard → Site Settings → Environment Variables

### API Smoke Test
- **D-04:** Write automated smoke test script (`tests/api-smoke.mjs`) that hits all 16 endpoints after deploy
- **D-05:** Test script covers: GET /api/listings (returns 20 items), GET /api/listing?id=l_001 (returns detail), POST /api/listings/create (creates + carbon estimate), POST /api/listings/:id/complete (status transition + carbon record), GET /api/dashboard (aggregated stats), OPTIONS on all endpoints (CORS 204)
- **D-06:** Run smoke test against production URL after each deploy

### Bug Regression
- **D-07:** Smoke test implicitly verifies the 11 bug fixes (CORS on all endpoints, correct object property access, no Knex/sync SQLite API calls) — no separate per-bug verification needed

### Demo Walkthrough Prep
- **D-08:** Target audience: competition judges (节能减排科技作品类)
- **D-09:** Demo path: browse listings → publish item → AI analysis → complete transfer → dashboard updates
- **D-10:** Demo must show: carbon values with "预计/估算" labels, food safety notices, mobile responsive layout

### Claude's Discretion
- Exact smoke test structure and assertions
- Error reporting format in smoke test
- Deploy command details (netlify-cli vs Dashboard)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Project vision, validated requirements, key decisions
- `.planning/REQUIREMENTS.md` — REQ-IDs mapped to this phase
- `.planning/ROADMAP.md` — Phase 1 definition and success criteria
- `.planning/research/SUMMARY.md` — Research findings on stack, pitfalls, architecture

### Backend Code
- `netlify.toml` — Build config, functions directory, SPA fallback
- `netlify/functions/_lib/db.js` — Turso HTTP wrapper (query, queryOne, execute, getDb)
- `netlify/functions/_lib/response.js` — JSON response helpers + CORS handler
- `netlify/functions/_lib/carbon-engine.js` — Carbon estimation from coefficients table
- `netlify/functions/_lib/auth.js` — X-User-Id header extraction
- `netlify/functions/_lib/ai-client.js` — ZhipuAI GLM-4.6V-Flash integration
- `netlify/functions/_lib/schema.sql` — Database schema (5 tables)

### Frontend Integration
- `new-site/public/assets/api-adapter.js` — API probe + fetch wrapper with fallback
- `new-site/public/assets/store.js` — Reactive state with API sync

### Existing Tests
- `tests/api-tests.mjs` — Existing integration test script (from Jules)

### Deployment Docs
- `docs/ENV_SETUP.md` — Environment variable setup guide

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `netlify.toml`: Already configured with correct publish dir (`new-site/public`), functions dir, esbuild bundler, SPA fallback
- `scripts/apply-schema.mjs`: Schema application script using Turso HTTP API
- `scripts/seed-all.mjs`: Seed script (users, coefficients, listings) — already run successfully
- `tests/api-tests.mjs`: Existing test script from Jules — can be extended or replaced

### Established Patterns
- All API endpoints use `export const config = { path: '/api/...' }` for clean URL routing
- CORS handled via `cors()` import from `_lib/response.js` — must be called at top of each handler
- Auth uses `getUser(req)` or `getCurrentUserId(req)` from `_lib/auth.js`
- Database access via `query()`, `queryOne()`, `execute()` from `_lib/db.js` (async, returns objects)

### Integration Points
- Frontend `api-adapter.js` probes `GET /api/listings` to detect API availability
- SPA fallback in `netlify.toml` must NOT intercept `/api/*` paths (functions with `config.path` take priority)

</code_context>

<specifics>
## Specific Ideas

- Competition is 节能减排科技作品类 — judges expect to see full architecture + running demo
- Demo needs to feel "complete" — not a prototype. Polished flow matters.
- The demo will likely be presented on a laptop screen, but mobile layout should also work for credibility

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-deploy-backend-verification*
*Context gathered: 2026-05-06*
