# External Integrations

**Analysis Date:** 2026-05-06

## APIs & External Services

**None in current MVP.** The project has zero external API calls, zero network requests beyond serving static files. All data is local.

**Planned future integration (documented, not implemented):**
- AI analysis service - Replace `mock-ai.js` with `fetch('/api/ai/analyze-listing', { method:'POST', body: JSON.stringify(input) })` (see `new-site/PROJECT_BRIEF.md` lines 216-221)
  - nginx proxy config would be added: `location /api/ { proxy_pass http://127.0.0.1:<backend-port>; }`
  - The `analyzeListingImage()` function signature in `new-site/public/assets/mock-ai.js` line 76 is designed as a drop-in replacement boundary

## Data Storage

**Primary storage: Browser localStorage**
- All application data lives entirely in `localStorage` under `tx.*` prefixed keys
- Keys defined in `new-site/public/assets/seed.js` lines 476-483:

| Key | Content | File reference |
|-----|---------|----------------|
| `tx.users` | User[] array | `seed.js` line 477 |
| `tx.listings` | Listing[] array | `seed.js` line 479 |
| `tx.interests` | Interest[] array | `seed.js` line 480 |
| `tx.carbonRecords` | CarbonRecord[] array | `seed.js` line 481 |
| `tx.currentUserId` | Current user ID string | `seed.js` line 478 |
| `tx.seed.version` | Seed data version string | `seed.js` line 482 |

**Storage mechanism:**
- Read: `localStorage.getItem(key)` + `JSON.parse()` in `new-site/public/assets/store.js` lines 8-14
- Write: `JSON.stringify()` + `localStorage.setItem(key)` in `store.js` lines 16-19
- Automatic persistence after every state mutation via `persist()` function at `store.js` lines 65-71

**Seed data initialization:**
- Version-controlled seeding in `store.js` lines 23-52 (`initIfNeeded()`)
- If `tx.seed.version` does not match `SEED_VERSION` constant (`seed.js` line 486), all data is wiped and re-seeded from `SEED_LISTINGS` and `SEED_USERS` arrays
- Current seed version: `2026-04-25-real-photos`

**Image storage:**
- Images stored as base64 data URLs inside localStorage (compressed to max 1200px edge, JPEG 0.82 quality)
- Seed images served as static files from `/assets/seed-images/*.jpg` (referenced via `/assets/seed-images/{name}` path)
- Seed image files: 38 JPEG files in `new-site/public/assets/seed-images/`

**File Storage:**
- No file upload to server. User-uploaded images are converted to base64 in browser and stored in localStorage.
- Seed images are static files committed to the repository.

**Caching:**
- None. No service worker, no HTTP caching headers configured (beyond nginx defaults).
- All data reloads from localStorage on every page load.

**Known limitation:**
- localStorage has a ~5 MB limit per origin. Documented as a scaling concern in `PROJECT_BRIEF.md` line 294: "data exceeding 5MB localStorage limit: consider IndexedDB or a minimal backend (SQLite + Express)"

## Authentication & Identity

**Auth provider:** None. No authentication system.

**Identity mechanism:**
- Client-side user switching via dropdown in Navbar (`new-site/public/assets/components.js` lines 154-208)
- Current user ID stored in `tx.currentUserId` localStorage key
- Default user: `u_alice` (set in `store.js` line 47 and line 51)
- Switch action: `actions.setCurrentUser(id)` in `store.js` lines 130-133

**User roles:**
- `STUDENT` - Standard user (4 seed users)
- `ADMIN` - Admin user with access to `/admin` route (1 seed user: `u_admin`)
- Role-based visibility: admin link shown conditionally in Navbar (`components.js` line 179: `v-if="currentUser?.role === 'ADMIN'"`)

**No session management, no tokens, no cookies, no password.**

## Monitoring & Observability

**Error tracking:** None. No Sentry, no error boundary, no crash reporting.

