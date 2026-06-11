import { reactive, computed } from 'vue';
import {
  SEED_USERS, SEED_LISTINGS, STORAGE_KEYS, SEED_VERSION,
  FOOTPRINT_FACTORS, CARBON_EQUIVALENTS, SEED_ECO_TIPS,
  estimateCarbonFromCatalog,
} from './seed.js';
import {
  isApiMode, fetchListings, fetchListingDetail,
  createListing as apiCreateListing,
  updateListing as apiUpdateListing,
  deleteListing as apiDeleteListing,
  fetchCarbonStats, fetchCarbonRecords, analyzeWithAI,
  getMe,
} from './api-adapter.js?v=20260609-demo5';
export { fetchCarbonStats };
import { saveImages, getImages, deleteImages } from './offline-db.js';

const LOCAL_AUTH_KEY = 'tx.local_auth_user_id';

// ---------- localStorage helpers ----------
const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const save = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {
    console.warn('[store] localStorage 写入失败（可能超限）：', e);
  }
};

// ---------- 初始化（带版本控制的种子） ----------
function initIfNeeded() {
  const currentVersion = localStorage.getItem(STORAGE_KEYS.version);
  if (currentVersion !== SEED_VERSION) {
    // 基于 SEED_LISTINGS 中已 COMPLETED 的物品自动生成历史 CarbonRecord
    const seedRecords = SEED_LISTINGS
      .filter(l => l.status === 'COMPLETED')
      .map(l => ({
        id: 'c_seed_' + l.id,
        listingId: l.id,
        userId: l.ownerId,
        category: l.category,
        carbonSavedKg: l.estimatedCarbonSavedKg || 0,
        source: 'LISTING_COMPLETED',
        isFood: !!l.isFood,
        weightKg: l.isFood ? (l.foodInfo?.weightKg || 0) : (l.estimatedWeightKg || 0),
        createdAt: l.completedAt || l.updatedAt || l.createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    save(STORAGE_KEYS.users,       SEED_USERS);
    save(STORAGE_KEYS.listings,    SEED_LISTINGS);
    save(STORAGE_KEYS.interests,   []);
    save(STORAGE_KEYS.carbon,      seedRecords);
    save(STORAGE_KEYS.calcHistory, []);
    save(STORAGE_KEYS.ecoTips,     SEED_ECO_TIPS);
    save(STORAGE_KEYS.current,     'u_alice');
    localStorage.setItem(STORAGE_KEYS.version, SEED_VERSION);
  }
  if (!localStorage.getItem(STORAGE_KEYS.current)) {
    localStorage.setItem(STORAGE_KEYS.current, 'u_alice');
  }
}
initIfNeeded();

// ---------- Reactive state ----------
export const state = reactive({
  users:           load(STORAGE_KEYS.users,       []),
  listings:        load(STORAGE_KEYS.listings,    []),
  interests:       load(STORAGE_KEYS.interests,   []),
  carbonRecords:   load(STORAGE_KEYS.carbon,      []),
  calcHistory:     load(STORAGE_KEYS.calcHistory, []),
  ecoTips:         load(STORAGE_KEYS.ecoTips,     SEED_ECO_TIPS),
  currentUserId:   localStorage.getItem(STORAGE_KEYS.current) || 'u_alice',
  campusStats:     null,
});

// Restore images from IndexedDB (localStorage only stores references)
(async () => {
  for (const l of state.listings) {
    if (!l.images?.length) {
      const imgs = await getImages(l.id);
      if (imgs.length) l.images = imgs;
    }
  }
})();

export const authState = reactive({
  user: null,
  loading: true,
});

export const isAuthenticated = computed(() => !!authState.user);

// 每次修改后持久化（图片存 IndexedDB，localStorage 只存引用）
function persist() {
  save(STORAGE_KEYS.users,       state.users);
  save(STORAGE_KEYS.listings,    state.listings.map(l => ({ ...l, images: [] })));
  save(STORAGE_KEYS.interests,   state.interests);
  save(STORAGE_KEYS.carbon,      state.carbonRecords);
  save(STORAGE_KEYS.calcHistory, state.calcHistory);
  save(STORAGE_KEYS.ecoTips,     state.ecoTips);
  localStorage.setItem(STORAGE_KEYS.current, state.currentUserId);
  // Save full images to IndexedDB
  for (const l of state.listings) {
    if (l.images?.length) saveImages(l.id, l.images).catch(() => {});
  }
}

// ---------- 计算派生 ----------
export const currentUser = computed(() =>
  authState.user || state.users.find(u => u.id === state.currentUserId) || state.users[0]
);

// 完成流转的总减碳
export const totalCarbonSaved = computed(() =>
  round1(state.carbonRecords.reduce((s, r) => s + (r.carbonSavedKg || 0), 0))
);

// 当前用户的减碳（用于计算器偏移量）
export const userCarbonSaved = computed(() =>
  round1(state.carbonRecords
    .filter(r => r.userId === state.currentUserId)
    .reduce((s, r) => s + (r.carbonSavedKg || 0), 0))
);
export const totalCompleted = computed(() => state.carbonRecords.length);
export const totalFoodSavedKg = computed(() => {
  let sum = 0;
  for (const r of state.carbonRecords) {
    if (r.isFood) sum += r.weightKg || 0;
  }
  return round1(sum);
});
export const activeStudents = computed(() => {
  // 演示值：有发布或有流转记录的用户数，最少 3
  const set = new Set();
  state.listings.forEach(l => set.add(l.ownerId));
  state.carbonRecords.forEach(r => set.add(r.userId));
  return Math.max(set.size, 3);
});

// ---------- 工具函数 ----------
export function round1(n) {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}
export function uid(prefix = 'l') {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
export function getUser(id) {
  return state.users.find(u => u.id === id);
}
export function getListing(id) {
  return state.listings.find(l => l.id === id);
}

// 扫描过期食物：超过 foodInfo.expireAt 自动标为 EXPIRED
export function sweepExpired() {
  const now = Date.now();
  let changed = false;
  for (const l of state.listings) {
    if (l.isFood && l.status === 'ACTIVE' && l.foodInfo?.expireAt) {
      if (new Date(l.foodInfo.expireAt).getTime() < now) {
        l.status = 'EXPIRED';
        l.updatedAt = new Date().toISOString();
        changed = true;
      }
    }
  }
  if (changed) persist();
}

// ---------- API 同步 ----------
// api-adapter.js already normalizes camelCase, no need to repeat here.
export async function syncFromApi() {
  if (!(await isApiMode())) return;
  try {
    const [listingsData, recordsData, campusData] = await Promise.all([
      fetchListings({ limit: 100 }),
      fetchCarbonRecords(200),
      fetchCarbonStats('global', 'all').catch(() => null),
    ]);
    if (listingsData?.listings) state.listings = listingsData.listings;
    if (recordsData?.records) state.carbonRecords = recordsData.records;
    if (campusData) state.campusStats = campusData;
    persist();
  } catch (e) {
    console.warn('[store] API sync failed, using local data:', e.message);
  }
}

// Auto-sync on load (non-blocking)
syncFromApi();

export async function initAuth() {
  authState.loading = true;
  const apiReady = await isApiMode();
  if (!apiReady) {
    const localUserId = localStorage.getItem(LOCAL_AUTH_KEY);
    const localUser = localUserId ? state.users.find(u => u.id === localUserId) : null;
    if (localUser) {
      authState.user = localUser;
      state.currentUserId = localUser.id;
    }
    authState.loading = false;
    return;
  }
  const token = localStorage.getItem('tx.auth_token');
  if (!token) {
    authState.loading = false;
    return;
  }
  try {
    const res = await getMe();
    if (res?.user) {
      authState.user = res.user;
      state.currentUserId = res.user.id;
    }
  } catch (e) {
    // Token invalid/expired — clear it
    localStorage.removeItem('tx.auth_token');
  }
  authState.loading = false;
}
export const authReady = initAuth();

// Listen for 401 events from api-adapter to clear stale auth state
if (typeof window !== 'undefined') {
  window.addEventListener('ecotrace:401', () => { clearAuth(); });
}

export function setAuthUser(user) {
  if (!user) return;
  authState.user = user;
  state.currentUserId = user.id;
  localStorage.setItem(LOCAL_AUTH_KEY, user.id);
  persist();
}

export function clearAuth() {
  authState.user = null;
  localStorage.removeItem(LOCAL_AUTH_KEY);
}

export function signInLocalDemo(nickname) {
  const cleanNickname = String(nickname || '').trim() || '演示同学';
  let user = state.users.find(u => u.nickname === cleanNickname);
  if (!user) {
    const isAdmin = /admin|管理/.test(cleanNickname);
    user = {
      id: uid('u_demo'),
      nickname: cleanNickname,
      avatar: isAdmin ? '🛡️' : '👤',
      school: '汕头大学',
      campus: isAdmin ? '后台演示' : '桑浦山校区',
      role: isAdmin ? 'ADMIN' : 'STUDENT',
      ecoPoints: 0,
    };
    state.users.unshift(user);
  }
  setAuthUser(user);
  return user;
}

// ---------- Actions ----------
export const actions = {
  setCurrentUser(id) {
    state.currentUserId = id;
    persist();
  },

  // BUG-002 fix: API 模式下若服务端写入失败必须 throw，否则会出现“UI 显示成功 / syncFromApi 后条目消失”的鬼影。
  // 离线（无 API）模式仍走 local-only 行为。
  async createListing(draft) {
    const now = new Date().toISOString();
    const listing = {
      id: uid('l'),
      ownerId: state.currentUserId,
      status: draft.status || 'ACTIVE',
      interestedCount: 0,
      tags: draft.tags || [],
      createdAt: now,
      updatedAt: now,
      ...draft,
    };

    if (await isApiMode()) {
      try {
        const res = await apiCreateListing(draft);
        if (res?.id) listing.id = res.id;
        if (res?.estimatedCarbonSavedKg) listing.estimatedCarbonSavedKg = res.estimatedCarbonSavedKg;
        listing._newBadges = res?.new_badges || [];
      } catch (e) {
        console.warn('[store] API createListing failed:', e.message);
        throw new Error('服务器保存失败：' + (e.message || '请稍后重试'));
      }
    }

    state.listings.unshift(listing);
    persist();
    return listing;
  },

  async updateListing(id, patch) {
    const l = getListing(id);
    if (!l) return null;
    if (await isApiMode()) {
      try {
        await apiUpdateListing(id, patch);
      } catch (e) {
        console.warn('[store] API updateListing failed:', e.message);
        throw new Error('服务器更新失败：' + (e.message || '请稍后重试'));
      }
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'images')) {
      if (patch.images?.length) await saveImages(id, patch.images);
      else await deleteImages(id);
    }
    Object.assign(l, patch, { updatedAt: new Date().toISOString() });
    persist();
    return l;
  },

  async removeListing(id) {
    const l = getListing(id);
    if (await isApiMode()) {
      try { await apiDeleteListing(id); } catch (e) {
        console.warn('[store] API removeListing failed:', e.message);
        throw new Error('服务器下架失败：' + (e.message || '请稍后重试'));
      }
    }
    if (!l) return;
    l.status = 'REMOVED';
    l.images = [];
    l.updatedAt = new Date().toISOString();
    await deleteImages(id);
    persist();
  },

  completeListing(id) {
    const l = getListing(id);
    if (!l || l.status !== 'ACTIVE') return null;
    l.status = 'COMPLETED';
    l.completedAt = new Date().toISOString();
    l.updatedAt = l.completedAt;

    const rec = {
      id: uid('c'),
      listingId: l.id,
      userId: l.ownerId,
      category: l.category,
      carbonSavedKg: l.estimatedCarbonSavedKg || 0,
      source: 'LISTING_COMPLETED',
      isFood: !!l.isFood,
      weightKg: l.isFood ? (l.foodInfo?.weightKg || l.estimatedWeightKg || 0) : (l.estimatedWeightKg || 0),
      createdAt: l.completedAt,
    };
    state.carbonRecords.unshift(rec);
    persist();
    return rec;
  },

  addInterest(listingId, message) {
    const l = getListing(listingId);
    if (!l) return;
    const intent = {
      id: uid('i'),
      listingId,
      userId: state.currentUserId,
      message: message || '',
      createdAt: new Date().toISOString(),
    };
    state.interests.unshift(intent);
    l.interestedCount = (l.interestedCount || 0) + 1;
    persist();
    return intent;
  },

  listInterestsOf(listingId) {
    return state.interests.filter(i => i.listingId === listingId);
  },

  // ---------- 碳足迹计算器 ----------
  saveCalculation(result) {
    const record = {
      id: uid('fp'),
      ...result,
      createdAt: new Date().toISOString(),
    };
    state.calcHistory.unshift(record);
    if (state.calcHistory.length > 50) state.calcHistory = state.calcHistory.slice(0, 50);
    persist();
    return record;
  },

  // ---------- 生态小贴士 CRUD ----------
  saveEcoTip(tip) {
    if (tip.id) {
      const idx = state.ecoTips.findIndex(t => t.id === tip.id);
      if (idx >= 0) {
        state.ecoTips[idx] = { ...state.ecoTips[idx], ...tip };
        persist();
        return state.ecoTips[idx];
      }
    }
    const newTip = { id: uid('t'), ...tip };
    state.ecoTips.unshift(newTip);
    persist();
    return newTip;
  },

  deleteEcoTip(id) {
    state.ecoTips = state.ecoTips.filter(t => t.id !== id);
    persist();
  },
};

// ---------- 碳减排估算服务 ----------
export { FOOTPRINT_FACTORS, CARBON_EQUIVALENTS, ECO_TIP_CATEGORIES } from './seed.js';
// 给定 { category, isFood, foodInfo:{foodType,weightKg}, estimatedWeightKg } 返回预计减碳
export function calculateCarbonEstimate(input) {
  const result = estimateCarbonFromCatalog(input);
  return {
    estimatedCarbonSavedKg: result.estimatedCarbonSavedKg,
    assumptions: result.assumptions,
  };
}

// 挂一个 dev 入口方便调试
if (typeof window !== 'undefined') {
  window.__store = { state, actions, reset: () => {
    localStorage.removeItem(STORAGE_KEYS.version);
    location.reload();
  }};
}
