# Codebase Concerns

**Analysis Date:** 2026-05-06 (updated 2026-05-08)

## Tech Debt

**localStorage as offline fallback (partially mitigated):**
- Issue: API mode uses Turso DB as primary store, but localStorage still holds all data as offline fallback. Base64 images stored inline. localStorage has a hard ~5MB limit per origin.
- Files: `new-site/public/assets/store.js`, `new-site/public/assets/pages/publish.js`
- Impact: In API mode, data persists to Turso. If API is down, localStorage serves as fallback but can still exhaust quota with many images. The `save()` function catches the error but only logs a warning.
- Mitigation: API mode is primary; localStorage is fallback only. Images compressed to 800px/0.7 before API upload via `compressForApi()`.
- Fix approach: Add user-visible error feedback when `localStorage.setItem` throws `QuotaExceededError`.

**No build system or bundling:**
- Issue: Raw ES modules served directly via importmap. No minification, tree-shaking, code splitting, or dead code elimination. Tailwind runs as Play CDN JIT at runtime (398KB).
- Files: `new-site/public/index.html` (lines 37-44, importmap), `new-site/public/assets/vendor/tailwind.js` (398KB)
- Impact: Every page load downloads and parses ~587KB of vendor JS (Vue 159KB + Vue Router 30KB + Tailwind 398KB) plus all application JS files. No lazy loading of route components -- all 8 page modules are imported eagerly in `app.js:6-13`.
- Fix approach: Introduce Vite as build tool. Move to proper npm dependencies with `npm install`. Enable code splitting per route. Replace Tailwind Play CDN with Tailwind CLI/PostCSS build.

**No TypeScript:**
- Issue: Entire codebase is plain JavaScript with no type annotations, no JSDoc type hints, and no type checking.
- Files: All `.js` files
- Impact: No compile-time error detection. Function signatures are implicit. The `analyzeListingImage` contract in `mock-ai.js` (lines 65-75) has JSDoc but it is the only one in the codebase. Shape of objects like `listing`, `foodInfo`, `user` is enforced only by convention.
- Fix approach: Add `jsconfig.json` with `checkJs: true` and `strict: true` as a zero-cost first step. Gradually migrate critical files to `.ts`.

**Tailwind Play CDN console warning:**
- Issue: `tailwind.js` (the self-hosted Play CDN) emits `cdn.tailwindcss.com should not be used in production` on every page load. Documented in PROJECT_BRIEF.md line 199 but still present.
- Files: `new-site/public/assets/vendor/tailwind.js`
- Impact: Confusing for evaluators checking the browser console. Minor but sloppy for a competition demo.
- Fix approach: Replace with Tailwind CLI build. This also eliminates the 398KB runtime JIT cost.

**Mutable state updates bypass Vue reactivity deep tracking:**
- Issue: `Object.assign(listing, patch)` at `store.js:155` mutates the reactive proxy in-place. While this works for top-level properties, adding new properties to nested objects (e.g., adding `foodInfo` to a listing that did not have it) will not be reactive unless the property already exists on the target.
- Files: `new-site/public/assets/store.js` (lines 152-158, `updateListing`)
- Impact: Edge case where a listing is created without `foodInfo` and later edited to add food info -- the nested `foodInfo` object may not trigger reactivity updates in templates.
- Fix approach: Use `Object.assign` on a new object and reassign, or use Vue's `reactive()` wrapper on nested objects at creation time.

**Seed data timestamps are frozen at module load time:**
- Issue: `const now = Date.now()` at `seed.js:73` is evaluated once when the module first loads. All relative timestamps (`hAgo`, `dAgo`, `hLater`) are computed from that single `now` value and baked into `SEED_LISTINGS`.
- Files: `new-site/public/assets/seed.js` (lines 73-76)
- Impact: If a user opens the page, leaves the tab open for hours, then resets seed data, the timestamps will be stale relative to the current time. The food expiration logic (`sweepExpired`) computes `Date.now()` at invocation time, so expired items will be detected correctly, but "posted 2 hours ago" labels will be inaccurate for long-lived sessions.
- Fix approach: Move timestamp generation into `initIfNeeded()` so seeds are regenerated with fresh timestamps on each reset. Not critical for MVP demo.

