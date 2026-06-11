const CACHE_NAME = 'ecotrace-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/styles.css',
  '/assets/seed.js',
  '/assets/store.js',
  '/assets/api-adapter.js',
  '/assets/mock-ai.js',
  '/assets/components.js',
  '/assets/app.js',
  '/assets/charts.js',
  '/assets/image-utils.js',
  '/assets/device.js',
  '/assets/offline-db.js',
  '/assets/carbon-coefficients.js',
  '/assets/share-card.js',
  '/assets/pages/home.js',
  '/assets/pages/demo.js',
  '/assets/pages/listings.js',
  '/assets/pages/listing-detail.js',
  '/assets/pages/publish.js',
  '/assets/pages/me.js',
  '/assets/pages/me-listings.js',
  '/assets/pages/impact.js',
  '/assets/pages/admin.js',
  '/assets/pages/auth.js',
  '/assets/pages/scan.js',
  '/assets/pages/carbon-report.js',
  '/assets/pages/calculator.js',
  '/assets/pages/eco-tips.js',
  '/assets/vendor/vue.esm-browser.prod.js',
  '/assets/vendor/vue-router.esm-browser.prod.js',
  '/assets/vendor/tailwind.js',
  '/assets/vendor/chart.umd.js',
  '/assets/vendor/html2canvas.js',
  '/assets/icon.svg',
  '/assets/icon-maskable.svg',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static, network-first for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API GET requests: network-first, cache fallback (POST/PUT/DELETE bypass cache entirely)
  if (url.pathname.startsWith('/api/')) {
    if (event.request.method !== 'GET') {
      event.respondWith(fetch(event.request));
      return;
    }
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets: cache-first, network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
