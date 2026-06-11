# 碳循校园 · 任务档案（封存于 2026-04-24）

> 新对话加载后请先读完本文件，再读需求文档，再动代码。

---

## 0. 一句话

给中国校园做的"二手漂流 + 碳减排估算" Web MVP Demo，v0.1，比赛用。需求文档在 `/tmp/校园二手漂流Web端需求文档_MVP版.md`。

---

## 1. 访问与部署

| 项 | 值 |
|---|---|
| 访问地址 | http://43.206.190.181/ |
| 绑定内网 IP | 172.31.40.245 (AWS 东京区 ens5 辅助 IP) |
| nginx 站点配置 | `/etc/nginx/conf.d/new-site.conf` |
| 站点根目录 | `/home/ec2-user/new-site/public/` |
| 日志 | `/var/log/nginx/new-site_{access,error}.log` |

服务器有 4 个公网 IP，本项目**只占用其中一个**（43.206.190.181）。其它 IP 上：
- blocksecx.com (ssl) 在 443，http → https 跳转
- `vless.conf` 的 `default_server` 在 80 绑所有 IP，对未命中本项目 IP 的 host 返回 444

nginx 片段（供参考，别擅自改）：

```nginx
server {
    listen 172.31.40.245:80;
    server_name _;
    root /home/ec2-user/new-site/public;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;   # SPA history 回退
    }
}
```

**热重载**：改完静态文件立即生效，不用重启 nginx。改 nginx 配置才需要 `nginx -t && nginx -s reload`。

---

## 2. 技术栈

| 层 | 选择 | 原因 |
|---|---|---|
| 前端框架 | Vue 3.5.13 + Vue Router 4.5.0（直接引 ESM） | 无构建，改文件刷新即见；模板语法便于写 Demo |
| 样式 | Tailwind CSS Play CDN（运行时 JIT） | 零配置，支持 `tailwind.config = {...}` |
| 数据层 | 浏览器 localStorage + 内置种子 | MVP 零后端成本，评委打开即有数据 |
| 图片 | 上传后转 base64 存 localStorage（压缩到最大边 1200px, JPEG 0.82） | 同上 |
| AI | Mock（前端 JS 规则引擎） | 需求允许，且保留了 `analyzeListingImage` 签名便于换真模型 |
| 路由模式 | history mode | URL 更干净；nginx 已配 fallback |

**所有依赖已自托管在 `public/assets/vendor/`**——不走 CDN。这是吃过亏之后的教训（见 §7）。

---

## 3. 目录结构

```
/home/ec2-user/new-site/
├── PROJECT_BRIEF.md          ← 本文件
└── public/                   ← nginx root
    ├── index.html            ← 唯一 HTML 入口（importmap 在这里）
    └── assets/
        ├── styles.css        ← 自定义 CSS（不依赖 Tailwind @apply）
        ├── seed.js           ← 枚举 + 碳系数 + 12 条种子物品 + 5 个种子用户
        ├── store.js          ← reactive state + actions + calculateCarbonEstimate
        ├── mock-ai.js        ← analyzeListingImage（关键词规则）
        ├── components.js     ← Navbar / Footer / 各种 Badge / ContactModal / ConfirmCompleteDialog / Toast
        ├── app.js            ← createApp + router
        ├── pages/            ← 7 个路由页面组件
        │   ├── home.js
        │   ├── listings.js
        │   ├── listing-detail.js
        │   ├── publish.js    ← 最复杂（4 步分步表单）
        │   ├── me.js
        │   ├── impact.js
        │   └── admin.js
            ├── device.js     ← useDevice() composable（断点识别）
        ├── pages/
        │   └── me-listings.js  ← 原 me.js（"我的发布"），已重命名
        └── vendor/           ← 自托管依赖（**别再加 CDN**）
            ├── vue.esm-browser.prod.js          (163 KB)
            ├── vue-router.esm-browser.prod.js   ( 30 KB) ← 必须是 prod，dev 版依赖 @vue/devtools-api 会炸
            └── tailwind.js                      (407 KB)
```

---

## 4. 路由表

| Path | 组件 | 功能 |
|---|---|---|
| `/` | home.js | 桌面：Hero · 数据卡 · 分类入口 · 最新发布。移动：紧凑 Hero + 横滚胶囊 + 双列瀑布流 |
| `/listings` | listings.js | 桌面：多列下拉筛选。移动：吸顶搜索 + 排序胶囊 + **底部抽屉筛选** + 瀑布流 |
| `/listings/:id` | listing-detail.js | 桌面：两栏 sticky 侧栏。移动：**沉浸式全宽大图** + 浮层返回 + **底部吸底 CTA** |
| `/publish` | publish.js | 四步分步表单。移动端：MobileTopBar + 顶部进度条 + **底部吸底 主/次按钮**。支持 `?edit=l_xxx` |
| `/me` | me.js | **"我的中心"聚合页**（移动端主入口，tab 栏第 4 格）：身份卡 + 个人数据 + 功能列表（发布/看板/管理/切身份/重置）|
| `/me/listings` | me-listings.js | 我的发布管理：状态筛选 · 确认已流转 · 编辑 · 下架 |
| `/impact` | impact.js | 大数据卡 · 分类柱状图 · 最近流转 · 个人排行 · 估算说明 |
| `/admin` | admin.js | 全部发布表格 · 下架违规（仅 ADMIN 可见入口） · 重置数据 |

