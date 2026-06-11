import { computed, ref, reactive, watch, nextTick } from 'vue';
import {
  CATEGORIES, CATEGORY_MAP, TRADE_MODES, CONDITIONS, STATUS_LABELS, HOME_ENTRIES,
} from './seed.js';
import { currentUser, isAuthenticated, authState, clearAuth } from './store.js?v=20260609-demo5';
import { logout } from './api-adapter.js?v=20260609-demo5';

// ---------- Toast 全局 ----------
export const toasts = reactive({ items: [] });
let toastId = 0;
export function toast(message, type = 'ok', ms = 4000) {
  const id = ++toastId;
  toasts.items.push({ id, message, type });
  setTimeout(() => {
    const idx = toasts.items.findIndex(t => t.id === id);
    if (idx >= 0) toasts.items.splice(idx, 1);
  }, ms);
}

export const ToastStack = {
  setup() {
    return { toasts };
  },
  template: `
    <div class="toast-wrap" role="status" aria-live="polite" aria-atomic="true">
      <div v-for="t in toasts.items" :key="t.id" class="toast-item" :class="t.type"
           :role="t.type === 'danger' ? 'alert' : 'status'"
           :aria-live="t.type === 'danger' ? 'assertive' : 'polite'">
        {{ t.message }}
      </div>
    </div>
  `,
};

// ---------- 徽章 ----------
export const TradeModeBadge = {
  props: ['mode', 'price', 'swap'],
  computed: {
    meta() { return TRADE_MODES[this.mode] || TRADE_MODES.NEGOTIABLE; },
    text() {
      if (this.mode === 'SALE')       return '付费 ¥' + (this.price ?? 0);
      if (this.mode === 'FREE')       return '免费赠送';
      if (this.mode === 'SWAP')       return '交换' + (this.swap ? `：${this.swap}` : '');
      if (this.mode === 'NEGOTIABLE') return '面议';
      return '—';
    },
  },
  template: `<span class="badge" :class="meta.color"><span>{{ text }}</span></span>`,
};

export const StatusBadge = {
  props: ['status'],
  computed: { meta() { return STATUS_LABELS[this.status] || STATUS_LABELS.ACTIVE; } },
  template: `<span class="badge" :class="meta.color">{{ meta.label }}</span>`,
};

export const CarbonBadge = {
  props: ['value', 'completed'],
  template: `
    <span class="badge"
          :class="completed ? 'bg-emerald-600 text-white' : 'bg-leaf-100 text-leaf-700'">
      🌿 {{ completed ? '已节约' : '预计可节约' }} {{ value ?? 0 }} kg CO₂e
    </span>
  `,
};

export const ConditionBadge = {
  props: ['condition'],
  computed: { label() { return CONDITIONS[this.condition] || '—'; } },
  template: `<span class="badge bg-slate-100 text-slate-600">{{ label }}</span>`,
};

export const CategoryBadge = {
  props: ['category'],
  computed: { meta() { return CATEGORY_MAP[this.category]; } },
  template: `
    <span class="badge bg-leaf-50 text-leaf-700" v-if="meta">
      <span>{{ meta.icon }}</span><span>{{ meta.label }}</span>
    </span>
  `,
};

// ---------- 食物安全提示 ----------
export const FoodSafetyNotice = {
  template: `
    <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800 leading-relaxed">
      <div class="font-semibold mb-1">🍞 食品安全提示</div>
      食物信息由发布者自行填写，平台仅提供信息展示、撮合和减碳估算，<strong>不对食品质量和食品安全作担保</strong>。领取前请自行确认包装、保质期、储存条件和实际状态。
    </div>
  `,
};

export const PaymentBoundaryNotice = {
  template: `
    <div class="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[13px] text-sky-800 leading-relaxed">
      🔒 平台仅提供校园闲置信息撮合，不接入支付，不托管资金。付费、交换或赠送由双方自行协商完成。
    </div>
  `,
};

