import { computed } from 'vue';
import {
  state,
  totalCarbonSaved,
  totalCompleted,
  totalFoodSavedKg,
  activeStudents,
  round1,
  CARBON_EQUIVALENTS,
} from '../store.js?v=20260609-demo5';

export default {
  setup() {
    const activeListings = computed(() => state.listings.filter(item => item.status === 'ACTIVE'));
    const foodListings = computed(() => activeListings.value.filter(item => item.isFood));
    const completedListings = computed(() => state.listings.filter(item => item.status === 'COMPLETED'));
    const demoStats = computed(() => [
      { label: '演示物品', value: state.listings.length, unit: '件', tone: 'leaf' },
      { label: '已完成流转', value: totalCompleted.value, unit: '件', tone: 'emerald' },
      { label: '预计减碳', value: totalCarbonSaved.value, unit: 'kg CO2e', tone: 'sky' },
      { label: '减少食物浪费', value: totalFoodSavedKg.value, unit: 'kg', tone: 'amber' },
    ]);

    const carKm = computed(() => round1(totalCarbonSaved.value * CARBON_EQUIVALENTS.carKmPerKg));
    const electricity = computed(() => round1(totalCarbonSaved.value * CARBON_EQUIVALENTS.electricityKwhPerKg));
    const phoneCharges = computed(() => Math.round(totalCarbonSaved.value * CARBON_EQUIVALENTS.phoneChargePerKg));

    const steps = [
      {
        title: '从首页进入',
        detail: '展示平台定位、校园累计数据和最新闲置，让评委先理解“信息撮合 + 减碳可视化”。',
        to: '/',
        action: '打开首页',
      },
      {
        title: '发布一件物品',
        detail: '上传图片后点击 AI 识别；如果现场无网络，系统仍可用模拟识别结果完成流程。',
        to: '/publish',
        action: '发布物品',
      },
      {
        title: '浏览并发起意向',
        detail: '在发现页筛选免费、交换、食物分享或临期物品，查看详情页的交易边界和食品安全提示。',
        to: '/listings',
        action: '发现闲置',
      },
      {
        title: '确认完成流转',
        detail: '发布者确认已线下交接后，物品状态变为已完成，碳贡献正式计入个人和校园看板。',
        to: '/me/listings',
        action: '我的发布',
      },
      {
        title: '展示减碳成果',
        detail: '打开看板和报告页，用生活化类比说明 kg CO2e 对应的开车里程、用电量和手机充电次数。',
        to: '/impact',
        action: '减碳看板',
      },
    ];

    const talkingPoints = [
      '项目不做支付和担保，只做校园闲置信息撮合，降低比赛演示的业务风险。',
      '碳减排是科普估算：物品类别、估算重量、替代购买比例共同决定预计 kg CO2e。',
      '只有已完成流转才计入总贡献，草稿、过期、下架物品不进入成果统计。',
      '食物分享单独展示保质期和安全提示，重点服务校园临期食物减浪费场景。',
    ];

    const demoModeNotes = [
      '本地演示可直接运行静态站点，不依赖数据库、账号服务或外部 AI。',
      '种子数据覆盖教材、电子产品、宿舍用品、食物、免费赠送和物品交换。',
      '管理员页保留一键重置本地数据，便于现场重复演示。',
    ];

    return {
      activeListings,
      foodListings,
      completedListings,
      demoStats,
      steps,
      talkingPoints,
      demoModeNotes,
      activeStudents,
      carKm,
      electricity,
      phoneCharges,
    };
  },
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <section class="rounded-3xl bg-white border border-leaf-100 overflow-hidden">
        <div class="grid lg:grid-cols-[1.2fr_0.8fr]">
          <div class="p-6 md:p-8">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-leaf-50 text-leaf-700 text-xs font-medium">
              比赛本地演示模式
            </div>
            <h1 class="mt-4 text-3xl md:text-4xl font-bold text-slate-800 leading-tight">
              8 分钟讲清校园闲置流转如何变成可见的低碳行动
            </h1>
            <p class="mt-4 text-slate-600 leading-relaxed max-w-2xl">
              这页用于答辩和现场演示：按步骤操作即可跑通“发布闲置、AI 辅助识别、线下流转、确认完成、生成减碳成果”的完整闭环。
            </p>
            <div class="mt-6 flex flex-wrap gap-3">
              <router-link to="/publish" class="px-5 py-2.5 rounded-xl bg-leaf-600 text-white font-medium hover:bg-leaf-700">
                开始发布演示
              </router-link>
              <router-link to="/report" class="px-5 py-2.5 rounded-xl bg-white border border-leaf-300 text-leaf-700 font-medium hover:bg-leaf-50">
                查看碳科普报告
              </router-link>
            </div>
          </div>
          <div class="bg-leaf-700 text-white p-6 md:p-8">
            <div class="text-sm opacity-80">当前演示数据</div>
            <div class="mt-5 grid grid-cols-2 gap-3">
              <div v-for="item in demoStats" :key="item.label" class="rounded-2xl bg-white/10 p-4">
                <div class="text-xs opacity-75">{{ item.label }}</div>
                <div class="mt-1 text-2xl font-bold">{{ item.value }}</div>
                <div class="text-xs opacity-75">{{ item.unit }}</div>
              </div>
            </div>
            <div class="mt-5 text-sm leading-relaxed text-white/85">
              已有 {{ activeStudents }} 位演示用户、{{ activeListings.length }} 件可流转物品、{{ foodListings.length }} 件食物分享、{{ completedListings.length }} 条完成案例。
            </div>
          </div>
        </div>
      </section>

      <section class="mt-8 grid lg:grid-cols-[1fr_360px] gap-6">
        <div class="space-y-4">
          <h2 class="text-xl font-semibold text-slate-800">现场演示路线</h2>
          <div class="space-y-3">
            <div v-for="(step, index) in steps" :key="step.title" class="rounded-2xl bg-white border border-slate-200 p-5 flex gap-4">
              <div class="w-9 h-9 rounded-full bg-leaf-100 text-leaf-700 flex items-center justify-center font-semibold shrink-0">
                {{ index + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-slate-800">{{ step.title }}</div>
                <div class="mt-1 text-sm text-slate-600 leading-relaxed">{{ step.detail }}</div>
              </div>
              <router-link :to="step.to" class="self-center shrink-0 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 text-sm hover:bg-leaf-50 hover:text-leaf-700">
                {{ step.action }}
              </router-link>
            </div>
          </div>
        </div>

        <aside class="space-y-4">
          <section class="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 class="font-semibold text-slate-800">答辩要点</h2>
            <ul class="mt-3 space-y-2 text-sm text-slate-600 leading-relaxed">
              <li v-for="point in talkingPoints" :key="point" class="flex gap-2">
                <span class="text-leaf-600">•</span><span>{{ point }}</span>
              </li>
            </ul>
          </section>

          <section class="rounded-2xl bg-sky-50 border border-sky-200 p-5">
            <h2 class="font-semibold text-sky-900">碳科普换算</h2>
            <div class="mt-3 grid grid-cols-3 gap-2 text-center">
              <div class="rounded-xl bg-white p-3">
                <div class="text-lg font-bold text-sky-700">{{ carKm }}</div>
                <div class="text-xs text-sky-900/70">km 少开车</div>
              </div>
              <div class="rounded-xl bg-white p-3">
                <div class="text-lg font-bold text-sky-700">{{ electricity }}</div>
                <div class="text-xs text-sky-900/70">kWh 省电</div>
              </div>
              <div class="rounded-xl bg-white p-3">
                <div class="text-lg font-bold text-sky-700">{{ phoneCharges }}</div>
                <div class="text-xs text-sky-900/70">次充电</div>
              </div>
            </div>
          </section>

          <section class="rounded-2xl bg-amber-50 border border-amber-200 p-5">
            <h2 class="font-semibold text-amber-900">本地演示保障</h2>
            <ul class="mt-3 space-y-2 text-sm text-amber-900/80 leading-relaxed">
              <li v-for="note in demoModeNotes" :key="note" class="flex gap-2">
                <span>✓</span><span>{{ note }}</span>
              </li>
            </ul>
          </section>
        </aside>
      </section>
    </div>
  `,
};
