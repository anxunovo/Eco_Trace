# Phase 1: Deploy + Backend Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-06
**Phase:** 01-deploy-backend-verification
**Areas discussed:** Netlify site setup, API smoke test approach, Bug regression strategy, Demo walkthrough prep

---

## Netlify Site Setup

| Option | Description | Selected |
|--------|-------------|----------|
| New Netlify site | Netlify Dashboard → Add new site → GitHub repo | ✓ |
| Existing site | Already have a Netlify site linked | |
| CLI deploy only | `netlify deploy --prod`, no Dashboard | |

**User's choice:** New Netlify site (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Default subdomain | Netlify-assigned, e.g. eco-trace.netlify.app | ✓ |
| Custom domain | Point a custom domain | |

**User's choice:** Default subdomain

---

## API Smoke Test Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Automated script | Write `tests/api-smoke.mjs` hitting all 16 endpoints | ✓ |
| Manual curl | curl each endpoint, verify by eye | |
| Local first | Test with `netlify dev`, trust production | |

**User's choice:** Automated script (Recommended)

---

## Bug Regression Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Smoke test covers it | Endpoint tests implicitly verify the 11 fixes | ✓ |
| Per-bug verification | Separate test per bug fix | |
| Manual check only | Check live site manually | |

**User's choice:** Smoke test covers it (Recommended)

---

## Demo Walkthrough Prep

| Option | Description | Selected |
|--------|-------------|----------|
| Competition judges | Full flow: publish → AI → carbon → complete → dashboard | ✓ |
| Internal review | Just make sure it works | |
| Mixed audience | Judges + classmates | |

**User's choice:** Competition judges (Recommended)

---

## Claude's Discretion

- Exact smoke test structure and assertions
- Error reporting format in smoke test
- Deploy command details (netlify-cli vs Dashboard)

## Deferred Ideas

None
