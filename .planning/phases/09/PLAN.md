# Phase 9: PWA Foundation

## Goal
App works offline and can be installed on mobile devices.

## Success Criteria
1. Browser shows "Add to Home Screen" prompt with app icon
2. App loads and browses listing pages when offline (IndexedDB cache)
3. Service Worker caches all static assets
4. App manifest with correct name, icons, theme color

## Implementation

### Step 1: manifest.json
- name, short_name, description, start_url, display: standalone
- theme_color: #3f9451, background_color: #f7f5ee
- SVG icons (icon.svg, icon-maskable.svg)
- lang: zh-CN

### Step 2: Service Worker (sw.js)
- Install: precache all static assets (JS modules, CSS, vendors)
- Activate: clean old caches
- Fetch: cache-first for static, network-first for API/CDN
- Registered in index.html

### Step 3: PWA meta tags in index.html
- manifest link, theme-color, apple-mobile-web-app-capable
- favicon (SVG), apple-touch-icon
- Service worker registration script

### Step 4: IndexedDB offline layer (offline-db.js)
- Store listings and dashboard data
- Cache on successful API fetch
- Serve from cache when offline
- Integrated into home.js loadApiData()

### Step 5: netlify.toml headers
- sw.js: no-cache (always fresh)
- manifest.json: 1hr cache

## Files Changed
- `new-site/public/manifest.json` — NEW
- `new-site/public/sw.js` — NEW
- `new-site/public/assets/offline-db.js` — NEW
- `new-site/public/assets/icon.svg` — NEW
- `new-site/public/assets/icon-maskable.svg` — NEW
- `new-site/public/index.html` — PWA meta tags + SW registration
- `new-site/public/assets/pages/home.js` — offline data caching
- `netlify.toml` — cache headers
