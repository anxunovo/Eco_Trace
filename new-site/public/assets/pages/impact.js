import { ref, computed, onMounted, watch } from 'vue';
import { state, getUser, getListing, totalCarbonSaved, totalCompleted, totalFoodSavedKg, activeStudents, round1, currentUser, isAuthenticated } from '../store.js?v=20260609-demo5';
import { CATEGORY_MAP, CATEGORIES } from '../seed.js';
import { TrendChart, CategoryDoughnut, CampusBar } from '../charts.js';
import { toast } from '../components.js?v=20260609-demo5';
import { createShareCardState, ShareCardTemplate } from '../share-card.js';

export default {
  components: { TrendChart, CategoryDoughnut, CampusBar, ShareCardTemplate },
  setup() {
    const apiData = ref(null);
    const dataSource = ref('本地');
    const period = ref('month');
    const loading = ref(false);

    async function loadData() {
      loading.value = true;
      try {
        const { isApiMode, fetchCarbonStats, getDashboard } = await import('../api-adapter.js?v=20260609-demo5');
        if (await isApiMode()) {
          const [statsRes, dashRes] = await Promise.all([
            fetchCarbonStats('global', period.value),
            getDashboard(),
          ]);
          apiData.value = {
            ...statsRes?.data || statsRes,
            ...dashRes?.data || dashRes,
          };
          dataSource.value = '云端';
        }
      } catch {
        // Fall back to localStorage-based data
      }
      loading.value = false;
    }

    onMounted(loadData);
    watch(period, loadData);

    const displayTotalCarbonSaved = computed(() => apiData.value?.totalCarbonSavedKg ?? apiData.value?.totalCarbonSaved ?? totalCarbonSaved.value);

    const userStats = computed(() => {
      const api = apiData.value?.userStats;
      let kg = 0, count = 0;
      if (api) {
        kg = api['累计减碳 (kg CO₂e)'] ?? api.myCarbon ?? 0;
        count = api['完成流转 (次)'] ?? api.myCompletedListings ?? 0;
      } else {
        for (const r of state.carbonRecords) {
          if (r.userId === state.currentUserId) {
            kg += r.carbonSavedKg || 0;
            count += 1;
          }
        }
      }
      return {
        '累计减碳 (kg CO₂e)': round1(kg),
        '完成流转 (次)': count,
      };
    });

    const trendData = computed(() => {
      if (apiData.value?.trend?.length) return apiData.value.trend;
      // Fallback: aggregate local carbonRecords by date
      const map = new Map();
      const now = new Date();
      const days = period.value === 'week' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        map.set(key, 0);
      }
      for (const r of state.carbonRecords) {
        const key = (r.createdAt || '').slice(0, 10);
        if (map.has(key)) map.set(key, (map.get(key) || 0) + (r.carbonSavedKg || 0));
      }
      return Array.from(map.entries()).map(([date, carbon]) => ({ date, carbon: round1(carbon) }));
    });

    const perCategory = computed(() => {
      if (apiData.value?.byCategory) {
        const raw = apiData.value.byCategory;
        if (Array.isArray(raw)) {
          return raw.map(r => {
            const cat = CATEGORY_MAP[r.category];
            return {
              key: r.category,
              label: cat?.label || r.category,
              icon: cat?.icon || '📦',
              kg: round1(r.total),
              count: r.count,
            };
          }).sort((a, b) => b.kg - a.kg);
        }
        // Object format: { BOOKS: { carbon: 3.4, count: 7 }, ... }
        return Object.entries(raw).map(([k, v]) => ({
          key: k,
          label: CATEGORY_MAP[k]?.label || k,
          icon: CATEGORY_MAP[k]?.icon || '📦',
          kg: round1(v.carbon),
          count: v.count,
        })).sort((a, b) => b.kg - a.kg);
      }
      const map = new Map();
      for (const cat of CATEGORIES) map.set(cat.key, { key: cat.key, label: cat.label, icon: cat.icon, kg: 0, count: 0 });
      for (const r of state.carbonRecords) {
        const m = map.get(r.category);
        if (m) { m.kg += r.carbonSavedKg || 0; m.count += 1; }
      }
      return Array.from(map.values())
        .map(x => ({ ...x, kg: round1(x.kg) }))
        .filter(x => x.kg > 0)
        .sort((a, b) => b.kg - a.kg);
    });
    const maxKg = computed(() => {
      const arr = Array.isArray(perCategory.value) ? perCategory.value : [];
      if (arr.length === 0) return 1;
      return Math.max(1, ...arr.map(x => Number(x.kg) || 0));
    });

    const campusData = computed(() => {
      if (apiData.value?.campusComparison?.length) return apiData.value.campusComparison;
      // Fallback: aggregate local by owner campus
      const map = new Map();
      for (const r of state.carbonRecords) {
        const listing = getListing(r.listingId);
        const user = getUser(r.userId);
        const campus = listing?.campus || user?.campus || '未知';
        if (!map.has(campus)) map.set(campus, { campus, carbon: 0, count: 0 });
        const x = map.get(campus);
        x.carbon += r.carbonSavedKg || 0;
        x.count += 1;
      }
      return Array.from(map.values())
        .filter(x => x.campus && x.campus !== '—' && x.campus !== '未知')
        .map(x => ({ ...x, carbon: round1(x.carbon) }))
        .sort((a, b) => b.carbon - a.carbon);
    });

    const recent = computed(() =>
      state.carbonRecords.slice(0, 10).map(r => ({
        ...r,
        listing: getListing(r.listingId),
        user: getUser(r.userId),
      }))
    );

    const leaderboard = computed(() => {
      if (apiData.value?.leaderboard) return apiData.value.leaderboard;
      const agg = new Map();
      for (const r of state.carbonRecords) {
        if (!agg.has(r.userId)) agg.set(r.userId, { userId: r.userId, kg: 0, count: 0 });
        const x = agg.get(r.userId);
        x.kg += r.carbonSavedKg || 0; x.count += 1;
      }
      return Array.from(agg.values())
        .map(x => ({ ...x, kg: round1(x.kg), user: getUser(x.userId) }))
        .sort((a, b) => b.kg - a.kg)
        .slice(0, 10);
    });

    const periods = [
      { key: 'week', label: '本周' },
      { key: 'month', label: '本月' },
      { key: 'all', label: '全部' },
    ];

    const { shareCardRef, generating, generateShareCard } = createShareCardState(ref, toast, {
      filenamePrefix: '碳循校园-减碳贡献',
    });

    const myRankInLeaderboard = computed(() => {
      if (!currentUser.value) return null;
      const idx = leaderboard.value.findIndex(u => u.userId === currentUser.value.id);
      return idx >= 0 ? idx + 1 : null;
    });

    const shareUser = computed(() => isAuthenticated.value ? currentUser.value : null);
    const shareStats = computed(() => {
      if (isAuthenticated.value) {
        return [
          { label: '我的减碳', value: userStats.value['累计减碳 (kg CO₂e)'] || 0, unit: 'kg CO₂e' },
          { label: '完成流转', value: userStats.value['完成流转 (次)'] || 0, unit: '次' },
          { label: '全校减碳', value: displayTotalCarbonSaved.value, unit: 'kg CO₂e' },
        ];
      }
      return [
        { label: '全校减碳', value: displayTotalCarbonSaved.value, unit: 'kg CO₂e' },
        { label: '完成流转', value: totalCompleted.value, unit: '次' },
        { label: '参与学生', value: activeStudents.value, unit: '人' },
      ];
    });

    return {
      totalCarbonSaved: displayTotalCarbonSaved,
      totalCompleted, totalFoodSavedKg, activeStudents,
      perCategory, maxKg, recent, leaderboard, userStats, dataSource,
      CATEGORY_MAP,
      trendData, campusData,
      period, periods, loading,
      shareCardRef, generating, generateShareCard,
      currentUser, isAuthenticated, myRankInLeaderboard,
      shareUser, shareStats,
    };
  },
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="flex items-end justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-slate-800 flex items-center gap-2">
            校园减碳看板
            <span class="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded-full font-normal">数据来源: {{ dataSource }}</span>
          </h1>
          <p class="text-sm text-slate-500 mt-1">每一次完成流转都代表一次资源浪费的减少，这里把它们汇总展示给评委和同学。</p>
        </div>
        <!-- Period filter -->
        <div class="flex rounded-xl bg-slate-100 p-1 gap-0.5">
          <button v-for="p in periods" :key="p.key"
                  @click="period = p.key"
                  class="px-3 py-1 text-sm rounded-lg transition-all"
                  :class="period === p.key ? 'bg-white shadow-sm text-leaf-700 font-medium' : 'text-slate-500 hover:text-slate-700'">
            {{ p.label }}
          </button>
        </div>
      </div>

      <!-- 我的个人贡献 -->
      <div class="mb-6 rounded-2xl bg-amber-50 border border-amber-100 p-5">
        <div class="text-sm font-medium text-amber-800 mb-2">我的个人贡献</div>
        <div class="flex gap-6">
          <div v-for="(val, key) in userStats" :key="key">
            <div class="text-xs text-amber-600/80">{{ key }}</div>
            <div class="text-xl font-bold text-amber-700">{{ val }}</div>
          </div>
        </div>
      </div>

      <!-- 大数据卡 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="rounded-2xl bg-leaf-600 text-white p-5 relative overflow-hidden">
          <div class="absolute top-2 right-3 text-4xl opacity-30">🌿</div>
          <div class="text-xs opacity-80">校园累计估算减碳</div>
          <div class="mt-1 text-3xl font-bold">{{ totalCarbonSaved }}</div>
          <div class="text-xs opacity-80 mt-1">kg CO₂e（估算值）</div>
        </div>
        <div class="rounded-2xl bg-white border border-slate-200 p-5">
          <div class="text-xs text-slate-500">完成流转件数</div>
          <div class="mt-1 text-3xl font-bold text-slate-800">{{ totalCompleted }}</div>
        </div>
        <div class="rounded-2xl bg-white border border-slate-200 p-5">
          <div class="text-xs text-slate-500">减少食物浪费</div>
          <div class="mt-1 text-3xl font-bold text-slate-800">{{ totalFoodSavedKg }}<span class="text-sm font-normal text-slate-500 ml-1">kg</span></div>
        </div>
        <div class="rounded-2xl bg-white border border-slate-200 p-5">
          <div class="text-xs text-slate-500">参与学生</div>
          <div class="mt-1 text-3xl font-bold text-slate-800">{{ activeStudents }}</div>
        </div>
      </div>

      <!-- 减碳趋势折线图 -->
      <section class="rounded-2xl bg-white border border-slate-200 p-5 mb-6">
        <h2 class="font-semibold text-slate-800 mb-4">减碳趋势</h2>
        <div style="height: 240px; position: relative;">
          <trend-chart v-if="trendData.length" :data="trendData" />
          <div v-else class="flex items-center justify-center h-full text-slate-400 text-sm">
            暂无数据
          </div>
        </div>
      </section>

      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <!-- 分类减碳 环形图 -->
        <section class="rounded-2xl bg-white border border-slate-200 p-5">
          <h2 class="font-semibold text-slate-800 mb-4">分类减碳贡献</h2>
          <div v-if="perCategory.length === 0" class="text-slate-400 text-sm py-6 text-center">
            暂无数据
          </div>
          <div v-else style="height: 240px; position: relative;">
            <category-doughnut :items="perCategory" />
          </div>
        </section>

        <!-- 校区对比 柱状图 -->
        <section class="rounded-2xl bg-white border border-slate-200 p-5">
          <h2 class="font-semibold text-slate-800 mb-4">校区减碳对比</h2>
          <div v-if="campusData.length === 0" class="text-slate-400 text-sm py-6 text-center">
            暂无校区数据
          </div>
          <div v-else style="height: 240px; position: relative;">
            <campus-bar :items="campusData" />
          </div>
        </section>
      </div>

      <!-- 分类柱状进度条（保留原版，作为补充） -->
      <section class="rounded-2xl bg-white border border-slate-200 p-5 mb-6">
        <h2 class="font-semibold text-slate-800 mb-4">分类详情</h2>
        <div v-if="perCategory.length === 0" class="text-slate-400 text-sm py-6 text-center">
          暂无数据。
        </div>
        <div v-else class="space-y-3">
          <div v-for="c in perCategory" :key="c.key">
            <div class="flex items-center justify-between text-sm mb-1">
              <div class="flex items-center gap-2 text-slate-700">
                <span>{{ c.icon }}</span><span>{{ c.label }}</span>
                <span class="text-xs text-slate-400">· {{ c.count }} 件</span>
              </div>
              <div class="text-leaf-700 font-medium">{{ c.kg }} kg CO₂e</div>
            </div>
            <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full bg-leaf-400 rounded-full transition-all"
                   :style="{ width: Math.max(2, (c.kg / maxKg) * 100) + '%' }"></div>
            </div>
          </div>
        </div>
      </section>

      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <!-- 最近流转 -->
        <section class="rounded-2xl bg-white border border-slate-200 p-5">
          <h2 class="font-semibold text-slate-800 mb-3">最近完成流转</h2>
          <div v-if="recent.length === 0" class="text-slate-400 text-sm py-6 text-center">暂无记录</div>
          <ul v-else class="divide-y divide-slate-100">
            <li v-for="r in recent" :key="r.id" class="py-2.5 flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-leaf-50 text-leaf-700 flex items-center justify-center shrink-0">
                {{ CATEGORY_MAP[r.category]?.icon || '📦' }}
              </div>
              <div class="flex-1 min-w-0">
                <router-link v-if="r.listing" :to="'/listings/' + r.listingId"
                             class="text-sm text-slate-800 hover:text-leaf-700 block truncate">
                  {{ r.listing.title }}
                </router-link>
                <div v-else class="text-sm text-slate-400">（物品已删除）</div>
                <div class="text-[12px] text-slate-400">
                  {{ r.user?.nickname || '—' }} · {{ new Date(r.createdAt).toLocaleString('zh-CN') }}
                </div>
              </div>
              <div class="text-leaf-700 text-sm font-medium">+{{ r.carbonSavedKg }} kg</div>
            </li>
          </ul>
        </section>

        <!-- 个人贡献排行 -->
        <section class="rounded-2xl bg-white border border-slate-200 p-5">
          <h2 class="font-semibold text-slate-800 mb-3">个人贡献排行</h2>
          <div v-if="leaderboard.length === 0" class="text-slate-400 text-sm py-6 text-center">还没有人上榜</div>
          <ul v-else class="space-y-2">
            <li v-for="(u,i) in leaderboard" :key="u.userId"
                class="flex items-center gap-3 px-3 py-2 rounded-xl"
                :class="i === 0 ? 'bg-amber-50' : i === 1 ? 'bg-slate-50' : i === 2 ? 'bg-orange-50' : ''">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                   :class="i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-400' : 'bg-leaf-300'">
                {{ i + 1 }}
              </div>
              <div class="text-xl">{{ u.user?.avatar || u.avatar || '👤' }}</div>
              <div class="flex-1 min-w-0">
                <div class="text-sm text-slate-800 truncate">{{ u.user?.nickname || u.nickname || u.userId }}</div>
                <div class="text-[12px] text-slate-400">{{ u.count || '—' }} 次流转</div>
              </div>
              <div class="text-leaf-700 text-sm font-semibold">{{ u.kg || u.carbon }} kg</div>
            </li>
          </ul>
        </section>
      </div>

      <!-- 估算说明 -->
      <section class="rounded-2xl bg-sky-50 border border-sky-200 p-5 text-sm text-sky-900 leading-relaxed">
        <div class="font-semibold mb-1">估算方法与数据边界</div>
        <ul class="list-disc list-inside space-y-1">
          <li>碳减排数据按分类系数 × 重量 × 二手再利用替代系数估算得出。</li>
          <li>系数默认值（教材 1.3、衣物 8.0、小型电子 25.0、宿舍 3.0、文具 2.0、运动 5.0、食物 0.8~8.0）不作为精确碳审计数据。</li>
          <li>仅 <strong>已完成流转</strong> 的物品计入总数据，草稿、过期、下架不计入。</li>
          <li>正式版本可替换为权威参考数据源或第三方碳核算服务。</li>
        </ul>
      </section>

      <!-- 分享按钮 -->
      <div class="mt-6 flex justify-center">
        <button @click="generateShareCard" :disabled="generating"
                class="px-6 py-3 rounded-2xl bg-leaf-600 text-white font-medium hover:bg-leaf-700 disabled:opacity-50 inline-flex items-center gap-2 shadow-lg shadow-leaf-600/20">
          <span v-if="generating" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
          {{ generating ? '生成中...' : '生成分享海报' }}
        </button>
      </div>

      <!-- 分享卡片模板（html2canvas 截图目标） -->
      <div style="position:absolute;left:-9999px;top:0;">
        <div ref="shareCardRef">
          <share-card-template
            title="碳循校园"
            subtitle="校园二手漂流与碳减排估算平台"
            :user="shareUser"
            :rank="myRankInLeaderboard"
            :stats="shareStats"
            :categories="perCategory" />
        </div>
      </div>
    </div>
  `,
};
