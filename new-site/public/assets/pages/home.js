import { computed } from 'vue';
import { state, totalCarbonSaved, totalCompleted, totalFoodSavedKg, activeStudents, sweepExpired, ECO_TIP_CATEGORIES } from '../store.js?v=20260609-demo5';
import { HOME_ENTRIES } from '../seed.js';
import { ListingCard, PaymentBoundaryNotice, MobileTopBar } from '../components.js?v=20260609-demo5';
import { useDevice } from '../device.js?v=20260609-demo5';
import { ref, onMounted, watch } from 'vue';
import { cacheListings, getCachedListings, cacheDashboard, getCachedDashboard } from '../offline-db.js';

// ---------- Animated Counter ----------
const AnimatedNumber = {
  props: {
    value: { type: Number, default: 0 },
    decimals: { type: Number, default: 1 },
    duration: { type: Number, default: 1200 },
  },
  setup(props) {
    const display = ref(0);
    let raf = null;
    let startTime = null;

    function animate() {
      if (raf) cancelAnimationFrame(raf);
      const target = Number(props.value) || 0;
      const start = display.value;
      const diff = target - start;
      if (Math.abs(diff) < 0.05) { display.value = target; return; }
      startTime = performance.now();

      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / props.duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        display.value = start + diff * eased;
        if (progress < 1) {
          raf = requestAnimationFrame(step);
        } else {
          display.value = target;
        }
      }
      raf = requestAnimationFrame(step);
    }

    onMounted(() => { display.value = 0; animate(); });
    watch(() => props.value, animate);

    return { display };
  },
  template: `<span>{{ display.toFixed(decimals) }}</span>`,
};

async function loadApiData() {
  try {
    const { isApiMode, fetchListings, getDashboard } = await import('../api-adapter.js?v=20260609-demo5');
    if (await isApiMode()) {
      const [listingsRes, dashboardRes] = await Promise.all([
        fetchListings({ limit: 8, status: 'ACTIVE' }),
        getDashboard(),
      ]);
      const listings = listingsRes?.listings || null;
      const dashboard = dashboardRes?.data || dashboardRes || null;
      // Cache for offline use
      if (listings) cacheListings(listings).catch(() => {});
      if (dashboard) cacheDashboard(dashboard).catch(() => {});
      return { listings, dashboard };
    }
  } catch {
    // Offline: try IndexedDB cache
    const [cachedListings, cachedDashboard] = await Promise.all([
      getCachedListings(),
      getCachedDashboard(),
    ]);
    if (cachedListings?.length || cachedDashboard) {
      return {
        listings: cachedListings?.length ? cachedListings : null,
        dashboard: cachedDashboard || null,
      };
    }
  }
  return null;
}

// ---------- Shared logic ----------
function useHomeData() {
  const apiData = ref(null);

  onMounted(async () => {
    apiData.value = await loadApiData();
  });

  const latest = computed(() => {
    if (apiData.value?.listings) {
      return apiData.value.listings;
    }
    return state.listings.filter(l => l.status === 'ACTIVE')
      .slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
  });

  const resolvedTotalCarbonSaved = computed(() => {
    return Number(apiData.value?.dashboard?.totalCarbonSaved ?? totalCarbonSaved.value) || 0;
  });

  const resolvedTotalCompleted = computed(() => {
    return Number(apiData.value?.dashboard?.totalCompletedListings ?? totalCompleted.value) || 0;
  });

  const resolvedTotalFoodSavedKg = computed(() => {
    return Number(apiData.value?.dashboard?.totalFoodSaved ?? totalFoodSavedKg.value) || 0;
  });

  const resolvedActiveStudents = computed(() => {
    return Number(apiData.value?.dashboard?.activeStudents ?? activeStudents.value) || 0;
  });

  const dailyTip = computed(() => {
    const tips = state.ecoTips;
    if (tips.length === 0) return null;
    const dayIndex = Math.floor(Date.now() / 86400000) % tips.length;
    return tips[dayIndex];
  });

  return {
    latest,
    totalCarbonSaved: resolvedTotalCarbonSaved,
    totalCompleted: resolvedTotalCompleted,
    totalFoodSavedKg: resolvedTotalFoodSavedKg,
    activeStudents: resolvedActiveStudents,
    entries: HOME_ENTRIES,
    dailyTip,
    ECO_TIP_CATEGORIES,
  };
}

