# Codebase Structure

**Analysis Date:** 2026-05-06

## Directory Layout

```
E:/Research/Eco_Trace/
├── .gitignore                    # Standard ignores (.DS_Store, node_modules, .env)
├── README.md                     # Project overview (Chinese)
├── REQUIREMENTS.md               # Full MVP requirements spec (713 lines, Chinese)
├── .planning/                    # GSD planning documents (generated)
│   └── codebase/
│       ├── ARCHITECTURE.md
│       └── STRUCTURE.md
└── new-site/                     # MVP web application root
    ├── PROJECT_BRIEF.md          # Development brief with deployment info, tech decisions, pitfalls
    └── public/                   # Static site root (nginx document root)
        ├── index.html            # Single HTML entry point (importmap + module scripts)
        └── assets/
            ├── styles.css        # Custom CSS (322 lines) -- badges, modals, mobile layout, animations
            ├── seed.js           # Enums, carbon factors, seed data, storage keys (486 lines)
            ├── store.js          # Reactive state, actions, carbon estimation, persistence (264 lines)
            ├── mock-ai.js        # Mock AI analysis service (133 lines)
            ├── components.js     # Shared Vue components (404 lines)
            ├── app.js            # Vue app bootstrap, router, root component (75 lines)
            ├── device.js         # Device breakpoint detection composable (39 lines)
            ├── pages/
            │   ├── home.js           # Home page -- hero, stats, categories, latest listings (215 lines)
            │   ├── listings.js       # Browse/filter listings with search and facets (319 lines)
            │   ├── listing-detail.js # Single listing detail with image carousel (405 lines)
            │   ├── publish.js        # 4-step publish form with AI integration (612 lines)
            │   ├── me.js             # "My Center" hub page (154 lines)
            │   ├── me-listings.js    # My listings management (152 lines)
            │   ├── impact.js         # Carbon impact dashboard with charts (166 lines)
            │   └── admin.js          # Admin panel with table view (160 lines)
            ├── seed-images/      # 37 JPEG seed photos for demo listings
            │   ├── bag_*.jpg, books_*.jpg, clothes_*.jpg, dorm_*.jpg,
            │   ├── earphones_*.jpg, food_*.jpg, lamp_*.jpg, mouse_*.jpg,
            │   ├── mug_*.jpg, sports_*.jpg, stationery_*.jpg
            └── vendor/           # Self-hosted dependencies (no CDN)
                ├── vue.esm-browser.prod.js          # Vue 3.5.13 (~163 KB)
                ├── vue-router.esm-browser.prod.js   # Vue Router 4.5.0 (~30 KB)
                └── tailwind.js                      # Tailwind CSS Play CDN (~407 KB)
```

## Directory Purposes

**`E:/Research/Eco_Trace/` (project root):**
- Purpose: Repository root containing documentation and the web application
- Contains: `README.md`, `REQUIREMENTS.md`, `.gitignore`
- Key files: `REQUIREMENTS.md` is the authoritative spec (data models, page requirements, AI schema, business rules)

**`E:/Research/Eco_Trace/new-site/`:**
- Purpose: MVP web application -- everything needed to run the demo
- Contains: `PROJECT_BRIEF.md` (deployment notes, tech decisions, known pitfalls), `public/` directory
- Key files: `PROJECT_BRIEF.md` is the developer handbook with server config, data model docs, and debugging tips

**`E:/Research/Eco_Trace/new-site/public/`:**
- Purpose: Static site root served by nginx (`root /home/ec2-user/new-site/public`)
- Contains: `index.html` (sole HTML file), `assets/` directory
- Key files: `index.html` defines the importmap and loads all modules

**`E:/Research/Eco_Trace/new-site/public/assets/`:**
- Purpose: All application source code, styles, and vendor dependencies
- Contains: 6 core JS modules + `pages/` + `vendor/` + `seed-images/` + `styles.css`
- Key files: `app.js` (entry), `store.js` (state), `seed.js` (data), `components.js` (UI), `mock-ai.js` (AI), `device.js` (responsive)

**`E:/Research/Eco_Trace/new-site/public/assets/pages/`:**
- Purpose: Route-level page components (one per route)
- Contains: 8 page modules, each exporting a default Vue component object
- Key files: `publish.js` is the most complex (612 lines, 4-step form); `listing-detail.js` has dual desktop/mobile layouts

