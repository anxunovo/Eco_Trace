import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { state, actions, currentUser, isAuthenticated } from '../store.js?v=20260609-demo5';
import { analyzeWithAI } from '../api-adapter.js?v=20260609-demo5';
import { compressForApi } from '../image-utils.js';
import { CATEGORIES, CATEGORY_MAP, TRADE_MODES, CAMPUS_LOCATIONS, CAMPUS_NAMES } from '../seed.js';
import { toast, MobileTopBar } from '../components.js?v=20260609-demo5';
import { useDevice } from '../device.js?v=20260609-demo5';

export default {
  components: { MobileTopBar },
  setup() {
    const router = useRouter();
    const { isLayoutMobile } = useDevice();

    const step = ref('camera'); // 'camera' | 'preview' | 'result' | 'confirm'
    const videoRef = ref(null);
    const canvasRef = ref(null);
    const stream = ref(null);
    const capturedImage = ref(null);
    const aiLoading = ref(false);
    const submitting = ref(false);
    const cameraError = ref('');
    const facingMode = ref('environment');

    const form = reactive({
      title: '',
      category: '',
      condition: 'GOOD',
      estimatedWeightKg: '',
      description: '',
      tradeMode: 'FREE',
      campus: currentUser.value?.campus || '东海岸校区',
      locationText: '',
      contactMethod: '微信',
      contactValue: '',
    });

    async function startCamera() {
      try {
        cameraError.value = '';
        if (stream.value) {
          stream.value.getTracks().forEach(t => t.stop());
        }
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode.value, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        stream.value = s;
        if (videoRef.value) {
          videoRef.value.srcObject = s;
          await videoRef.value.play();
        }
      } catch (e) {
        cameraError.value = e.name === 'NotAllowedError'
          ? '请允许摄像头权限后重试'
          : e.name === 'NotFoundError'
          ? '未检测到摄像头'
          : '摄像头启动失败：' + e.message;
      }
    }

    function switchCamera() {
      facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment';
      startCamera();
    }

    async function capturePhoto() {
      if (!videoRef.value || !canvasRef.value) return;
      const video = videoRef.value;
      const canvas = canvasRef.value;
      const maxSize = 1200;
      let w = video.videoWidth;
      let h = video.videoHeight;
      if (w > maxSize || h > maxSize) {
        const ratio = Math.min(maxSize / w, maxSize / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, w, h);
      capturedImage.value = canvas.toDataURL('image/jpeg', 0.85);
      step.value = 'preview';
      stopCamera();
    }

    function retake() {
      capturedImage.value = null;
      step.value = 'camera';
      startCamera();
    }

    function handleFileFallback(e) {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxSize = 1200;
          let w = img.width, h = img.height;
          if (w > maxSize || h > maxSize) {
            const ratio = Math.min(maxSize / w, maxSize / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          capturedImage.value = canvas.toDataURL('image/jpeg', 0.85);
          step.value = 'preview';
          stopCamera();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }

    async function analyzeImage() {
      if (!capturedImage.value || aiLoading.value) return;
      aiLoading.value = true;
      try {
        const compressed = await compressForApi(capturedImage.value);
        const res = await analyzeWithAI({ images: [compressed], title: '', description: '', category: '' });
        if (!res) {
          toast('AI 识别暂不可用，请手动填写', 'warn');
          step.value = 'confirm';
          return;
        }
        form.title = res.titleSuggestion || '';
        form.category = res.category || '';
        form.condition = res.condition || 'GOOD';
        form.estimatedWeightKg = res.estimatedWeightKg || '';
        form.description = res.descriptionSuggestion || '';
        step.value = 'result';
        toast(`识别为 ${CATEGORY_MAP[res.category]?.label || res.category}，置信度 ${(res.confidence * 100).toFixed(0)}%`);
      } catch (e) {
        console.error('[scan] AI error:', e);
        toast('识别失败：' + e.message, 'danger');
        step.value = 'confirm';
      } finally {
        aiLoading.value = false;
      }
    }

    async function quickPublish() {
      if (submitting.value) return;
      if (!form.title || !form.category) {
        toast('请至少填写标题和分类', 'warn');
        return;
      }
      submitting.value = true;
      try {
        const payload = {
          images: capturedImage.value ? [capturedImage.value] : [],
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          tradeMode: form.tradeMode,
          condition: form.condition,
          campus: form.campus,
          locationText: form.locationText || '待定',
          contactMethod: form.contactMethod,
          contactValue: form.contactValue,
          estimatedWeightKg: Number(form.estimatedWeightKg) || undefined,
          status: 'ACTIVE',
        };
        const created = await actions.createListing(payload);
        if (!created?.id) throw new Error('发布失败');
        if (created._newBadges?.length) {
          for (const b of created._newBadges) {
            toast(`${b.icon} 获得新徽章：${b.name}`, 'success');
          }
        }
        toast('发布成功！');
        router.push('/listings/' + created.id);
      } catch (e) {
        toast('发布失败：' + (e.message || '未知错误'), 'danger');
      } finally {
        submitting.value = false;
      }
    }

    function stopCamera() {
      if (stream.value) {
        stream.value.getTracks().forEach(t => t.stop());
        stream.value = null;
      }
    }

    onMounted(() => {
      if (step.value === 'camera') startCamera();
    });
    onUnmounted(stopCamera);

    return {
      step, videoRef, canvasRef, capturedImage, aiLoading, submitting,
      cameraError, form, facingMode,
      capturePhoto, retake, switchCamera, analyzeImage, quickPublish,
      handleFileFallback,
      isLayoutMobile,
      CATEGORIES, CATEGORY_MAP, TRADE_MODES, CAMPUS_LOCATIONS, CAMPUS_NAMES,
    };
  },
  template: `
    <div :class="isLayoutMobile ? 'pb-24' : 'max-w-lg mx-auto px-4 py-8'">
      <mobile-top-bar v-if="isLayoutMobile" title="扫码发布" :back="true" />

      <!-- Camera Step -->
      <div v-if="step === 'camera'" class="space-y-4">
        <div v-if="!isLayoutMobile" class="flex items-center gap-3 mb-4">
          <button @click="$router.back()" class="text-slate-400 hover:text-slate-600">← 返回</button>
          <h1 class="text-xl font-semibold text-slate-800">扫码快速发布</h1>
        </div>

        <div v-if="cameraError" class="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-center">
          <div class="text-4xl mb-3">📷</div>
          <div class="text-amber-800 mb-4">{{ cameraError }}</div>
          <label class="inline-block px-5 py-2.5 rounded-xl bg-leaf-600 text-white text-sm font-medium hover:bg-leaf-700 cursor-pointer">
            从相册选择图片
            <input type="file" accept="image/*" class="hidden" @change="handleFileFallback" />
          </label>
        </div>

        <div v-else class="relative rounded-2xl overflow-hidden bg-black">
          <video ref="videoRef" autoplay playsinline muted
                 class="w-full aspect-[4/3] object-cover"></video>
          <canvas ref="canvasRef" class="hidden"></canvas>
          <!-- Controls -->
          <div class="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center gap-6">
            <label class="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white cursor-pointer">
              🖼
              <input type="file" accept="image/*" class="hidden" @change="handleFileFallback" />
            </label>
            <button @click="capturePhoto"
                    class="w-16 h-16 rounded-full bg-white border-4 border-leaf-400 shadow-lg active:scale-95 transition-transform"></button>
            <button @click="switchCamera"
                    class="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white">
              🔄
            </button>
          </div>
        </div>
        <p class="text-xs text-slate-400 text-center">拍摄物品照片，AI 将自动识别类型并估算碳减排</p>
      </div>

      <!-- Preview Step -->
      <div v-if="step === 'preview'" class="space-y-4">
        <div class="rounded-2xl overflow-hidden">
          <img :src="capturedImage" class="w-full" />
        </div>
        <div class="flex gap-3">
          <button @click="retake" class="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm">
            重拍
          </button>
          <button @click="analyzeImage" :disabled="aiLoading"
                  class="flex-1 py-3 rounded-xl bg-leaf-600 text-white font-medium hover:bg-leaf-700 disabled:opacity-50 text-sm inline-flex items-center justify-center gap-2">
            <span v-if="aiLoading" class="w-3 h-3 rounded-full bg-white/80 animate-ping"></span>
            {{ aiLoading ? '识别中...' : 'AI 识别' }}
          </button>
        </div>
      </div>

      <!-- Result Step -->
      <div v-if="step === 'result'" class="space-y-3">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">{{ CATEGORY_MAP[form.category]?.icon || '📦' }}</span>
          <div>
            <div class="font-semibold text-slate-800">{{ CATEGORY_MAP[form.category]?.label || form.category }}</div>
            <div class="text-xs text-slate-400">AI 识别结果</div>
          </div>
        </div>

        <div>
          <label class="block text-xs text-slate-500 mb-1">标题</label>
          <input v-model="form.title" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-leaf-300" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-slate-500 mb-1">分类</label>
            <select v-model="form.category" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
              <option v-for="c in CATEGORIES" :key="c.key" :value="c.key">{{ c.icon }} {{ c.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">新旧程度</label>
            <select v-model="form.condition" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
              <option value="NEW">全新</option>
              <option value="LIKE_NEW">几乎全新</option>
              <option value="GOOD">良好</option>
              <option value="FAIR">一般</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-slate-500 mb-1">流转方式</label>
            <select v-model="form.tradeMode" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
              <option v-for="(m,k) in TRADE_MODES" :key="k" :value="k">{{ m.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">重量 (kg)</label>
            <input v-model.number="form.estimatedWeightKg" type="number" min="0" step="0.1"
                   class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          </div>
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-1">交接地点</label>
          <input v-model="form.locationText" list="scan-loc" placeholder="例如：图书馆门口"
                 class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          <datalist id="scan-loc">
            <option v-for="loc in CAMPUS_LOCATIONS" :key="loc" :value="loc" />
          </datalist>
        </div>

        <div class="flex gap-3 pt-2">
          <button @click="retake" class="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm">
            重拍
          </button>
          <button @click="quickPublish" :disabled="submitting || !form.title || !form.category"
                  class="flex-1 py-3 rounded-xl bg-leaf-600 text-white font-medium hover:bg-leaf-700 disabled:opacity-50 text-sm inline-flex items-center justify-center gap-2">
            <span v-if="submitting" class="w-3 h-3 rounded-full bg-white/80 animate-ping"></span>
            {{ submitting ? '发布中...' : '一键发布' }}
          </button>
        </div>
      </div>

      <!-- Confirm Step (AI failed, manual) -->
      <div v-if="step === 'confirm'" class="space-y-3">
        <div class="text-sm text-amber-700 bg-amber-50 rounded-xl p-3">
          AI 识别不可用，请手动填写信息后发布。
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-1">标题 *</label>
          <input v-model="form.title" placeholder="物品名称" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-1">分类 *</label>
          <select v-model="form.category" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
            <option value="">请选择</option>
            <option v-for="c in CATEGORIES" :key="c.key" :value="c.key">{{ c.icon }} {{ c.label }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-1">交接地点</label>
          <input v-model="form.locationText" placeholder="例如：图书馆门口" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        </div>
        <div class="flex gap-3 pt-2">
          <button @click="retake" class="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm">重拍</button>
          <button @click="quickPublish" :disabled="submitting || !form.title || !form.category"
                  class="flex-1 py-3 rounded-xl bg-leaf-600 text-white font-medium disabled:opacity-50 text-sm">
            {{ submitting ? '发布中...' : '一键发布' }}
          </button>
        </div>
      </div>
    </div>
  `,
};
