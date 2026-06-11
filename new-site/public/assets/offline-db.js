// IndexedDB offline data layer for EcoTrace

const DB_NAME = 'ecotrace-offline';
const DB_VERSION = 2;
const IMAGE_STORE = 'listing_images';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('listings')) {
        db.createObjectStore('listings', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('dashboard')) {
        db.createObjectStore('dashboard', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheListings(listings) {
  try {
    const db = await openDB();
    const tx = db.transaction('listings', 'readwrite');
    const store = tx.objectStore('listings');
    for (const item of listings) {
      store.put(item);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

export async function getCachedListings() {
  try {
    const db = await openDB();
    const tx = db.transaction('listings', 'readonly');
    const store = tx.objectStore('listings');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch { return []; }
}

export async function cacheDashboard(data) {
  try {
    const db = await openDB();
    const tx = db.transaction('dashboard', 'readwrite');
    tx.objectStore('dashboard').put({ key: 'main', ...data, cachedAt: Date.now() });
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

export async function getCachedDashboard() {
  try {
    const db = await openDB();
    const tx = db.transaction('dashboard', 'readonly');
    return new Promise((resolve, reject) => {
      const req = tx.objectStore('dashboard').get('main');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch { return null; }
}

// ---------- Listing images (base64 data URLs) ----------
// Images stored separately to avoid bloating localStorage.

function ensureImageStore() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let _imageStoreReady = null;
function getImageDB() {
  if (!_imageStoreReady) _imageStoreReady = ensureImageStore();
  return _imageStoreReady;
}

export async function saveImages(listingId, images) {
  try {
    const db = await getImageDB();
    const tx = db.transaction(IMAGE_STORE, 'readwrite');
    tx.objectStore(IMAGE_STORE).put({ id: listingId, images });
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => { console.warn('[offline-db] saveImages failed:', tx.error); reject(tx.error); };
    });
  } catch (e) { console.warn('[offline-db] saveImages error:', e); }
}

export async function getImages(listingId) {
  try {
    const db = await getImageDB();
    const tx = db.transaction(IMAGE_STORE, 'readonly');
    return new Promise((resolve, reject) => {
      const req = tx.objectStore(IMAGE_STORE).get(listingId);
      req.onsuccess = () => resolve(req.result?.images || []);
      req.onerror = () => { console.warn('[offline-db] getImages failed:', req.error); reject(req.error); };
    });
  } catch (e) { console.warn('[offline-db] getImages error:', e); return []; }
}

export async function deleteImages(listingId) {
  try {
    const db = await getImageDB();
    const tx = db.transaction(IMAGE_STORE, 'readwrite');
    tx.objectStore(IMAGE_STORE).delete(listingId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) { console.warn('[offline-db] deleteImages error:', e); }
}