### 移动端布局关键决策

- **断点**：`<= 767px` 走移动端布局；**Pad (768–1023) 与 Desktop 共用桌面布局**（用户明确要求）
- **底 tab 栏**（`MobileTabBar`）：5 区位对称——首页 / 发现 / [+发布凸起] / 减碳 / 我的；管理端入口藏在"我的"页内且仅 ADMIN 可见
- **设备识别**：`assets/device.js` 导出 `useDevice()`，返回 `{width, height, isMobile, isTablet, isDesktop, isLayoutMobile}`，全局 reactive state + window resize 监听
- **body class 切换**：`app.js` 的 `watchEffect` 把 `body.is-mobile` 加/去，CSS 据此给 body 加底部 padding 让 tab 栏不遮内容
- **底部抽屉 `BottomSheet`**：移动端筛选等复杂交互的统一载体
- **Modal 自动退化**：`.modal-panel` + 媒体查询，桌面居中 card，移动端自动变底部 sheet（圆角只在顶部）
- **触摸相关**：`<meta viewport-fit=cover, user-scalable=no>`；tab-bar 与 fixed CTA 都用 `env(safe-area-inset-bottom)` 适配 iPhone 刘海屏

---

## 5. 数据模型

### localStorage keys（定义在 `seed.js` 的 `STORAGE_KEYS`）

| key | 内容 |
|---|---|
| `tx.users` | User[] |
| `tx.listings` | Listing[] |
| `tx.interests` | Interest[] |
| `tx.carbonRecords` | CarbonRecord[] |
| `tx.currentUserId` | 当前切换到的用户 id |
| `tx.seed.version` | 种子版本号，用于强制刷新 |

### 种子版本刷新机制

**改了 `SEED_USERS` / `SEED_LISTINGS` 的结构后，必须递增 `seed.js` 顶部的 `SEED_VERSION`**，否则已访问过的浏览器不会重灌种子。

```js
// seed.js
export const SEED_VERSION = '2026-04-24-01';   // ← 改结构后改这里
```

初始化逻辑在 `store.js` 的 `initIfNeeded()`：版本不同则清空并重播种子，同时把 `currentUserId` 重置成 `u_alice`。

### 主要实体字段

见 `seed.js` 的 `SEED_LISTINGS` 第一条 `l_001` 作为 canonical 样本；`foodInfo` 结构见 `l_007`。

状态枚举：`DRAFT | ACTIVE | COMPLETED | EXPIRED | REMOVED`。

---

## 6. 碳减排估算

### 配置位置：`seed.js`

```js
export const CATEGORIES = [
  { key: 'BOOKS',       mode: 'per_kg',   factor: 1.3, defaultWeight: 0.8, substitution: 0.7 },
  { key: 'CLOTHING',    mode: 'per_item', factor: 8.0, substitution: 0.7 },
  // ... 共 7 项主分类
];
export const FOOD_SUBCATS = {
  COMMON: { factor: 2.5 }, MEAT: { factor: 8.0 },
  VEG:    { factor: 0.8 }, SNACK: { factor: 2.0 },
};
```

### 算法：`store.js` 的 `calculateCarbonEstimate(input)`

```
非食物 per_kg:   weight × factor × substitution
非食物 per_item: factor × substitution
食物:           foodInfo.weightKg × FOOD_SUBCATS[foodType].factor × 1.0
```

所有结果 `round1`（保留一位小数）。前端文案**必须**带"预计 / 估算"字样——这是需求硬约束。

### 关键规则

- 只有 `COMPLETED` 状态的物品会生成 `CarbonRecord` 记入总数据
- `EXPIRED / REMOVED / DRAFT / ACTIVE` 都不计入
- 发布/编辑时会自动重算碳减排（`publish.js` 的 `recalcCarbon()` watch 了 category/weight/foodType）

---

## 7. 已踩过的坑（避免再犯）

### ❌ CDN 引用
一开始用 `cdn.tailwindcss.com` + `unpkg.com`，**国内家宽访问这两个域名普遍超时/被墙**，表现为打开页面白屏。
→ 已把 3 个依赖全部下载到 `public/assets/vendor/`。**后续别再引外部 CDN**。

### ❌ vue-router 的 dev 版
下载时顺手拉了 `vue-router.esm-browser.js`（dev 版），它会 `import from '@vue/devtools-api'`，importmap 没映射这个裸模块名，页面直接炸。表现同样是白屏 + console "Failed to resolve module specifier @vue/devtools-api"。
→ **必须用 `vue-router.esm-browser.prod.js`**。prod 版不引用 devtools。

