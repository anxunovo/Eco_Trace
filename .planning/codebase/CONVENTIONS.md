# Coding Conventions

**Analysis Date:** 2026-05-06

## Naming Patterns

**Files:**
- Use kebab-case for all `.js` files: `listing-detail.js`, `me-listings.js`, `mock-ai.js`, `seed-images/`
- Page components live under `new-site/public/assets/pages/` with short descriptive names: `home.js`, `listings.js`, `impact.js`
- Shared modules at `new-site/public/assets/` level: `store.js`, `components.js`, `seed.js`, `device.js`

**Functions:**
- Use camelCase for all functions and variables: `calculateCarbonEstimate()`, `sweepExpired()`, `fileToDataURL()`, `guessCategory()`
- Vue composable functions use `use` prefix: `useDevice()` in `new-site/public/assets/device.js`
- Action methods are plain verbs: `setCurrentUser()`, `createListing()`, `removeListing()`, `completeListing()`

**Variables:**
- camelCase for mutable/reactive state: `state`, `currentUser`, `totalCarbonSaved`, `form`, `filterOpen`
- ref() variables use short names: `q`, `msg`, `step`, `showContact`, `aiLoading`
- Boolean refs use `is`/`show` prefix: `isOwner`, `isLayoutMobile`, `showUserMenu`, `showComplete`

**Constants/Enums:**
- UPPER_SNAKE_CASE for exported constants that are enum-like or config: `CATEGORIES`, `TRADE_MODES`, `CONDITIONS`, `STATUS_LABELS`, `FOOD_SUBCATS`, `CAMPUS_LOCATIONS`, `STORAGE_KEYS`, `SEED_VERSION`, `HOME_ENTRIES`
- Mapped lookup objects use `_MAP` suffix: `CATEGORY_MAP`
- Breakpoint constants: `MOBILE_MAX`, `TABLET_MAX` (line 6-7, `new-site/public/assets/device.js`)

**Vue Components:**
- PascalCase for all component objects: `ListingCard`, `TradeModeBadge`, `MobileTabBar`, `FoodSafetyNotice`, `PaymentBoundaryNotice`, `ConfirmCompleteDialog`
- Internal layout variants use suffix: `HomeDesktop`, `HomeMobile` (in `new-site/public/assets/pages/home.js`)
- Page-level components use `export default { ... }` (anonymous default export)

**IDs:**
- Seed IDs use prefixed short strings: `u_alice`, `l_001`, `c_seed_l_023`
- Generated IDs use `uid()` function with prefix + timestamp-base36 + random: `l_m1abc2d3ef`, `c_m1abc2d3ef`, `i_m1abc2d3ef` (line 102-103, `new-site/public/assets/store.js`)

## Code Style

**Formatting:**
- No build tools, no linter, no formatter configured
- 2-space indentation throughout all files
- Single quotes for strings (consistent): `'COMPLETED'`, `'ACTIVE'`, `'微信'`
- Semicolons used at end of statements (consistent)
- Trailing commas used in object/array literals (consistent)
- Template literals for multi-line Vue templates (all components use backtick template strings)

**Indentation:**
- JS: 2 spaces consistently
- HTML (`index.html`): 4 spaces
- CSS (`styles.css`): 2 spaces
- Vue template strings: 2 spaces for inner markup

**Line Length:**
- No enforced limit; some template strings run very long (200+ chars for inline Tailwind classes)
- Component template strings are typically the full component in one backtick block

**No TypeScript:**
- Entire codebase is plain JavaScript with no type annotations
- No JSDoc type annotations except one function (`analyzeListingImage` in `new-site/public/assets/mock-ai.js`, lines 65-75)

## Import Organization

**Order (consistent across all files):**
1. Vue core (`import { ref, computed, ... } from 'vue'`)
2. Vue Router (`import { useRoute, useRouter } from 'vue-router'`)
3. Internal store (`import { state, actions, currentUser, ... } from '../store.js'` or `'./store.js'`)
4. Internal seed/data (`import { CATEGORIES, CATEGORY_MAP, ... } from '../seed.js'`)
5. Internal components (`import { ListingCard, BottomSheet, ... } from '../components.js'`)
6. Internal composables (`import { useDevice } from '../device.js'`)

**Path Style:**
- Relative paths with explicit `.js` extension: `'../store.js'`, `'./components.js'`, `'./pages/home.js'`
- No path aliases
- Importmap used only for Vue and Vue Router bare specifiers in `new-site/public/index.html` (lines 37-44)

