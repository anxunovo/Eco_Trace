import { ref, computed } from 'vue';
import { state, ECO_TIP_CATEGORIES } from '../store.js?v=20260609-demo5';

export default {
  setup() {
    const selectedCategory = ref(null);
    const categories = ECO_TIP_CATEGORIES;

    const filteredTips = computed(() => {
      let tips = state.ecoTips;
      if (selectedCategory.value) {
        tips = tips.filter(t => t.category === selectedCategory.value);
      }
      return tips;
    });

    const expandedId = ref(null);

    function toggleExpand(id) {
      expandedId.value = expandedId.value === id ? null : id;
    }

    function getCategory(key) {
      return categories.find(c => c.key === key) || { label: key, icon: '🌱', color: 'bg-slate-100 text-slate-700' };
    }

    return { selectedCategory, categories, filteredTips, expandedId, toggleExpand, getCategory };
  },
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-semibold text-slate-800 mb-1">生态小贴士</h1>
      <p class="text-sm text-slate-500 mb-6">环保知识 + 实际行动，把绿色融入校园生活</p>

      <!-- 分类筛选 -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button @click="selectedCategory = null"
                class="px-3 py-1.5 rounded-full text-sm border transition-all"
                :class="!selectedCategory ? 'bg-leaf-600 text-white border-leaf-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'">
          全部
        </button>
        <button v-for="cat in categories" :key="cat.key"
                @click="selectedCategory = selectedCategory === cat.key ? null : cat.key"
                class="px-3 py-1.5 rounded-full text-sm border transition-all"
                :class="selectedCategory === cat.key ? cat.color + ' border-current font-medium' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'">
          {{ cat.icon }} {{ cat.label }}
        </button>
      </div>

      <!-- Tips 列表 -->
      <div v-if="filteredTips.length === 0" class="text-center text-slate-400 py-12">
        暂无此分类的贴士
      </div>
      <div v-else class="space-y-4">
        <div v-for="tip in filteredTips" :key="tip.id"
             class="rounded-2xl bg-white border border-slate-200 p-5 hover:shadow-sm transition-shadow cursor-pointer"
             @click="toggleExpand(tip.id)">
          <div class="flex items-start gap-3">
            <span class="shrink-0 mt-0.5 px-2 py-1 rounded-full text-xs font-medium"
                  :class="getCategory(tip.category).color">
              {{ getCategory(tip.category).icon }} {{ getCategory(tip.category).label }}
            </span>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-slate-800">{{ tip.title }}</div>
              <div class="text-sm text-slate-600 mt-1 leading-relaxed">{{ tip.body }}</div>
            </div>
          </div>

          <!-- 展开详情 -->
          <div v-if="expandedId === tip.id" class="mt-4 pt-4 border-t border-slate-100">
            <div v-if="tip.action" class="flex items-start gap-2 mb-3">
              <span class="shrink-0 text-leaf-500">✅</span>
              <div>
                <div class="text-xs text-slate-500 mb-0.5">你可以做什么</div>
                <div class="text-sm text-slate-700">{{ tip.action }}</div>
              </div>
            </div>
            <div v-if="tip.carbonLink" class="flex items-start gap-2">
              <span class="shrink-0 text-leaf-500">🌿</span>
              <div>
                <div class="text-xs text-slate-500 mb-0.5">平台减碳关联</div>
                <div class="text-sm text-leaf-700">{{ tip.carbonLink }}</div>
              </div>
            </div>
          </div>

          <div class="mt-2 text-xs text-slate-400">
            {{ expandedId === tip.id ? '点击收起' : '点击展开详情' }}
          </div>
        </div>
      </div>
    </div>
  `,
};
