import { CATEGORY_MAP } from './carbon-coefficients.js';

export function getShareCardDateStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function createShareCardState(ref, toast, options = {}) {
  const shareCardRef = ref(null);
  const generating = ref(false);
  const {
    filenamePrefix = '碳循校园-分享海报',
    backgroundColor = '#f7f5ee',
    scale = 2,
    now = () => new Date(),
    html2canvasImpl = null,
    createLink = () => document.createElement('a'),
  } = options;

  async function generateShareCard() {
    if (generating.value) return;
    generating.value = true;
    try {
      const el = shareCardRef.value;
      const render = html2canvasImpl || globalThis.html2canvas;
      if (!el || typeof render !== 'function') {
        toast('分享功能需要网络加载依赖库，请联网后刷新页面重试', 'danger');
        return;
      }
      const canvas = await render(el, {
        backgroundColor,
        scale,
        useCORS: true,
      });
      if (!canvas || typeof canvas.toDataURL !== 'function') {
        toast('分享功能需要网络加载依赖库，请联网后刷新页面重试', 'danger');
        return;
      }
      const link = createLink();
      link.download = `${filenamePrefix}-${getShareCardDateStamp(now())}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast('分享卡片已保存到本地');
    } catch (e) {
      console.error('Share card error:', e);
      toast('生成失败：' + e.message, 'danger');
    } finally {
      generating.value = false;
    }
  }

  return { shareCardRef, generating, generateShareCard };
}

export const ShareCardTemplate = {
  props: {
    title: { type: String, default: '碳循校园' },
    subtitle: { type: String, default: '校园二手漂流与碳减排估算平台' },
    user: { type: Object, default: null },
    rank: { type: Number, default: null },
    stats: { type: Array, default: () => [] },
    categories: { type: Array, default: () => [] },
  },
  setup() {
    const today = new Date().toLocaleDateString('zh-CN');
    return { CATEGORY_MAP, today };
  },
  template: `
    <div style="width:750px;padding:40px;background:linear-gradient(135deg,#f1f9f2 0%,#dcf0de 50%,#f7f5ee 100%);font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
        <div style="width:48px;height:48px;background:linear-gradient(135deg,#5fae6c,#2f7740);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;">🌿</div>
        <div>
          <div style="font-size:22px;font-weight:700;color:#1d3f28;">{{ title }}</div>
          <div style="font-size:13px;color:#5fae6c;">{{ subtitle }}</div>
        </div>
      </div>

      <div style="background:linear-gradient(135deg,#5fae6c,#2f7740);border-radius:20px;padding:24px;margin-bottom:24px;color:white;">
        <div v-if="user" style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <div style="width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;">{{ user.avatar || '👤' }}</div>
          <div>
            <div style="font-size:18px;font-weight:600;">{{ user.nickname || '同学' }}</div>
            <div style="font-size:12px;opacity:0.8;">{{ user.school }}{{ user.campus ? ' · ' + user.campus : '' }}</div>
          </div>
          <div v-if="rank" style="margin-left:auto;background:rgba(255,255,255,0.2);border-radius:12px;padding:4px 12px;font-size:13px;">
            {{ rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : '' }} 排名 #{{ rank }}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <div v-for="stat in stats.slice(0, 3)" :key="stat.label"
               style="background:rgba(255,255,255,0.15);border-radius:14px;padding:14px;text-align:center;">
            <div style="font-size:11px;opacity:0.8;">{{ stat.label }}</div>
            <div style="font-size:28px;font-weight:700;margin-top:4px;">{{ stat.value }}</div>
            <div style="font-size:11px;opacity:0.7;">{{ stat.unit }}</div>
          </div>
        </div>
      </div>

      <div v-if="categories.length > 0" style="margin-bottom:24px;">
        <div style="font-size:14px;font-weight:600;color:#275f36;margin-bottom:12px;">分类减碳贡献</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div v-for="c in categories.slice(0, 6)" :key="c.key"
               style="display:flex;align-items:center;gap:10px;background:white;border-radius:12px;padding:10px 14px;">
            <div style="font-size:20px;">{{ c.icon || CATEGORY_MAP[c.key]?.icon || '📦' }}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:12px;color:#64748b;">{{ c.label || CATEGORY_MAP[c.key]?.label || c.key }}</div>
              <div style="font-size:15px;font-weight:600;color:#275f36;">{{ c.kg || 0 }} kg</div>
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:16px;border-top:1px solid #dcf0de;">
        <div style="font-size:12px;color:#8bc994;">stu-eco-trace.netlify.app</div>
        <div style="font-size:12px;color:#8bc994;">{{ today }}</div>
      </div>
    </div>
  `,
};