**Module System:**
- ES Modules (`import`/`export`) throughout
- All exports are named (except page components which use `export default`)
- Barrel-style not used; each file exports its own symbols directly

## Error Handling

**Patterns:**
- localStorage access wrapped in try/catch with silent fallback (lines 8-15, `new-site/public/assets/store.js`):
  ```js
  const load = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  ```
- localStorage write failures logged to `console.warn` (line 18, `new-site/public/assets/store.js`):
  ```js
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {
    console.warn('[store] localStorage write failed:', e);
  }
  ```
- Image upload errors caught and shown via toast (lines 99-104, `new-site/public/assets/pages/publish.js`):
  ```js
  try {
    const url = await fileToDataURL(f);
    form.images.push(url);
  } catch (err) {
    toast('Image upload failed: ' + err.message, 'danger');
  }
  ```
- AI analysis errors caught and shown via toast (lines 156-158, `new-site/public/assets/pages/publish.js`):
  ```js
  } catch (e) {
    toast('Recognition failed: ' + e.message, 'danger');
  }
  ```
- No global error boundary or Vue error handler configured
- No network error handling (no API calls exist yet)
- `confirm()` used for destructive actions like "remove listing" (e.g., line 61, `new-site/public/assets/pages/listing-detail.js`)

**What's NOT handled:**
- No null-check patterns on store lookups before use in templates (relies on optional chaining `?.` in templates)
- No validation error display pattern beyond inline computed arrays (`step3Errors` in `publish.js`)
- No loading/error states for data fetching (all data is synchronous from localStorage)

## Logging

**Framework:** `console.warn` only (one instance), no structured logging

**Patterns:**
- Only one `console.warn` in production code: localStorage quota exceeded warning (`new-site/public/assets/store.js`, line 18)
- Dev-only debug surfaces attached to `window`:
  - `window.__store` in `new-site/public/assets/store.js` (lines 259-263)
  - `window.__device` in `new-site/public/assets/device.js` (lines 37-39)

## Comments

**Language:** Chinese throughout (both comments and UI strings)

**When to Comment:**
- Section dividers with `// ----------` pattern and Chinese description:
  ```js
  // ---------- Toast ----------
  // ---------- localStorage helpers ----------
  // ---------- Reactive state ----------
  ```
- Brief intent comments inline: `// Scan expired food` (line 112, store.js), `// Demo value` (line 92, store.js)
- JSDoc: Only on `analyzeListingImage()` in `new-site/public/assets/mock-ai.js` (lines 65-75) -- the only function with a JSDoc block

**What's NOT Commented:**
- Most functions have no comments
- Vue component templates have no comments
- CSS has brief Chinese comments for major sections (lines 1, 10, 20, etc., `styles.css`)

## CSS Approach

**Primary: Tailwind CSS utility classes via CDN**
- Tailwind loaded via self-hosted Play CDN in `new-site/public/index.html` (line 9)
- Custom theme extension for `leaf` color palette (green) and `cream` background (lines 11-34, `index.html`)
- Font stack: `-apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei` (line 30, `index.html`)
- All layout, spacing, typography, and color done via Tailwind utility classes inline in templates

**Secondary: Custom CSS in `new-site/public/assets/styles.css` (322 lines)**
- Used for things Tailwind cannot express: animations, scrollbar styling, complex selectors, pseudo-elements
- Naming: kebab-case with descriptive names: `card-hover`, `hero-bg`, `modal-mask`, `modal-panel`, `tab-bar`, `tab-item`, `pill-row`, `waterfall`, `mobile-search`, `immersive-hero`, `mobile-fixed-cta`, `sheet-mask`, `sheet`, `sheet-handle`
- No BEM, no CSS Modules, no scoped styles
- `@media (max-width: 767px)` used for responsive modal behavior (line 79, `styles.css`)
- CSS custom properties for safe areas and tab bar height (lines 117-121, `styles.css`):
  ```css
  :root {
    --tab-bar-h: 56px;
    --safe-b: env(safe-area-inset-bottom, 0px);
    --safe-t: env(safe-area-inset-top, 0px);
  }
  ```
- Mobile body class toggled by JS: `body.is-mobile` pattern (line 124, `styles.css`)