**`E:/Research/Eco_Trace/new-site/public/assets/vendor/`:**
- Purpose: Self-hosted JavaScript dependencies to avoid CDN issues in China
- Contains: Vue 3 production ESM build, Vue Router production ESM build, Tailwind CSS Play CDN
- Key files: `vue-router.esm-browser.prod.js` -- MUST be prod build, dev build breaks due to missing `@vue/devtools-api`

**`E:/Research/Eco_Trace/new-site/public/assets/seed-images/`:**
- Purpose: Demo photos for seed listings (37 JPEG files)
- Contains: Category-organized images (books, food, dorm, electronics, clothing, sports, stationery)
- Generated: No, manually curated
- Committed: Yes

## Key File Locations

**Entry Points:**
- `new-site/public/index.html`: Sole HTML file, loads importmap and all `<script type="module">` tags
- `new-site/public/assets/app.js`: Vue app creation, router definition, root component with layout switching

**Configuration:**
- `new-site/public/index.html` (lines 9-35): Tailwind theme config (custom `leaf` color palette, `cream` background, Chinese font stack)
- `new-site/public/assets/seed.js`: All application constants -- categories, carbon factors, trade modes, status labels, campus locations, seed data, storage key names, seed version

**Core Logic:**
- `new-site/public/assets/store.js`: Centralized reactive state (line 56), CRUD actions (line 129), carbon estimation (line 214), localStorage persistence (line 65), food expiry sweep (line 113)
- `new-site/public/assets/mock-ai.js`: AI mock service `analyzeListingImage()` (line 76) -- keyword rules, food subcategory detection, condition guessing

**UI Components:**
- `new-site/public/assets/components.js`: All shared components -- Navbar (line 154), MobileTabBar (line 297), ListingCard (line 99), modals (ContactModal line 249, ConfirmCompleteDialog line 371), BottomSheet (line 348), toast system (line 8), badge components (lines 33-78)

**Testing:**
- Not applicable -- no test files exist in the codebase. Playwright smoke test referenced in `PROJECT_BRIEF.md` is located at `/tmp/pw-smoke.js` on the server (not in repo).

**Styles:**
- `new-site/public/assets/styles.css`: Custom CSS for elements that Tailwind CDN cannot handle -- card hover effects, route transitions, modal/sheet mobile adaptations, toast animations, mobile tab bar, waterfall grid, immersive hero, step indicators

## Module Boundaries

**Data Boundary -- `seed.js` is the leaf:**
- `seed.js` exports only constants and seed data, imports nothing
- Every other module depends on `seed.js` for enums, labels, and configuration
- To modify carbon factors, categories, or seed data: edit only `seed.js` and bump `SEED_VERSION`

**State Boundary -- `store.js` owns all mutations:**
- `store.js` imports from `seed.js` only
- All state mutations go through `actions` object exported from `store.js`
- Pages and components access state via exported `state`, `currentUser`, and computed values
- `persist()` is private to `store.js` -- no external code should write to localStorage directly

**AI Boundary -- `mock-ai.js` has a stable contract:**
- `analyzeListingImage(input)` signature and return schema are documented in `PROJECT_BRIEF.md` section 8
- Only `pages/publish.js` calls this function
- To replace with real AI: change only the function body; keep input/output schema identical

**Layout Boundary -- `device.js` is the single source of truth:**
- `useDevice()` composable returns reactive breakpoint state
- Pages use `isLayoutMobile` to render either `<PageMobile>` or `<PageDesktop>`
- `app.js` uses `isLayoutMobile` to toggle Navbar/SiteFooter vs MobileTabBar
- Mobile breakpoint: <= 767px; tablet (768-1023) shares desktop layout

## Public Assets

**`new-site/public/assets/seed-images/`:**
- 37 JPEG files organized by category prefix (e.g., `books_1.jpg`, `food_fruit_2.jpg`)
- Referenced via `/assets/seed-images/{name}` paths in `seed.js`
- Used as demo listing photos in seed data
- Not generated -- curated static images

