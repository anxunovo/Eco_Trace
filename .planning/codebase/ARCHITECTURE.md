# Architecture

**Analysis Date:** 2026-05-06 (updated 2026-05-08)

## Pattern Overview

**Overall:** Vue 3 SPA with Netlify Functions backend, Turso database, and ZhipuAI image recognition

**Key Characteristics:**
- No build step, no bundler -- pure vanilla ES modules loaded via browser `importmap`
- Backend via Netlify Functions (serverless, `.mjs` files) with Turso (cloud SQLite) database
- Real AI image recognition via ZhipuAI `glm-4v-flash` with client-side mock fallback
- Vue 3 Composition API with inline template strings (no `.vue` SFC files)
- Dual-layout system: every page has desktop and mobile variants rendered conditionally via `useDevice()`
- API-first with localStorage as offline fallback; API availability probed with 30s TTL
- Service worker: cache-first for static assets, network-first for GET API, passthrough for POST/PUT/DELETE

## Layers

**Presentation (Page Components):**
- Purpose: Full-page views mapped to router paths
- Location: `new-site/public/assets/pages/`
- Contains: `home.js`, `listings.js`, `listing-detail.js`, `publish.js`, `me.js`, `me-listings.js`, `impact.js`, `admin.js`
- Depends on: `components.js`, `store.js`, `seed.js`, `device.js`
- Used by: `app.js` (router registration)

**Shared Components:**
- Purpose: Reusable UI widgets (badges, modals, nav, toast, bottom sheet)
- Location: `new-site/public/assets/components.js`
- Contains: `Navbar`, `SiteFooter`, `MobileTabBar`, `MobileTopBar`, `ListingCard`, `TradeModeBadge`, `StatusBadge`, `CarbonBadge`, `ConditionBadge`, `CategoryBadge`, `FoodSafetyNotice`, `PaymentBoundaryNotice`, `ContactModal`, `ConfirmCompleteDialog`, `BottomSheet`, `ToastStack`
- Depends on: `store.js`, `seed.js`
- Used by: All page components

**State / Data Layer:**
- Purpose: Centralized reactive state, CRUD actions, carbon estimation logic
- Location: `new-site/public/assets/store.js`
- Contains: `state` (reactive), `actions` object, computed derived values (`totalCarbonSaved`, `totalCompleted`, etc.), `calculateCarbonEstimate()`, `sweepExpired()`, localStorage persistence helpers
- Depends on: `seed.js`
- Used by: All page components, `components.js`, `mock-ai.js`

**Configuration / Seed Data:**
- Purpose: Enums, carbon factors, seed users and listings, localStorage key names
- Location: `new-site/public/assets/seed.js`
- Contains: `CATEGORIES`, `FOOD_SUBCATS`, `CATEGORY_MAP`, `HOME_ENTRIES`, `TRADE_MODES`, `CONDITIONS`, `STATUS_LABELS`, `CAMPUS_LOCATIONS`, `SEED_USERS`, `SEED_LISTINGS`, `STORAGE_KEYS`, `SEED_VERSION`
- Depends on: Nothing (leaf module)
- Used by: `store.js`, `components.js`, `mock-ai.js`, all page components

**API Adapter:**
- Purpose: All HTTP communication with Netlify Functions backend; API availability detection with TTL caching
- Location: `new-site/public/assets/api-adapter.js`
- Contains: `ensureApi()` (30s TTL probe), `fetchJson()`, `analyzeWithAI()`, `createListing()`, `fetchListings()`, auth functions
- Depends on: browser `fetch`, localStorage (auth token)
- Used by: `pages/publish.js`, `store.js`

**Image Utilities:**
- Purpose: Client-side image compression before API upload (800px max, JPEG 0.7 quality)
- Location: `new-site/public/assets/image-utils.js`
- Contains: `compressForApi()`, `getBase64Size()`, `validateImages()`
- Depends on: browser Canvas API
- Used by: `pages/publish.js`

**Mock AI Service (fallback):**
- Purpose: Client-side keyword-based fallback when real AI API is unavailable; does NOT analyze images
- Location: `new-site/public/assets/mock-ai.js`
- Contains: `analyzeListingImage(input)` -- keyword-based category guessing from title/description text
- Depends on: `seed.js`, `store.js`
- Used by: `pages/publish.js` (only when `analyzeWithAI()` returns null)

**Device Detection:**
- Purpose: Reactive breakpoint state for responsive layout switching
- Location: `new-site/public/assets/device.js`
- Contains: `useDevice()` composable returning `{ width, height, isMobile, isTablet, isDesktop, isLayoutMobile }`
- Depends on: Vue `reactive`, `computed`
- Used by: `app.js`, all page components that switch between desktop/mobile layouts

**Application Shell:**
- Purpose: Vue app creation, router setup, root component, layout orchestration
- Location: `new-site/public/assets/app.js`
- Contains: Route definitions, `App` component (Navbar + `<router-view>` + SiteFooter + MobileTabBar + ToastStack), `watchEffect` for body class toggling
- Depends on: `vue`, `vue-router`, `components.js`, `device.js`, all page components
- Used by: `index.html`

## Data Flow

**User publishes a listing:**

1. User navigates to `/publish` -- `publish.js` mounts with a 4-step reactive `form` object
2. User uploads images -- `fileToDataURL()` compresses to base64 JPEG (max 1200px, quality 0.82), pushes to `form.images`
3. User triggers AI -- `publish.js` compresses images via `compressForApi()` (800px/0.7), calls `analyzeWithAI()` from `api-adapter.js`
4. Backend `ai-analyze.mjs` validates images (max 5, <4MB each), calls `analyzeImages()` from `ai-client.js`
5. `ai-client.js` sends each image as a parallel request to ZhipuAI `glm-4v-flash` (1 image per request), merges results by confidence + category voting
6. Backend runs `calibrateAiResult()` (weight clamping, cross-validation) and `estimateCarbon()` (DB-backed coefficients), returns calibrated result
7. If API unavailable (probe fails), `publish.js` falls back to `mock-ai.js` keyword matching with a warning toast
8. User reviews/edits fields in Step 3 -- `watch` on category/weight/foodType triggers `recalcCarbon()`
9. User submits -- `publish.js` calls `actions.createListing(payload)` which POSTs to backend, persists to Turso DB + local state
10. Router navigates to `/listings/:id`