### ❌ Tailwind `@apply` 在外部 CSS
Play CDN 的运行时 JIT 不解析外部 CSS 里的 `@apply`。
→ styles.css 里全改成原生 CSS，需要原子类时直接写在组件 class 上。

### ⚠️ Tailwind Play CDN 的 console warning
`cdn.tailwindcss.com should not be used in production` 这句是 Play CDN 代码里**内置**的警告，与实际是否走 CDN 无关，**即便本地加载 tailwind.js 仍会打印**。可以忽略。

---

## 8. Mock AI

### 实现位置：`mock-ai.js` 的 `analyzeListingImage(input)`

```js
input = { images, title, description, category, estimatedWeightKg, foodInfo }
→ await 700ms 模拟延迟
→ 返回 { titleSuggestion, category, isFood, condition, estimatedWeightKg,
         descriptionSuggestion, estimatedCarbonSavedKg, confidence, assumptions, foodInfoSuggestion }
```

规则：先看用户传的 `category`，没有则按 title+description 关键词命中 `KEYWORD_RULES`；食物二级分类走 `FOOD_SUBCAT_RULES`；置信度随图片数和文字长度增长，封顶 0.95。

### 换真实 AI 时改什么

1. 保持 `analyzeListingImage` 签名（入参、返回 schema 见需求文档 §7.2）不变
2. 把函数体换成 `fetch('/api/ai/analyze-listing', { method:'POST', body: JSON.stringify(input) })`
3. 在 nginx `new-site.conf` 加一段 `location /api/ { proxy_pass http://127.0.0.1:<后端端口>; }`
4. 后端可用任何语言，`publish.js` 的调用方完全不用改

---

## 9. 业务红线（**不可违反**）

- ❌ 不写 "购物车 / 订单 / 下单 / 立即支付 / 付款 / 物流 / 仲裁"
- ✅ 按钮文案只能是 "我想要 / 联系发布者 / 约定交接 / 确认已流转"
- ✅ 所有碳数据文案必须带 "预计" 或 "估算"
- ✅ 食物类详情页**必须**展示 `FoodSafetyNotice`
- ✅ 所有页面**必须**能跑出 `PaymentBoundaryNotice`（首页/详情都已放）

违反以上任何一条会直接破坏需求文档里的"展示验收"标准。

---

## 10. Demo 验收路径（按这个顺序演示）

1. 打开首页 → 讲项目定位
2. 浏览最新发布 → 说明不同交易方式和预计减碳标签
3. 进入食物详情（如 `/listings/l_007`）→ 展示最晚领取时间和食品安全提示
4. 点"发布物品" → 上传图片 → AI 识别 → 修改字段（改价格为 0 或 10）→ 发布
5. 进入"我的发布" → 点"✅ 确认已流转"
6. 回到"减碳看板" → 总减碳数据和柱状图已增加

用右上角"身份切换"演示发布者/认领者/管理员不同视角。

---

## 11. 调试 & 测试工具

### Playwright 冒烟（已验证可用）

```bash
# playwright + arm64 chromium 装在 /tmp
# 测试脚本：/tmp/pw-smoke.js（遍历 8 个路由，抓 console error / pageerror / reqfail）
node /tmp/pw-smoke.js
```

### 浏览器 DevTools Console 便捷入口

```js
__store.state                 // 看当前所有数据
__store.actions.createListing(…)
__store.reset()               // 清空 localStorage 并刷新
```

### 强制重置演示数据

两种方式任选：
- `/admin` 页面点"重置演示数据"按钮
- Console: `localStorage.clear(); location.reload()`

---

## 12. 完成度 & 下一步

| 需求优先级 | 状态 |
|---|---|
| P0 全部 | ✅ 完成（首页/列表/详情/发布+Mock AI/我的/看板/管理） |
| P1 · 我的发布 | ✅ |
| P1 · 联系弹窗 | ✅（ContactModal） |
| P1 · 简管理员 | ✅ |
| P1 · 分类图表 | ✅（看板的分类柱状图） |
| P1 · 环保积分 | ⬜ 未做（User 模型有 `ecoPoints` 字段预留，但没在 UI 展示） |
| P1 · 用户切换 | ✅（Navbar 右上角） |
| P2 · 全部 | ⬜ 未做（接真 AI / SSO / 双方确认 / 扫码 / 聊天 / 举报审核 / 报告导出） |

### 可能的后续 TODO

1. 环保积分（P1 残留）：`User.ecoPoints` 在确认流转时 +N，看板加"积分排行"
2. 接真 AI：按 §8 步骤替换
3. 需要登录态时：在 store 加 session 概念，把 Navbar 的身份切换下拉换成登录页
4. 数据超 5MB localStorage 上限：可选改为 IndexedDB 或加个极简后端（SQLite + Express）

---

## 13. Memory 引用

`~/.claude/projects/-home-ec2-user/memory/project_tanxun_campus.md` 是简短指针，**本文件才是完整任务档案**。新对话中如果 memory 指引到这里，请直接读本文件。