// ---------- 物品卡片 ----------
export const ListingCard = {
  props: ['listing'],
  computed: {
    cat() { return CATEGORY_MAP[this.listing.category]; },
    remainHours() {
      if (!this.listing.isFood || !this.listing.foodInfo?.expireAt) return null;
      const diff = new Date(this.listing.foodInfo.expireAt).getTime() - Date.now();
      if (diff <= 0) return 0;
      return Math.max(1, Math.round(diff / 3600_000));
    },
  },
  template: `
    <router-link :to="'/listings/' + listing.id"
       class="block rounded-2xl overflow-hidden bg-white border border-slate-200 card-hover">
      <div class="aspect-[4/3] bg-slate-100 overflow-hidden relative">
        <img v-if="listing.images?.[0]" :src="listing.images[0]"
             :alt="listing.title" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full placeholder-img flex items-center justify-center text-4xl">
          {{ cat?.icon || '📦' }}
        </div>
        <div class="absolute top-2 left-2 flex gap-1 flex-wrap">
          <trade-mode-badge :mode="listing.tradeMode" :price="listing.price" :swap="listing.swapWanted" />
          <status-badge v-if="listing.status !== 'ACTIVE'" :status="listing.status" />
        </div>
        <div v-if="listing.isFood && remainHours != null" class="absolute bottom-2 right-2">
          <span class="badge"
                :class="remainHours <= 6 ? 'bg-red-700 text-white' : 'bg-amber-100 text-amber-700'">
            ⏰ {{ remainHours > 0 ? remainHours + 'h 内领取' : '已过期' }}
          </span>
        </div>
      </div>

      <div class="p-3.5">
        <div class="flex items-start justify-between gap-2">
          <h2 class="font-semibold text-slate-800 line-clamp-2 text-[15px] leading-snug">
            {{ listing.title }}
          </h2>
        </div>
        <div class="flex gap-1.5 flex-wrap mt-2">
          <category-badge :category="listing.category" />
          <condition-badge v-if="listing.condition" :condition="listing.condition" />
        </div>
        <div class="mt-2 text-[13px] text-slate-600 flex items-center gap-1">
          <span>📍</span><span>{{ listing.locationText }}</span>
        </div>
        <div class="mt-2">
          <carbon-badge :value="listing.estimatedCarbonSavedKg"
                        :completed="listing.status === 'COMPLETED'" />
        </div>
      </div>
    </router-link>
  `,
};

