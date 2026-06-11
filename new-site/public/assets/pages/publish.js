import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { state, actions, currentUser, getListing, calculateCarbonEstimate } from '../store.js?v=20260609-demo5';
import { analyzeListingImage } from '../mock-ai.js?v=20260609-demo5';
import { analyzeWithAI } from '../api-adapter.js?v=20260609-demo5';
import { compressForApi } from '../image-utils.js';
import {
  CATEGORIES, CATEGORY_MAP, TRADE_MODES, CONDITIONS, FOOD_SUBCATS, CAMPUS_LOCATIONS, CAMPUS_NAMES,
} from '../seed.js';
import {
  TradeModeBadge, CarbonBadge, CategoryBadge, ConditionBadge,
  FoodSafetyNotice, PaymentBoundaryNotice, toast, MobileTopBar,
} from '../components.js?v=20260609-demo5';
import { useDevice } from '../device.js?v=20260609-demo5';

// 读取 File → base64，并做尺寸压缩（avoid localStorage quota）
function fileToDataURL(file, maxSize = 1200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default {
  components: {
    TradeModeBadge, CarbonBadge, CategoryBadge, ConditionBadge,
    FoodSafetyNotice, PaymentBoundaryNotice, MobileTopBar,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { isLayoutMobile } = useDevice();

    const editId = route.query.edit;
    const editing = editId ? getListing(editId) : null;

    const step = ref(editing ? 3 : 1);
    const aiLoading = ref(false);
    const aiRan = ref(!!editing);
    const submitting = ref(false);

    const form = reactive({
      images: editing?.images ? [...editing.images] : [],
      title: editing?.title || '',
      description: editing?.description || '',
      category: editing?.category || '',
      tradeMode: editing?.tradeMode || 'FREE',
      price: editing?.price ?? 0,
      swapWanted: editing?.swapWanted || '',
      condition: editing?.condition || 'GOOD',
      campus: editing?.campus || currentUser.value?.campus || '东海岸校区',
      locationText: editing?.locationText || '',
      contactMethod: editing?.contactMethod || '微信',
      contactValue: editing?.contactValue || '',
      estimatedWeightKg: editing?.estimatedWeightKg ?? '',
      estimatedCarbonSavedKg: editing?.estimatedCarbonSavedKg ?? 0,
      aiConfidence: editing?.aiConfidence,
      aiAssumptions: editing?.aiAssumptions ? [...editing.aiAssumptions] : [],
      isFood: editing?.isFood ?? false,
      foodInfo: editing?.foodInfo
        ? { ...editing.foodInfo }
        : {
            foodType: 'COMMON', packageStatus: 'UNOPENED',
            weightKg: 0.5, servings: null,
            madeAt: '', expireAt: '', storageNote: '',
            safetyConfirmed: false,
          },
      tags: editing?.tags ? [...editing.tags] : [],
    });

    // 食物类切换时同步
    watch(() => form.category, (c) => {
      if (c === 'FOOD') form.isFood = true;
      else if (form.isFood && c !== 'FOOD') form.isFood = false;
    });

    // 图片上传
    const fileInput = ref(null);
    async function onFileChange(e) {
      const files = Array.from(e.target.files || []);
      for (const f of files) {
        if (form.images.length >= 5) break;
        try {
          const url = await fileToDataURL(f);
          form.images.push(url);
        } catch (err) {
          toast('图片上传失败：' + err.message, 'danger');
        }
      }
      e.target.value = '';
    }
    function removeImage(i) { form.images.splice(i, 1); }
    function pickFile() { fileInput.value?.click(); }

    // 如果未上传图片，用一个占位 SVG
    function ensurePlaceholder() {
      if (form.images.length === 0) {
        const emoji = CATEGORY_MAP[form.category]?.icon || '📦';
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
          <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#dcf0de"/><stop offset="100%" stop-color="#8bc994"/>
          </linearGradient></defs>
          <rect width="400" height="300" fill="url(#g)"/>
          <text x="50%" y="55%" font-size="120" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
        </svg>`;
        form.images.push('data:image/svg+xml;utf8,' + encodeURIComponent(svg));
      }
    }

    // AI 识别 — 优先调用真实 API，失败时降级到本地 mock
    // BUG-001 fix: 重新识别 / 重新上传时必须丢弃上一轮的 AI 派生字段，否则旧文本会污染新一轮的输入提示，
    // 且原有 `if (!form.X)` 守卫会让新结果被静默吞掉。
    async function runAI() {
      if (aiLoading.value) return;
      aiLoading.value = true;
      try {
        // 重新识别：清空上一轮的 AI 派生字段，避免守卫吞结果 / 旧文本污染输入
        if (aiRan.value) {
          form.title = '';
          form.description = '';
          form.category = '';
          form.estimatedWeightKg = '';
          form.aiConfidence = undefined;
          form.aiAssumptions = [];
        }
        // 压缩图片后再发 API（800px/0.7），避免超 4MB 限制
        const compressedImages = await Promise.all(
          form.images.map(img => compressForApi(img))
        );
        const input = {
          images: compressedImages,
          title: form.title,
          description: form.description,
          category: form.category,
        };
        let res;
        try {
          res = await analyzeWithAI(input);
        } catch (apiErr) {
          console.warn('[ai] API error, falling back to mock:', apiErr.message);
          res = null;
        }
        if (!res) {
          toast('真实 AI 暂不可用，使用本地估算（结果可能不准确）', 'warn');
          res = await analyzeListingImage({
            images: form.images,
            title: form.title,
            description: form.description,
            category: form.category,
            estimatedWeightKg: form.estimatedWeightKg || undefined,
            foodInfo: form.isFood ? form.foodInfo : undefined,
          });
        }
        // 直接覆盖 AI 派生字段（守卫已移除）。如果 AI 没返回某字段，用空值兜底以保持类型一致。
        form.title = res.titleSuggestion ?? '';
        form.category = res.category ?? '';
        form.description = res.descriptionSuggestion ?? '';
        if (res.condition) form.condition = res.condition;
        if (res.estimatedWeightKg != null) form.estimatedWeightKg = res.estimatedWeightKg;
        form.estimatedCarbonSavedKg = res.estimatedCarbonSavedKg ?? 0;
        form.aiConfidence = res.confidence;
        form.aiAssumptions = res.assumptions || [];
        if (res.isFood) {
          form.isFood = true;
          if (res.foodInfoSuggestion) {
            form.foodInfo.foodType = res.foodInfoSuggestion.foodType || form.foodInfo.foodType;
            form.foodInfo.weightKg = res.foodInfoSuggestion.weightKg || form.foodInfo.weightKg;
          }
        }
        aiRan.value = true;
        step.value = 2;
      } catch (e) {
        toast('识别失败：' + e.message, 'danger');
      } finally {
        aiLoading.value = false;
      }
    }

    // 重算碳减排（字段变化时）
    function recalcCarbon() {
      const r = calculateCarbonEstimate({
        category: form.category,
        isFood: form.isFood,
        estimatedWeightKg: Number(form.estimatedWeightKg) || undefined,
        foodInfo: form.isFood ? { foodType: form.foodInfo.foodType, weightKg: Number(form.foodInfo.weightKg) || undefined } : undefined,
      });
      form.estimatedCarbonSavedKg = r.estimatedCarbonSavedKg;
      form.aiAssumptions = ['（根据用户修改字段重新估算）', ...r.assumptions];
    }
    watch(() => [form.category, form.estimatedWeightKg, form.isFood, form.foodInfo.foodType, form.foodInfo.weightKg],
          () => { if (aiRan.value) recalcCarbon(); });

    // Step 3 校验
    const step3Errors = computed(() => {
      const errs = [];
      if (!form.title?.trim()) errs.push('请填写标题');
      if (!form.category) errs.push('请选择分类');
      if (!form.tradeMode) errs.push('请选择流转方式');
      if (form.tradeMode === 'SALE' && (form.price === '' || form.price === null || Number(form.price) < 0)) errs.push('付费转让请填写价格（可为 0）');
      if (form.tradeMode === 'SWAP' && !form.swapWanted?.trim()) errs.push('交换模式请填写希望交换的物品');
      if (!form.locationText?.trim()) errs.push('请填写交接地点');
      if (form.isFood) {
        if (!form.foodInfo.expireAt) errs.push('食物类请填写最晚领取时间');
        if (!form.foodInfo.safetyConfirmed) errs.push('食物类需要勾选食品安全信息确认');
      }
      return errs;
    });

    function goto(n) {
      if (n === 2 && !aiRan.value) {
        toast('请先完成上一步', 'warn');
        return;
      }
      step.value = n;
    }

    // BUG-002 fix: createListing / updateListing 是 async，必须 await，否则 created 是 Promise，
    // created.id === undefined 会让 router 跳到 /listings/undefined，且 API 失败时缺少错误反馈。
    async function submit() {
      if (submitting.value) return;
      if (step3Errors.value.length) {
        toast(step3Errors.value[0], 'warn');
        return;
      }
      ensurePlaceholder();
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        tradeMode: form.tradeMode,
        price: form.tradeMode === 'SALE' ? Number(form.price) || 0 : undefined,
        swapWanted: form.tradeMode === 'SWAP' ? form.swapWanted.trim() : undefined,
        condition: form.condition,
        campus: form.campus,
        locationText: form.locationText.trim(),
        contactMethod: form.contactMethod,
        contactValue: form.contactValue,
        images: [...form.images],
        estimatedWeightKg: Number(form.estimatedWeightKg) || undefined,
        estimatedCarbonSavedKg: Number(form.estimatedCarbonSavedKg) || 0,
        aiConfidence: form.aiConfidence,
        aiAssumptions: [...form.aiAssumptions],
        isFood: !!form.isFood,
        foodInfo: form.isFood ? { ...form.foodInfo, weightKg: Number(form.foodInfo.weightKg) || 0 } : undefined,
        tags: [...form.tags],
        status: 'ACTIVE',
      };
      submitting.value = true;
      try {
        if (editing) {
          await actions.updateListing(editing.id, payload);
          toast('已更新');
          router.push('/listings/' + editing.id);
        } else {
          const created = await actions.createListing(payload);
          if (!created || !created.id) {
            throw new Error('服务器未返回有效的物品 ID');
          }
          toast('发布成功 · 预计可节约 ' + (created.estimatedCarbonSavedKg ?? 0) + ' kg CO₂e');
          if (created._newBadges?.length) {
            for (const b of created._newBadges) {
              toast(`${b.icon} 获得新徽章：${b.name}`, 'success');
            }
          }
          router.push('/listings/' + created.id);
        }
      } catch (e) {
        console.error('[publish] submit failed:', e);
        toast('发布失败：' + (e.message || '未知错误'), 'danger');
      } finally {
        submitting.value = false;
      }
    }

    // 主按钮抽象（给移动端 fixed CTA 和桌面端共用）
    const primaryAction = computed(() => {
      if (step.value === 1) return { label: '下一步', handler: runAI, loading: aiLoading.value };
      if (step.value === 2) return { label: '下一步：补充信息', handler: () => step.value = 3 };
      if (step.value === 3) return { label: '下一步：预览', handler: () => step.value = 4, disabled: step3Errors.value.length > 0 };
      if (step.value === 4) return { label: editing ? '保存修改' : '确认发布', handler: submit, loading: submitting.value, disabled: submitting.value };
      return null;
    });
    const prevAction = computed(() => {
      if (step.value === 1) return null;
      if (step.value === 2) return { label: '← 重新上传', handler: () => step.value = 1 };
      if (step.value === 3) return { label: '← 识别结果',   handler: () => step.value = 2 };
      if (step.value === 4) return { label: '← 返回修改',   handler: () => step.value = 3 };
      return null;
    });

    return {
      step, aiLoading, aiRan, submitting, editing,
      form, fileInput, onFileChange, removeImage, pickFile,
      runAI, goto, submit, step3Errors, recalcCarbon,
      primaryAction, prevAction, isLayoutMobile,
      CATEGORIES, CATEGORY_MAP, TRADE_MODES, CONDITIONS, FOOD_SUBCATS, CAMPUS_LOCATIONS, CAMPUS_NAMES,
      currentUser,
    };
  },
  template: `
    <div :class="isLayoutMobile ? 'pb-24' : 'max-w-3xl mx-auto px-4 py-8'">
      <mobile-top-bar v-if="isLayoutMobile" :title="editing ? '编辑发布' : '发布物品'" :back="true" />

      <div :class="isLayoutMobile ? 'px-3 pt-3' : ''">
        <template v-if="!isLayoutMobile">
          <h1 class="text-2xl font-semibold text-slate-800 mb-6">{{ editing ? '编辑发布' : '发布我的闲置' }}</h1>
        </template>

        <!-- 步骤条（移动端紧凑版） -->
        <div v-if="!isLayoutMobile" class="steps">
          <div class="step" :class="{active: step===1, done: step>1}"><span class="dot">1</span>上传图片</div>
          <div class="bar"></div>
          <div class="step" :class="{active: step===2, done: step>2}"><span class="dot">2</span>识别结果</div>
          <div class="bar"></div>
          <div class="step" :class="{active: step===3, done: step>3}"><span class="dot">3</span>补充信息</div>
          <div class="bar"></div>
          <div class="step" :class="{active: step===4}"><span class="dot">4</span>预览发布</div>
        </div>
        <div v-else class="flex items-center gap-1.5 mb-3 px-1 text-[12px] text-slate-500">
          <div v-for="i in 4" :key="i" class="flex-1 h-1 rounded-full"
               :class="i <= step ? 'bg-leaf-500' : 'bg-slate-200'"></div>
          <span class="ml-2 text-leaf-700 font-medium whitespace-nowrap">
            {{ step }}/4 {{ ['上传图片','识别结果','补充信息','预览发布'][step-1] }}
          </span>
        </div>

      <!-- Step 1 -->
      <section v-if="step===1" class="rounded-2xl bg-white border border-slate-200 p-5">
        <h2 class="font-semibold text-slate-800 mb-3">上传物品图片（1-5 张）</h2>
        <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <div v-for="(img,i) in form.images" :key="i"
               class="aspect-square rounded-xl overflow-hidden relative border border-slate-200 group">
            <img :src="img" class="w-full h-full object-cover" />
            <button @click="removeImage(i)" aria-label="删除图片"
                    class="absolute top-1 right-1 w-8 h-8 rounded-full bg-black/60 text-white text-sm opacity-0 group-hover:opacity-100 transition flex items-center justify-center">×</button>
            <div v-if="i===0" class="absolute bottom-1 left-1 text-[10px] bg-leaf-600 text-white px-1.5 py-0.5 rounded">主图</div>
          </div>
          <button v-if="form.images.length < 5"
                  @click="pickFile"
                  class="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-leaf-400 hover:bg-leaf-50 flex flex-col items-center justify-center text-slate-400 hover:text-leaf-600">
            <div class="text-3xl">＋</div>
            <div class="text-xs mt-1">添加图片</div>
          </button>
          <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onFileChange" />
        </div>
        <p class="mt-3 text-xs text-slate-400">
          不上传也可以，系统会自动使用分类占位图。图片只保存在浏览器本地，会自动压缩。
        </p>
        <router-link to="/scan"
                     class="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-leaf-50 text-leaf-700 text-sm hover:bg-leaf-100 border border-leaf-200">
          📷 拍照快速发布
        </router-link>
        <div v-if="!isLayoutMobile" class="mt-5 flex justify-end gap-2">
          <button @click="runAI" :disabled="aiLoading"
                  class="px-5 py-2.5 rounded-xl bg-leaf-600 text-white text-sm hover:bg-leaf-700 inline-flex items-center gap-2">
            <span v-if="aiLoading" class="w-3 h-3 rounded-full bg-white/80 animate-ping"></span>
            下一步
          </button>
        </div>
      </section>

      <!-- Step 2 -->
      <section v-if="step===2" class="rounded-2xl bg-white border border-slate-200 p-5">
        <div class="flex items-center gap-2 mb-3">
          <h2 class="font-semibold text-slate-800">识别结果</h2>
          <span v-if="form.aiConfidence" class="badge bg-leaf-100 text-leaf-700">置信度 {{ (form.aiConfidence*100).toFixed(0) }}%</span>
          <span class="text-xs text-slate-400 ml-auto">所有字段可在下一步修改</span>
        </div>

        <div class="grid md:grid-cols-2 gap-3 text-sm">
          <div class="rounded-xl bg-slate-50 p-3">
            <div class="text-xs text-slate-500">建议标题</div>
            <div class="mt-1 font-medium text-slate-800">{{ form.title || '—' }}</div>
          </div>
          <div class="rounded-xl bg-slate-50 p-3">
            <div class="text-xs text-slate-500">识别分类</div>
            <div class="mt-1"><category-badge :category="form.category" /></div>
          </div>
          <div class="rounded-xl bg-slate-50 p-3">
            <div class="text-xs text-slate-500">估算重量</div>
            <div class="mt-1 text-slate-800">{{ form.estimatedWeightKg }} kg</div>
          </div>
          <div class="rounded-xl bg-slate-50 p-3">
            <div class="text-xs text-slate-500">新旧程度</div>
            <div class="mt-1"><condition-badge :condition="form.condition" /></div>
          </div>
          <div class="rounded-xl bg-slate-50 p-3 md:col-span-2">
            <div class="text-xs text-slate-500">描述建议</div>
            <div class="mt-1 text-slate-800 whitespace-pre-wrap">{{ form.description || '—' }}</div>
          </div>
          <div class="rounded-xl bg-leaf-50 border border-leaf-100 p-3 md:col-span-2">
            <div class="text-xs text-leaf-700">预计可节约碳排放</div>
            <div class="mt-1 flex items-center gap-2">
              <carbon-badge :value="form.estimatedCarbonSavedKg" />
            </div>
            <div class="mt-2 text-[12px] text-slate-500">
              <div class="font-medium text-slate-600">估算依据：</div>
              <ul class="list-disc list-inside mt-1 space-y-0.5">
                <li v-for="a in form.aiAssumptions" :key="a">{{ a }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div v-if="!isLayoutMobile" class="mt-5 flex justify-between gap-2">
          <button @click="step=1" class="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100">← 重新上传</button>
          <div class="flex gap-2">
            <button @click="runAI" :disabled="aiLoading" class="px-4 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50">重新识别</button>
            <button @click="step=3" class="px-5 py-2 rounded-xl bg-leaf-600 text-white text-sm hover:bg-leaf-700">下一步：补充信息</button>
          </div>
        </div>
        <!-- 移动端：重新识别做成次要按钮，放在表单内 -->
        <div v-else class="mt-4">
          <button @click="runAI" :disabled="aiLoading"
                  class="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 hover:bg-slate-50">
            重新识别
          </button>
        </div>
      </section>

      <!-- Step 3 -->
      <section v-if="step===3" class="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
        <h2 class="font-semibold text-slate-800">补充信息</h2>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">标题 <span class="text-red-500">*</span></label>
          <input v-model="form.title" placeholder="例如：九成新高等数学教材" aria-required="true"
                 class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-leaf-300 text-sm" />
        </div>

        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">分类 <span class="text-red-500">*</span></label>
            <select v-model="form.category" aria-required="true"
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
              <option value="">请选择</option>
              <option v-for="c in CATEGORIES" :key="c.key" :value="c.key">{{ c.icon }} {{ c.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">新旧程度</label>
            <select v-model="form.condition"
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
              <option v-for="(l,k) in CONDITIONS" :key="k" :value="k">{{ l }}</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">流转方式 <span class="text-red-500">*</span></label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button v-for="(m,k) in TRADE_MODES" :key="k" type="button"
                    @click="form.tradeMode = k"
                    class="px-3 py-2 rounded-xl border text-sm transition"
                    :class="form.tradeMode === k
                      ? 'border-leaf-600 bg-leaf-50 text-leaf-700 font-medium'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'">
              {{ m.label }}
            </button>
          </div>
        </div>

        <div v-if="form.tradeMode === 'SALE'">
          <label class="block text-sm font-medium text-slate-700 mb-1">价格（元） <span class="text-red-500">*</span></label>
          <input v-model.number="form.price" type="number" min="0" placeholder="0 代表免费，建议使用免费模式"
                 class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-leaf-300 text-sm" />
          <p class="text-[12px] text-slate-400 mt-1">平台仅展示价格，不接入支付</p>
        </div>
        <div v-if="form.tradeMode === 'SWAP'">
          <label class="block text-sm font-medium text-slate-700 mb-1">希望交换 <span class="text-red-500">*</span></label>
          <input v-model="form.swapWanted" placeholder="例如：瑜伽垫 / 奶茶 / 其他文具"
                 class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-leaf-300 text-sm" />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">描述</label>
          <textarea v-model="form.description" rows="3"
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-leaf-300 text-sm"
                    placeholder="详细描述物品情况、配件、使用感受等"></textarea>
        </div>

        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">交接地点 <span class="text-red-500">*</span></label>
            <input v-model="form.locationText" list="loc-list" placeholder="例如：桑浦山校区图书馆" aria-required="true"
                   class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-leaf-300 text-sm" />
            <datalist id="loc-list">
              <option v-for="loc in CAMPUS_LOCATIONS" :key="loc" :value="loc" />
            </datalist>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">校区</label>
            <select v-model="form.campus"
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-leaf-300 text-sm">
              <option v-for="c in CAMPUS_NAMES" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">联系方式类型</label>
            <select v-model="form.contactMethod" class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
              <option value="微信">微信</option>
              <option value="QQ">QQ</option>
              <option value="手机号">手机号</option>
              <option value="站内留言">仅站内留言</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">联系方式内容</label>
            <input v-model="form.contactValue" placeholder="例如：微信号 / 手机号"
                   class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-leaf-300 text-sm" />
          </div>
        </div>

        <!-- 重量可修改，会触发碳减排重算 -->
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">估算重量（kg）</label>
            <input v-model.number="form.estimatedWeightKg" type="number" min="0" step="0.1"
                   class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-leaf-300 text-sm" />
          </div>
          <div>
            <div class="text-sm font-medium text-slate-700 mb-1">预计减碳</div>
            <div class="px-3 py-2 rounded-lg bg-leaf-50 text-leaf-700 text-sm font-medium">
              🌿 预计可节约 {{ form.estimatedCarbonSavedKg }} kg CO₂e
            </div>
          </div>
        </div>

        <!-- 食物类字段 -->
        <div v-if="form.isFood || form.category === 'FOOD'" class="space-y-3 pt-1">
          <div class="font-medium text-slate-800">食物补充信息</div>
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-slate-700 mb-1">食物类型</label>
              <select v-model="form.foodInfo.foodType" class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
                <option v-for="(v,k) in FOOD_SUBCATS" :key="k" :value="k">{{ v.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-slate-700 mb-1">包装状态</label>
              <select v-model="form.foodInfo.packageStatus" class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
                <option value="UNOPENED">未开封</option>
                <option value="OPENED">已开封</option>
                <option value="COOKED">现制食品</option>
                <option value="EVENT_LEFTOVER">活动剩余</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-slate-700 mb-1">估算重量（kg）</label>
              <input v-model.number="form.foodInfo.weightKg" type="number" min="0" step="0.1"
                     class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
            <div>
              <label class="block text-sm text-slate-700 mb-1">份数（可选）</label>
              <input v-model.number="form.foodInfo.servings" type="number" min="0"
                     class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
            <div>
              <label class="block text-sm text-slate-700 mb-1">制作 / 购买时间</label>
              <input v-model="form.foodInfo.madeAt" type="datetime-local"
                     class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
            <div>
              <label class="block text-sm text-slate-700 mb-1">最晚领取时间 <span class="text-red-500">*</span></label>
              <input v-model="form.foodInfo.expireAt" type="datetime-local"
                     class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm text-slate-700 mb-1">储存条件</label>
              <input v-model="form.foodInfo.storageNote" placeholder="例如：常温 / 冷藏 / 已切好尽快食用"
                     class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
          </div>
          <label class="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" v-model="form.foodInfo.safetyConfirmed" class="mt-0.5" />
            <span><span class="text-red-500 mr-0.5">*</span>我已如实填写食品信息并确认发出，理解平台<strong>不对食品安全做担保</strong>。</span>
          </label>
        </div>

        <!-- 校验提示 -->
        <div v-if="step3Errors.length" class="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3">
          <ul class="list-disc list-inside space-y-0.5">
            <li v-for="e in step3Errors" :key="e">{{ e }}</li>
          </ul>
        </div>

        <div v-if="!isLayoutMobile" class="flex justify-between gap-2">
          <button @click="step=2" class="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100">← 识别结果</button>
          <button @click="step=4" :disabled="step3Errors.length > 0"
                  class="px-5 py-2 rounded-xl bg-leaf-600 text-white text-sm hover:bg-leaf-700 disabled:opacity-50 disabled:cursor-not-allowed">
            下一步：预览
          </button>
        </div>
      </section>

      <!-- Step 4 预览 -->
      <section v-if="step===4" class="space-y-4">
        <div class="rounded-2xl bg-white border border-slate-200 p-5">
          <h2 class="font-semibold text-slate-800 mb-3">预览</h2>
          <div class="grid md:grid-cols-2 gap-4">
            <div class="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
              <img v-if="form.images[0]" :src="form.images[0]" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full placeholder-img flex items-center justify-center text-6xl">
                {{ CATEGORY_MAP[form.category]?.icon || '📦' }}
              </div>
            </div>
            <div>
              <h3 class="font-semibold text-lg text-slate-800">{{ form.title }}</h3>
              <div class="mt-2 flex gap-1.5 flex-wrap">
                <trade-mode-badge :mode="form.tradeMode" :price="form.price" :swap="form.swapWanted" />
                <category-badge :category="form.category" />
                <condition-badge v-if="form.condition" :condition="form.condition" />
              </div>
              <div class="mt-3 text-sm text-slate-600">📍 {{ form.locationText }}</div>
              <div class="mt-2"><carbon-badge :value="form.estimatedCarbonSavedKg" /></div>
              <p v-if="form.description" class="mt-3 text-sm text-slate-700 line-clamp-3">{{ form.description }}</p>
              <div class="mt-3 text-[12px] text-slate-400">发布者：{{ currentUser?.nickname }}</div>
            </div>
          </div>
        </div>

        <food-safety-notice v-if="form.isFood" />
        <payment-boundary-notice />

        <div v-if="!isLayoutMobile" class="flex justify-between gap-2">
          <button @click="step=3" :disabled="submitting" class="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50">← 返回修改</button>
          <button @click="submit" :disabled="submitting" class="px-6 py-2.5 rounded-xl bg-leaf-600 text-white text-sm font-medium hover:bg-leaf-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2">
            <span v-if="submitting" class="w-3 h-3 rounded-full bg-white/80 animate-ping"></span>
            {{ submitting ? '发布中…' : (editing ? '保存修改' : '确认发布') }}
          </button>
        </div>
      </section>
      </div><!-- /inner wrapper -->

      <!-- 移动端：统一底部 CTA -->
      <div v-if="isLayoutMobile" class="mobile-fixed-cta">
        <button v-if="prevAction" @click="prevAction.handler"
                class="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-[13px] shrink-0">
          {{ prevAction.label }}
        </button>
        <button v-if="primaryAction"
                @click="primaryAction.handler"
                :disabled="primaryAction.disabled || primaryAction.loading"
                class="flex-1 px-4 py-3 rounded-xl bg-leaf-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <span v-if="primaryAction.loading" class="w-3 h-3 rounded-full bg-white/80 animate-ping"></span>
          {{ primaryAction.label }}
        </button>
      </div>
    </div>
  `,
};