// ---------- Desktop ----------
const HomeDesktop = {
  components: { ListingCard, PaymentBoundaryNotice, AnimatedNumber },
  setup() {
    return useHomeData();
  },
  template: `
    <div>
      <section class="hero-bg">
        <div class="max-w-6xl mx-auto px-4 pt-12 pb-16 md:pt-20 md:pb-24 grid md:grid-cols-5 gap-10 items-center">
          <div class="md:col-span-3">
            <h1 class="text-3xl md:text-5xl font-bold leading-tight text-slate-800">
              让校园里的闲置，<br/>
              <span class="text-leaf-600">被看见，被带走，被再次使用。</span>
            </h1>
            <p class="mt-5 text-slate-600 leading-relaxed max-w-xl">
              碳循校园把学生的闲置物品、剩余食品和可再利用资源聚到一起，支持付费、免费、交换和面议。
              每一次成功流转，系统都会把它转化为可视化的校园减碳贡献。
            </p>
            <div class="mt-7 flex flex-wrap gap-3">
              <router-link to="/publish" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-leaf-600 text-white font-medium hover:bg-leaf-700 shadow-sm">
                🌿 发布我的闲置
              </router-link>
              <router-link to="/listings" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-leaf-400 text-leaf-700 font-medium hover:bg-leaf-50">
                📦 浏览校园闲置
              </router-link>
              <router-link to="/impact" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-leaf-700 font-medium hover:bg-leaf-50">
                📊 查看减碳成果
              </router-link>
              <router-link to="/demo" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sky-700 font-medium hover:bg-sky-50">
                🎬 比赛演示流程
              </router-link>
            </div>
          </div>
          <div class="md:col-span-2 grid grid-cols-2 gap-3">
            <div class="rounded-2xl bg-white/80 backdrop-blur border border-leaf-100 p-4">
              <div class="text-xs text-slate-500">累计流转件数</div>
              <div class="mt-1 text-2xl font-bold text-leaf-700"><animated-number :value="totalCompleted" :decimals="0" /></div>
              <div class="text-xs text-slate-400 mt-1">（只计已完成）</div>
            </div>
            <div class="rounded-2xl bg-white/80 backdrop-blur border border-leaf-100 p-4">
              <div class="text-xs text-slate-500">累计估算减碳</div>
              <div class="mt-1 text-2xl font-bold text-leaf-700"><animated-number :value="totalCarbonSaved" /><span class="text-sm font-normal text-slate-500 ml-1">kg CO₂e</span></div>
              <div class="text-xs text-slate-400 mt-1">估算值</div>
            </div>
            <div class="rounded-2xl bg-white/80 backdrop-blur border border-leaf-100 p-4">
              <div class="text-xs text-slate-500">减少食物浪费</div>
              <div class="mt-1 text-2xl font-bold text-leaf-700"><animated-number :value="totalFoodSavedKg" /><span class="text-sm font-normal text-slate-500 ml-1">kg</span></div>
            </div>
            <div class="rounded-2xl bg-white/80 backdrop-blur border border-leaf-100 p-4">
              <div class="text-xs text-slate-500">参与学生</div>
              <div class="mt-1 text-2xl font-bold text-leaf-700"><animated-number :value="activeStudents" :decimals="0" /></div>
            </div>
          </div>
        </div>
      </section>

      <section class="max-w-6xl mx-auto px-4 py-10">
        <div class="flex items-end justify-between mb-4">
          <h2 class="text-xl font-semibold text-slate-800">找闲置 · 看专区</h2>
          <router-link to="/listings" class="text-sm text-leaf-600 hover:text-leaf-700">全部 →</router-link>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <router-link v-for="e in entries" :key="e.key + e.kind"
            :to="{
              path: '/listings',
              query: e.kind === 'category' ? { category: e.key }
                   : e.kind === 'trade'   ? { trade: e.key }
                   :                        { tag: e.key }
            }"
            class="rounded-2xl bg-white border border-slate-200 p-4 flex items-center gap-3 card-hover">
            <span class="text-2xl">{{ e.icon }}</span>
            <div class="text-sm font-medium text-slate-700">{{ e.label }}</div>
          </router-link>
        </div>
      </section>

      <section class="max-w-6xl mx-auto px-4 py-6">
        <div class="flex items-end justify-between mb-4">
          <h2 class="text-xl font-semibold text-slate-800">最新发布</h2>
          <router-link to="/listings" class="text-sm text-leaf-600 hover:text-leaf-700">查看更多 →</router-link>
        </div>

        <!-- 每日生态贴士 -->
        <div v-if="dailyTip" class="rounded-2xl bg-leaf-50 border border-leaf-200 p-5 mb-6">
          <div class="flex items-start gap-3">
            <span class="shrink-0 mt-0.5 px-2 py-1 rounded-full text-xs font-medium"
                  :class="dailyTip.category ? ECO_TIP_CATEGORIES.find(c => c.key === dailyTip.category)?.color || 'bg-leaf-100 text-leaf-700' : 'bg-leaf-100 text-leaf-700'">
              {{ ECO_TIP_CATEGORIES.find(c => c.key === dailyTip.category)?.icon || '🌱' }} {{ ECO_TIP_CATEGORIES.find(c => c.key === dailyTip.category)?.label || '生态贴士' }}
            </span>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-slate-800">{{ dailyTip.title }}</div>
              <div class="text-sm text-slate-600 mt-1">{{ dailyTip.body }}</div>
              <div v-if="dailyTip.carbonLink" class="text-xs text-leaf-700 mt-2">🌿 {{ dailyTip.carbonLink }}</div>
            </div>
            <router-link to="/eco-tips" class="shrink-0 text-xs text-leaf-600 hover:text-leaf-700">更多贴士 →</router-link>
          </div>
        </div>
        <div v-if="latest.length === 0" class="text-center text-slate-400 py-10">暂无发布，快来发布第一个吧～</div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <listing-card v-for="l in latest" :key="l.id" :listing="l" />
        </div>
      </section>

      <section class="max-w-6xl mx-auto px-4 py-10">
        <h2 class="text-xl font-semibold text-slate-800 mb-4">减碳是怎么算的</h2>
        <div class="grid md:grid-cols-5 gap-3">
          <div v-for="(item, i) in [
            {icon:'📷', t:'上传图片', d:'1~5 张实物图'},
            {icon:'🔎', t:'识别估算', d:'系统自动给出分类、重量和标题建议'},
            {icon:'🧮', t:'估算减碳',   d:'按分类系数和替代系数给出预计 kg CO₂e'},
            {icon:'🤝', t:'完成流转',   d:'线下约定交接：付费 / 免费 / 交换'},
            {icon:'📊', t:'记录贡献',   d:'确认完成后计入校园总减碳'},
          ]" :key="i"
            class="rounded-2xl bg-white border border-slate-200 p-4">
            <div class="text-2xl">{{ item.icon }}</div>
            <div class="mt-2 font-semibold text-slate-800">{{ i + 1 }}. {{ item.t }}</div>
            <div class="mt-1 text-[13px] text-slate-500 leading-relaxed">{{ item.d }}</div>
          </div>
        </div>
      </section>

      <section class="max-w-6xl mx-auto px-4 py-6">
        <payment-boundary-notice />
      </section>
    </div>
  `,
};

