// 设备识别 composable
// 断点：< 768 = mobile，768..1024 = tablet（按用户指示与 desktop 同布局），> 1024 = desktop
import { reactive, onMounted, onUnmounted, computed } from 'vue';

const MOBILE_MAX = 767;   // <=767 视为手机
const TABLET_MAX = 1023;  // 768..1023 视为 tablet（当前归入 desktop 布局）

const state = reactive({
  width: typeof window !== 'undefined' ? window.innerWidth : 1280,
  height: typeof window !== 'undefined' ? window.innerHeight : 800,
});

function update() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', update, { passive: true });
  window.addEventListener('orientationchange', update, { passive: true });
}

export function useDevice() {
  // 不需要每个组件都挂监听——全局 state 已经在更新
  return {
    width: computed(() => state.width),
    height: computed(() => state.height),
    isMobile:  computed(() => state.width <= MOBILE_MAX),
    isTablet:  computed(() => state.width > MOBILE_MAX && state.width <= TABLET_MAX),
    isDesktop: computed(() => state.width > TABLET_MAX),
    // 按用户指示 Pad 与桌面同布局，统一用 isLayoutMobile 表达"需要移动端布局"
    isLayoutMobile: computed(() => state.width <= MOBILE_MAX),
  };
}

// Dev 入口
if (typeof window !== 'undefined') {
  window.__device = state;
}
