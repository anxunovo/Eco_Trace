# Testing Patterns

**Analysis Date:** 2026-05-06

## Test Framework

**Runner:**
- No test framework is configured or installed
- No `package.json` exists; the project uses zero build tools
- No `jest.config.*`, `vitest.config.*`, `karma.conf.*`, `playwright.config.*`, or any other test configuration files exist

**Assertion Library:**
- None in use

**Run Commands:**
```bash
# None available -- no test infrastructure exists
# Manual testing only: open new-site/public/index.html in browser
```

**Manual/Ad-hoc Testing:**
- A Playwright smoke test script exists on the deployment server at `/tmp/pw-smoke.js` (referenced in `new-site/PROJECT_BRIEF.md`, lines 252-256) but is NOT checked into the repository
- That script traverses 8 routes and checks for console errors, page errors, and request failures
- Browser DevTools console debugging via `window.__store` (`new-site/public/assets/store.js`, lines 259-263) and `window.__device` (`new-site/public/assets/device.js`, lines 37-39)

## Test File Organization

**Location:**
- No test files exist anywhere in the repository
- Glob searches for `*.test.*`, `*.spec.*`, and any test framework config files return zero results

**Naming:**
- Not applicable

**Structure:**
```
new-site/
  public/
    assets/
      *.js              # Source files (no corresponding test files)
      pages/
        *.js            # Page components (no corresponding test files)
```

## Test Coverage

**Requirements:** None enforced. No coverage tooling configured.

**Current State: 0% -- Zero automated tests exist.**

The entire codebase (3,906 lines of application code across 15 JS files + 322 lines of CSS + 59 lines of HTML) has no automated test coverage.

**What IS tested (manually):**
- Route traversal smoke test (server-side Playwright script, not in repo)
- Visual inspection by opening `index.html` in browser
- Demo walkthrough path documented in `new-site/PROJECT_BRIEF.md` (lines 236-246)

**What is NOT tested at all:**

### Store Logic (Critical -- highest test value)
- `new-site/public/assets/store.js` (264 lines)
  - `initIfNeeded()` -- seed data initialization and version check (lines 23-52)
  - `calculateCarbonEstimate()` -- carbon calculation for per_kg, per_item, and food categories (lines 214-256)
  - `actions.createListing()` -- entity creation with default fields (lines 135-149)
  - `actions.updateListing()` -- partial update with Object.assign (lines 152-156)
  - `actions.completeListing()` -- status transition + CarbonRecord creation (lines 168-189)
  - `actions.removeListing()` -- soft-delete (lines 159-164)
  - `sweepExpired()` -- automatic food expiry scanning (lines 113-126)
  - `uid()` -- ID generation uniqueness (lines 102-103)
  - `round1()` -- rounding with EPSILON correction (lines 99-101)
  - `persist()` -- localStorage serialization (lines 65-71)
  - Computed derivations: `totalCarbonSaved`, `totalCompleted`, `totalFoodSavedKg`, `activeStudents` (lines 79-96)

### Mock AI Logic (High test value)
- `new-site/public/assets/mock-ai.js` (133 lines)
  - `guessCategory()` -- keyword-to-category mapping (lines 25-31)
  - `guessFoodSubcat()` -- food subcategory identification (lines 33-39)
  - `guessCondition()` -- condition inference from text (lines 41-48)
  - `analyzeListingImage()` -- full AI mock pipeline (lines 76-133)
  - Confidence score calculation (lines 115-118)

### Seed Data Integrity
- `new-site/public/assets/seed.js` (486 lines)
  - All 26 seed listings have required fields
  - `SEED_LISTINGS` cross-references valid user IDs
  - Carbon estimates are consistent with category factors
  - Food items have valid `foodInfo` structures
  - Status distribution matches documented counts (22 ACTIVE, 3 COMPLETED, 1 EXPIRED)

### Component Behavior (Medium test value)
- `new-site/public/assets/components.js` (404 lines)
  - Toast lifecycle: push, auto-remove after timeout (lines 8-17)
  - Badge display logic for different trade modes and statuses
  - Modal open/close via v-model

### Form Validation
- `new-site/public/assets/pages/publish.js` (612 lines)
  - `step3Errors` computed -- 8+ validation rules (lines 178-191)
  - `fileToDataURL()` -- image compression promise (lines 15-39)
  - `recalcCarbon()` -- reactive recalculation on field change (lines 164-175)
  - Submit payload construction with conditional fields (lines 201-237)

### Routing
- `new-site/public/assets/app.js` (75 lines)
  - All 8+ routes resolve to correct components
  - Route meta titles set correctly
  - 404 catch-all route works

## Test Data

**Seed Data:**
- 5 seed users (`SEED_USERS` in `new-site/public/assets/seed.js`, lines 64-70): `u_alice`, `u_bob`, `u_club`, `u_grad`, `u_admin`
- 26 seed listings (`SEED_LISTINGS` in `new-site/public/assets/seed.js`, lines 83-474): cover all 7 categories, all 4 trade modes, all statuses, all food subtypes
- Seed version string controls cache invalidation: `'2026-04-25-real-photos'` (line 486, `seed.js`)

**Test Fixtures:**
- None exist. Seed data doubles as both production demo data and implicit test fixture.

**Mocking Patterns:**
- The entire AI layer is a mock: `mock-ai.js` with 700ms simulated delay (line 78)
- localStorage is real browser localStorage (no mock/stub)
- No API calls exist to mock (all data is client-side)

## Gaps

### Gap 1: Zero Unit Tests (CRITICAL)
**What's missing:** No unit tests for any of the 15 source files.
**Risk:** Regressions in carbon calculation, store mutations, or seed data integrity go completely undetected.
**Priority:** High