**Duplicate page component patterns:**
- Issue: `home.js`, `listings.js`, and `listing-detail.js` each define separate `HomeDesktop`/`HomeMobile`, `isLayoutMobile` branching, etc. The desktop and mobile templates are fully duplicated within each file with `v-if="!isLayoutMobile"` / `v-else` toggling.
- Files: `new-site/public/assets/pages/home.js` (lines 8-215), `new-site/public/assets/pages/listings.js` (lines 115-319), `new-site/public/assets/pages/listing-detail.js` (lines 91-405)
- Impact: Any UI change must be applied twice (once per layout). Template strings inside JS files are not lintable and lack IDE support. `listing-detail.js` has the mobile template at 160+ lines of inline template string.
- Fix approach: Extract shared logic into composables. Use CSS media queries or `<template v-if>` with shared structure. Consider `.vue` SFC files once a build tool is introduced.

**Duplicated filtering logic across pages:**
- Issue: Three different pages implement their own listing filter/sort pipelines with similar but not identical logic.
- Files: `new-site/public/assets/pages/listings.js` (lines 63-93), `new-site/public/assets/pages/admin.js` (lines 18-31), `new-site/public/assets/pages/me-listings.js` (lines 17-23)
- Impact: Bug fixes or filter additions must be applied in three places. The `listings.js` filter supports price range, tags, campus, and sort options; `admin.js` has a simpler subset; `me-listings.js` filters by owner only.
- Fix approach: Extract a shared `useListingsFilter(listings, options)` composable.

## Known Bugs

**SVG placeholder XSS vector:**
- Symptoms: User-controlled emoji from `CATEGORY_MAP[form.category]?.icon` is interpolated directly into an SVG `<text>` element without escaping.
- Files: `new-site/public/assets/pages/publish.js` (lines 115-123, `ensurePlaceholder`)
- Trigger: If a category's `icon` field contained characters like `</text><script>...`, it would break out of the SVG context. Currently mitigated because all category icons in `seed.js:4-11` are hardcoded emoji, but the data model allows arbitrary strings.
- Workaround: None needed currently since icons are hardcoded. Fix by HTML-entity-encoding the icon string before SVG interpolation.

**Food expiration not auto-swept on all paths:**
- Symptoms: `sweepExpired()` is only called on `home.js`, `listings.js`, `listing-detail.js`, `me-listings.js`, and `admin.js` page mounts. It is NOT called on `me.js` or `impact.js`.
- Files: Missing calls in `new-site/public/assets/pages/me.js` and `new-site/public/assets/pages/impact.js`
- Trigger: If a food item expires while the user navigates directly to `/me` or `/impact` without hitting a page that calls `sweepExpired()`, the item will appear as ACTIVE in the user's personal stats until they visit a page that triggers the sweep.
- Workaround: Visit `/listings` or `/` to trigger expiration sweep.

**Active students count is misleading:**
- Symptoms: `activeStudents` computed at `store.js:90-96` counts unique user IDs across ALL listings and carbon records, then floors at 3. It includes users from seed data, giving a false impression of real activity.
- Files: `new-site/public/assets/store.js` (lines 90-96)
- Trigger: Always displays inflated numbers since seed data has 5 users. The `Math.max(set.size, 3)` guarantee means it never shows fewer than 3.
- Workaround: Acceptable for demo. Document clearly that this is a mock metric.

**Price validation gap for SALE mode:**
- Symptoms: The `step3Errors` validation at `publish.js:183` allows `Number(form.price) < 0` to trigger an error but does not validate for non-numeric input when the field is bound with `v-model.number`. If a user types a non-numeric string, Vue's `v-model.number` modifier converts it to `NaN`, which passes the `< 0` check.
- Files: `new-site/public/assets/pages/publish.js` (line 183)
- Trigger: Type non-numeric text into the price field when SALE mode is selected.
- Workaround: Add `|| isNaN(Number(form.price))` to the validation condition.

