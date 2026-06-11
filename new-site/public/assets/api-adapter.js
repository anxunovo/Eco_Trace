const API = {
  listings: '/api/listings',
  listing: '/api/listing',
  create: '/api/listings/create',
  update: '/api/listings/update',
  delete: '/api/listings/delete',
  complete: '/api/listings',
  interests: '/api/interests',
  carbonStats: '/api/carbon/stats',
  dashboard: '/api/dashboard',
  userProfile: '/api/user/profile',
  aiAnalyze: '/api/ai/analyze',
  authRegister: '/api/auth/register',
  authLogin: '/api/auth/login',
  authMe: '/api/auth/me',
  adminListings: '/api/admin/listings',
  adminReset: '/api/admin/reset',
};

let _apiAvailable = null;
let _apiCheckedAt = 0;
const API_PROBE_TTL = 30_000;

function getToken() {
  return localStorage.getItem('tx.auth_token') || '';
}

function setToken(token) {
  localStorage.setItem('tx.auth_token', token);
}

function clearToken() {
  localStorage.removeItem('tx.auth_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function parseJson(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function pick(row, camelKey, snakeKey) {
  return row[camelKey] ?? row[snakeKey];
}

function normalizeListing(row) {
  if (!row) return row;
  const rawIsFood = row.isFood ?? row.is_food;
  const isFood = rawIsFood === true || rawIsFood === 1 || rawIsFood === '1';
  const owner = row.owner || ((row.nickname || row.avatar) ? { nickname: row.nickname, avatar: row.avatar } : undefined);

  return {
    ...row,
    id: row.id,
    ownerId: pick(row, 'ownerId', 'owner_id'),
    title: row.title,
    description: row.description,
    category: row.category,
    tradeMode: pick(row, 'tradeMode', 'trade_mode'),
    price: row.price,
    swapWanted: pick(row, 'swapWanted', 'swap_wanted'),
    condition: row.condition,
    campus: row.campus,
    locationText: pick(row, 'locationText', 'location_text'),
    contactMethod: pick(row, 'contactMethod', 'contact_method'),
    contactValue: pick(row, 'contactValue', 'contact_value'),
    images: parseJson(row.images, []),
    estimatedWeightKg: pick(row, 'estimatedWeightKg', 'estimated_weight_kg'),
    estimatedCarbonSavedKg: pick(row, 'estimatedCarbonSavedKg', 'estimated_carbon_saved_kg'),
    aiConfidence: pick(row, 'aiConfidence', 'ai_confidence'),
    aiAssumptions: parseJson(pick(row, 'aiAssumptions', 'ai_assumptions'), []),
    isFood,
    foodInfo: parseJson(pick(row, 'foodInfo', 'food_info'), null),
    tags: parseJson(row.tags, []),
    interestedCount: pick(row, 'interestedCount', 'interested_count'),
    status: row.status,
    createdAt: pick(row, 'createdAt', 'created_at'),
    updatedAt: pick(row, 'updatedAt', 'updated_at'),
    completedAt: pick(row, 'completedAt', 'completed_at'),
    owner,
  };
}

function normalizeListingResponse(res) {
  if (!res) return res;
  const next = { ...res };
  if (Array.isArray(next.listings)) next.listings = next.listings.map(normalizeListing);
  if (Array.isArray(next.data)) next.data = next.data.map(normalizeListing);
  if (next.listing) next.listing = normalizeListing(next.listing);
  return next;
}

async function probeApi() {
  try {
    const res = await fetch(API.listings, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });
    if (res.status === 404) {
      const text = await res.text().catch(() => '');
      if (text.includes('Static demo mode')) return false;
    }
    return res.ok || res.status === 400;
  } catch {
    return false;
  }
}

async function ensureApi() {
  if (_apiAvailable === null || Date.now() - _apiCheckedAt > API_PROBE_TTL) {
    _apiAvailable = await probeApi();
    _apiCheckedAt = Date.now();
  }
  return _apiAvailable;
}

async function fetchJson(url, options = {}) {
  const { headers, ...rest } = options;
  const res = await fetch(url, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...headers },
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404 && text.includes('Static demo mode')) {
      _apiAvailable = false;
      return null;
    }
    if (res.status === 401) clearToken();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export async function isApiMode() {
  return ensureApi();
}

