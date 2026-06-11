import { createApp, watchEffect } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

import { Navbar, SiteFooter, ToastStack, MobileTabBar } from './components.js?v=20260609-demo5';
import { useDevice } from './device.js?v=20260609-demo5';
import HomePage from './pages/home.js?v=20260609-demo5';
import DemoPage from './pages/demo.js?v=20260609-demo5';
import ListingsPage from './pages/listings.js?v=20260609-demo5';
import ListingDetailPage from './pages/listing-detail.js?v=20260609-demo5';
import PublishPage from './pages/publish.js?v=20260609-demo5';
import MyListingsPage from './pages/me-listings.js?v=20260609-demo5';
import MyCenterPage from './pages/me.js?v=20260609-demo5';
import ImpactPage from './pages/impact.js?v=20260609-demo5';
import AdminPage from './pages/admin.js?v=20260609-demo5';
import AuthPage from './pages/auth.js?v=20260609-demo5';
import ScanPage from './pages/scan.js?v=20260609-demo5';
import CarbonReportPage from './pages/carbon-report.js?v=20260609-demo5';
import CalculatorPage from './pages/calculator.js?v=20260609-demo5';
import EcoTipsPage from './pages/eco-tips.js?v=20260609-demo5';
import { isAuthenticated, authState, authReady } from './store.js?v=20260609-demo5';

const NotFound = {
  template: `
    <div class="max-w-3xl mx-auto px-4 py-24 text-center">
      <div class="text-6xl">🌿</div>
      <div class="mt-4 text-slate-600">页面走丢了</div>
      <router-link to="/" class="mt-6 inline-block px-4 py-2 rounded-xl bg-leaf-500 text-white text-sm">回首页</router-link>
    </div>
  `,
};

const routes = [
  { path: '/',                 component: HomePage,          meta: { title: '首页' } },
  { path: '/demo',             component: DemoPage,          meta: { title: '演示流程' } },
  { path: '/listings',         component: ListingsPage,      meta: { title: '发现闲置' } },
  { path: '/listings/:id',     component: ListingDetailPage, meta: { title: '物品详情', hideFooter: true } },
  { path: '/publish',          component: PublishPage,       meta: { title: '发布物品', hideFooter: true } },
  { path: '/me',               component: MyCenterPage,      meta: { title: '我的' } },
  { path: '/me/listings',      component: MyListingsPage,    meta: { title: '我的发布' } },
  { path: '/impact',           component: ImpactPage,        meta: { title: '减碳看板' } },
  { path: '/admin',            component: AdminPage,         meta: { title: '管理端' } },
  { path: '/auth',             component: AuthPage,          meta: { title: '登录' } },
  { path: '/scan',             component: ScanPage,          meta: { title: '扫码发布', hideFooter: true } },
  { path: '/report',           component: CarbonReportPage,  meta: { title: '碳减排报告' } },
  { path: '/calculator',       component: CalculatorPage,    meta: { title: '碳足迹估算' } },
  { path: '/eco-tips',         component: EcoTipsPage,       meta: { title: '生态贴士' } },
  { path: '/:pathMatch(.*)*',  component: NotFound },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 }; },
});

const PROTECTED_ROUTES = ['/publish', '/me', '/admin', '/scan'];

router.beforeEach(async (to) => {
  if (authState.loading) await authReady;
  if (PROTECTED_ROUTES.some(r => to.path.startsWith(r)) && !isAuthenticated.value) {
    return { path: '/auth' };
  }
});

router.afterEach((to) => {
  const title = to.meta?.title;
  document.title = (title ? title + ' · ' : '') + '碳循校园 · 校园二手漂流';
});

const App = {
  components: { Navbar, SiteFooter, ToastStack, MobileTabBar },
  setup() {
    const { isLayoutMobile } = useDevice();

    // 同步 body class 给 CSS 用
    watchEffect(() => {
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('is-mobile', isLayoutMobile.value);
      }
    });

    return { isLayoutMobile };
  },
  template: `
    <Navbar v-if="!isLayoutMobile" />
    <main id="main-content">
      <router-view v-slot="{ Component, route }">
        <transition name="route-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <SiteFooter v-if="!isLayoutMobile" />
    <MobileTabBar v-if="isLayoutMobile" />
    <ToastStack />
  `,
};

createApp(App).use(router).mount('#app');