**`confirm()` dialog blocks UI thread:**
- Symptoms: Browser native `confirm()` is used for destructive actions (remove listing, reset data) in `listing-detail.js:61`, `me-listings.js:37`, `me.js:23`, `admin.js:45,51`.
- Files: `new-site/public/assets/pages/listing-detail.js` (line 61), `new-site/public/assets/pages/me-listings.js` (line 37), `new-site/public/assets/pages/me.js` (line 23), `new-site/public/assets/pages/admin.js` (lines 45, 51)
- Trigger: On mobile, native `confirm()` dialogs are ugly and inconsistent across browsers. They also block the main thread.
- Workaround: Replace with a custom modal component (the codebase already has `ConfirmCompleteDialog` and modal infrastructure).

## Security Considerations

**No input sanitization on user-generated text:**
- Risk: Listing titles, descriptions, swapWanted, contactValue, locationText, and food storageNote are stored raw and rendered with Vue's `{{ }}` interpolation. Vue's template syntax auto-escapes HTML entities, so direct XSS via `<script>` injection is prevented. However, SVG injection (via data URLs in images) and social engineering via crafted text content are not mitigated.
- Files: `new-site/public/assets/pages/publish.js` (form submission at lines 207-228), all listing display templates
- Current mitigation: Vue 3's default text interpolation escaping.
- Recommendations: Add server-side validation and sanitization for all text fields before storage. Implement max-length constraints (currently none enforced in HTML attributes). Add content moderation for production.

**Admin access control is UI-only:**
- Risk: The `/admin` route at `app.js:33` has no route guard. Any user can navigate to `/admin` directly. The admin features (listing removal) are gated by `isAdmin` computed property checking `currentUser.value?.role === 'ADMIN'`, but the page itself renders for all users. The reset button (`admin.js:51-54`) calls `localStorage.clear()` which any user can do via DevTools.
- Files: `new-site/public/assets/app.js` (line 33), `new-site/public/assets/pages/admin.js` (line 56)
- Current mitigation: UI hides admin link for non-admin users in Navbar (`components.js:179`).
- Recommendations: For production, implement route guards and server-side authorization. Acceptable for MVP demo.

**Contact information stored in plain text:**
- Risk: Phone numbers, WeChat IDs, and QQ numbers are stored in localStorage as plain text and displayed directly on listing detail pages. If this were a real deployment, this is PII exposure.
- Files: `new-site/public/assets/pages/listing-detail.js` (lines 272-275), `new-site/public/assets/seed.js` (seed listings with `contactValue` fields)
- Current mitigation: Demo data uses fake values (`demo_alice`, `10000001`, etc.).
- Recommendations: For production, implement in-app messaging to avoid exposing direct contact info. Add privacy consent flow.

**Global debug objects exposed on window:**
- Risk: `window.__store` at `store.js:260-264` and `window.__device` at `device.js:38` expose the entire reactive state store and device state to any script on the page, including browser extensions or injected scripts.
- Files: `new-site/public/assets/store.js` (lines 259-264), `new-site/public/assets/device.js` (lines 37-39)
- Current mitigation: None. Acceptable for demo.
- Recommendations: Guard with `if (import.meta.env?.DEV)` or remove before production deployment.

**No CSRF protection on API endpoints:**
- Risk: Netlify Functions accept POST/PUT/DELETE requests without CSRF tokens. Same-origin policy provides some protection, but cross-site request forgery is possible if a user visits a malicious page while authenticated.
- Files: All `netlify/functions/*.mjs` endpoints
- Current mitigation: Same-origin enforcement by browser; auth token in `Authorization` header (not cookies) reduces cookie-based CSRF risk.
- Recommendations: For production, add CSRF token validation or use `SameSite` cookie attributes.