// ---------- Navbar ----------
export const Navbar = {
  setup() {
    const showUserMenu = ref(false);
    const toggle = () => showUserMenu.value = !showUserMenu.value;
    const close = () => showUserMenu.value = false;
    function handleLogout() {
      logout();
      clearAuth();
      toast('已退出登录');
    }
    return { currentUser, showUserMenu, toggle, close, handleLogout, isAuthenticated, authState };
  },
  template: `
    <header class="sticky top-0 z-40 backdrop-blur bg-white/80 border-b border-slate-200/70">
      <div class="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <router-link to="/" class="flex items-center gap-2 shrink-0">
          <span class="w-8 h-8 rounded-full bg-leaf-500 text-white flex items-center justify-center text-lg">🌿</span>
          <span class="font-bold text-leaf-700 hidden sm:inline">碳循校园</span>
        </router-link>
        <nav class="flex items-center gap-1 text-sm text-slate-600 ml-auto md:ml-0 overflow-x-auto">
          <router-link to="/" class="px-3 py-1.5 rounded-lg hover:text-leaf-700 hover:bg-leaf-50" active-class="text-leaf-700 bg-leaf-50">首页</router-link>
          <router-link to="/demo" class="px-3 py-1.5 rounded-lg hover:text-leaf-700 hover:bg-leaf-50" active-class="text-leaf-700 bg-leaf-50">演示</router-link>
          <router-link to="/listings" class="px-3 py-1.5 rounded-lg hover:text-leaf-700 hover:bg-leaf-50" active-class="text-leaf-700 bg-leaf-50">发现闲置</router-link>
          <router-link to="/publish" class="px-3 py-1.5 rounded-lg hover:text-leaf-700 hover:bg-leaf-50" active-class="text-leaf-700 bg-leaf-50">发布物品</router-link>
          <router-link to="/impact" class="px-3 py-1.5 rounded-lg hover:text-leaf-700 hover:bg-leaf-50" active-class="text-leaf-700 bg-leaf-50">减碳看板</router-link>
          <router-link to="/report" class="px-3 py-1.5 rounded-lg hover:text-leaf-700 hover:bg-leaf-50" active-class="text-leaf-700 bg-leaf-50">碳报告</router-link>
          <router-link to="/calculator" class="px-3 py-1.5 rounded-lg hover:text-leaf-700 hover:bg-leaf-50" active-class="text-leaf-700 bg-leaf-50">碳足迹</router-link>
          <router-link to="/eco-tips" class="px-3 py-1.5 rounded-lg hover:text-leaf-700 hover:bg-leaf-50" active-class="text-leaf-700 bg-leaf-50">生态贴士</router-link>
          <router-link to="/me" class="px-3 py-1.5 rounded-lg hover:text-leaf-700 hover:bg-leaf-50" active-class="text-leaf-700 bg-leaf-50">我的</router-link>
          <router-link v-if="currentUser?.role === 'ADMIN'" to="/admin"
                       class="px-3 py-1.5 rounded-lg hover:text-leaf-700 hover:bg-leaf-50"
                       active-class="text-leaf-700 bg-leaf-50">管理</router-link>
        </nav>
        <div v-if="isAuthenticated" class="ml-auto relative shrink-0">
          <button @click="toggle" class="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-sm">
            <span class="text-lg leading-none">{{ authState.user?.avatar || '👤' }}</span>
            <span class="hidden sm:inline">{{ authState.user?.nickname }}</span>
            <span class="text-slate-400">▾</span>
          </button>
          <div v-if="showUserMenu" class="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <router-link to="/me" @click="close" class="block w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-leaf-50">个人中心</router-link>
            <button @click="handleLogout(); close()" class="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-slate-100">退出登录</button>
          </div>
        </div>
        <router-link v-else to="/auth" class="ml-auto shrink-0 px-4 py-1.5 rounded-xl bg-leaf-600 text-white text-sm hover:bg-leaf-700">
          登录 / 注册
        </router-link>
      </div>
    </header>
  `,
};

// ---------- Footer ----------
export const SiteFooter = {
  template: `
    <footer class="mt-16 border-t border-slate-200/70 bg-white/60">
      <div class="max-w-6xl mx-auto px-4 py-8 text-sm text-slate-500 grid md:grid-cols-3 gap-6">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="w-7 h-7 rounded-full bg-leaf-500 text-white flex items-center justify-center">🌿</span>
            <span class="font-semibold text-slate-700">碳循校园</span>
          </div>
          <p class="leading-relaxed">
            面向中国校园场景的二手漂流 Web 平台，让闲置物品、剩余食品和可再利用资源更容易被再次使用。
          </p>
        </div>
        <div>
          <div class="text-slate-700 font-medium mb-2">平台边界</div>
          <ul class="space-y-1">
            <li>· 仅做信息撮合，<strong>不接入支付</strong></li>
            <li>· 不做担保交易、退款、仲裁</li>
            <li>· 不做物流</li>
            <li>· 碳减排数据为<strong>估算值</strong>，不作为精确碳审计</li>
          </ul>
        </div>
        <div>
          <div class="text-slate-700 font-medium mb-2">怎么使用</div>
          <ul class="space-y-1">
            <li>· 发布闲置、食物或可交换物品</li>
            <li>· 与对方线下约定交接时间与地点</li>
            <li>· 完成后点「确认已流转」</li>
            <li>· 系统自动把流转记为减碳贡献</li>
          </ul>
        </div>
      </div>
    </footer>
  `,
};