**Tailwind Custom Classes:**
- `leaf-{50..900}`: Green palette for brand identity
- `cream`: Background color (`#f7f5ee`)
- Badge styling done via Tailwind classes in component templates, not CSS: `bg-leaf-100 text-leaf-700`, `bg-amber-100 text-amber-700`

## Common Patterns

**Device-Adaptive Layout (split component pattern):**
Every major page has TWO internal components (desktop vs mobile) dispatched by `isLayoutMobile`:
```js
// new-site/public/assets/pages/home.js, lines 204-215
export default {
  components: { HomeDesktop, HomeMobile },
  setup() {
    const { isLayoutMobile } = useDevice();
    return { isLayoutMobile };
  },
  template: `
    <home-mobile v-if="isLayoutMobile" />
    <home-desktop v-else />
  `,
};
```
For simpler pages, a single template uses `v-if="!isLayoutMobile"` / `v-else` blocks (e.g., `listings.js`, `listing-detail.js`).

**Reactive Store Pattern (single-source-of-truth with localStorage persistence):**
```js
// new-site/public/assets/store.js
export const state = reactive({ users: [...], listings: [...], ... });
function persist() {
  save(STORAGE_KEYS.users, state.users);
  // ...save all keys
}
export const actions = {
  createListing(draft) { /* mutate state, then persist() */ },
  // ...
};
```
All mutations go through `actions` which call `persist()` after modifying `state`. No Vuex/Pinia.

**Computed Derivations:**
```js
export const currentUser = computed(() =>
  state.users.find(u => u.id === state.currentUserId) || state.users[0]
);
export const totalCarbonSaved = computed(() =>
  round1(state.carbonRecords.reduce((s, r) => s + (r.carbonSavedKg || 0), 0))
);
```

**Toast Notifications:**
Global reactive toast system in `new-site/public/assets/components.js` (lines 8-30):
```js
export const toasts = reactive({ items: [] });
export function toast(message, type = 'ok', ms = 2200) { /* push + setTimeout remove */ }
```
Usage: `toast('message', 'warn')`, `toast('message', 'danger')`.

**Form Validation (computed error array):**
```js
// new-site/public/assets/pages/publish.js, lines 178-191
const step3Errors = computed(() => {
  const errs = [];
  if (!form.title?.trim()) errs.push('Please fill in title');
  // ...
  return errs;
});
```
Buttons disabled when `step3Errors.length > 0`.

**Badge Components (reusable display-only):**
`TradeModeBadge`, `StatusBadge`, `CarbonBadge`, `ConditionBadge`, `CategoryBadge` -- all defined in `new-site/public/assets/components.js`. Accept props, compute display text/color, render a `<span class="badge">`.

**Seed Data Versioning:**
```js
// new-site/public/assets/seed.js
export const SEED_VERSION = '2026-04-25-real-photos';
// new-site/public/assets/store.js
function initIfNeeded() {
  if (localStorage.getItem(STORAGE_KEYS.version) !== SEED_VERSION) {
    // overwrite all localStorage with fresh seed data
  }
}
```

**Inline Templates:**
All Vue component templates are inline backtick strings within the component object. No `.vue` single-file components. Largest template: `publish.js` (~350 lines of template string in a 612-line file).

## Function Design

**Size:** Functions are typically short (5-30 lines). The `setup()` functions in page components are the longest (50-100+ lines) because they aggregate refs, computed properties, and actions.

**Parameters:** Functions take minimal parameters. Store actions take entity IDs and patch objects. The `calculateCarbonEstimate()` function takes a single input object (line 214, `store.js`).

**Return Values:** Actions return the created/modified entity or `null` on failure. Computed properties return derived values. No explicit error codes.

## Module Design

**Exports:** Each file exports its public API via named `export`. Page components use `export default`. No barrel/index files.

**Dependency Graph:**
```
index.html
  -> seed.js (data, constants, enums)
  -> store.js (state, actions, computed -- imports seed.js)
  -> mock-ai.js (AI mock -- imports seed.js, store.js)
  -> components.js (shared UI -- imports seed.js, store.js)
  -> device.js (composable -- standalone)
  -> app.js (router, mount -- imports everything)
  -> pages/*.js (page components -- import store, seed, components, device)
```

**Key rule:** `seed.js` has zero imports (leaf node). `store.js` imports only `seed.js`. Page files import from `store.js`, `seed.js`, `components.js`, and `device.js`.

---

*Convention analysis: 2026-05-06*