**`new-site/public/assets/vendor/`:**
- 3 JavaScript files: `vue.esm-browser.prod.js`, `vue-router.esm-browser.prod.js`, `tailwind.js`
- Self-hosted to avoid CDN blocking in China (see `PROJECT_BRIEF.md` section 7)
- Referenced via importmap in `index.html` and direct `<script src>` for Tailwind

## Configuration Files

**`new-site/public/index.html`:**
- Tailwind theme configuration (inline `<script>` block, lines 10-35): custom colors (`leaf` 50-900, `cream`), Chinese font family
- Importmap (lines 37-44): maps `vue` and `vue-router` to self-hosted vendor files
- Viewport meta (line 5): `viewport-fit=cover, user-scalable=no` for iPhone safe area support

**`new-site/public/assets/seed.js`:**
- `SEED_VERSION` (line 486): Version string `'2026-04-25-real-photos'` -- bump this when changing seed data structure to force client reset
- `STORAGE_KEYS` (lines 476-483): localStorage key names prefixed with `tx.`
- `CATEGORIES` (lines 3-11): 7 categories with carbon factors, modes, and substitution rates
- `FOOD_SUBCATS` (lines 13-18): 4 food subcategories with per-kg carbon factors

**`.gitignore`:**
- Ignores: `.DS_Store`, `Thumbs.db`, `*.log`, `node_modules/`, `.env`, `.env.local`

**No other config files exist:**
- No `package.json`, `tsconfig.json`, `.eslintrc`, `vite.config.*`, `webpack.config.*`
- No build tooling -- the app runs directly as static files
- No Node.js runtime required for development

## Naming Conventions

**Files:**
- Page components: `kebab-case.js` (e.g., `listing-detail.js`, `me-listings.js`)
- Core modules: `kebab-case.js` (e.g., `mock-ai.js`)
- Single-word modules: lowercase (e.g., `store.js`, `seed.js`, `device.js`, `components.js`, `app.js`)
- Vendor files: Keep original package names (e.g., `vue.esm-browser.prod.js`)

**Directories:**
- `pages/` for route-level components
- `vendor/` for third-party self-hosted libraries
- `seed-images/` for demo asset images

**Exports:**
- Page components: `export default { ... }` (Vue component options object)
- Core modules: Named exports (`export const state`, `export function calculateCarbonEstimate`)
- Components: Named exports per component (`export const Navbar`, `export const ListingCard`)

## Where to Add New Code

**New Route/Page:**
1. Create `new-site/public/assets/pages/{name}.js` exporting a default Vue component
2. Import it in `new-site/public/assets/app.js` and add to `routes` array (line 25)
3. Add nav link in `components.js` `Navbar` template (line 173) and `MobileTabBar` template (line 298)

**New Shared Component:**
1. Add to `new-site/public/assets/components.js` as a named export
2. Import in the page component(s) that need it

**New Data Entity or Enum:**
1. Add constants to `new-site/public/assets/seed.js`
2. Bump `SEED_VERSION` to force client data reset
3. Add seed data to `SEED_LISTINGS` or `SEED_USERS` if needed

**New State Action:**
1. Add function to `actions` object in `new-site/public/assets/store.js`
2. Follow pattern: mutate `state`, call `persist()`, return result

**New CSS Styles:**
1. Add to `new-site/public/assets/styles.css` -- Tailwind `@apply` does NOT work with Play CDN in external CSS
2. Use Tailwind utility classes directly in component templates for standard styling

**Replace Mock AI with Real AI:**
1. Replace body of `analyzeListingImage()` in `new-site/public/assets/mock-ai.js`
2. Keep function signature and return schema unchanged
3. Add nginx proxy rule for `/api/` if needed (documented in `PROJECT_BRIEF.md` section 8)

## Special Directories

**`new-site/public/assets/vendor/`:**
- Purpose: Self-hosted JavaScript framework dependencies
- Generated: No -- manually downloaded from CDN/package registries
- Committed: Yes -- must stay in repo; do NOT switch back to CDN references

**`new-site/public/assets/seed-images/`:**
- Purpose: Demo product photos for seed listings
- Generated: No -- manually curated JPEG images
- Committed: Yes -- referenced by seed data

**`.planning/`:**
- Purpose: GSD workflow planning documents
- Generated: Yes -- created by codebase mapping tools
- Committed: No (not in `.gitignore` but typically excluded from commits)

---

*Structure analysis: 2026-05-06*