## Performance Bottlenecks

**Base64 images in localStorage waste ~33% space:**
- Problem: Images are converted to base64 data URLs (JPEG at 0.82 quality, max 1200px) and stored in localStorage. Base64 encoding adds ~33% overhead over raw binary. A single 1200px JPEG at 0.82 quality is typically 100-300KB base64.
- Files: `new-site/public/assets/pages/publish.js` (lines 15-38, `fileToDataURL`)
- Cause: No binary storage option in localStorage. Each image stored as a string.
- Improvement path: Use IndexedDB with Blob storage for images (saves 33% space). Or upload to object storage (S3, R2) and store only URLs.

**No pagination or virtual scrolling:**
- Problem: `listings.js` filter computed at line 63 processes the entire listings array on every reactive change. With 26 seed items this is instant, but at 1000+ listings, the filter/sort chain (Date parsing, string matching, array sorting) will cause visible lag.
- Files: `new-site/public/assets/pages/listings.js` (lines 63-93), `new-site/public/assets/pages/home.js` (lines 11-14)
- Cause: All filtering and sorting happens synchronously in a computed property over the full array.
- Improvement path: Implement pagination or cursor-based loading. Move filtering to a web worker or backend. Use virtual scrolling (e.g., `vue-virtual-scroller`) for the listing grid.

**Tailwind Play CDN JIT at runtime:**
- Problem: The 398KB `tailwind.js` vendor file performs JIT CSS compilation in the browser on every page load. This means CSS generation happens on the client, adding to First Contentful Paint.
- Files: `new-site/public/assets/vendor/tailwind.js` (398KB), `new-site/public/index.html` (line 9)
- Cause: Play CDN is designed for prototyping, not production.
- Improvement path: Replace with Tailwind CLI or PostCSS build step that generates a static CSS file. Eliminates the 398KB JS download and client-side JIT entirely.

**No image lazy loading:**
- Problem: All listing images are loaded eagerly via `<img>` tags with no `loading="lazy"` attribute. On the listings page with 20+ items, all images download immediately.
- Files: `new-site/public/assets/components.js` (line 115, ListingCard), `new-site/public/assets/pages/home.js` (lines 91-92)
- Cause: Missing `loading="lazy"` and `decoding="async"` attributes on `<img>` tags.
- Improvement path: Add `loading="lazy" decoding="async"` to all `<img>` tags. Implement intersection observer for above-the-fold prioritization.

**Eager module loading without code splitting:**
- Problem: All 8 route page modules are imported statically in `app.js:6-13`. Vue Router does not use lazy loading (`() => import(...)`) for any route.
- Files: `new-site/public/assets/app.js` (lines 6-13)
- Cause: No build tool means dynamic `import()` still downloads the full module. Static imports were the pragmatic choice for this architecture.
- Improvement path: With Vite, use `() => import('./pages/home.js')` in route definitions for automatic code splitting.

## Maintainability Issues

**Page files exceed reasonable size with inline templates:**
- Issue: `publish.js` is 612 lines, `listing-detail.js` is 405 lines, `listings.js` is 319 lines. Most of this is inline template strings within JS files, which have no syntax highlighting, no linting, and no auto-formatting.
- Files: `new-site/public/assets/pages/publish.js` (612 lines), `new-site/public/assets/pages/listing-detail.js` (405 lines), `new-site/public/assets/pages/listings.js` (319 lines)
- Impact: Difficult to navigate, review, and maintain. Template typos are not caught until runtime.
- Fix approach: Migrate to `.vue` Single File Components once a build tool is added.

**Magic numbers throughout the codebase:**
- Issue: Numeric constants with no named reference:
  - `700` ms AI delay in `mock-ai.js:78`
  - `1200` px max image size and `0.82` JPEG quality in `publish.js:15,32`
  - `0.95` max confidence cap in `mock-ai.js:118`
  - `0.5` base confidence, `0.1` per image, `0.08` per text unit in `mock-ai.js:115-118`
  - `767` and `1023` breakpoint values in `device.js:5-6`
  - `2200` ms toast duration in `components.js:10`