### Gap 2: No Carbon Calculation Tests (CRITICAL)
**What's missing:** `calculateCarbonEstimate()` in `new-site/public/assets/store.js` (lines 214-256) is the core business logic. It has three code paths (per_kg, per_item, food) with different formulas. None are tested.
**Risk:** A coefficient change or formula bug would silently produce wrong carbon estimates -- the primary data shown to competition judges.
**Priority:** High

### Gap 3: No Form Validation Tests
**What's missing:** `step3Errors` in `new-site/public/assets/pages/publish.js` has 8+ validation rules. Invalid submissions could produce broken listings in localStorage.
**Risk:** Users can publish listings with missing required fields, causing display errors on detail pages.
**Priority:** High

### Gap 4: No State Transition Tests
**What's missing:** Status transitions (`ACTIVE -> COMPLETED`, `ACTIVE -> EXPIRED`, `ACTIVE -> REMOVED`) are not tested. `completeListing()` creates a CarbonRecord -- no test verifies this side effect.
**Risk:** Broken state transitions could corrupt the carbon dashboard data.
**Priority:** High

### Gap 5: No Seed Data Validation
**What's missing:** No automated check that seed data references are consistent (e.g., every `ownerId` in listings maps to an actual user, every `foodInfo` has required fields for food items).
**Risk:** Seed data edits could introduce dangling references that cause runtime errors.
**Priority:** Medium

### Gap 6: No localStorage Persistence Tests
**What's missing:** `persist()` and `load()` in `new-site/public/assets/store.js` handle JSON serialization/deserialization. No test verifies roundtrip fidelity or handles edge cases (quota exceeded, corrupted JSON).
**Risk:** Data loss on page refresh if serialization breaks.
**Priority:** Medium

### Gap 7: No AI Mock Contract Tests
**What's missing:** `analyzeListingImage()` in `new-site/public/assets/mock-ai.js` returns a structured object. No test verifies the output contract matches what `publish.js` expects.
**Risk:** When replacing the mock with a real AI API, schema mismatches could break the publish flow.
**Priority:** Medium

### Gap 8: No E2E Tests in Repository
**What's missing:** The Playwright smoke test (`/tmp/pw-smoke.js`) exists only on the deployment server, not in the git repository.
**Risk:** CI/CD cannot run E2E tests; new contributors cannot run them locally.
**Priority:** Medium

## Recommendations

### Tier 1: Foundation (Implement First)

**1. Add `package.json` with Vitest and JSDOM:**
```bash
# Minimal setup -- no build step needed for testing store/mock-ai logic
npm init -y
npm install -D vitest jsdom
```
Config in `vitest.config.js`:
```js
export default {
  test: {
    environment: 'jsdom',
    globals: true,
  },
};
```

**2. Unit test `store.js` -- `calculateCarbonEstimate()`:**
Test all three code paths with known inputs/outputs:
- `per_kg` category (BOOKS): `0.8kg * 1.3 * 0.7 = 0.7`
- `per_item` category (ELECTRONICS): `25.0 * 0.6 = 15.0`
- Food category (VEG, 1.0kg): `1.0 * 0.8 * 1.0 = 0.8`
- Food category (MEAT, 1.0kg): `1.0 * 8.0 * 1.0 = 8.0`
- Unknown category: returns 0
- Edge cases: zero weight, missing foodType

**3. Unit test `store.js` -- `round1()` and `uid()`:**
- `round1(0.7000000000001)` returns `0.7`
- `round1(0)` returns `0`
- `uid()` returns unique strings with prefix

**4. Unit test `mock-ai.js` -- keyword matching:**
- `guessCategory('textbook')` returns `BOOKS`
- `guessCategory('headphones')` returns `ELECTRONICS`
- `guessCategory('unknown text')` returns `DORM` (fallback)
- `guessCondition('brand new')` returns `NEW`
- Food subcategory detection for each type

**5. Unit test `store.js` -- `actions.completeListing()`:**
- Creates CarbonRecord with correct fields
- Sets listing status to COMPLETED
- Returns null for non-ACTIVE listings
- Sets `completedAt` timestamp

### Tier 2: Data Integrity

**6. Seed data validation test:**
Write a test that loads `SEED_LISTINGS` and verifies:
- Every `ownerId` exists in `SEED_USERS`
- Every listing has required fields (`id`, `title`, `category`, `status`, `tradeMode`)
- Food listings have valid `foodInfo` with `foodType`, `expireAt`
- Status counts match: 22 ACTIVE, 3 COMPLETED, 1 EXPIRED
- Carbon estimates are positive numbers

**7. Form validation tests for `publish.js`:**
Extract `step3Errors` logic into a testable function. Test:
- Missing title produces error
- SALE mode without price produces error
- SWAP mode without swapWanted produces error
- Food without expireAt produces error
- Valid complete form produces zero errors

### Tier 3: Integration

**8. localStorage roundtrip test:**
```js
// Test that save + load preserves data fidelity
save('test.key', { nested: true, arr: [1,2,3] });
expect(load('test.key', null)).toEqual({ nested: true, arr: [1,2,3] });
```

**9. Bring Playwright smoke test into repo:**
Copy `/tmp/pw-smoke.js` from the server into `tests/e2e/smoke.spec.js` (or equivalent). Add `playwright` as a dev dependency. This provides route-level regression testing for all 8 pages.

**10. Component snapshot tests (lower priority):**
Since components use inline templates, snapshot testing with `@vue/test-utils` could catch template regressions. However, this is lower priority than the pure-logic tests above.

---

*Testing analysis: 2026-05-06*
