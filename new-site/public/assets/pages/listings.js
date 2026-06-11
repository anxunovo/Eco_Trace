import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { state, sweepExpired } from '../store.js?v=20260609-demo5';
import { CATEGORIES, TRADE_MODES, CAMPUS_LOCATIONS } from '../seed.js';
import { ListingCard, BottomSheet } from '../components.js?v=20260609-demo5';
import { useDevice } from '../device.js?v=20260609-demo5';

export default {
  components: { ListingCard, BottomSheet },
  setup() {
    sweepExpired();
    const route = useRoute();
    const router = useRouter();
    const { isLayoutMobile } = useDevice();

    const q = ref('');
    const category = ref('');
    const trade = ref('');
    const campus = ref('');
    const status = ref('ACTIVE');
    const priceMin = ref('');
    const priceMax = ref('');
    const tag = ref('');
    const sort = ref('latest');

    const filterOpen = ref(false);

    function readQuery() {
      q.value        = route.query.q || '';
      category.value = route.query.category || '';
      trade.value    = route.query.trade || '';
      campus.value   = route.query.campus || '';
      status.value   = route.query.status || 'ACTIVE';
      priceMin.value = route.query.min ?? '';
      priceMax.value = route.query.max ?? '';
      tag.value      = route.query.tag || '';
      sort.value     = route.query.sort || 'latest';
    }
    readQuery();
    watch(() => route.query, readQuery);

    function updateQuery() {
      const query = {};
      if (q.value)        query.q = q.value;
      if (category.value) query.category = category.value;
      if (trade.value)    query.trade = trade.value;
      if (campus.value)   query.campus = campus.value;
      if (status.value && status.value !== 'ACTIVE') query.status = status.value;
      if (priceMin.value !== '') query.min = priceMin.value;
      if (priceMax.value !== '') query.max = priceMax.value;
      if (tag.value)      query.tag = tag.value;
      if (sort.value && sort.value !== 'latest') query.sort = sort.value;
      router.replace({ path: '/listings', query });
    }

    function reset() {
      q.value = ''; category.value = ''; trade.value = ''; campus.value = '';
      status.value = 'ACTIVE'; priceMin.value = ''; priceMax.value = '';
      tag.value = ''; sort.value = 'latest';
      updateQuery();
    }

    const filtered = computed(() => {
      let list = state.listings.slice();
      if (status.value === 'ACTIVE')    list = list.filter(l => l.status === 'ACTIVE');
      else if (status.value === 'DONE') list = list.filter(l => l.status === 'COMPLETED');
      else if (status.value === 'EXPIRED') list = list.filter(l => l.status === 'EXPIRED');
      if (category.value) list = list.filter(l => l.category === category.value);
      if (trade.value)    list = list.filter(l => l.tradeMode === trade.value);
      if (campus.value)   list = list.filter(l => (l.locationText || '').includes(campus.value) || (l.campus || '') === campus.value);
      if (tag.value)      list = list.filter(l => (l.tags || []).includes(tag.value));
      const min = priceMin.value === '' ? null : Number(priceMin.value);
      const max = priceMax.value === '' ? null : Number(priceMax.value);
      if (min !== null) list = list.filter(l => (l.tradeMode === 'SALE' ? (l.price ?? 0) >= min : true));
      if (max !== null) list = list.filter(l => (l.tradeMode === 'SALE' ? (l.price ?? 0) <= max : true));
      if (q.value) {
        const kw = q.value.toLowerCase();
        list = list.filter(l =>
          (l.title || '').toLowerCase().includes(kw) ||
          (l.description || '').toLowerCase().includes(kw) ||
          (l.locationText || '').toLowerCase().includes(kw)
        );
      }
      if (sort.value === 'latest')       list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      else if (sort.value === 'carbon')  list.sort((a, b) => (b.estimatedCarbonSavedKg || 0) - (a.estimatedCarbonSavedKg || 0));
      else if (sort.value === 'free')    list.sort((a, b) => (a.tradeMode === 'FREE' ? -1 : 1) - (b.tradeMode === 'FREE' ? -1 : 1));
      else if (sort.value === 'expiring')list.sort((a, b) => {
        const ta = a.isFood ? new Date(a.foodInfo?.expireAt || 0).getTime() : Infinity;
        const tb = b.isFood ? new Date(b.foodInfo?.expireAt || 0).getTime() : Infinity;
        return ta - tb;
      });
      return list;
    });

    const campusOptions = ['', ...new Set(CAMPUS_LOCATIONS)];

    const activeFilterCount = computed(() => {
      let n = 0;
      if (category.value) n++;
      if (trade.value)    n++;
      if (campus.value)   n++;
      if (tag.value)      n++;
      if (priceMin.value !== '' || priceMax.value !== '') n++;
      if (status.value !== 'ACTIVE') n++;
      return n;
    });

    return {
      q, category, trade, campus, status, priceMin, priceMax, tag, sort,
      CATEGORIES, TRADE_MODES, campusOptions,
      filtered, updateQuery, reset, isLayoutMobile,
      filterOpen, activeFilterCount,
    };
  },
  template: `
    <!-- ============ 桌面端 ============ -->
    <div v-if="!isLayoutMobile" class="max-w-6xl mx-auto px-4 py-8">
      <div class="flex items-end justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-slate-800">发现校园闲置</h1>
          <p class="text-sm text-slate-500 mt-1">按需筛选：免费 / 付费 / 交换 / 食物分享。平台不接入支付，信息仅供撮合。</p>
        </div>
        <router-link to="/publish" class="hidden sm:inline-flex px-4 py-2 rounded-xl bg-leaf-600 text-white text-sm hover:bg-leaf-700">发布我的闲置</router-link>
      </div>

      <div class="flex gap-2 mb-4 items-center flex-wrap">
        <div class="relative flex-1 min-w-[220px]">
          <input v-model="q" @input="updateQuery" placeholder="搜索物品、地点、关键词…"
                 class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-leaf-300 text-sm" />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>
        <div class="seg shrink-0">
          <button v-for="s in [{k:'latest',l:'最新'},{k:'carbon',l:'减碳最高'},{k:'free',l:'免费优先'},{k:'expiring',l:'临近过期'}]"
                  :key="s.k" :class="{active: sort === s.k}" @click="sort = s.k; updateQuery()">{{ s.l }}</button>
        </div>
      </div>

      <div class="grid md:grid-cols-5 gap-3 mb-4">
        <select v-model="category" @change="updateQuery" class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
          <option value="">全部分类</option>
          <option v-for="c in CATEGORIES" :key="c.key" :value="c.key">{{ c.icon }} {{ c.label }}</option>
        </select>
        <select v-model="trade" @change="updateQuery" class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
          <option value="">全部流转方式</option>
          <option v-for="(m,k) in TRADE_MODES" :key="k" :value="k">{{ m.label }}</option>
        </select>
        <select v-model="status" @change="updateQuery" class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
          <option value="ACTIVE">可领取 / 可约</option>
          <option value="DONE">已完成</option>
          <option value="EXPIRED">已过期</option>
          <option value="ALL">所有状态</option>
        </select>
        <div class="flex gap-2 items-center bg-white border border-slate-200 rounded-lg px-2">
          <span class="text-slate-400 text-xs">¥</span>
          <input v-model="priceMin" @change="updateQuery" type="number" min="0" placeholder="最低"
                 class="w-full py-2 text-sm bg-transparent focus:outline-none" />
          <span class="text-slate-300">—</span>
          <input v-model="priceMax" @change="updateQuery" type="number" min="0" placeholder="最高"
                 class="w-full py-2 text-sm bg-transparent focus:outline-none" />
        </div>
        <select v-model="campus" @change="updateQuery" class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
          <option value="">全部校区 / 地点</option>
          <option v-for="loc in campusOptions.filter(x=>x)" :key="loc" :value="loc">{{ loc }}</option>
        </select>
      </div>

      <div v-if="q || category || trade || campus || tag || priceMin !== '' || priceMax !== '' || status !== 'ACTIVE'"
           class="flex items-center flex-wrap gap-2 mb-4 text-xs text-slate-500">
        <span>已筛选</span>
        <span v-if="tag" class="badge bg-leaf-100 text-leaf-700">专区：{{ tag === 'GRAD' ? '毕业季' : tag }}</span>
        <button @click="reset" class="text-leaf-600 hover:underline">清除全部</button>
      </div>

      <div class="text-sm text-slate-500 mb-3">共 {{ filtered.length }} 条结果</div>
      <div v-if="filtered.length === 0" class="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
        暂无匹配结果，换个筛选条件试试。
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <listing-card v-for="l in filtered" :key="l.id" :listing="l" />
      </div>
    </div>

    <!-- ============ 移动端 ============ -->
    <div v-else class="pb-4">
      <!-- 吸顶：搜索 + 筛选入口 -->
      <div class="sticky top-0 z-30 bg-cream/95 backdrop-blur">
        <div class="px-3 pt-3 pb-2 flex items-center gap-2">
          <div class="relative flex-1">
            <input v-model="q" @input="updateQuery" placeholder="搜索…"
                   class="w-full pl-9 pr-3 py-2 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-leaf-300" />
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          </div>
          <button @click="filterOpen = true"
                  class="shrink-0 relative px-3 py-2 rounded-full bg-white border border-slate-200 text-sm text-slate-600 active:bg-slate-50">
            筛选
            <span v-if="activeFilterCount" class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-leaf-600 text-white text-[10px] font-medium flex items-center justify-center">
              {{ activeFilterCount }}
            </span>
          </button>
        </div>

        <!-- 排序胶囊 -->
        <div class="px-3 pb-2">
          <div class="pill-row">
            <button v-for="s in [{k:'latest',l:'最新'},{k:'carbon',l:'减碳 TOP'},{k:'free',l:'免费'},{k:'expiring',l:'临近过期'}]"
                    :key="s.k"
                    @click="sort = s.k; updateQuery()"
                    class="px-3 py-1.5 rounded-full text-[13px] border transition"
                    :class="sort === s.k ? 'bg-leaf-600 text-white border-leaf-600' : 'bg-white text-slate-600 border-slate-200'">
              {{ s.l }}
            </button>
          </div>
        </div>
      </div>

      <!-- 结果计数 + 已选筛选 -->
      <div class="px-3 pt-2 pb-1 flex items-center justify-between text-[12px] text-slate-500">
        <span>共 {{ filtered.length }} 条</span>
        <button v-if="activeFilterCount || q" @click="reset"
                class="text-leaf-600">清除筛选</button>
      </div>

      <!-- 瀑布流 -->
      <div class="px-3 mt-2">
        <div v-if="filtered.length === 0"
             class="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 text-sm">
          暂无匹配结果
        </div>
        <div v-else class="waterfall">
          <listing-card v-for="l in filtered" :key="l.id" :listing="l" />
        </div>
      </div>

      <!-- 底部抽屉筛选 -->
      <bottom-sheet v-model="filterOpen" title="筛选">
        <div class="space-y-4 pb-2">
          <!-- 分类 -->
          <div>
            <div class="text-sm font-medium text-slate-700 mb-2">分类</div>
            <div class="flex flex-wrap gap-2">
              <button @click="category = ''"
                      class="px-3 py-1.5 rounded-full text-[13px] border"
                      :class="!category ? 'bg-leaf-600 text-white border-leaf-600' : 'bg-white text-slate-600 border-slate-200'">全部</button>
              <button v-for="c in CATEGORIES" :key="c.key"
                      @click="category = c.key"
                      class="px-3 py-1.5 rounded-full text-[13px] border"
                      :class="category === c.key ? 'bg-leaf-600 text-white border-leaf-600' : 'bg-white text-slate-600 border-slate-200'">
                {{ c.icon }} {{ c.label }}
              </button>
            </div>
          </div>

          <!-- 流转方式 -->
          <div>
            <div class="text-sm font-medium text-slate-700 mb-2">流转方式</div>
            <div class="flex flex-wrap gap-2">
              <button @click="trade = ''"
                      class="px-3 py-1.5 rounded-full text-[13px] border"
                      :class="!trade ? 'bg-leaf-600 text-white border-leaf-600' : 'bg-white text-slate-600 border-slate-200'">全部</button>
              <button v-for="(m,k) in TRADE_MODES" :key="k"
                      @click="trade = k"
                      class="px-3 py-1.5 rounded-full text-[13px] border"
                      :class="trade === k ? 'bg-leaf-600 text-white border-leaf-600' : 'bg-white text-slate-600 border-slate-200'">
                {{ m.label }}
              </button>
            </div>
          </div>

          <!-- 状态 -->
          <div>
            <div class="text-sm font-medium text-slate-700 mb-2">状态</div>
            <div class="flex flex-wrap gap-2">
              <button v-for="s in [{k:'ACTIVE',l:'可领取'},{k:'DONE',l:'已完成'},{k:'EXPIRED',l:'已过期'},{k:'ALL',l:'全部状态'}]"
                      :key="s.k"
                      @click="status = s.k"
                      class="px-3 py-1.5 rounded-full text-[13px] border"
                      :class="status === s.k ? 'bg-leaf-600 text-white border-leaf-600' : 'bg-white text-slate-600 border-slate-200'">
                {{ s.l }}
              </button>
            </div>
          </div>

          <!-- 价格区间 -->
          <div>
            <div class="text-sm font-medium text-slate-700 mb-2">价格区间（仅付费）</div>
            <div class="flex items-center gap-2">
              <div class="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white">
                <span class="text-slate-400 text-xs">¥</span>
                <input v-model="priceMin" type="number" min="0" placeholder="最低" class="w-full text-sm bg-transparent focus:outline-none" />
              </div>
              <span class="text-slate-300">—</span>
              <div class="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white">
                <span class="text-slate-400 text-xs">¥</span>
                <input v-model="priceMax" type="number" min="0" placeholder="最高" class="w-full text-sm bg-transparent focus:outline-none" />
              </div>
            </div>
          </div>

          <!-- 校区 -->
          <div>
            <div class="text-sm font-medium text-slate-700 mb-2">校区 / 地点</div>
            <select v-model="campus" class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
              <option value="">全部校区</option>
              <option v-for="loc in campusOptions.filter(x=>x)" :key="loc" :value="loc">{{ loc }}</option>
            </select>
          </div>

          <!-- 底部按钮 -->
          <div class="pt-2 flex gap-2">
            <button @click="reset(); filterOpen = false"
                    class="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600">重置</button>
            <button @click="updateQuery(); filterOpen = false"
                    class="flex-1 py-2.5 rounded-xl bg-leaf-600 text-white text-sm font-medium">查看 {{ filtered.length }} 条</button>
          </div>
        </div>
      </bottom-sheet>
    </div>
  `,
};
