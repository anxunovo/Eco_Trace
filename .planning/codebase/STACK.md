# Technology Stack

**Analysis Date:** 2026-05-06 (updated 2026-05-08)

## Languages

**Primary:**
- JavaScript (ES2020+, ES Modules) - All application logic, components, routing, state management, mock AI
- HTML5 - Single entry point SPA shell
- CSS3 - Custom styles, animations, responsive layout utilities

**Secondary:**
- Jinja-style template literals (Vue `<template>` inline strings) - Component templates embedded in `.js` files

## Runtime

**Environment:**
- Frontend: Browser-only SPA (no SSR), served via Netlify CDN
- Backend: Netlify Functions (serverless Node.js, `.mjs` files)
- Database: Turso (cloud SQLite, `@tursodatabase/serverless`)
- AI: ZhipuAI GLM-4V-Flash API (`https://open.bigmodel.cn/api/paas/v4/chat/completions`)

**Package Manager:**
- npm (project root `package.json` with `@tursodatabase/serverless` dependency)
- Frontend vendor files self-hosted in `new-site/public/assets/vendor/` (no bundler)

## Frameworks

**Core:**
- Vue 3.5.13 (ESM browser prod build) - Reactive UI framework, Composition API + Options API hybrid
  - Source: `new-site/public/assets/vendor/vue.esm-browser.prod.js` (159 KB)
- Vue Router 4.5.0 (ESM browser prod build) - SPA client-side routing with HTML5 history mode
  - Source: `new-site/public/assets/vendor/vue-router.esm-browser.prod.js` (30 KB)

**CSS Framework:**
- Tailwind CSS (Play CDN runtime JIT build) - Utility-first CSS via runtime class scanning
  - Source: `new-site/public/assets/vendor/tailwind.js` (398 KB)
  - Custom theme config inline in `new-site/public/index.html` lines 10-35 (leaf color palette, cream background, Chinese font stack)

**Testing:**
- Playwright (external, installed separately) - Smoke tests for route traversal and console error detection
  - Test script location: `/tmp/pw-smoke.js` (referenced in `new-site/PROJECT_BRIEF.md` line 252)
  - No formal test framework (Jest, Vitest, etc.) is present in the project

**Build/Dev:**
- No build toolchain. No bundler, no compiler, no transpiler, no minifier.
- ES Module `<script type="module">` in `index.html` loads modules natively via browser importmap
- Importmap defined in `new-site/public/index.html` lines 37-43 maps `vue` and `vue-router` to local vendor files

## Key Dependencies

**Critical (self-hosted vendor):**
- `vue.esm-browser.prod.js` v3.5.13 - Vue 3 runtime + compiler (reactivity, template compilation, component system)
- `vue-router.esm-browser.prod.js` v4.5.0 - Client-side routing (history mode, route guards, transitions)
  - MUST use prod build; dev build imports `@vue/devtools-api` which is not available (see `PROJECT_BRIEF.md` line 191)
- `tailwind.js` - Tailwind CSS Play CDN runtime JIT (processes utility classes at runtime in browser)

**No runtime npm dependencies.** The project has zero `package.json`.

## Configuration

**Environment:**
- `.env` file at project root (not committed). Required variables:
  - `TURSO_DATABASE_URL` — Turso database connection string
  - `TURSO_AUTH_TOKEN` — Turso auth token
  - `ZHIPUAI_API_KEY` — ZhipuAI API key
- Frontend configuration hardcoded in JavaScript modules:
  - Carbon factors: `new-site/public/assets/seed.js` lines 3-18 (`CATEGORIES`, `FOOD_SUBCATS`)
  - Seed data version: `new-site/public/assets/seed.js` line 486 (`SEED_VERSION`)
  - Tailwind theme: `new-site/public/index.html` lines 10-35
  - Device breakpoints: `new-site/public/assets/device.js` lines 5-6 (`MOBILE_MAX=767`, `TABLET_MAX=1023`)
- AI configuration hardcoded in `netlify/functions/_lib/ai-client.js`:
  - Model: `glm-4v-flash`, temperature: 0.3, max retries: 2
  - Image limit: 1 per request (model constraint), max 5 images per listing
  - Timeout: 25s (AbortController in `ai-analyze.mjs`)

**Build:**
- Netlify Functions bundled via esbuild (configured in `netlify.toml`)
- No frontend build step (raw ES modules served directly)

**Deployment:**
- Netlify (static hosting + serverless functions)
- `netlify.toml`: function bundling, SPA fallback, static asset caching headers
- Service worker (`sw.js`): cache v3, static-first + API network-first strategy

## Module System

**Approach:**
- Native ES Modules with browser importmap
- All `.js` files use `import`/`export` syntax
- Module loading order in `index.html` (lines 53-57):
  1. `seed.js` - Enums, constants, seed data (no dependencies)
  2. `store.js` - Reactive state, actions, carbon calculator (depends on seed.js)
  3. `mock-ai.js` - AI analysis mock (depends on seed.js, store.js)
  4. `components.js` - Shared UI components (depends on seed.js, store.js)
  5. `app.js` - App bootstrap, router setup (depends on all above + page modules)

**Page modules** are imported statically in `app.js` (no code splitting).

**Backend modules** (Netlify Functions):
- Entry points: `netlify/functions/*.mjs` — one file per endpoint
- Shared libs: `netlify/functions/_lib/` — `db.js`, `auth.js`, `response.js`, `ai-client.js`, `ai-calibrator.js`, `carbon-engine.js`

## Platform Requirements

**Development:**
- Any static file server or direct `index.html` open in browser
- No Node.js, no npm install, no build step
- Tested primarily on Chrome/Safari (desktop + mobile)

**Production:**
- nginx on AWS EC2 (Linux, arm64)
- Single HTML entry point with SPA fallback
- All assets under `/assets/` served as static files
- No server-side computation needed (pure static SPA)

---

*Stack analysis: 2026-05-06*