- Files: Multiple files across the codebase
- Impact: Hard to tune values. Changing one requires finding all instances.
- Fix approach: Extract to named constants at the top of each module or into a shared config file.

**Hardcoded Chinese text in templates:**
- Issue: All UI text (button labels, error messages, placeholders, status labels) is hardcoded directly in template strings. No i18n infrastructure.
- Files: All template strings across all files
- Impact: Not a problem for current scope (Chinese-only campus demo). Would be blocking for any multilingual expansion.
- Fix approach: Not needed for MVP. For production, extract to a locale file.

**No error boundaries or global error handling:**
- Issue: If a component's `setup()` or template throws, the entire Vue app will crash with no recovery path. There is no `app.config.errorHandler` set.
- Files: `new-site/public/assets/app.js` (line 75, `createApp`)
- Impact: A single runtime error in any page component will white-screen the entire application.
- Fix approach: Add `app.config.errorHandler` in `app.js` to log errors and show a fallback UI.

**`components.js` is a catch-all file:**
- Issue: `components.js` at 404 lines contains 12 exported components: Navbar, Footer, Toast, all Badges, FoodSafetyNotice, PaymentBoundaryNotice, ListingCard, ContactModal, ConfirmCompleteDialog, MobileTabBar, MobileTopBar, BottomSheet. No separation by concern.
- Files: `new-site/public/assets/components.js` (404 lines)
- Impact: Importing any single component pulls in all component definitions. No tree-shaking possible without a bundler.
- Fix approach: Split into individual files per component or per concern area (badges, modals, layout).

**No error feedback on save failures:**
- Issue: The `save()` function at `store.js:17-20` catches `localStorage` write failures and logs `console.warn` but does not surface the error to the user. All callers of `persist()` (lines 66-71) assume success.
- Files: `new-site/public/assets/store.js` (lines 17-20, 66-71)
- Impact: User creates/edits a listing, sees the success toast, but the data was never persisted. On page reload, the change is gone.
- Fix approach: Add a reactive error state or toast notification when `save()` fails.

## Missing Infrastructure

**No testing infrastructure:**
- Absent: No test runner (Jest, Vitest, Playwright test framework), no test files, no test configuration. The PROJECT_BRIEF.md mentions a Playwright smoke test at `/tmp/pw-smoke.js` but this is on the server, not in the repo.
- Impact: No way to verify that changes do not break existing functionality. All verification is manual.
- Priority: HIGH -- even basic smoke tests for the 8 routes would catch regressions.

**No CI/CD pipeline:**
- Absent: No GitHub Actions, no deploy scripts, no build pipeline. Deployment appears to be manual file copy to the nginx server.
- Impact: No automated quality gates. Manual deployment is error-prone.
- Priority: MEDIUM for MVP, HIGH for production.

**No linting or formatting tools:**
- Absent: No `.eslintrc`, `biome.json`, `.prettierrc`, or any code quality tooling.
- Impact: No consistent code style enforcement. No detection of common bugs (unused variables, missing returns, etc.).
- Priority: MEDIUM.

**No source map or development tooling:**
- Absent: No source maps, no hot module replacement, no development server. Changes require full page reload.
- Impact: Slower development iteration.
- Priority: LOW for current architecture (MVP demo). Would become HIGH with a build tool.

**SEO and social sharing (mostly resolved):**
- Present: `favicon.svg`, Open Graph meta tags in `index.html` (added 2026-05-08).
- Missing: `robots.txt`, Twitter Card meta tags.
- Impact: WeChat/social media previews now work. Minor gap in Twitter Card support.
- Priority: LOW.

**PWA support (partial):**
- Present: Service worker (`sw.js`) with static asset caching (cache v3) and API network-first strategy. `manifest.json` exists.
- Missing: Offline page fallback for API failures. Service worker caches API GET responses but not full offline workflow.
- Impact: App loads from cache when offline, but listing data and AI features require network.
- Priority: LOW for MVP.

