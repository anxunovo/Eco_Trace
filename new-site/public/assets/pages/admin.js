import { ref, computed, watch } from 'vue';
import { state, actions, currentUser, getUser, sweepExpired, ECO_TIP_CATEGORIES } from '../store.js?v=20260609-demo5';
import { fetchAdminListings, removeAdminListing, resetAdminData } from '../api-adapter.js?v=20260609-demo5';
import { CATEGORIES, CATEGORY_MAP, STATUS_LABELS, TRADE_MODES } from '../seed.js';
import {
  TradeModeBadge, StatusBadge, CategoryBadge, toast,
} from '../components.js?v=20260609-demo5';

export default {
  components: { TradeModeBadge, StatusBadge, CategoryBadge },
  setup() {
    sweepExpired();

    const dataSource = ref('local');
    const apiListings = ref([]);

    async function fetchApiListings() {
      try {
        const data = await fetchAdminListings();
        apiListings.value = data?.listings || data?.data || [];
      } catch (err) {
        console.error('Failed to fetch api listings', err);
        toast('加载远程发布失败：' + (err.message || '服务器错误'), 'danger');
      }
    }

    watch(dataSource, (newVal) => {
      if (newVal === 'api') {
        fetchApiListings();
      }
    }, { immediate: true });

    const allListings = computed(() => {
      return dataSource.value === 'api' ? apiListings.value : state.listings;
    });

    const statusFilter = ref('ALL');
    const categoryFilter = ref('');
    const foodOnly = ref(false);
    const q = ref('');

    const filtered = computed(() => {
      let list = allListings.value.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (statusFilter.value !== 'ALL') list = list.filter(l => l.status === statusFilter.value);
      if (categoryFilter.value) list = list.filter(l => l.category === categoryFilter.value);
      if (foodOnly.value) list = list.filter(l => l.isFood);
      if (q.value) {
        const kw = q.value.toLowerCase();
        list = list.filter(l =>
          (l.title||'').toLowerCase().includes(kw) ||
          (l.description||'').toLowerCase().includes(kw)
        );
      }
      return list;
    });

    const stat = computed(() => ({
      total:     allListings.value.length,
      active:    allListings.value.filter(l => l.status === 'ACTIVE').length,
      completed: allListings.value.filter(l => l.status === 'COMPLETED').length,
      expired:   allListings.value.filter(l => l.status === 'EXPIRED').length,
      removed:   allListings.value.filter(l => l.status === 'REMOVED').length,
      food:      allListings.value.filter(l => l.isFood).length,
      users:     state.users.length,
      carbonRec: state.carbonRecords.length,
    }));

    async function doRemove(l) {
      if (!confirm(`确认下架「${l.title}」？管理员下架也可撤销（通过手动修改状态）。`)) return;
      if (dataSource.value === 'api') {
        try {
          await removeAdminListing(l.id);
          await fetchApiListings();
          toast('已下架', 'warn');
        } catch (err) {
          console.error(err);
          toast('下架失败：' + (err.message || '服务器错误'), 'danger');
        }
      } else {
        actions.removeListing(l.id);
        toast('已下架', 'warn');
      }
    }

    async function resetAll() {
      if (dataSource.value === 'api') {
        if (!confirm('这将清空数据库数据并重置为初始种子数据。确定继续？')) return;
        try {
          await resetAdminData();
          await fetchApiListings();
          toast('已重置', 'success');
        } catch (err) {
          console.error(err);
          toast('远程重置未启用：' + (err.message || '服务器拒绝'), 'danger');
        }
      } else {
        if (!confirm('这将清空浏览器本地存储并重置为初始种子数据。确定继续？')) return;
        localStorage.clear();
        location.reload();
      }
    }

    const isAdmin = computed(() => currentUser.value?.role === 'ADMIN');

    // ---------- 生态贴士管理 ----------
    const tipTab = ref('listings');
    const editingTip = ref(null);
    const tipForm = ref({ category: 'energy', title: '', body: '', action: '', carbonLink: '' });
    const showTipForm = ref(false);

    function editTip(tip) {
      editingTip.value = tip;
      tipForm.value = { category: tip.category, title: tip.title, body: tip.body, action: tip.action || '', carbonLink: tip.carbonLink || '' };
      showTipForm.value = true;
    }

    function newTip() {
      editingTip.value = null;
      tipForm.value = { category: 'energy', title: '', body: '', action: '', carbonLink: '' };
      showTipForm.value = true;
    }

    function saveTip() {
      if (!tipForm.value.title?.trim() || !tipForm.value.body?.trim()) {
        toast('标题和内容为必填', 'danger');
        return;
      }
      const data = editingTip.value
        ? { id: editingTip.value.id, ...tipForm.value }
        : { ...tipForm.value };
      actions.saveEcoTip(data);
      showTipForm.value = false;
      toast(editingTip.value ? '贴士已更新' : '贴士已创建');
    }

    function deleteTip(tip) {
      if (!confirm(`确认删除「${tip.title}」？`)) return;
      actions.deleteEcoTip(tip.id);
      toast('已删除', 'warn');
    }

    return {
      dataSource, statusFilter, categoryFilter, foodOnly, q,
      filtered, stat, doRemove, resetAll, isAdmin,
      currentUser, getUser,
      CATEGORIES, CATEGORY_MAP, STATUS_LABELS, TRADE_MODES,
      tipTab, editingTip, tipForm, showTipForm, editTip, newTip, saveTip, deleteTip,
      ECO_TIP_CATEGORIES, state,
    };
  },
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="flex items-end justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-slate-800">管理端（简版）</h1>
          <p class="text-sm text-slate-500 mt-1">
            当前身份：<span class="text-slate-700 font-medium">{{ currentUser?.nickname }}</span>
            <span v-if="!isAdmin" class="ml-2 text-amber-600">（切换到「管理员」以使用下架功能）</span>
          </p>
        </div>
        <div class="flex items-center gap-4">
          <!-- Tab 切换 -->
          <div class="flex rounded-xl bg-slate-100 p-1 gap-0.5">
            <button @click="tipTab = 'listings'"
                    class="px-3 py-1 text-sm rounded-lg transition-all"
                    :class="tipTab === 'listings' ? 'bg-white shadow-sm text-leaf-700 font-medium' : 'text-slate-500'">
              物品管理
            </button>
            <button @click="tipTab = 'tips'"
                    class="px-3 py-1 text-sm rounded-lg transition-all"
                    :class="tipTab === 'tips' ? 'bg-white shadow-sm text-leaf-700 font-medium' : 'text-slate-500'">
              生态贴士
            </button>
          </div>
          <div v-if="tipTab === 'listings'" class="flex items-center gap-2 text-sm bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span class="text-slate-500">数据来源:</span>
            <select v-model="dataSource" class="bg-transparent font-medium text-slate-700 outline-none cursor-pointer">
              <option value="local">本地缓存</option>
              <option value="api">远程 API</option>
            </select>
          </div>
          <button v-if="tipTab === 'listings'" @click="resetAll" class="text-red-600 text-sm hover:underline">重置演示数据</button>
        </div>
      </div>

      <!-- 统计 -->
      <div v-if="tipTab === 'listings'" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div class="rounded-2xl bg-white border border-slate-200 p-4">
          <div class="text-xs text-slate-500">全部发布</div>
          <div class="mt-1 text-2xl font-bold text-slate-800">{{ stat.total }}</div>
        </div>
        <div class="rounded-2xl bg-white border border-slate-200 p-4">
          <div class="text-xs text-slate-500">发布中 / 已完成</div>
          <div class="mt-1 text-2xl font-bold text-leaf-700">{{ stat.active }} / {{ stat.completed }}</div>
        </div>
        <div class="rounded-2xl bg-white border border-slate-200 p-4">
          <div class="text-xs text-slate-500">食物类 / 已过期</div>
          <div class="mt-1 text-2xl font-bold text-amber-600">{{ stat.food }} / {{ stat.expired }}</div>
        </div>
        <div class="rounded-2xl bg-white border border-slate-200 p-4">
          <div class="text-xs text-slate-500">用户 / 减碳记录</div>
          <div class="mt-1 text-2xl font-bold text-slate-800">{{ stat.users }} / {{ stat.carbonRec }}</div>
        </div>
      </div>

      <!-- 筛选 -->
      <div v-if="tipTab === 'listings'" class="rounded-2xl bg-white border border-slate-200 p-4 mb-4 grid md:grid-cols-4 gap-3 items-center">
        <input v-model="q" placeholder="搜索标题 / 描述" class="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        <select v-model="statusFilter" class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
          <option value="ALL">全部状态</option>
          <option v-for="(v,k) in STATUS_LABELS" :key="k" :value="k">{{ v.label }}</option>
        </select>
        <select v-model="categoryFilter" class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
          <option value="">全部分类</option>
          <option v-for="c in CATEGORIES" :key="c.key" :value="c.key">{{ c.icon }} {{ c.label }}</option>
        </select>
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" v-model="foodOnly" /> 只看食物类
        </label>
      </div>

      <!-- 表格 -->
      <div v-if="tipTab === 'listings'" class="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr class="text-left">
                <th class="px-4 py-2.5 font-medium">标题</th>
                <th class="px-4 py-2.5 font-medium">发布者</th>
                <th class="px-4 py-2.5 font-medium">分类</th>
                <th class="px-4 py-2.5 font-medium">方式</th>
                <th class="px-4 py-2.5 font-medium">状态</th>
                <th class="px-4 py-2.5 font-medium">预计减碳</th>
                <th class="px-4 py-2.5 font-medium">创建</th>
                <th class="px-4 py-2.5 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="l in filtered" :key="l.id" class="hover:bg-slate-50">
                <td class="px-4 py-2.5">
                  <router-link :to="'/listings/' + l.id" class="text-slate-800 hover:text-leaf-700 line-clamp-1">
                    {{ l.title }}
                  </router-link>
                </td>
                <td class="px-4 py-2.5 text-slate-600">{{ getUser(l.ownerId)?.nickname || l.owner?.nickname || '—' }}</td>
                <td class="px-4 py-2.5"><category-badge :category="l.category" /></td>
                <td class="px-4 py-2.5"><trade-mode-badge :mode="l.tradeMode" :price="l.price" :swap="l.swapWanted" /></td>
                <td class="px-4 py-2.5"><status-badge :status="l.status" /></td>
                <td class="px-4 py-2.5 text-leaf-700 font-medium">{{ l.estimatedCarbonSavedKg ?? 0 }} kg</td>
                <td class="px-4 py-2.5 text-slate-500 text-[12px]">{{ new Date(l.createdAt).toLocaleDateString('zh-CN') }}</td>
                <td class="px-4 py-2.5 text-right whitespace-nowrap">
                  <router-link :to="'/listings/' + l.id" class="text-leaf-600 text-xs mr-3">查看</router-link>
                  <button v-if="isAdmin && l.status === 'ACTIVE'"
                          @click="doRemove(l)"
                          class="text-red-600 text-xs hover:underline">下架</button>
                  <span v-else-if="!isAdmin && l.status === 'ACTIVE'" class="text-slate-300 text-xs">下架</span>
                </td>
              </tr>
              <tr v-if="filtered.length === 0">
                <td colspan="8" class="px-4 py-10 text-center text-slate-400">暂无记录</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 生态贴士管理 -->
      <div v-if="tipTab === 'tips'">
        <div class="flex items-center justify-between mb-4">
          <div class="text-sm text-slate-500">共 {{ state.ecoTips.length }} 条贴士</div>
          <button @click="newTip" class="px-4 py-2 rounded-xl bg-leaf-600 text-white text-sm font-medium hover:bg-leaf-700">
            + 新建贴士
          </button>
        </div>

        <!-- 新建/编辑表单 -->
        <div v-if="showTipForm" class="rounded-2xl bg-white border border-slate-200 p-5 mb-4">
          <h3 class="font-semibold text-slate-800 mb-3">{{ editingTip ? '编辑贴士' : '新建贴士' }}</h3>
          <div class="space-y-3">
            <div>
              <label class="text-sm text-slate-600 block mb-1">分类</label>
              <select v-model="tipForm.category" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                <option v-for="cat in ECO_TIP_CATEGORIES" :key="cat.key" :value="cat.key">{{ cat.icon }} {{ cat.label }}</option>
              </select>
            </div>
            <div>
              <label class="text-sm text-slate-600 block mb-1">标题 *</label>
              <input v-model="tipForm.title" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="例如：随手关灯，省电又减碳" />
            </div>
            <div>
              <label class="text-sm text-slate-600 block mb-1">内容 *</label>
              <textarea v-model="tipForm.body" rows="3" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="详细描述这个环保知识点"></textarea>
            </div>
            <div>
              <label class="text-sm text-slate-600 block mb-1">你可以做什么</label>
              <input v-model="tipForm.action" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="具体的行动建议" />
            </div>
            <div>
              <label class="text-sm text-slate-600 block mb-1">平台减碳关联</label>
              <input v-model="tipForm.carbonLink" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="例如：发布闲置物品可减碳 X kg" />
            </div>
            <div class="flex gap-2">
              <button @click="saveTip" class="px-4 py-2 rounded-xl bg-leaf-600 text-white text-sm font-medium hover:bg-leaf-700">保存</button>
              <button @click="showTipForm = false" class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">取消</button>
            </div>
          </div>
        </div>

        <!-- 贴士列表 -->
        <div class="space-y-3">
          <div v-for="tip in state.ecoTips" :key="tip.id"
               class="rounded-2xl bg-white border border-slate-200 p-4">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
                        :class="ECO_TIP_CATEGORIES.find(c => c.key === tip.category)?.color || 'bg-slate-100 text-slate-700'">
                    {{ ECO_TIP_CATEGORIES.find(c => c.key === tip.category)?.icon || '🌱' }}
                    {{ ECO_TIP_CATEGORIES.find(c => c.key === tip.category)?.label || tip.category }}
                  </span>
                  <span class="font-medium text-slate-800 truncate">{{ tip.title }}</span>
                </div>
                <div class="text-sm text-slate-600 line-clamp-2">{{ tip.body }}</div>
              </div>
              <div class="shrink-0 flex gap-2 ml-3">
                <button @click="editTip(tip)" class="text-leaf-600 text-xs hover:underline">编辑</button>
                <button @click="deleteTip(tip)" class="text-red-600 text-xs hover:underline">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