**Logs:** Console only. Debug utilities exposed on `window`:
- `window.__store` - Direct access to reactive state and actions (`store.js` lines 259-263)
- `window.__device` - Device detection state (`device.js` lines 37-39)
- `console.warn` on localStorage write failure (`store.js` line 18)

## CI/CD & Deployment

**Hosting:**
- AWS EC2 instance, Tokyo region (`ap-northeast-1`)
- nginx static file server
- 4 public IPs on instance; this project uses only `43.206.190.181`

**CI Pipeline:**
- None. No CI/CD configuration detected. No GitHub Actions, no pipeline files.
- Deployment is manual: edit files on server or copy via SSH, nginx serves immediately (hot reload for static content).

**Server configuration:**
- nginx site config: `/etc/nginx/conf.d/new-site.conf`
- SPA fallback: `try_files $uri $uri/ /index.html` (history mode support)
- No HTTPS for this subdomain (HTTP only on port 80)

## Environment Configuration

**Required env vars:** None. No `.env` file, no environment variables.

**Secrets location:** Not applicable. No secrets exist in the project.

**All configuration is code-level:**
- Carbon emission factors: hardcoded in `new-site/public/assets/seed.js` lines 3-18
- Campus locations: hardcoded in `seed.js` lines 58-62
- Seed users: hardcoded in `seed.js` lines 64-70
- Seed listings: hardcoded in `seed.js` lines 83-473
- Tailwind theme: hardcoded in `new-site/public/index.html` lines 10-35

## Webhooks & Callbacks

**Incoming:** None.

**Outgoing:** None. No outbound HTTP requests exist in the codebase.

## Internal Integration Points

**Component-to-Store communication:**
- All page components import reactive `state`, `actions`, computed properties, and utility functions from `new-site/public/assets/store.js`
- Pattern: direct ES module import, no event bus, no provide/inject
- Example: `import { state, actions, currentUser } from '../store.js'` (used in every page file)

**Mock AI boundary:**
- `new-site/public/assets/mock-ai.js` exports `analyzeListingImage(input)` (line 76)
- Called from `new-site/public/assets/pages/publish.js` during the publish workflow
- This function is the designated swap point for replacing mock with real AI backend
- Input schema: `{ images, title, description, category, estimatedWeightKg, foodInfo }`
- Output schema: `{ titleSuggestion, category, isFood, condition, estimatedWeightKg, descriptionSuggestion, estimatedCarbonSavedKg, confidence, assumptions, foodInfoSuggestion }`

**Device detection composable:**
- `new-site/public/assets/device.js` exports `useDevice()` composable
- Returns reactive `{ width, height, isMobile, isTablet, isDesktop, isLayoutMobile }`
- Global singleton state (single resize listener shared across all components)
- Used in `app.js` line 51 and throughout page components for responsive layout switching

**Shared UI components:**
- `new-site/public/assets/components.js` exports reusable components:
  - `Navbar`, `SiteFooter`, `MobileTabBar`, `MobileTopBar` - Layout chrome
  - `ListingCard` - Item preview card
  - `TradeModeBadge`, `StatusBadge`, `CarbonBadge`, `ConditionBadge`, `CategoryBadge` - Data display badges
  - `FoodSafetyNotice`, `PaymentBoundaryNotice` - Legal/compliance notices
  - `ContactModal`, `ConfirmCompleteDialog` - User interaction modals
  - `BottomSheet` - Mobile bottom drawer container
  - `ToastStack` + `toast()` function - Global notification system
  - `toast()` function is imported and called directly from page components (e.g., `publish.js`, `me-listings.js`)

**Seed data to store initialization:**
- `store.js` imports `SEED_USERS`, `SEED_LISTINGS`, `STORAGE_KEYS`, `SEED_VERSION`, `CATEGORY_MAP`, `FOOD_SUBCATS` from `seed.js`
- `initIfNeeded()` in `store.js` lines 23-52 runs at module load time, seeding localStorage if version mismatch
- Carbon records are auto-generated from COMPLETED seed listings (`store.js` lines 27-39)

---

*Integration audit: 2026-05-06*
