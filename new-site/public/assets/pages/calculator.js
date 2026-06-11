import { ref, computed, watch } from 'vue';
import { state, actions, currentUser, userCarbonSaved, round1, FOOTPRINT_FACTORS, CARBON_EQUIVALENTS } from '../store.js?v=20260609-demo5';
import { CAMPUS_NAMES } from '../seed.js';
import { CategoryDoughnut } from '../charts.js';
import { toast } from '../components.js?v=20260609-demo5';

const { transport, electricity, food } = FOOTPRINT_FACTORS;

const campusDefaults = {
  '东海岸校区': { transportMode: 'shuttle', dailyDistanceKm: 8, weeklyKwh: 15 },
  '桑浦山校区': { transportMode: 'bus', dailyDistanceKm: 4, weeklyKwh: 12 },
};

export default {
  components: { CategoryDoughnut },
  setup() {
    const transportMode = ref('bus');
    const dailyDistanceKm = ref(5);
    const weeklyKwh = ref(14);
    const foodLevel = ref('balanced');
    const campus = ref(currentUser.value?.campus || CAMPUS_NAMES[0] || '');

    const defaults = campusDefaults[campus.value];
    if (defaults) {
      transportMode.value = defaults.transportMode;
      dailyDistanceKm.value = defaults.dailyDistanceKm;
      weeklyKwh.value = defaults.weeklyKwh;
    }

    watch(campus, (val) => {
      const d = campusDefaults[val];
      if (d) {
        transportMode.value = d.transportMode;
        dailyDistanceKm.value = d.dailyDistanceKm;
        weeklyKwh.value = d.weeklyKwh;
      }
    });

    // ---------- 计算 ----------
    const result = computed(() => {
      const clampedKm = Math.max(0, Math.min(dailyDistanceKm.value, 50));
      const clampedKwh = Math.max(0, Math.min(weeklyKwh.value, 60));
      const tFactor = transport[transportMode.value]?.factor || 0;
      const transportYearly = round1(tFactor * clampedKm * 365);
      const electricityYearly = round1(clampedKwh * 52 * electricity.chinaGrid.factor);
      const foodFactor = food[foodLevel.value]?.factor || 3.8;
      const foodYearly = round1(foodFactor * 365);
      const total = round1(transportYearly + electricityYearly + foodYearly);
      return { transportYearly, electricityYearly, foodYearly, total };
    });

    const breakdown = computed(() => [
      { key: 'transport', label: '交通出行', kg: result.value.transportYearly, icon: '🚌' },
      { key: 'electricity', label: '电力消耗', kg: result.value.electricityYearly, icon: '⚡' },
      { key: 'food', label: '饮食碳排', kg: result.value.foodYearly, icon: '🍱' },
    ]);

    const offsetPercentage = computed(() => {
      if (result.value.total === 0) return 0;
      return Math.min(100, round1((userCarbonSaved.value / result.value.total) * 100));
    });

    const eq = CARBON_EQUIVALENTS;
    const equivalents = computed(() => [
      { icon: '🌳', label: '需要', value: (result.value.total / eq.treeAbsorption).toFixed(1), unit: '棵树吸收一年' },
      { icon: '🚗', label: '相当于开车', value: round1(result.value.total / 0.21), unit: 'km' },
    ]);

    // ---------- 保存 ----------
    const saved = ref(false);
    function saveResult() {
      actions.saveCalculation({
        transportMode: transportMode.value,
        dailyDistanceKm: dailyDistanceKm.value,
        weeklyKwh: weeklyKwh.value,
        foodLevel: foodLevel.value,
        campus: campus.value,
        ...result.value,
      });
      saved.value = true;
      toast('计算结果已保存');
      setTimeout(() => { saved.value = false; }, 2000);
    }

    // ---------- 历史 ----------
    const history = computed(() => state.calcHistory);
    const showHistory = ref(state.calcHistory.length > 0);

    const transportModes = Object.entries(transport).map(([k, v]) => ({ key: k, ...v }));
    const foodLevels = Object.entries(food).map(([k, v]) => ({ key: k, ...v }));

    return {
      transportMode, dailyDistanceKm, weeklyKwh, foodLevel, campus,
      result, breakdown, offsetPercentage, equivalents,
      saved, saveResult,
      history, showHistory,
      transportModes, foodLevels,
      userCarbonSaved, CAMPUS_NAMES,
    };
  },
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-semibold text-slate-800 mb-1">碳足迹估算器</h1>
      <p class="text-sm text-slate-500 mb-6">估算你的日常生活碳排放，看看平台减碳行动能抵消多少</p>

      <!-- 校园选择 -->
      <div class="mb-4 flex items-center gap-2">
        <span class="text-sm text-slate-500">当前校园：</span>
        <select v-model="campus"
                class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white">
          <option v-for="c in CAMPUS_NAMES" :key="c" :value="c">{{ c }}</option>
        </select>
        <span class="text-xs text-slate-400">选择后会预填校园默认值</span>
      </div>

      <!-- 交通出行 -->
      <section class="rounded-2xl bg-white border border-slate-200 p-5 mb-4">
        <h2 class="font-semibold text-slate-800 mb-3 flex items-center gap-2">🚌 交通出行</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-slate-600 mb-1 block">日常出行方式</label>
            <div class="flex flex-wrap gap-2">
              <button v-for="m in transportModes" :key="m.key"
                      @click="transportMode = m.key"
                      class="px-3 py-2 rounded-xl text-sm border transition-all"
                      :class="transportMode === m.key ? 'bg-leaf-50 border-leaf-300 text-leaf-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'">
                {{ m.icon }} {{ m.label }}
              </button>
            </div>
          </div>
          <div>
            <label class="text-sm text-slate-600 mb-1 block">日均出行距离 (km)</label>
            <input type="range" v-model.number="dailyDistanceKm" min="0" max="50" step="1"
                   class="w-full accent-leaf-500" />
            <div class="flex justify-between text-xs text-slate-400 mt-1">
              <span>0 km</span>
              <span class="text-leaf-700 font-medium">{{ dailyDistanceKm }} km/天</span>
              <span>50 km</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 电力消耗 -->
      <section class="rounded-2xl bg-white border border-slate-200 p-5 mb-4">
        <h2 class="font-semibold text-slate-800 mb-3 flex items-center gap-2">⚡ 电力消耗</h2>
        <div>
          <label class="text-sm text-slate-600 mb-1 block">宿舍每周用电量估算 (kWh)</label>
          <input type="range" v-model.number="weeklyKwh" min="0" max="60" step="1"
                 class="w-full accent-amber-500" />
          <div class="flex justify-between text-xs text-slate-400 mt-1">
            <span>0 kWh</span>
            <span class="text-amber-700 font-medium">{{ weeklyKwh }} kWh/周</span>
            <span>60 kWh</span>
          </div>
          <div class="text-xs text-slate-400 mt-2">💡 参考值：宿舍空调每天 4 小时 ≈ 10-15 kWh/周</div>
        </div>
      </section>

      <!-- 饮食碳排 -->
      <section class="rounded-2xl bg-white border border-slate-200 p-5 mb-4">
        <h2 class="font-semibold text-slate-800 mb-3 flex items-center gap-2">🍱 饮食习惯</h2>
        <label class="text-sm text-slate-600 mb-2 block">你的饮食中肉食占比</label>
        <div class="flex flex-wrap gap-2">
          <button v-for="f in foodLevels" :key="f.key"
                  @click="foodLevel = f.key"
                  class="px-4 py-2 rounded-xl text-sm border transition-all"
                  :class="foodLevel === f.key ? 'bg-leaf-50 border-leaf-300 text-leaf-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'">
            {{ f.icon }} {{ f.label }}
          </button>
        </div>
        <div class="mt-2 text-xs text-slate-400">按日均饮食碳排放 {{ foodLevels.find(f => f.key === foodLevel)?.factor || 3.8 }} kg CO₂e 估算</div>
      </section>

      <!-- 计算结果 -->
      <section class="rounded-2xl bg-leaf-50 border border-leaf-200 p-6 mb-4">
        <h2 class="font-semibold text-slate-800 mb-4">估算结果</h2>
        <div class="text-center mb-4">
          <div class="text-sm text-slate-500 mb-1">年碳足迹估算</div>
          <div class="text-5xl font-bold text-leaf-700">{{ result.total }}</div>
          <div class="text-sm text-slate-500 mt-1">kg CO₂e / 年</div>
        </div>

        <div class="grid md:grid-cols-2 gap-4 mb-4">
          <!-- 分类环形图 -->
          <div style="height: 220px; position: relative;">
            <category-doughnut :items="breakdown" />
          </div>
          <!-- 分类数据 -->
          <div class="space-y-3">
            <div v-for="b in breakdown" :key="b.key" class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-lg">{{ b.icon }}</span>
                <span class="text-sm text-slate-700">{{ b.label }}</span>
              </div>
              <div class="text-sm font-medium text-slate-800">{{ b.kg }} kg <span class="text-slate-400 font-normal text-xs">({{ b.kg > 0 ? ((b.kg / result.total) * 100).toFixed(0) : 0 }}%)</span></div>
            </div>
          </div>
        </div>

        <!-- 抵消进度 -->
        <div class="rounded-xl bg-white border border-slate-200 p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-slate-600">平台减碳抵消进度</span>
            <span class="text-sm font-medium text-leaf-700">{{ offsetPercentage }}%</span>
          </div>
          <div class="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500"
                 :class="offsetPercentage >= 100 ? 'bg-leaf-500' : offsetPercentage >= 50 ? 'bg-leaf-400' : 'bg-amber-400'"
                 :style="{ width: Math.max(2, offsetPercentage) + '%' }"></div>
          </div>
          <div class="text-xs text-slate-400 mt-2">
            你在平台完成的流转已减碳 {{ userCarbonSaved }} kg，可抵消年碳足迹的 {{ offsetPercentage }}%
          </div>
        </div>
      </section>

      <!-- 保存按钮 -->
      <div class="flex justify-center gap-3 mb-6">
        <button @click="saveResult" :disabled="saved"
                class="px-6 py-3 rounded-2xl bg-leaf-600 text-white font-medium hover:bg-leaf-700 disabled:opacity-50">
          {{ saved ? '已保存 ✓' : '保存计算结果' }}
        </button>
        <button @click="showHistory = !showHistory"
                class="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50">
          {{ showHistory ? '隐藏历史' : '查看历史' }}
        </button>
      </div>

      <!-- 历史记录 -->
      <section v-if="showHistory && history.length > 0" class="rounded-2xl bg-white border border-slate-200 p-5 mb-6">
        <h2 class="font-semibold text-slate-800 mb-3">计算历史</h2>
        <ul class="divide-y divide-slate-100">
          <li v-for="h in history.slice(0, 10)" :key="h.id" class="py-3">
            <div class="flex items-center justify-between">
              <div class="text-sm text-slate-700 font-medium">{{ h.total }} kg CO₂e/年</div>
              <div class="text-xs text-slate-400">{{ new Date(h.createdAt).toLocaleDateString('zh-CN') }}</div>
            </div>
            <div class="flex gap-3 mt-1 text-xs text-slate-400">
              <span>🚌 {{ h.transportYearly }}</span>
              <span>⚡ {{ h.electricityYearly }}</span>
              <span>🍱 {{ h.foodYearly }}</span>
            </div>
          </li>
        </ul>
      </section>

      <!-- 免责声明 -->
      <section class="rounded-2xl bg-sky-50 border border-sky-200 p-5 text-sm text-sky-900 leading-relaxed">
        <div class="font-semibold mb-1">估算方法说明</div>
        <ul class="list-disc list-inside space-y-1">
          <li>交通排放因子：步行/骑行=0，公交=0.08，校车=0.06，私家车=0.21，电动=0.05 kg CO₂e/km（IPCC AR6）</li>
          <li>电力排放因子：0.581 kg CO₂e/kWh（中国电网 2024 年均值）</li>
          <li>饮食排放因子：纯素 1.5 ~ 多肉 6.8 kg CO₂e/天（FAO 数据）</li>
          <li>本计算器 <strong>仅作参考</strong>，不构成精确碳审计或合规依据。</li>
        </ul>
      </section>
    </div>
  `,
};