// ---------- Mobile ----------
const HomeMobile = {
  components: { ListingCard, MobileTopBar, AnimatedNumber },
  setup() {
    return useHomeData();
  },
  template: `
    <div class="pb-4">
      <!-- 顶栏 -->
      <div class="sticky top-0 z-30 bg-cream/95 backdrop-blur">
        <div class="px-3 pt-3 pb-2 flex items-center gap-2">
          <router-link to="/" class="flex items-center gap-1.5 shrink-0">
            <span class="w-8 h-8 rounded-full bg-leaf-600 text-white flex items-center justify-center text-base">🌿</span>
          </router-link>
          <router-link to="/listings" class="mobile-search">
            <span class="text-base">🔍</span>
            <span class="flex-1 truncate">搜索教材 / 台灯 / 矿泉水…</span>
          </router-link>
        </div>
      </div>

      <!-- 小型 Hero -->
      <section class="px-3 pt-2">
        <div class="rounded-3xl p-4 relative overflow-hidden"
             style="background: linear-gradient(135deg, #dcf0de 0%, #bae0bf 55%, #f1f9f2 100%);">
          <div class="absolute right-3 top-3 text-5xl opacity-25">🌿</div>
          <div class="text-xs text-leaf-700 font-medium">碳循校园 · 让闲置被再次使用</div>
          <div class="mt-2 grid grid-cols-3 gap-2">
            <div>
              <div class="text-[11px] text-slate-500">累计减碳</div>
              <div class="font-bold text-leaf-700 text-lg leading-tight"><animated-number :value="totalCarbonSaved" /><span class="text-[10px] font-normal ml-0.5">kg</span></div>
            </div>
            <div>
              <div class="text-[11px] text-slate-500">已流转</div>
              <div class="font-bold text-leaf-700 text-lg leading-tight"><animated-number :value="totalCompleted" :decimals="0" /></div>
            </div>
            <div>
              <div class="text-[11px] text-slate-500">食物省下</div>
              <div class="font-bold text-leaf-700 text-lg leading-tight"><animated-number :value="totalFoodSavedKg" /><span class="text-[10px] font-normal ml-0.5">kg</span></div>
            </div>
          </div>
        </div>
      </section>

      <!-- 分类横滚 -->
      <section class="px-3 mt-3">
        <div class="pill-row">
          <router-link v-for="e in entries" :key="e.key + e.kind"
            :to="{
              path: '/listings',
              query: e.kind === 'category' ? { category: e.key }
                   : e.kind === 'trade'   ? { trade: e.key }
                   :                        { tag: e.key }
            }"
            class="rounded-2xl bg-white border border-slate-200 px-3.5 py-2.5 flex items-center gap-2 text-sm text-slate-700 active:bg-leaf-50 active:border-leaf-300">
            <span class="text-lg">{{ e.icon }}</span>
            <span>{{ e.label }}</span>
          </router-link>
        </div>
      </section>

      <!-- 最新发布 -->
      <section class="px-3 mt-4 flex items-baseline justify-between">
        <div class="font-semibold text-slate-800">最新发布</div>
        <router-link to="/listings" class="text-[12px] text-leaf-600">查看更多 ›</router-link>
      </section>

      <!-- 每日生态贴士（移动端） -->
      <section v-if="dailyTip" class="px-3 mt-3">
        <div class="rounded-2xl bg-leaf-50 border border-leaf-200 p-3">
          <div class="flex items-start gap-2">
            <span class="shrink-0 mt-0.5 text-lg">{{ ECO_TIP_CATEGORIES.find(c => c.key === dailyTip.category)?.icon || '🌱' }}</span>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-slate-800">{{ dailyTip.title }}</div>
              <div class="text-xs text-slate-600 mt-0.5 line-clamp-2">{{ dailyTip.body }}</div>
              <router-link to="/eco-tips" class="text-[11px] text-leaf-600 mt-1 inline-block">更多贴士 ›</router-link>
            </div>
          </div>
        </div>
      </section>

      <section class="px-3 mt-2">
        <div v-if="latest.length === 0" class="text-center text-slate-400 py-10 text-sm">暂无发布</div>
        <div v-else class="waterfall">
          <listing-card v-for="l in latest" :key="l.id" :listing="l" />
        </div>
      </section>
    </div>
  `,
};

// ---------- Root ----------
export default {
  components: { HomeDesktop, HomeMobile },
  setup() {
    sweepExpired();
    const { isLayoutMobile } = useDevice();
    return { isLayoutMobile };
  },
  template: `
    <home-mobile v-if="isLayoutMobile" />
    <home-desktop v-else />
  `,
};
