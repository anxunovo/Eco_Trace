// "我的"聚合页（移动端主入口；桌面端也能访问）
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { state, currentUser, round1, isAuthenticated, authState, clearAuth } from '../store.js?v=20260609-demo5';
import { logout, fetchUserProfile, fetchCarbonStats, getDashboard, isApiMode } from '../api-adapter.js?v=20260609-demo5';
import { CATEGORY_MAP } from '../seed.js';
import { toast } from '../components.js?v=20260609-demo5';

export default {
  setup() {
    const router = useRouter();
    const apiProfile = ref(null);
    const myCategoryStats = ref(null);
    const myRank = ref(null);
    const myBadges = ref([]);
    const allBadgeDefs = ref([]);

    onMounted(async () => {
      if (isAuthenticated.value && await isApiMode()) {
        try {
          const [profile, stats, dash] = await Promise.all([
            fetchUserProfile(),
            fetchCarbonStats('user', 'all'),
            getDashboard(),
          ]);
          apiProfile.value = profile?.data || profile;
          if (stats?.byCategory) myCategoryStats.value = stats.byCategory;
          if (dash?.userStats?.myRank) myRank.value = dash.userStats.myRank;
          else if (dash?.data?.userStats?.myRank) myRank.value = dash.data.userStats.myRank;
          const pData = profile?.data || profile;
          if (pData?.badges) myBadges.value = pData.badges;
          if (pData?.allBadges) allBadgeDefs.value = pData.allBadges;
        } catch (e) {
          console.warn('Failed to fetch user profile via API', e);
        }
      }
    });

    const activeUser = computed(() => apiProfile.value || authState.user || currentUser.value);

    const myListings = computed(() => state.listings.filter(l => l.ownerId === activeUser.value?.id));
    const myActive   = computed(() => apiProfile.value?.activeCount ?? myListings.value.filter(l => l.status === 'ACTIVE').length);
    const myRecords  = computed(() => state.carbonRecords.filter(r => r.userId === activeUser.value?.id));
    const myCarbon   = computed(() => apiProfile.value?.totalCarbonSavedKg ?? round1(myRecords.value.reduce((s, r) => s + (r.carbonSavedKg || 0), 0)));
    const isAdmin    = computed(() => activeUser.value?.role === 'ADMIN');

    const perCategory = computed(() => {
      if (myCategoryStats.value) {
        const arr = Array.isArray(myCategoryStats.value)
          ? myCategoryStats.value
          : Object.entries(myCategoryStats.value).map(([k, v]) => ({ category: k, ...v }));
        return arr
          .map(c => {
            const cat = CATEGORY_MAP[c.category];
            return { key: c.category, label: cat?.label || c.category, icon: cat?.icon || '📦', kg: round1(c.total || 0), count: c.count || 0 };
          })
          .filter(c => c.kg > 0)
          .sort((a, b) => b.kg - a.kg);
      }
      const agg = {};
      for (const r of myRecords.value) {
        if (!agg[r.category]) agg[r.category] = { kg: 0, count: 0 };
        agg[r.category].kg += r.carbonSavedKg || 0;
        agg[r.category].count += 1;
      }
      return Object.entries(agg)
        .map(([k, v]) => {
          const cat = CATEGORY_MAP[k];
          return { key: k, label: cat?.label || k, icon: cat?.icon || '📦', kg: round1(v.kg), count: v.count };
        })
        .filter(c => c.kg > 0)
        .sort((a, b) => b.kg - a.kg);
    });
    const maxCatKg = computed(() => Math.max(...perCategory.value.map(c => c.kg), 1));

    const badgeShelf = computed(() => {
      const earnedKeys = new Set(myBadges.value.map(b => b.key));
      const all = allBadgeDefs.value.length > 0 ? allBadgeDefs.value : [
        { key: 'FIRST_PUBLISH', icon: '🌱', name: '首次发布', desc: '发布第一个物品' },
        { key: 'FIRST_COMPLETE', icon: '🤝', name: '首次流转', desc: '完成第一次物品流转' },
        { key: 'CARBON_10', icon: '🌿', name: '减碳达人', desc: '累计减碳达到 10 kg' },
        { key: 'CARBON_50', icon: '🌳', name: '环保先锋', desc: '累计减碳达到 50 kg' },
        { key: 'CARBON_100', icon: '🏆', name: '碳中和之星', desc: '累计减碳达到 100 kg' },
        { key: 'TRADE_10', icon: '📦', name: '二手达人', desc: '完成 10 次物品流转' },
      ];
      return all.map(b => ({
        ...b,
        earned: earnedKeys.has(b.key),
        earnedAt: myBadges.value.find(eb => eb.key === b.key)?.earnedAt,
      }));
    });
    const earnedCount = computed(() => badgeShelf.value.filter(b => b.earned).length);

    function handleLogout() {
      logout();
      clearAuth();
      toast('已退出登录');
      router.push('/');
    }

    async function resetAll() {
      if (!confirm('将清空浏览器本地数据并重置为初始种子，确定？')) return;
      localStorage.clear();
      location.reload();
    }

    return {
      currentUser: activeUser, isAdmin, isAuthenticated,
      myListings, myActive, myCarbon, myRecords,
      perCategory, maxCatKg, myRank,
      badgeShelf, earnedCount, myBadges,
      handleLogout, resetAll,
    };
  },
  template: `
    <div class="max-w-3xl mx-auto">
      <div v-if="!isAuthenticated" class="px-4 pt-12 pb-8 text-center">
        <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl mx-auto mb-4">👤</div>
        <div class="text-slate-600 mb-6">登录后可查看和管理个人信息</div>
        <router-link to="/auth" class="px-6 py-2.5 rounded-xl bg-leaf-600 text-white font-medium hover:bg-leaf-700">去登录</router-link>
      </div>

      <template v-else>
      <!-- 身份卡 -->
      <section class="px-4 pt-6 pb-4">
        <div class="rounded-3xl p-5 relative overflow-hidden"
             style="background: linear-gradient(135deg, #5fae6c 0%, #2f7740 100%);">
          <div class="absolute -right-6 -top-6 text-[120px] opacity-10">🌿</div>
          <div class="flex items-center gap-3 relative">
            <div class="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl">
              {{ currentUser?.avatar || '👤' }}
            </div>
            <div class="flex-1 min-w-0 text-white">
              <div class="font-semibold text-lg truncate">{{ currentUser?.nickname || '—' }}</div>
              <div class="text-xs text-white/80 mt-0.5">
                {{ currentUser?.school }}{{ currentUser?.campus ? ' · ' + currentUser.campus : '' }}
                <span v-if="isAdmin" class="ml-1.5 inline-block px-1.5 py-0.5 rounded bg-white/20 text-[10px]">管理员</span>
              </div>
            </div>
            <router-link v-if="!isAuthenticated" to="/auth" class="text-white/90 text-xs px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 shrink-0">登录</router-link>
          </div>

          <!-- 数据卡 -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
            <div class="rounded-2xl bg-white/15 backdrop-blur px-3 py-2.5 text-white">
              <div class="text-[11px] text-white/80">我的减碳</div>
              <div class="mt-0.5 font-bold text-lg leading-tight">{{ myCarbon }}<span class="text-[10px] font-normal ml-0.5">kg</span></div>
            </div>
            <div class="rounded-2xl bg-white/15 backdrop-blur px-3 py-2.5 text-white">
              <div class="text-[11px] text-white/80">完成流转</div>
              <div class="mt-0.5 font-bold text-lg leading-tight">{{ myRecords.length }}</div>
            </div>
            <div class="rounded-2xl bg-amber-400/20 backdrop-blur px-3 py-2.5 text-white">
              <div class="text-[11px] text-white/80">积分</div>
              <div class="mt-0.5 font-bold text-lg leading-tight">{{ currentUser?.ecoPoints ?? 0 }}</div>
            </div>
            <div class="rounded-2xl bg-white/15 backdrop-blur px-3 py-2.5 text-white">
              <div class="text-[11px] text-white/80">徽章</div>
              <div class="mt-0.5 font-bold text-lg leading-tight">{{ earnedCount }}<span class="text-[10px] font-normal ml-0.5">/ {{ badgeShelf.length }}</span></div>
            </div>
          </div>
        </div>
      </section>

      <!-- 个人碳足迹详情 -->
      <section class="px-4 pb-4">
        <div class="rounded-2xl bg-white border border-slate-200 p-5">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-slate-800">我的碳足迹</h2>
            <span v-if="myRank" class="text-xs px-2.5 py-1 rounded-full font-medium"
                  :class="myRank <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-leaf-100 text-leaf-700'">
              {{ myRank <= 3 ? ['🥇','🥈','🥉'][myRank-1] : '' }} 排名 #{{ myRank }}
            </span>
          </div>

          <div v-if="perCategory.length === 0" class="text-slate-400 text-sm py-4 text-center">
            完成流转后将在此显示减碳明细
          </div>

          <div v-else class="space-y-2.5">
            <div v-for="c in perCategory" :key="c.key" class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-leaf-50 flex items-center justify-center text-lg shrink-0">
                {{ c.icon }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="text-slate-700">{{ c.label }}</span>
                  <span class="text-leaf-700 font-medium">{{ c.kg }} kg <span class="text-slate-400 font-normal">({{ c.count }}次)</span></span>
                </div>
                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-leaf-400 rounded-full transition-all duration-500"
                       :style="{ width: (c.kg / maxCatKg * 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="perCategory.length > 0" class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
            <span class="text-slate-500">累计减碳</span>
            <span class="text-leaf-700 font-bold text-lg">{{ myCarbon }} kg CO₂e</span>
          </div>
        </div>
      </section>

      <!-- 徽章架 -->
      <section class="px-4 pb-4">
        <div class="rounded-2xl bg-white border border-slate-200 p-5">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-slate-800">成就徽章</h2>
            <span class="text-xs text-slate-400">{{ earnedCount }} / {{ badgeShelf.length }} 已获得</span>
          </div>
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <div v-for="b in badgeShelf" :key="b.key"
                 class="flex flex-col items-center text-center p-3 rounded-xl transition"
                 :class="b.earned ? 'bg-leaf-50' : 'bg-slate-50 opacity-50'">
              <div class="text-3xl mb-1" :class="b.earned ? '' : 'grayscale'">{{ b.icon }}</div>
              <div class="text-xs font-medium" :class="b.earned ? 'text-leaf-700' : 'text-slate-400'">{{ b.name }}</div>
              <div class="text-[10px] mt-0.5" :class="b.earned ? 'text-slate-500' : 'text-slate-300'">{{ b.desc }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 功能列表 -->
      <section class="px-4 pb-6">
        <div class="rounded-2xl bg-white border border-slate-200 overflow-hidden divide-y divide-slate-100">
          <router-link to="/me/listings"
                       class="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100">
            <div class="w-9 h-9 rounded-xl bg-leaf-50 text-leaf-600 flex items-center justify-center text-xl">📦</div>
            <div class="flex-1">
              <div class="text-slate-800 text-[15px]">我的发布</div>
              <div class="text-[12px] text-slate-400">管理、编辑、确认已流转</div>
            </div>
            <div class="text-slate-300">›</div>
          </router-link>

          <router-link to="/impact"
                       class="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100">
            <div class="w-9 h-9 rounded-xl bg-leaf-50 text-leaf-600 flex items-center justify-center text-xl">🌿</div>
            <div class="flex-1">
              <div class="text-slate-800 text-[15px]">减碳看板</div>
              <div class="text-[12px] text-slate-400">校园累计减碳 · 个人排行</div>
            </div>
            <div class="text-slate-300">›</div>
          </router-link>

          <router-link to="/report"
                       class="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100">
            <div class="w-9 h-9 rounded-xl bg-leaf-50 text-leaf-600 flex items-center justify-center text-xl">📊</div>
            <div class="flex-1">
              <div class="text-slate-800 text-[15px]">碳减排报告</div>
              <div class="text-[12px] text-slate-400">个人贡献 · 等效换算 · 分享海报</div>
            </div>
            <div class="text-slate-300">›</div>
          </router-link>

          <router-link to="/calculator"
                       class="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100">
            <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">🧮</div>
            <div class="flex-1">
              <div class="text-slate-800 text-[15px]">碳足迹估算</div>
              <div class="text-[12px] text-slate-400">交通 · 电力 · 饮食碳排放估算</div>
            </div>
            <div class="text-slate-300">›</div>
          </router-link>

          <router-link to="/eco-tips"
                       class="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100">
            <div class="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-xl">🌱</div>
            <div class="flex-1">
              <div class="text-slate-800 text-[15px]">生态小贴士</div>
              <div class="text-[12px] text-slate-400">环保知识 · 绿色生活行动</div>
            </div>
            <div class="text-slate-300">›</div>
          </router-link>

          <router-link to="/publish"
                       class="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100">
            <div class="w-9 h-9 rounded-xl bg-leaf-50 text-leaf-600 flex items-center justify-center text-xl">＋</div>
            <div class="flex-1">
              <div class="text-slate-800 text-[15px]">发布新物品</div>
              <div class="text-[12px] text-slate-400">上传图片，自动估算减碳</div>
            </div>
            <div class="text-slate-300">›</div>
          </router-link>

          <router-link v-if="isAdmin" to="/admin"
                       class="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100">
            <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">🛠️</div>
            <div class="flex-1">
              <div class="text-slate-800 text-[15px]">管理端</div>
              <div class="text-[12px] text-slate-400">下架违规 · 查看全部发布</div>
            </div>
            <div class="text-slate-300">›</div>
          </router-link>
        </div>

        <div class="mt-4 rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <button @click="resetAll"
                  class="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100">
            <div class="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center text-xl">🔄</div>
            <div class="flex-1">
              <div class="text-slate-800 text-[15px]">重置演示数据</div>
              <div class="text-[12px] text-slate-400">清空本地数据并恢复初始种子</div>
            </div>
            <div class="text-slate-300">›</div>
          </button>

          <button v-if="isAuthenticated" @click="handleLogout"
                  class="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-red-50 active:bg-red-100 border-t border-slate-100">
            <div class="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center text-xl">🚪</div>
            <div class="flex-1">
              <div class="text-red-600 text-[15px]">退出登录</div>
            </div>
            <div class="text-slate-300">›</div>
          </button>
        </div>

        <div class="text-center text-[12px] text-slate-400 mt-6">
          碳循校园 · 让闲置被再次使用
        </div>
      </section>
      </template>
    </div>
  `,
};