// ---------- 联系发布者 弹窗 ----------
export const ContactModal = {
  props: ['listing', 'modelValue'],
  emits: ['update:modelValue', 'submitted'],
  setup(props, { emit }) {
    const msg = ref('');
    const panelRef = ref(null);
    let previousFocus = null;
    function close() { emit('update:modelValue', false); }
    function confirm() {
      emit('submitted', msg.value);
      close();
    }
    function getFocusable() {
      return panelRef.value?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || [];
    }
    watch(() => props.modelValue, async (open) => {
      if (typeof document === 'undefined') return;
      if (open) {
        previousFocus = document.activeElement;
        await nextTick();
        const focusable = getFocusable();
        (focusable[0] || panelRef.value)?.focus();
      } else {
        previousFocus?.focus?.();
        previousFocus = null;
      }
    });
    // Focus trap
    function onKeydown(e) {
      if (e.key === 'Escape') close();
      if (e.key !== 'Tab' || !panelRef.value) return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    return { msg, close, confirm, currentUser, panelRef, onKeydown };
  },
  template: `
    <div v-if="modelValue" class="modal-mask" @click.self="close" @keydown="onKeydown">
      <div ref="panelRef" class="modal-panel bg-white w-full max-w-md overflow-hidden shadow-2xl" role="dialog" aria-modal="true" aria-label="联系发布者" tabindex="-1">
        <div class="p-5 border-b border-slate-100">
          <div class="font-semibold text-slate-800">联系发布者</div>
          <div class="text-xs text-slate-500 mt-0.5">平台不接入支付，双方请线下自行约定付费 / 赠送 / 交换</div>
        </div>
        <div class="p-5 space-y-3 text-sm">
          <div class="rounded-lg bg-slate-50 p-3 space-y-1">
            <div><span class="text-slate-500">发布者：</span><span class="text-slate-800">{{ listing.ownerNickname || '—' }}</span></div>
            <div><span class="text-slate-500">联系方式：</span>
              <span class="text-slate-800">{{ listing.contactMethod || '—' }} · {{ listing.contactValue || '（发布者选择了站内留言）' }}</span>
            </div>
            <div><span class="text-slate-500">交接地点：</span><span class="text-slate-800">{{ listing.locationText }}</span></div>
          </div>
          <div>
            <label class="block text-sm text-slate-700 mb-1">给发布者留言（可选）</label>
            <textarea v-model="msg" rows="3"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-leaf-300 text-sm"
                      placeholder="例如：今天下午可以在桑浦山校区图书馆自取吗？"></textarea>
          </div>
          <div class="text-[12px] text-slate-400">当前身份：{{ currentUser?.nickname }}</div>
        </div>
        <div class="px-5 py-3 bg-slate-50 flex justify-end gap-2">
          <button @click="close" class="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">取消</button>
          <button @click="confirm" class="px-4 py-2 rounded-lg text-sm bg-leaf-600 text-white hover:bg-leaf-700">发送意向</button>
        </div>
      </div>
    </div>
  `,
};

// ---------- 确认完成弹窗 ----------
// ---------- 移动端底 tab 栏 ----------
export const MobileTabBar = {
  setup() {
    return { isAuthenticated };
  },
  template: `
    <nav class="tab-bar" aria-label="主导航">
      <router-link to="/" class="tab-item" exact-active-class="router-link-active">
        <div class="tab-icon">🏠</div>
        <div>首页</div>
      </router-link>
      <router-link to="/listings" class="tab-item" active-class="router-link-active">
        <div class="tab-icon">🔍</div>
        <div>发现</div>
      </router-link>
      <div class="tab-publish">
        <router-link :to="isAuthenticated ? '/publish' : '/auth'" class="btn" aria-label="发布">＋</router-link>
      </div>
      <router-link to="/impact" class="tab-item" active-class="router-link-active">
        <div class="tab-icon">🌿</div>
        <div>减碳</div>
      </router-link>
      <router-link :to="isAuthenticated ? '/me' : '/auth'" class="tab-item" active-class="router-link-active">
        <div class="tab-icon">👤</div>
        <div>我的</div>
      </router-link>
    </nav>
  `,
};

// ---------- 移动端顶栏（轻量）----------
export const MobileTopBar = {
  props: { title: String, back: Boolean, transparent: Boolean },
  template: `
    <header class="sticky top-0 z-40"
            :class="transparent ? 'bg-transparent' : 'bg-white/90 backdrop-blur border-b border-slate-200/70'">
      <div class="h-12 px-3 flex items-center gap-2">
        <button v-if="back" @click="$router.back()"
                class="w-9 h-9 -ml-2 flex items-center justify-center text-slate-700 text-xl">
          ←
        </button>
        <router-link v-else to="/" class="flex items-center gap-1.5 shrink-0">
          <span class="w-7 h-7 rounded-full bg-leaf-500 text-white flex items-center justify-center text-base">🌿</span>
          <span class="font-bold text-leaf-700 text-sm">碳循校园</span>
        </router-link>
        <div class="flex-1 text-center text-[15px] font-semibold text-slate-800 truncate px-2">
          {{ title }}
        </div>
        <div class="w-9"></div>
      </div>
    </header>
  `,
};

// ---------- 底部抽屉（bottom sheet） ----------
export const BottomSheet = {
  props: ['modelValue', 'title'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const close = () => emit('update:modelValue', false);
    return { close };
  },
  template: `
    <div v-if="modelValue" class="sheet-mask" @click.self="close">
      <div class="sheet">
        <div class="sheet-handle"></div>
        <div v-if="title" class="px-5 pb-2 flex items-center justify-between">
          <div class="font-semibold text-slate-800">{{ title }}</div>
          <button @click="close" class="text-slate-400 text-sm">完成</button>
        </div>
        <div class="px-5 pb-4 pt-1 overflow-y-auto">
          <slot />
        </div>
      </div>
    </div>
  `,
};

export const ConfirmCompleteDialog = {
  props: ['listing', 'modelValue'],
  emits: ['update:modelValue', 'confirmed'],
  setup(props, { emit }) {
    const panelRef = ref(null);
    let previousFocus = null;
    function close() { emit('update:modelValue', false); }
    function confirm() {
      emit('confirmed');
      close();
    }
    function getFocusable() {
      return panelRef.value?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || [];
    }
    watch(() => props.modelValue, async (open) => {
      if (typeof document === 'undefined') return;
      if (open) {
        previousFocus = document.activeElement;
        await nextTick();
        const focusable = getFocusable();
        (focusable[0] || panelRef.value)?.focus();
      } else {
        previousFocus?.focus?.();
        previousFocus = null;
      }
    });
    function onKeydown(e) {
      if (e.key === 'Escape') close();
      if (e.key !== 'Tab' || !panelRef.value) return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    return { close, confirm, panelRef, onKeydown };
  },
  template: `
    <div v-if="modelValue" class="modal-mask" @click.self="close" @keydown="onKeydown">
      <div ref="panelRef" class="modal-panel bg-white w-full max-w-md overflow-hidden shadow-2xl" role="dialog" aria-modal="true" aria-label="确认流转" tabindex="-1">
        <div class="p-5 border-b border-slate-100">
          <div class="font-semibold text-slate-800">确认已流转？</div>
        </div>
        <div class="p-5 text-sm text-slate-600 leading-relaxed space-y-2">
          <p>确认物品「{{ listing.title }}」已完成付费 / 赠送 / 交换并交接给对方。</p>
          <p>确认后系统会把 <strong class="text-leaf-700">预计减碳 {{ listing.estimatedCarbonSavedKg }} kg CO₂e</strong> 计入你的贡献与校园总数据。</p>
          <p class="text-[12px] text-slate-400">碳减排为估算值，仅用于环保贡献展示。</p>
        </div>
        <div class="px-5 py-3 bg-slate-50 flex justify-end gap-2">
          <button @click="close" class="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">再想想</button>
          <button @click="confirm" class="px-4 py-2 rounded-lg text-sm bg-leaf-600 text-white hover:bg-leaf-700">确认已流转</button>
        </div>
      </div>
    </div>
  `,
};