**User completes a listing (confirm transfer):**

1. User clicks "Confirm transferred" on detail or my-listings page
2. `ConfirmCompleteDialog` emits `confirmed`
3. `actions.completeListing(id)` sets `status = 'COMPLETED'`, creates a `CarbonRecord`, pushes to `state.carbonRecords`, calls `persist()`
4. `totalCarbonSaved` computed value automatically updates across all bound views

**State Management:**
- Single `reactive()` object in `store.js` holds all application state (users, listings, interests, carbonRecords, currentUserId)
- Every mutation goes through `actions` functions that modify state and call `persist()` which serializes each slice to localStorage
- Derived values use Vue `computed()` -- `currentUser`, `totalCarbonSaved`, `totalCompleted`, `totalFoodSavedKg`, `activeStudents`
- No Vuex/Pinia -- the store is a plain module with exported reactive state
- Seed versioning: `SEED_VERSION` constant in `seed.js` is checked on init; mismatch triggers full data reset from seed

## Key Abstractions

**Listing Entity:**
- Purpose: Central domain object representing a publishable item
- Shape: Defined in `seed.js` `SEED_LISTINGS` (canonical sample: `l_001`)
- Key fields: `id`, `ownerId`, `title`, `category`, `tradeMode`, `status`, `estimatedCarbonSavedKg`, `isFood`, `foodInfo`
- Status lifecycle: `DRAFT` -> `ACTIVE` -> `COMPLETED` | `EXPIRED` | `REMOVED`

**Carbon Estimation:**
- Purpose: Calculate estimated CO2e savings for a listing
- Implementation: `store.js` `calculateCarbonEstimate(input)`
- Modes: `per_kg` (weight * factor * substitution) and `per_item` (factor * substitution)
- Food override: Uses `FOOD_SUBCATS` factors with substitution = 1.0
- Configuration: All factors in `seed.js` `CATEGORIES` and `FOOD_SUBCATS`

**Responsive Layout Strategy:**
- Purpose: Serve different UI layouts for mobile vs desktop from the same codebase
- Implementation: Each page exports a default component that renders either `<PageMobile>` or `<PageDesktop>` based on `isLayoutMobile`
- Breakpoint: <= 767px = mobile layout; 768-1023 (tablet) shares desktop layout
- Detection: `device.js` `useDevice()` composable with global reactive state + window resize listener

## Entry Points

**HTML Entry:**
- Location: `new-site/public/index.html`
- Triggers: Browser loads this file (served by nginx or opened directly)
- Responsibilities: Loads Tailwind CDN config, defines importmap for `vue` and `vue-router`, loads all JS modules via `<script type="module">`, provides `<div id="app">` mount point

**Application Bootstrap:**
- Location: `new-site/public/assets/app.js`
- Triggers: `<script type="module" src="/assets/app.js">` in `index.html`
- Responsibilities: Creates Vue app, registers router with 8 routes + catch-all, defines root `App` component with layout switching, mounts to `#app`

**Store Initialization:**
- Location: `new-site/public/assets/store.js` (lines 23-53)
- Triggers: Module import (runs `initIfNeeded()` at module load time)
- Responsibilities: Checks `SEED_VERSION` against localStorage, seeds data if stale, exports reactive `state` object

## Error Handling

**Strategy:** Layered fallback -- API with mock fallback for AI, localStorage as offline data cache

**Patterns:**
- API availability probed with 30s TTL (`api-adapter.js`); stale probe auto-refreshes
- AI analysis: real API → mock fallback with warning toast (`publish.js` `runAI()`)
- AI backend: 25s AbortController timeout, fallback result on ZhipuAI failure (`ai-analyze.mjs`)
- ZhipuAI retry: exponential backoff (2 retries) on rate-limit codes 1302/1305 (`ai-client.js`)
- Service worker: POST/PUT/DELETE bypass cache entirely; only GET responses cached (`sw.js`)
- Image compression: `compressForApi()` (800px/0.7) before API upload to avoid 4MB limit
- localStorage reads wrapped in try/catch with fallback to default value (`store.js`)
- localStorage writes wrapped in try/catch with `console.warn` (`store.js`)
- API mode: `createListing`/`updateListing` throw on failure (no silent local-only fallback)

## Cross-Cutting Concerns

**Logging:** No structured logging. `console.warn` for localStorage failures only. `window.__store` and `window.__device` exposed for DevTools debugging.

**Validation:** Form validation in `publish.js` `step3Errors` computed (lines 178-191) -- checks required fields before allowing publish. No schema validation library.

**Authentication:** None. Demo uses identity switching via `actions.setCurrentUser(id)`. Current user stored in localStorage key `tx.currentUserId`. Default user: `u_alice`.

**Responsive Design:** CSS-first with Tailwind utility classes, supplemented by JS-driven layout switching via `useDevice()`. Mobile-specific CSS in `styles.css` (tab bar, bottom sheet, immersive hero, fixed CTA, waterfall grid).

**Accessibility:** Basic -- semantic `<nav>`, `<header>`, `<footer>`, `<section>`, `<main>`. ARIA labels on icon-only buttons. No screen reader testing evident.

---

*Architecture analysis: 2026-05-06*
