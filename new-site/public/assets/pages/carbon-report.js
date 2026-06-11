import { ref, computed } from 'vue';
import { state, currentUser, totalCarbonSaved, userCarbonSaved, totalCompleted, round1, isAuthenticated, CARBON_EQUIVALENTS, fetchCarbonStats } from '../store.js?v=20260609-demo5';
import { CATEGORY_MAP } from '../seed.js';
import { CategoryDoughnut } from '../charts.js';
import { toast } from '../components.js?v=20260609-demo5';
import { createShareCardState, ShareCardTemplate } from '../share-card.js';

export default {
  components: { CategoryDoughnut, ShareCardTemplate },
  setup() {
    const tab = ref('personal');

    // ---------- 个人报告数据 ----------
    const userRecords = computed(() =>
      state.carbonRecords.filter(r => r.userId === state.currentUserId)
    );
    const userTotalKg = computed(() => userCarbonSaved.value);
    const userItemCount = computed(() => userRecords.value.length);
    const activeDays = computed(() => {
      if (userRecords.value.length === 0) return 0;
      const earliest = userRecords.value[userRecords.value.length - 1]?.createdAt;
      if (!earliest) return 0;
      return Math.max(1, Math.ceil((Date.now() - new Date(earliest).getTime()) / 86400000));
    });

    // ---------- 校园报告数据 ----------
    const campusKg = computed(() => {
      if (state.campusStats?.totalCarbonSavedKg != null) {
        return round1(state.campusStats.totalCarbonSavedKg);
      }
      return totalCarbonSaved.value;
    });
    const campusCount = computed(() => {
      if (state.campusStats?.listingCount != null) {
        return state.campusStats.listingCount;
      }
      return totalCompleted.value;
    });

    // ---------- 等效换算 ----------
    const eq = CARBON_EQUIVALENTS;
    const equivalents = computed(() => {
      const kg = tab.value === 'personal' ? userTotalKg.value : campusKg.value;
      return [
        { icon: '🌳', label: '相当于吸收', value: (kg / eq.treeAbsorption).toFixed(1), unit: '棵树一年的碳汇', source: '中国杉木年均碳汇量 18.3 kg CO₂e' },
        { icon: '🚗', label: '相当于减少', value: round1(kg * eq.carKmPerKg), unit: 'km 汽车行驶', source: '汽油车平均 0.21 kg CO₂e/km' },
        { icon: '⚡', label: '相当于节省', value: round1(kg * eq.electricityKwhPerKg), unit: 'kWh 电力', source: '中国电网排放因子 0.581 kg CO₂e/kWh' },
        { icon: '📱', label: '相当于充满', value: Math.round(kg * eq.phoneChargePerKg), unit: '次手机', source: '每次充电约 0.0087 kg CO₂e' },
      ];
    });

    // ---------- 分类环形图数据 ----------
    const campusCategories = computed(() => {
      if (state.campusStats?.byCategory?.length) {
        return state.campusStats.byCategory.map(r => {
          const cat = CATEGORY_MAP[r.category];
          return { key: r.category, label: cat?.label || r.category, icon: cat?.icon || '📦', kg: round1(r.total), count: r.count };
        }).filter(x => x.kg > 0).sort((a, b) => b.kg - a.kg);
      }
      return null;
    });
    const perCategory = computed(() => {
      if (tab.value === 'campus' && campusCategories.value) {
        return campusCategories.value;
      }
      const records = tab.value === 'personal' ? userRecords.value : state.carbonRecords;
      const map = new Map();
      for (const r of records) {
        const cat = CATEGORY_MAP[r.category];
        if (!cat) continue;
        if (!map.has(r.category)) map.set(r.category, { key: r.category, label: cat.label, icon: cat.icon, kg: 0, count: 0 });
        const m = map.get(r.category);
        m.kg += r.carbonSavedKg || 0;
        m.count += 1;
      }
      return Array.from(map.values())
        .map(x => ({ ...x, kg: round1(x.kg) }))
        .filter(x => x.kg > 0)
        .sort((a, b) => b.kg - a.kg);
    });

    // ---------- 分享卡片 ----------
    const { shareCardRef, generating, generateShareCard } = createShareCardState(ref, toast, {
      filenamePrefix: '碳循校园-减碳报告',
    });

    const reportKg = computed(() => tab.value === 'personal' ? userTotalKg.value : campusKg.value);
    const reportCount = computed(() => tab.value === 'personal' ? userItemCount.value : campusCount.value);
    const equivalentTrees = computed(() => {
      const value = reportKg.value / eq.treeAbsorption;
      return value < 0.1 ? '<0.1' : value.toFixed(1);
    });
    const shareUser = computed(() => tab.value === 'personal' && isAuthenticated.value ? currentUser.value : null);
    const shareStats = computed(() => [
      { label: tab.value === 'personal' ? '我的减碳' : '校园减碳', value: reportKg.value, unit: 'kg CO₂e' },
      { label: '完成流转', value: reportCount.value, unit: '件' },
      { label: '等效植树', value: equivalentTrees.value, unit: '棵' },
    ]);

    return {
      tab, userTotalKg, userItemCount, activeDays,
      campusKg, campusCount,
      equivalents, perCategory,
      shareCardRef, generating, generateShareCard,
      currentUser, isAuthenticated, CATEGORY_MAP,
      state, userRecords, eq,
      shareUser, shareStats,
    };
  },
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-semibold text-slate-800 mb-1">碳减排贡献报告</h1>
      <p class="text-sm text-slate-500 mb-6">你的每一次闲置流转，都在为地球减负</p>

      <!-- Tab 切换 -->
      <div class="flex rounded-xl bg-slate-100 p-1 gap-0.5 mb-6 w-fit">
        <button @click="tab = 'personal'"
                class="px-4 py-2 text-sm rounded-lg transition-all"
                :class="tab === 'personal' ? 'bg-white shadow-sm text-leaf-700 font-medium' : 'text-slate-500 hover:text-slate-700'">
          🧑 我的报告
        </button>
        <button @click="tab = 'campus'"
                class="px-4 py-2 text-sm rounded-lg transition-all"
                :class="tab === 'campus' ? 'bg-white shadow-sm text-leaf-700 font-medium' : 'text-slate-500 hover:text-slate-700'">
          🏫 校园报告
        </button>
      </div>

      <!-- 核心数据 -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div class="rounded-2xl bg-leaf-600 text-white p-5 relative overflow-hidden">
          <div class="absolute top-2 right-3 text-3xl opacity-30">🌿</div>
          <div class="text-xs opacity-80">{{ tab === 'personal' ? '我的减碳' : '校园减碳' }}</div>
          <div class="mt-1 text-3xl font-bold">{{ tab === 'personal' ? userTotalKg : campusKg }}</div>
          <div class="text-xs opacity-80 mt-1">kg CO₂e</div>
        </div>
        <div class="rounded-2xl bg-white border border-slate-200 p-5">
          <div class="text-xs text-slate-500">完成流转</div>
          <div class="mt-1 text-3xl font-bold text-slate-800">{{ tab === 'personal' ? userItemCount : campusCount }}</div>
          <div class="text-xs text-slate-500 mt-1">件</div>
        </div>
        <div class="rounded-2xl bg-white border border-slate-200 p-5">
          <div class="text-xs text-slate-500">{{ tab === 'personal' ? '参与天数' : '参与学生' }}</div>
          <div class="mt-1 text-3xl font-bold text-slate-800">
            <template v-if="tab === 'personal'">{{ activeDays }}</template>
            <template v-else>{{ Math.max(new Set(state.carbonRecords.map(r => r.userId)).size, 3) }}</template>
          </div>
          <div class="text-xs text-slate-500 mt-1">{{ tab === 'personal' ? '天' : '人' }}</div>
        </div>
      </div>

      <!-- 分类减碳环形图 -->
      <section v-if="perCategory.length > 0" class="rounded-2xl bg-white border border-slate-200 p-5 mb-6">
        <h2 class="font-semibold text-slate-800 mb-4">分类减碳贡献</h2>
        <div style="height: 240px; position: relative;">
          <category-doughnut :items="perCategory" />
        </div>
      </section>

      <!-- 等效换算 -->
      <section class="rounded-2xl bg-white border border-slate-200 p-5 mb-6">
        <h2 class="font-semibold text-slate-800 mb-4">等效换算</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div v-for="e in equivalents" :key="e.label"
               class="rounded-xl bg-slate-50 p-4 text-center">
            <div class="text-2xl mb-2">{{ e.icon }}</div>
            <div class="text-xs text-slate-500 mb-1">{{ e.label }}</div>
            <div class="text-xl font-bold text-leaf-700">{{ e.value }}</div>
            <div class="text-xs text-slate-500 mt-1">{{ e.unit }}</div>
          </div>
        </div>
        <div class="mt-4 text-xs text-slate-400 leading-relaxed">
          <div v-for="e in equivalents" :key="e.label + 'src'" class="inline">
            · {{ e.source }}
          </div>
        </div>
      </section>

      <section class="rounded-2xl bg-white border border-slate-200 p-5 mb-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="font-semibold text-slate-800">科普估算方法</h2>
            <p class="mt-1 text-sm text-slate-500">适合比赛展示和低碳教育，不用于精确碳审计。</p>
          </div>
          <router-link to="/calculator" class="shrink-0 text-sm text-leaf-700 hover:text-leaf-800">打开碳足迹计算器 →</router-link>
        </div>
        <div class="mt-4 grid md:grid-cols-3 gap-3">
          <div class="rounded-xl bg-leaf-50 border border-leaf-100 p-4">
            <div class="text-sm font-semibold text-leaf-800">基础公式</div>
            <div class="mt-2 text-sm text-leaf-900/80 leading-relaxed">
              预计减碳 = 估算重量 × 分类排放系数 × 替代购买比例
            </div>
          </div>
          <div class="rounded-xl bg-sky-50 border border-sky-100 p-4">
            <div class="text-sm font-semibold text-sky-800">计入规则</div>
            <div class="mt-2 text-sm text-sky-900/80 leading-relaxed">
              只有发布者确认“已完成流转”的物品计入总贡献；草稿、过期、下架不计入。
            </div>
          </div>
          <div class="rounded-xl bg-amber-50 border border-amber-100 p-4">
            <div class="text-sm font-semibold text-amber-800">展示边界</div>
            <div class="mt-2 text-sm text-amber-900/80 leading-relaxed">
              AI 只辅助识别类别和估重，用户可以修正；页面统一标注为预计值或估算值。
            </div>
          </div>
        </div>
      </section>

      <!-- 减碳明细 -->
      <section v-if="tab === 'personal' && userRecords.length > 0" class="rounded-2xl bg-white border border-slate-200 p-5 mb-6">
        <h2 class="font-semibold text-slate-800 mb-3">我的减碳明细</h2>
        <ul class="divide-y divide-slate-100">
          <li v-for="r in userRecords.slice(0, 20)" :key="r.id" class="py-3 flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-leaf-50 text-leaf-700 flex items-center justify-center shrink-0">
              {{ CATEGORY_MAP[r.category]?.icon || '📦' }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-slate-700">{{ CATEGORY_MAP[r.category]?.label || r.category }}</div>
              <div class="text-xs text-slate-400">{{ new Date(r.createdAt).toLocaleDateString('zh-CN') }}</div>
            </div>
            <div class="text-leaf-700 text-sm font-medium">+{{ r.carbonSavedKg }} kg</div>
          </li>
        </ul>
      </section>

      <!-- 分享按钮 -->
      <div class="flex justify-center mb-6">
        <button @click="generateShareCard" :disabled="generating"
                class="px-6 py-3 rounded-2xl bg-leaf-600 text-white font-medium hover:bg-leaf-700 disabled:opacity-50 inline-flex items-center gap-2 shadow-lg shadow-leaf-600/20">
          <span v-if="generating" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
          {{ generating ? '生成中...' : '生成分享海报' }}
        </button>
      </div>

      <!-- 估算说明 -->
      <section class="rounded-2xl bg-sky-50 border border-sky-200 p-5 text-sm text-sky-900 leading-relaxed">
        <div class="font-semibold mb-1">数据说明</div>
        <ul class="list-disc list-inside space-y-1">
          <li>数据仅统计 <strong>已完成流转</strong> 的物品，草稿、过期不计入。</li>
          <li>等效换算基于 IPCC AR6、中国电网排放因子、FAO 公开数据。</li>
          <li>本报告为 <strong>估算参考</strong>，不作为精确碳审计依据。</li>
        </ul>
      </section>

      <!-- 分享卡片模板 -->
      <div style="position:absolute;left:-9999px;top:0;">
        <div ref="shareCardRef">
          <share-card-template
            title="碳循校园 · 碳减排报告"
            :subtitle="tab === 'personal' ? '我的减碳贡献' : '校园减碳总览'"
            :user="shareUser"
            :stats="shareStats"
            :categories="perCategory" />
        </div>
      </div>
    </div>
  `,
};
