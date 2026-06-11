import { ref, computed, onMounted } from 'vue';
import { state, actions, currentUser, sweepExpired, round1 } from '../store.js?v=20260609-demo5';
import { isApiMode, fetchListings, deleteListing as apiDeleteListing, completeListing as apiCompleteListing } from '../api-adapter.js?v=20260609-demo5';
import { CATEGORY_MAP, STATUS_LABELS } from '../seed.js';
import {
  TradeModeBadge, StatusBadge, CarbonBadge, CategoryBadge,
  ConfirmCompleteDialog, toast,
} from '../components.js?v=20260609-demo5';

export default {
  components: { TradeModeBadge, StatusBadge, CarbonBadge, CategoryBadge, ConfirmCompleteDialog },
  setup() {
    sweepExpired();
    const filter = ref('ALL');
    const showCompleteDialog = ref(false);
    const targetListing = ref(null);

    const apiMode = ref(false);
    const apiListings = ref([]);
    const apiFetched = ref(false);

    onMounted(async () => {
      apiMode.value = await isApiMode();
      if (apiMode.value) {
        try {
          const data = await fetchListings({ ownerId: currentUser.value.id, status: 'ALL', limit: 100 });
          apiListings.value = data?.listings || data?.data || [];
          apiFetched.value = true;
        } catch (e) {
          console.warn('Failed to fetch listings via API', e);
        }
      }
    });

    const mine = computed(() =>
      (apiMode.value && apiFetched.value) ? apiListings.value : state.listings.filter(l => l.ownerId === currentUser.value?.id)
    );
    const filtered = computed(() => {
      if (filter.value === 'ALL') return mine.value.slice().sort(byCreatedDesc);
      return mine.value.filter(l => l.status === filter.value).sort(byCreatedDesc);
    });
    function byCreatedDesc(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }

    const myTotal = computed(() => {
      if (apiMode.value && apiFetched.value) {
         return apiListings.value.filter(l => l.status === 'COMPLETED').reduce((s, l) => s + (l.estimatedCarbonSavedKg || 0), 0);
      }
      return state.carbonRecords
      .filter(r => r.userId === currentUser.value?.id)
      .reduce((s, r) => s + (r.carbonSavedKg || 0), 0);
    });
    const myCompleted = computed(() => {
      if (apiMode.value && apiFetched.value) {
         return apiListings.value.filter(l => l.status === 'COMPLETED').length;
      }
      return state.carbonRecords
      .filter(r => r.userId === currentUser.value?.id).length;
    });

    function openComplete(l) {
      targetListing.value = l;
      showCompleteDialog.value = true;
    }
    async function doRemove(l) {
      if (!confirm(`确认下架「${l.title}」？`)) return;
      if (apiMode.value) {
        try {
          await apiDeleteListing(l.id);
          const localItem = apiListings.value.find(x => x.id === l.id);
          if (localItem) localItem.status = 'REMOVED';
          const cachedItem = state.listings.find(x => x.id === l.id);
          if (cachedItem) cachedItem.status = 'REMOVED';
        } catch (e) {
          console.warn('Failed to remove listing via API', e);
          toast('下架失败：' + (e.message || '服务器错误'), 'danger');
          return;
        }
      } else {
        await actions.removeListing(l.id);
      }
      toast('已下架', 'warn');
    }

    async function handleComplete() {
      if (!targetListing.value) return;
      if (apiMode.value) {
        try {
          const res = await apiCompleteListing(targetListing.value.id);
          const completed = res?.listing || {
            ...targetListing.value,
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const localItem = apiListings.value.find(x => x.id === targetListing.value.id);
          if (localItem) Object.assign(localItem, completed);
          const cachedItem = state.listings.find(x => x.id === targetListing.value.id);
          if (cachedItem) Object.assign(cachedItem, completed);
          toast('已确认流转完成');
          if (res?.new_badges?.length) {
            for (const b of res.new_badges) {
              toast(`${b.icon} 获得新徽章：${b.name}`, 'success');
            }
          }
        } catch (e) {
          console.warn('Failed to complete listing via API', e);
          toast('确认失败：' + (e.message || '服务器错误'), 'danger');
        }
        return;
      }
      const rec = actions.completeListing(targetListing.value.id);
      if (rec) toast(`流转完成，已节约约 ${rec.carbonSavedKg} kg CO₂e`);
    }

    function countInterests(l) {
      return actions.listInterestsOf(l.id).length;
    }

    return {
      filter, mine, filtered, myTotal, myCompleted,
      showCompleteDialog, targetListing, openComplete, doRemove, handleComplete,
      countInterests, round1, currentUser,
      CATEGORY_MAP, STATUS_LABELS,
    };
  },
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="flex items-end justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-slate-800">我的发布</h1>
          <p class="text-sm text-slate-500 mt-1">
            当前身份：<span class="text-slate-700 font-medium">{{ currentUser?.nickname }}</span>
            · 可以在右上角切换身份以演示不同发布者
          </p>
        </div>
        <router-link to="/publish" class="hidden sm:inline-flex px-4 py-2 rounded-xl bg-leaf-600 text-white text-sm hover:bg-leaf-700">发布新物品</router-link>
      </div>

      <!-- 个人数据 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="rounded-2xl bg-white border border-slate-200 p-4">
          <div class="text-xs text-slate-500">我的累计估算减碳</div>
          <div class="mt-1 text-2xl font-bold text-leaf-700">{{ round1(myTotal) }}<span class="text-sm font-normal text-slate-500 ml-1">kg</span></div>
        </div>
        <div class="rounded-2xl bg-white border border-slate-200 p-4">
          <div class="text-xs text-slate-500">完成流转次数</div>
          <div class="mt-1 text-2xl font-bold text-leaf-700">{{ myCompleted }}</div>
        </div>
        <div class="rounded-2xl bg-white border border-slate-200 p-4">
          <div class="text-xs text-slate-500">当前发布数</div>
          <div class="mt-1 text-2xl font-bold text-slate-700">{{ mine.filter(x=>x.status==='ACTIVE').length }}</div>
        </div>
        <div class="rounded-2xl bg-white border border-slate-200 p-4">
          <div class="text-xs text-slate-500">总发布</div>
          <div class="mt-1 text-2xl font-bold text-slate-700">{{ mine.length }}</div>
        </div>
      </div>

      <!-- 状态筛选 -->
      <div class="seg mb-4">
        <button v-for="s in [
          {k:'ALL', l:'全部'},
          {k:'ACTIVE', l:'发布中'},
          {k:'COMPLETED', l:'已流转'},
          {k:'EXPIRED', l:'已过期'},
          {k:'REMOVED', l:'已下架'},
          {k:'DRAFT', l:'草稿'},
        ]" :key="s.k" :class="{active: filter===s.k}" @click="filter=s.k">{{ s.l }}</button>
      </div>

      <!-- 列表 -->
      <div v-if="filtered.length===0"
           class="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
        还没有符合条件的发布。
      </div>
      <div v-else class="space-y-3">
        <div v-for="l in filtered" :key="l.id"
             class="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col sm:flex-row gap-4">
          <router-link :to="'/listings/' + l.id"
                       class="w-full sm:w-40 aspect-[4/3] sm:aspect-auto sm:h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0">
            <img v-if="l.images?.[0]" :src="l.images[0]" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full placeholder-img flex items-center justify-center text-3xl">
              {{ CATEGORY_MAP[l.category]?.icon || '📦' }}
            </div>
          </router-link>
          <div class="flex-1 min-w-0">
            <div class="flex items-start gap-2">
              <router-link :to="'/listings/' + l.id" class="font-semibold text-slate-800 hover:text-leaf-700 line-clamp-2">{{ l.title }}</router-link>
            </div>
            <div class="mt-1.5 flex gap-1.5 flex-wrap">
              <status-badge :status="l.status" />
              <trade-mode-badge :mode="l.tradeMode" :price="l.price" :swap="l.swapWanted" />
              <category-badge :category="l.category" />
            </div>
            <div class="mt-2 text-[13px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
              <span>📍 {{ l.locationText }}</span>
              <span v-if="l.interestedCount">❤️ 意向 {{ l.interestedCount }} 人</span>
              <span>🕒 {{ new Date(l.createdAt).toLocaleDateString('zh-CN') }}</span>
            </div>
            <div class="mt-2">
              <carbon-badge :value="l.estimatedCarbonSavedKg" :completed="l.status === 'COMPLETED'" />
            </div>
          </div>
          <div class="flex sm:flex-col flex-wrap gap-2 justify-end shrink-0">
            <button v-if="l.status === 'ACTIVE'"
                    @click="openComplete(l)"
                    class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700">
              ✅ 确认已流转
            </button>
            <router-link v-if="l.status === 'ACTIVE' || l.status === 'DRAFT'"
                         :to="'/publish?edit=' + l.id"
                         class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 text-center">编辑</router-link>
            <button v-if="l.status === 'ACTIVE'"
                    @click="doRemove(l)"
                    class="px-3 py-1.5 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50">下架</button>
          </div>
        </div>
      </div>

      <confirm-complete-dialog v-if="targetListing"
                               v-model="showCompleteDialog"
                               :listing="targetListing"
                               @confirmed="handleComplete" />
    </div>
  `,
};
