import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { state, actions, currentUser, getUser, getListing, sweepExpired } from '../store.js?v=20260609-demo5';
import { fetchListingDetail, isApiMode, submitInterest, completeListing as apiCompleteListing, deleteListing as apiDeleteListing } from '../api-adapter.js?v=20260609-demo5';
import { CATEGORY_MAP, TRADE_MODES, CONDITIONS, FOOD_SUBCATS, STATUS_LABELS } from '../seed.js';
import {
  TradeModeBadge, StatusBadge, CarbonBadge, ConditionBadge, CategoryBadge,
  FoodSafetyNotice, PaymentBoundaryNotice,
  ContactModal, ConfirmCompleteDialog, toast,
} from '../components.js?v=20260609-demo5';
import { useDevice } from '../device.js?v=20260609-demo5';

export default {
  components: {
    TradeModeBadge, StatusBadge, CarbonBadge, ConditionBadge, CategoryBadge,
    FoodSafetyNotice, PaymentBoundaryNotice, ContactModal, ConfirmCompleteDialog,
  },
  setup() {
    sweepExpired();
    const route = useRoute();
    const router = useRouter();
    const { isLayoutMobile } = useDevice();

    const activeImageIdx = ref(0);
    const showContact = ref(false);
    const showComplete = ref(false);

    const localListing = computed(() => getListing(route.params.id));
    const remoteListing = ref(null);
    const listing = computed(() => remoteListing.value || localListing.value);
    const owner = computed(() => {
      if (!listing.value) return null;
      return getUser(listing.value.ownerId) || listing.value.owner || null;
    });

    onMounted(async () => {
      try {
        if (await isApiMode()) {
          const res = await fetchListingDetail(route.params.id);
          if (res && res.listing) remoteListing.value = res.listing;
        }
      } catch {}
    });

    async function onInterestSubmitted(msg) {
      try {
        if (await isApiMode()) {
          await submitInterest(listing.value.id, msg);
        } else {
          actions.addInterest(listing.value.id, msg);
        }
        toast('已记录意向，请根据展示的联系方式与发布者线下约定');
      } catch (e) {
        toast('发送意向失败：' + (e.message || '请先登录'), 'danger');
      }
    }

    async function onCompleteConfirmed() {
      try {
        if (await isApiMode()) {
          const res = await apiCompleteListing(listing.value.id);
          const completed = res?.listing || {
            ...listing.value,
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          remoteListing.value = completed;
          const cached = getListing(listing.value.id);
          if (cached) Object.assign(cached, completed);
          toast(`流转完成，已节约约 ${completed.estimatedCarbonSavedKg || 0} kg CO₂e`);
          if (res?.new_badges?.length) {
            for (const b of res.new_badges) {
              toast(`${b.icon} 获得新徽章：${b.name}`, 'success');
            }
          }
          return;
        }
        const rec = actions.completeListing(listing.value.id);
        if (rec) toast(`流转完成，已节约约 ${rec.carbonSavedKg} kg CO₂e`);
      } catch (e) {
        toast('确认失败：' + (e.message || '服务器错误'), 'danger');
      }
    }
    const isOwner = computed(() => listing.value && listing.value.ownerId === currentUser.value?.id);
    const listingForModal = computed(() => listing.value && ({
      ...listing.value,
      ownerNickname: owner.value?.nickname,
    }));

    const foodSubLabel = computed(() => {
      const t = listing.value?.foodInfo?.foodType;
      return FOOD_SUBCATS[t]?.label || t || '未标注';
    });

    const remainText = computed(() => {
      if (!listing.value?.isFood) return null;
      const exp = listing.value.foodInfo?.expireAt;
      if (!exp) return '未填写';
      const diff = new Date(exp).getTime() - Date.now();
      if (diff <= 0) return '已过期';
      const h = Math.max(1, Math.round(diff / 3600_000));
      if (h < 24) return `${h} 小时内领取`;
      return `${Math.round(h/24)} 天内领取`;
    });

    const createdAgo = computed(() => {
      if (!listing.value) return '';
      const diff = Date.now() - new Date(listing.value.createdAt).getTime();
      const h = Math.round(diff / 3600_000);
      if (h < 1) return '刚刚';
      if (h < 24) return `${h} 小时前`;
      return `${Math.round(h/24)} 天前`;
    });

    async function removeSelf() {
      if (!confirm('确认下架此物品？')) return;
      try {
        if (await isApiMode()) {
          await apiDeleteListing(listing.value.id);
          if (remoteListing.value) remoteListing.value = { ...remoteListing.value, status: 'REMOVED' };
          const cached = getListing(listing.value.id);
          if (cached) {
            cached.status = 'REMOVED';
            cached.updatedAt = new Date().toISOString();
          }
        } else {
          await actions.removeListing(listing.value.id);
        }
        toast('已下架', 'warn');
      } catch (e) {
        toast('下架失败：' + (e.message || '服务器错误'), 'danger');
      }
    }

    function onContact() {
      if (!listing.value || listing.value.status !== 'ACTIVE') {
        toast('此物品当前不可联系', 'warn');
        return;
      }
      if (isOwner.value) {
        toast('你是发布者，不能联系自己哦', 'warn');
        return;
      }
      showContact.value = true;
    }

    function goBack() {
      if (window.history.length > 1) router.back();
      else router.push('/listings');
    }

    return {
      listing, owner, isOwner, listingForModal,
      activeImageIdx, showContact, showComplete,
      foodSubLabel, remainText, createdAgo,
      CONDITIONS, CATEGORY_MAP, TRADE_MODES, STATUS_LABELS,
      removeSelf, onContact, goBack, router, isLayoutMobile,
      onInterestSubmitted, onCompleteConfirmed,
    };
  },
  template: `
    <!-- ============ 桌面端 ============ -->
    <div v-if="!isLayoutMobile" class="max-w-5xl mx-auto px-4 py-8">
      <div v-if="!listing" class="text-center py-16 text-slate-400">
        物品不存在或已被删除。
        <div class="mt-4"><router-link to="/listings" class="text-leaf-600">← 返回列表</router-link></div>
      </div>

      <div v-else class="grid md:grid-cols-5 gap-6">
        <div class="md:col-span-3">
          <div class="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative">
            <img v-if="listing.images?.[activeImageIdx]" :src="listing.images[activeImageIdx]" :alt="listing.title"
                 class="w-full h-full object-cover" />
            <div v-else class="w-full h-full placeholder-img flex items-center justify-center text-7xl">
              {{ CATEGORY_MAP[listing.category]?.icon || '📦' }}
            </div>
            <div class="absolute top-3 left-3 flex gap-1.5 flex-wrap">
              <trade-mode-badge :mode="listing.tradeMode" :price="listing.price" :swap="listing.swapWanted" />
              <status-badge :status="listing.status" />
            </div>
          </div>
          <div v-if="listing.images?.length > 1" class="mt-3 flex gap-2 flex-wrap">
            <button v-for="(img,i) in listing.images" :key="i" @click="activeImageIdx = i"
                    class="w-16 h-16 rounded-lg overflow-hidden border-2"
                    :class="i === activeImageIdx ? 'border-leaf-600' : 'border-transparent hover:border-slate-300'">
              <img :src="img" class="w-full h-full object-cover" />
            </button>
          </div>

          <section class="mt-6">
            <h3 class="font-semibold text-slate-800 mb-2">描述</h3>
            <p class="text-slate-700 leading-relaxed whitespace-pre-wrap">{{ listing.description || '—' }}</p>
          </section>

          <section class="mt-6 rounded-2xl bg-leaf-50/60 border border-leaf-100 p-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2 font-semibold text-leaf-700">
                <span>🌿 分类与减碳估算</span>
                <span v-if="listing.aiConfidence" class="badge bg-white text-leaf-700 border border-leaf-200">置信度 {{ (listing.aiConfidence*100).toFixed(0) }}%</span>
              </div>
            </div>
            <div class="text-sm text-slate-700 space-y-1">
              <div><span class="text-slate-500">分类：</span>{{ CATEGORY_MAP[listing.category]?.label }}</div>
              <div v-if="listing.estimatedWeightKg"><span class="text-slate-500">估算重量：</span>约 {{ listing.estimatedWeightKg }} kg</div>
              <div v-if="listing.aiAssumptions?.length">
                <div class="text-slate-500 mb-1">估算依据：</div>
                <ul class="list-disc list-inside space-y-0.5 text-[13px]">
                  <li v-for="a in listing.aiAssumptions" :key="a">{{ a }}</li>
                </ul>
              </div>
            </div>
          </section>

          <section v-if="listing.isFood && listing.foodInfo" class="mt-6 space-y-3">
            <food-safety-notice />
            <div class="rounded-2xl bg-white border border-slate-200 p-4 text-sm grid grid-cols-2 gap-y-2">
              <div><span class="text-slate-500">类别：</span>{{ foodSubLabel }}</div>
              <div><span class="text-slate-500">状态：</span>
                {{ ({UNOPENED:'未开封', OPENED:'已开封', COOKED:'现制食品', EVENT_LEFTOVER:'活动剩余'})[listing.foodInfo.packageStatus] || listing.foodInfo.packageStatus }}
              </div>
              <div v-if="listing.foodInfo.weightKg"><span class="text-slate-500">估算重量：</span>{{ listing.foodInfo.weightKg }} kg</div>
              <div v-if="listing.foodInfo.servings"><span class="text-slate-500">份数：</span>{{ listing.foodInfo.servings }}</div>
              <div><span class="text-slate-500">最晚领取：</span>{{ new Date(listing.foodInfo.expireAt).toLocaleString('zh-CN') }}</div>
              <div><span class="text-slate-500">剩余时间：</span><span class="text-amber-700 font-medium">{{ remainText }}</span></div>
              <div v-if="listing.foodInfo.storageNote" class="col-span-2">
                <span class="text-slate-500">储存条件：</span>{{ listing.foodInfo.storageNote }}
              </div>
              <div class="col-span-2 text-[12px] text-slate-400">
                发布者已确认食品安全信息：{{ listing.foodInfo.safetyConfirmed ? '是' : '否' }}
              </div>
            </div>
          </section>
        </div>

        <aside class="md:col-span-2">
          <div class="rounded-2xl bg-white border border-slate-200 p-5 sticky top-20">
            <h1 class="text-xl font-semibold text-slate-800 leading-snug">{{ listing.title }}</h1>
            <div class="mt-2 flex flex-wrap gap-1.5">
              <category-badge :category="listing.category" />
              <condition-badge v-if="listing.condition" :condition="listing.condition" />
            </div>

            <div class="mt-4">
              <div v-if="listing.tradeMode === 'SALE'" class="text-3xl font-bold text-amber-600">¥{{ listing.price ?? 0 }}</div>
              <div v-else-if="listing.tradeMode === 'FREE'" class="text-3xl font-bold text-leaf-600">免费赠送</div>
              <div v-else-if="listing.tradeMode === 'SWAP'">
                <div class="text-leaf-700 font-semibold">🔄 物品交换</div>
                <div class="mt-1 text-sm text-slate-600">希望交换：{{ listing.swapWanted || '（未填写）' }}</div>
              </div>
              <div v-else class="text-slate-700 font-semibold">💬 面议 / 自行协商</div>
            </div>

            <div class="mt-4">
              <carbon-badge :value="listing.estimatedCarbonSavedKg" :completed="listing.status === 'COMPLETED'" />
              <p class="text-[12px] text-slate-400 mt-2 leading-relaxed">
                碳减排为估算值，用于环保贡献展示，不作为精确碳审计数据。
              </p>
            </div>

            <div class="mt-5 text-sm space-y-2 text-slate-700">
              <div>📍 {{ listing.locationText }}</div>
              <div v-if="owner">👤 {{ owner.nickname }} · {{ owner.campus }}</div>
              <div>🕒 发布于 {{ createdAgo }}</div>
              <div v-if="listing.interestedCount">❤️ 已有 {{ listing.interestedCount }} 人表达意向</div>
            </div>

            <div v-if="listing.status === 'ACTIVE'" class="mt-5 space-y-2">
              <template v-if="!isOwner">
                <button @click="onContact"
                        class="w-full px-4 py-2.5 rounded-xl bg-leaf-600 text-white font-medium hover:bg-leaf-700">
                  🙋 我想要 / 联系发布者
                </button>
                <p class="text-[12px] text-slate-400 text-center">
                  双方线下约定付费 / 赠送 / 交换，平台不处理支付
                </p>
              </template>
              <template v-else>
                <button @click="showComplete = true"
                        class="w-full px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700">
                  ✅ 确认已流转
                </button>
                <div class="flex gap-2">
                  <router-link :to="'/publish?edit=' + listing.id"
                               class="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 text-center">编辑</router-link>
                  <button @click="removeSelf"
                          class="flex-1 px-4 py-2 rounded-xl border border-red-200 text-sm text-red-600 hover:bg-red-50">下架</button>
                </div>
              </template>
            </div>

            <div v-else-if="listing.status === 'COMPLETED'" class="mt-5 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-700">
              🎉 此物品已完成流转，感谢参与校园资源再利用。
            </div>
            <div v-else-if="listing.status === 'EXPIRED'" class="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-500">
              此食物已过最晚领取时间，不再开放领取。
            </div>
            <div v-else-if="listing.status === 'REMOVED'" class="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-500">
              此物品已被发布者下架。
            </div>
          </div>
        </aside>
      </div>

      <section class="mt-8" v-if="listing">
        <payment-boundary-notice />
      </section>

      <contact-modal v-if="listing" v-model="showContact" :listing="listingForModal" @submitted="onInterestSubmitted" />
      <confirm-complete-dialog v-if="listing" v-model="showComplete" :listing="listing" @confirmed="onCompleteConfirmed" />
    </div>

    <!-- ============ 移动端 ============ -->
    <div v-else class="pb-24">
      <div v-if="!listing" class="text-center py-16 text-slate-400">
        <div class="text-5xl">🕳️</div>
        <div class="mt-3">物品不存在或已被删除</div>
        <div class="mt-4"><router-link to="/listings" class="text-leaf-600">← 返回列表</router-link></div>
      </div>

      <template v-else>
        <!-- 沉浸式大图 + 浮层返回 -->
        <div class="immersive-hero">
          <img v-if="listing.images?.[activeImageIdx]" :src="listing.images[activeImageIdx]" :alt="listing.title" />
          <div v-else class="w-full h-full placeholder-img flex items-center justify-center text-[110px]">
            {{ CATEGORY_MAP[listing.category]?.icon || '📦' }}
          </div>
          <button @click="goBack" class="back" aria-label="返回">‹</button>
          <div class="absolute top-3 right-3 flex gap-1.5">
            <trade-mode-badge :mode="listing.tradeMode" :price="listing.price" :swap="listing.swapWanted" />
            <status-badge v-if="listing.status !== 'ACTIVE'" :status="listing.status" />
          </div>
          <div v-if="listing.images?.length > 1"
               class="absolute bottom-2 right-3 bg-black/40 text-white text-[11px] px-2 py-0.5 rounded-full">
            {{ activeImageIdx + 1 }} / {{ listing.images.length }}
          </div>
        </div>
        <!-- 缩略图横滚 -->
        <div v-if="listing.images?.length > 1" class="px-3 pt-3">
          <div class="pill-row">
            <button v-for="(img, i) in listing.images" :key="i" @click="activeImageIdx = i"
                    class="w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0"
                    :class="i === activeImageIdx ? 'border-leaf-600' : 'border-transparent'">
              <img :src="img" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        <!-- 价格卡 + 标题 -->
        <section class="px-4 pt-4">
          <div>
            <div v-if="listing.tradeMode === 'SALE'" class="flex items-baseline gap-2">
              <span class="text-[13px] text-amber-600">¥</span>
              <span class="text-3xl font-bold text-amber-600 leading-none">{{ listing.price ?? 0 }}</span>
            </div>
            <div v-else-if="listing.tradeMode === 'FREE'" class="text-2xl font-bold text-leaf-600">免费赠送</div>
            <div v-else-if="listing.tradeMode === 'SWAP'" class="text-lg font-semibold text-leaf-700">🔄 想换：{{ listing.swapWanted || '面议' }}</div>
            <div v-else class="text-lg font-semibold text-slate-700">💬 面议</div>
          </div>
          <h1 class="mt-2 text-[17px] font-semibold text-slate-800 leading-snug">{{ listing.title }}</h1>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <category-badge :category="listing.category" />
            <condition-badge v-if="listing.condition" :condition="listing.condition" />
            <carbon-badge :value="listing.estimatedCarbonSavedKg" :completed="listing.status === 'COMPLETED'" />
          </div>
        </section>

        <!-- 基本信息卡 -->
        <section class="px-4 mt-4">
          <div class="rounded-2xl bg-white border border-slate-200 p-4 text-sm text-slate-700 space-y-2">
            <div class="flex items-center gap-2">📍 <span>{{ listing.locationText }}</span></div>
            <div v-if="owner" class="flex items-center gap-2">
              <span>{{ owner.avatar || '👤' }}</span>
              <span>{{ owner.nickname }} · {{ owner.campus }}</span>
            </div>
            <div class="flex items-center gap-2 text-slate-500 text-[13px]">🕒 {{ createdAgo }}
              <span v-if="listing.interestedCount" class="ml-2">❤️ {{ listing.interestedCount }} 人想要</span>
            </div>
          </div>
        </section>

        <!-- 描述 -->
        <section class="px-4 mt-4">
          <div class="rounded-2xl bg-white border border-slate-200 p-4">
            <div class="text-[13px] text-slate-500 mb-1.5">描述</div>
            <p class="text-slate-700 text-[14px] leading-relaxed whitespace-pre-wrap">{{ listing.description || '—' }}</p>
          </div>
        </section>

        <!-- 分类与减碳估算 -->
        <section class="px-4 mt-3">
          <div class="rounded-2xl bg-leaf-50/60 border border-leaf-100 p-4">
            <div class="flex items-center gap-2 font-semibold text-leaf-700 mb-2">
              <span>🌿 分类与减碳估算</span>
              <span v-if="listing.aiConfidence" class="badge bg-white text-leaf-700 border border-leaf-200">
                {{ (listing.aiConfidence*100).toFixed(0) }}%
              </span>
            </div>
            <div class="text-[13px] text-slate-700 space-y-1">
              <div><span class="text-slate-500">分类：</span>{{ CATEGORY_MAP[listing.category]?.label }}</div>
              <div v-if="listing.estimatedWeightKg"><span class="text-slate-500">估算重量：</span>约 {{ listing.estimatedWeightKg }} kg</div>
              <div v-if="listing.aiAssumptions?.length">
                <div class="text-slate-500 mb-0.5 mt-1">估算依据：</div>
                <ul class="list-disc list-inside space-y-0.5 text-[12px]">
                  <li v-for="a in listing.aiAssumptions" :key="a">{{ a }}</li>
                </ul>
              </div>
            </div>
            <p class="mt-2 text-[11px] text-slate-400">预计减碳为估算值，仅用于环保贡献展示。</p>
          </div>
        </section>

        <!-- 食物信息 -->
        <section v-if="listing.isFood && listing.foodInfo" class="px-4 mt-3 space-y-3">
          <food-safety-notice />
          <div class="rounded-2xl bg-white border border-slate-200 p-4 text-[13px] grid grid-cols-2 gap-y-2">
            <div><span class="text-slate-500">类别：</span>{{ foodSubLabel }}</div>
            <div><span class="text-slate-500">状态：</span>
              {{ ({UNOPENED:'未开封', OPENED:'已开封', COOKED:'现制食品', EVENT_LEFTOVER:'活动剩余'})[listing.foodInfo.packageStatus] || listing.foodInfo.packageStatus }}
            </div>
            <div v-if="listing.foodInfo.weightKg"><span class="text-slate-500">重量：</span>{{ listing.foodInfo.weightKg }} kg</div>
            <div v-if="listing.foodInfo.servings"><span class="text-slate-500">份数：</span>{{ listing.foodInfo.servings }}</div>
            <div class="col-span-2"><span class="text-slate-500">最晚领取：</span>{{ new Date(listing.foodInfo.expireAt).toLocaleString('zh-CN') }}</div>
            <div class="col-span-2"><span class="text-slate-500">剩余：</span><span class="text-amber-700 font-medium">{{ remainText }}</span></div>
            <div v-if="listing.foodInfo.storageNote" class="col-span-2">
              <span class="text-slate-500">储存：</span>{{ listing.foodInfo.storageNote }}
            </div>
          </div>
        </section>

        <!-- 边界提示 -->
        <section class="px-4 mt-3">
          <payment-boundary-notice />
        </section>

        <!-- 底部 fixed CTA -->
        <div class="mobile-fixed-cta">
          <template v-if="listing.status === 'ACTIVE'">
            <template v-if="!isOwner">
              <router-link to="/listings"
                           class="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-[13px] shrink-0">
                返回
              </router-link>
              <button @click="onContact"
                      class="flex-1 px-4 py-3 rounded-xl bg-leaf-600 text-white font-medium">
                🙋 我想要 · 联系 TA
              </button>
            </template>
            <template v-else>
              <router-link :to="'/publish?edit=' + listing.id"
                           class="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-[13px] shrink-0">
                编辑
              </router-link>
              <button @click="removeSelf"
                      class="px-4 py-3 rounded-xl border border-red-200 text-red-600 text-[13px] shrink-0">
                下架
              </button>
              <button @click="showComplete = true"
                      class="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium">
                ✅ 确认已流转
              </button>
            </template>
          </template>
          <div v-else class="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-500 text-center text-sm">
            <template v-if="listing.status === 'COMPLETED'">🎉 已完成流转</template>
            <template v-else-if="listing.status === 'EXPIRED'">此食物已过期</template>
            <template v-else>此物品已下架</template>
          </div>
        </div>

        <contact-modal v-model="showContact" :listing="listingForModal" @submitted="onInterestSubmitted" />
        <confirm-complete-dialog v-model="showComplete" :listing="listing" @confirmed="onCompleteConfirmed" />
      </template>
    </div>
  `,
};