export async function fetchListings(params = {}) {
  if (!(await ensureApi())) return null;
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.campus) qs.set('campus', params.campus);
  if (params.tradeMode) qs.set('tradeMode', params.tradeMode);
  if (params.q) qs.set('q', params.q);
  if (params.status) qs.set('status', params.status);
  if (params.ownerId) qs.set('ownerId', params.ownerId);
  if (params.page) qs.set('page', params.page);
  if (params.limit) qs.set('limit', params.limit);
  return normalizeListingResponse(await fetchJson(`${API.listings}?${qs}`));
}

export async function fetchListingDetail(id) {
  if (!(await ensureApi())) return null;
  return normalizeListingResponse(await fetchJson(`${API.listing}?id=${encodeURIComponent(id)}`));
}

export async function createListing(draft) {
  if (!(await ensureApi())) return null;
  return fetchJson(API.create, {
    method: 'POST',
    body: JSON.stringify(draft),
  });
}

export async function updateListing(id, patch) {
  if (!(await ensureApi())) return null;
  return fetchJson(`${API.update}?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}

export async function deleteListing(id) {
  if (!(await ensureApi())) return null;
  return fetchJson(`${API.delete}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function completeListing(id) {
  if (!(await ensureApi())) return null;
  return normalizeListingResponse(await fetchJson(`${API.complete}/${encodeURIComponent(id)}/complete`, {
    method: 'POST',
  }));
}

export async function submitInterest(listingId, message) {
  if (!(await ensureApi())) return null;
  return fetchJson(`${API.interests}?listingId=${encodeURIComponent(listingId)}`, {
    method: 'POST',
    body: JSON.stringify({ listingId, message: message || '' }),
  });
}

export async function fetchCarbonStats(scope = 'user', period = 'all') {
  if (!(await ensureApi())) return null;
  return fetchJson(`${API.carbonStats}?scope=${scope}&period=${period}`);
}

export async function fetchCarbonRecords(limit = 200) {
  if (!(await ensureApi())) return null;
  // The current API exposes aggregate carbon stats, not a record-list endpoint.
  // Keep this adapter export for store sync compatibility without clearing local demo records.
  await fetchCarbonStats('global', 'all').catch(() => null);
  return null;
}

export async function getDashboard() {
  if (!(await ensureApi())) return null;
  return fetchJson(API.dashboard);
}

export async function fetchUserProfile() {
  if (!(await ensureApi())) return null;
  return fetchJson(API.userProfile);
}

export async function fetchAdminListings() {
  if (!(await ensureApi())) return null;
  return normalizeListingResponse(await fetchJson(API.adminListings));
}

export async function removeAdminListing(id) {
  if (!(await ensureApi())) return null;
  return fetchJson(`${API.adminListings}/${encodeURIComponent(id)}/remove`, {
    method: 'PUT',
  });
}

export async function resetAdminData() {
  if (!(await ensureApi())) return null;
  return fetchJson(API.adminReset, {
    method: 'POST',
  });
}

export async function analyzeWithAI({ images, title, description, category }) {
  if (!(await ensureApi())) return null;
  const res = await fetchJson(API.aiAnalyze, {
    method: 'POST',
    body: JSON.stringify({ images, title, description, category }),
  });
  return {
    titleSuggestion: res.titleSuggestion || title || '',
    category: res.category || category || 'OTHER',
    isFood: res.isFood || res.category === 'FOOD',
    condition: res.condition || 'GOOD',
    estimatedWeightKg: res.estimatedWeightKg || 0,
    descriptionSuggestion: res.descriptionSuggestion || description || '',
    estimatedCarbonSavedKg: res.carbonSavedEstimate?.amount ?? 0,
    confidence: res.confidence ?? 0,
    assumptions: res.assumptions || [],
    foodInfoSuggestion: res.foodInfoSuggestion || undefined,
  };
}

// Auth
export async function register({ nickname, password }) {
  if (!(await ensureApi())) return null;
  const res = await fetchJson(API.authRegister, {
    method: 'POST',
    body: JSON.stringify({ nickname, password }),
  });
  if (res.token) setToken(res.token);
  return res;
}

export async function login({ nickname, password }) {
  if (!(await ensureApi())) return null;
  const res = await fetchJson(API.authLogin, {
    method: 'POST',
    body: JSON.stringify({ nickname, password }),
  });
  if (res.token) setToken(res.token);
  return res;
}

export async function getMe() {
  if (!(await ensureApi())) return null;
  return fetchJson(API.authMe);
}

export function logout() {
  clearToken();
}

export { getToken, setToken };