## Scalability Limits

**localStorage 5MB hard limit:**
- Current capacity: 26 seed listings with 2-3 small images each (~50-100KB base64 per image) use approximately 1-2MB.
- Limit: At 50-100 user-created listings with 5 images each, localStorage will overflow. The error is silently caught (`store.js:17-20`) with only a console warning.
- Scaling path: IndexedDB for images (supports 50MB+), or backend storage with image URLs.

**No pagination or infinite scroll:**
- Current capacity: 26 listings render instantly.
- Limit: At 200+ listings, the filter/sort computed at `listings.js:63` will start to show lag. At 1000+, the DOM rendering of all listing cards will cause frame drops.
- Scaling path: Add server-side pagination. Use virtual scrolling for the listing grid.

**No database indexing or search:**
- Current capacity: Full-text search via `.toLowerCase().includes()` over title, description, and location at `listings.js:77-83`.
- Limit: At 500+ listings, string matching on every keystroke (debounce not implemented -- `@input="updateQuery"` fires on every character) will cause noticeable lag.
- Scaling path: Add `lodash.debounce` to search input. Move search to backend with full-text indexing (SQLite FTS5 or Elasticsearch).

**Single-user, single-device architecture:**
- Current capacity: Works for one person in one browser tab.
- Limit: No data sharing between users or devices. No real multi-user capability. Two users on different devices see completely independent data.
- Scaling path: Add backend API with shared database. Implement real user authentication.

**Seed version bump mechanism is fragile:**
- Current capacity: `SEED_VERSION` string at `seed.js:486` must be manually incremented. If forgotten, existing users keep stale data.
- Limit: Any structural change to seed data requires coordinating this version bump. No automated detection of schema changes.
- Scaling path: Use a hash of the seed data as version, or implement migration scripts.

## Dependencies at Risk

**Tailwind Play CDN (self-hosted):**
- Risk: The Play CDN is explicitly not intended for production use. It may be removed or changed without notice. The self-hosted copy at `vendor/tailwind.js` is a snapshot in time and will not receive security or bug fixes.
- Impact: If Tailwind changes class name generation or removes the CDN, the existing copy still works, but no updates are available.
- Migration plan: Replace with Tailwind CSS CLI build (`@tailwindcss/cli` or PostCSS plugin). This also removes the 398KB runtime cost.

**Vue 3 ESM browser build:**
- Risk: The `vue.esm-browser.prod.js` and `vue-router.esm-browser.prod.js` are frozen at version 3.5.13 and 4.5.0 respectively. They are minified production builds with no source maps.
- Impact: Bug fixes and security patches in Vue/Vue Router will not be applied. The versions are recent enough (April 2026) that this is acceptable short-term.
- Migration plan: Introduce npm dependencies and a bundler. Pin versions in `package.json` and update via `npm update`.

## Test Coverage Gaps

**Zero test coverage:**
- What's not tested: Everything. No unit tests, integration tests, or E2E tests exist in the repository.
- Files: All source files
- Risk: Any code change could break existing functionality without detection. The competition demo depends entirely on manual verification.
- Priority: CRITICAL

**Specific untested critical paths:**
- Carbon estimation calculation (`store.js:214-256`): The `calculateCarbonEstimate` function has branching logic for per_kg vs per_item vs food modes. Incorrect carbon numbers directly undermine the project's core value proposition.
- Food expiration sweep (`store.js:113-126`): Time-dependent logic that affects listing visibility. Off-by-one errors in date comparison could show expired food or hide valid food.
- Seed version migration (`store.js:23-52`): The `initIfNeeded()` function handles localStorage state migration. Bugs here could wipe user data or fail to seed.
- Image upload and compression (`publish.js:15-38`): Canvas-based image resizing with async callbacks. Edge cases include non-image files, corrupt images, and browser-specific canvas behavior.

---

*Concerns audit: 2026-05-06*
