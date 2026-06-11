# Bugs

**Project:** 碳循校园 EcoTrace
**Created:** 2026-05-07
**Updated:** 2026-05-08
**Status:** 0 open, 7 fixed (待部署验证)

报告自用户在生产环境（https://stu-eco-trace.netlify.app）的实测反馈。

---

## BUG-001 · AI 识别结果被缓存，重新上传 / 重新识别无效

**Severity:** High（影响核心发布流程的多次发布场景）
**Reported:** 2026-05-07 by user
**Area:** Frontend — `publish.js` 发布流程 Step 1 → Step 2
**Status:** ✅ fixed 2026-05-07（待部署验证）

### 现象
用户上传第一件物品 A，AI 识别正确并填好标题/分类/描述等字段。
用户接着想发布第二件物品 B：

- 在 Step 1 重新选择了 B 的图片（点击 "← 重新上传"），或
- 在 Step 2 直接点击 "重新识别"

→ 结果：识别出来的标题、分类、描述、新旧程度仍然显示物品 A 的内容，AI 返回的物品 B 信息没有被采纳。

### 根因
`@e:/Research/Eco_Trace/new-site/public/assets/pages/publish.js:128-174` 的 `runAI()`：

```@e:/Research/Eco_Trace/new-site/public/assets/pages/publish.js:151-159
        // 仅在字段为空时采纳 AI 建议，避免覆盖用户输入
        if (!form.title) form.title = res.titleSuggestion;
        if (!form.category) form.category = res.category;
        if (!form.description) form.description = res.descriptionSuggestion;
        if (!form.condition) form.condition = res.condition;
        if (!form.estimatedWeightKg) form.estimatedWeightKg = res.estimatedWeightKg;
        form.estimatedCarbonSavedKg = res.estimatedCarbonSavedKg;
        form.aiConfidence = res.confidence;
        form.aiAssumptions = res.assumptions;
```

`if (!form.X)` 守卫的本意是 **保护用户已经手动修改过的字段**。但它无法区分两种来源：

1. 用户手动修改过的值（应保护）
2. 上一轮 AI 识别填进去的值（应该被新一轮覆盖）

第一次 AI 跑完后 `form.title` 等字段已经有值，`!form.title` 一直为 false，所以后续任何 `runAI()` 调用都被悄悄丢弃。

此外，"重新上传"按钮 `@e:/Research/Eco_Trace/new-site/public/assets/pages/publish.js:380` 只是 `step=1`，**没有清空** `form.title / form.description / form.images / form.aiConfidence` 等字段，于是返回 Step 1 后表单仍带着上一件物品的状态。

### 建议修复（最小改动）

方案 A（推荐）：用一个 `aiOverridable` 状态记录哪些字段尚未被用户手动改过。
- AI 填字段时，把字段标记为 "AI 填写"。
- 输入框 `@input` 触发时，把字段标记为 "用户编辑"。
- `runAI()` 只覆盖标记为 "AI 填写" 的字段。

方案 B（最简单，符合用户预期）：`runAI()` 直接覆盖 AI 派生字段（标题、分类、描述、新旧程度、重量、碳估算、置信度、依据），不再守卫。
- 用户在 Step 3 后手动修改的内容已经基本不会触发 `runAI()`，因为 Step 3 没有重新识别按钮。
- "重新识别" 的语义本来就是 "丢弃旧结果，用新图片重算"。

方案 C（配合 A/B）：`prevAction` 在 Step 2 返回 Step 1 时，重置 AI 派生字段：
```js
{ label: '← 重新上传', handler: () => {
    form.title = ''; form.description = ''; form.category = '';
    form.estimatedWeightKg = ''; form.estimatedCarbonSavedKg = 0;
    form.aiConfidence = undefined; form.aiAssumptions = [];
    aiRan.value = false;
    step.value = 1;
}}
```

最低成本：**方案 B + C**（去掉守卫 + "重新上传"清空 AI 字段）。

### 验证步骤
1. 进入 `/publish`
2. 上传图片 A（如教材） → 下一步 → 确认识别为 "BOOK / 教材"
3. 点击 "← 重新上传" → 删除已有图片 → 上传图片 B（如衣服） → 下一步
4. **预期：** 识别结果显示 "CLOTHING / 衣物"
5. **当前：** 仍显示 "BOOK / 教材"

---

## BUG-002 · 点击"确认发布"后跳转到 `/listings/undefined`，列表里看不到新发布

**Severity:** Critical（用户感知发布失败）
**Reported:** 2026-05-07 by user
**Area:** Frontend — `publish.js` submit() + `store.js` createListing()
**Status:** ✅ fixed 2026-05-07（待部署验证）

### 现象
用户在 Step 4 点击"确认发布"。

- Toast 显示 "发布成功 · 预计可节约 **undefined** kg CO₂e"
- 浏览器跳转到 `/listings/undefined`，详情页空白或报错
- 回到首页/我的发布页面看不到刚发布的物品（或刷新后消失）

### 根因
两层叠加的问题。

#### 根因 1：`submit()` 没有 `await` 异步的 `createListing`

`@e:/Research/Eco_Trace/new-site/public/assets/pages/publish.js:214-251` 的 `submit()`：

```@e:/Research/Eco_Trace/new-site/public/assets/pages/publish.js:242-250
      if (editing) {
        actions.updateListing(editing.id, payload);
        toast('已更新');
        router.push('/listings/' + editing.id);
      } else {
        const created = actions.createListing(payload);
        toast('发布成功 · 预计可节约 ' + created.estimatedCarbonSavedKg + ' kg CO₂e');
        router.push('/listings/' + created.id);
      }
```

但 `@e:/Research/Eco_Trace/new-site/public/assets/store.js:217` 的 `createListing` 是 **async**：

```@e:/Research/Eco_Trace/new-site/public/assets/store.js:217-243
  async createListing(draft) {
    const now = new Date().toISOString();
    const listing = {
      id: uid('l'),
      ownerId: state.currentUserId,
      ...
    };
    if (await isApiMode()) {
      try {
        const res = await apiCreateListing(draft);
        if (res?.id) listing.id = res.id;
        ...
      } catch (e) {
        console.warn('[store] API createListing failed:', e.message);
      }
    }
    state.listings.unshift(listing);
    persist();
    return listing;
  },
```

→ `created` 是一个 **Promise**，不是 listing 对象。
→ `created.id === undefined`，于是 `router.push('/listings/undefined')`。
→ `created.estimatedCarbonSavedKg === undefined`，于是 toast 文案错乱。

`updateListing` 同样没 await，但因为 `editing.id` 在本地已知，跳转地址是对的，所以编辑场景没暴露这个 bug。

#### 根因 2：API 创建失败时本地条目会被 `syncFromApi()` 抹掉

即便 `submit()` 加了 `await`，仍存在第二层问题：

- 如果 `apiCreateListing` 抛错（如 401 token 过期、网络故障），`store.js` 只是 `console.warn`，然后把本地生成的 listing（带本地 uid）push 进 `state.listings`。
- 用户跳到详情页能看到（本地 state 里有），但下一次刷新时 `@e:/Research/Eco_Trace/new-site/public/assets/store.js:144-170` 的 `syncFromApi()` 用服务端数据**整体覆盖** `state.listings`，本地未持久化的条目消失 → 用户感知"发布不见了"。

```@e:/Research/Eco_Trace/new-site/public/assets/store.js:147-166
    const data = await fetchListings({ limit: 100 });
    if (data?.listings) {
      state.listings = data.listings.map(l => ({ ... }));
      persist();
    }
```

### 建议修复

#### Fix 1（必须）：`submit()` 改为 async + await

```js
async function submit() {
  if (step3Errors.value.length) {
    toast(step3Errors.value[0], 'warn');
    return;
  }
  ensurePlaceholder();
  const payload = { ... };
  try {
    if (editing) {
      await actions.updateListing(editing.id, payload);
      toast('已更新');
      router.push('/listings/' + editing.id);
    } else {
      const created = await actions.createListing(payload);
      toast('发布成功 · 预计可节约 ' + created.estimatedCarbonSavedKg + ' kg CO₂e');
      router.push('/listings/' + created.id);
    }
  } catch (e) {
    toast('发布失败：' + e.message, 'danger');
  }
}
```

主按钮也要进入 loading 态，避免用户重复点击。

#### Fix 2（建议）：`createListing` API 失败时显式抛错

`store.js` 当前吞掉 API 错误并保留本地副本，会造成"看起来成功，实际上没成功"。建议：

- API 模式下，API 调用失败时 **抛错** 而不是退化到 local-only。
- 或：显式标记本地未同步条目（`pendingSync: true`），并在 `syncFromApi` 时合并而非覆盖。
- 或：提供 toast 提醒用户"已保存到本地，未同步到服务器"。

最小改动建议：API 模式下 `createListing` 失败直接 throw，让 `submit()` 的 try/catch 给出明确错误。

### 验证步骤
1. 登录任意用户
2. 进入 `/publish`，走完 4 步流程，点击"确认发布"
3. **预期：** Toast 显示具体减碳值；URL 跳到 `/listings/<具体ID>`；首页 / "我的发布" 能看到该条目；刷新后仍在
4. **当前：** Toast 显示 "undefined kg"；URL 是 `/listings/undefined`；列表无新条目（或刷新后消失）

---

## 修复优先级建议

| Bug | Severity | 建议优先级 | 修复 phase |
|-----|----------|-----------|-----------|
| BUG-002 | Critical | P0（demo 阻塞） | Phase 4 子任务 4-1.1 |
| BUG-001 | High | P1（影响重复发布） | Phase 4 子任务 4-1.2 |

两个 bug 都集中在 `publish.js`，建议合并为一次 commit / 一个 PR。

---

## 修复记录 · 2026-05-07

### 已修改文件

- `@e:/Research/Eco_Trace/new-site/public/assets/pages/publish.js`
- `@e:/Research/Eco_Trace/new-site/public/assets/store.js`

### BUG-001 修复要点
1. `runAI()` 入口处检测 `aiRan.value`，若为 true 则清空 `form.title / description / category / estimatedWeightKg / aiConfidence / aiAssumptions`，再发请求给 AI（避免旧文本污染输入提示）。
2. AI 返回值直接覆盖 form 字段（移除 `if (!form.X)` 守卫），用 `?? ''` / `?? 0` 兜底防止类型错乱。
3. 增加 `if (aiLoading.value) return;` 防止重复点击导致并发识别。

### BUG-002 修复要点
1. **`publish.js submit()` 改为 async**，对 `actions.createListing` / `actions.updateListing` 都加 `await`；外层 `try/catch` 捕获异常并 toast 反馈；新增 `submitting` ref 防重复提交。
2. **`store.js createListing` / `updateListing`**：API 模式下若服务端调用失败，**throw** 而不是 `console.warn` 后静默返回本地条目，杜绝"假成功 + 下次同步消失"的鬼影。`updateListing` 也调整为 API 成功后再 `Object.assign`，避免本地先改但服务端没改的不一致。
3. UI 层在 Step 4 桌面版按钮 + 移动端 fixed CTA 都加上 `submitting` 的 disabled / loading 视觉反馈。
4. 防御性断言：`if (!created || !created.id) throw` —— 即便 store 返回异常对象也不会跳到 `/listings/undefined`。

### 未做的事（备选项）
- `syncFromApi()` 用本地 `pendingSync` 标记合并而非整体覆盖：当前 throw 方案已经避免了 happy path 的鬼影问题，合并方案留待真有"离线发布"需求时再做。
- "重新识别" 弹确认框（保护用户在 Step 3 手填的标题）：判断当前用户场景下成本大于收益，不做。

### 验证清单
- [ ] 部署到 Netlify
- [ ] 注册新用户 → 发布物品 A → 跳转到正确的 `/listings/<id>`，详情页可见
- [ ] 同一会话再次进入 `/publish` → 上传图片 B → 识别结果是 B 的内容（非 A）
- [ ] 在 Step 2 点击"重新识别" → 字段刷新为新一轮识别结果
- [ ] 故意断网 / 清 token 后发布 → 看到红色 toast "发布失败：..." 而不是假成功
- [ ] 编辑模式（`/publish?edit=<id>`）→ 保存修改正常工作

---

## BUG-003 ~ BUG-007 · AI 识别失败（部分用户）+ 配套修复

**Reported:** 2026-05-08 by user feedback
**Area:** Frontend API probe, Service Worker, AI client, Image compression
**Status:** ✅ fixed 2026-05-08（待部署验证）

### BUG-003 · API 探测结果永久缓存，部分用户被锁定为 mock 模式

**Severity:** Critical
**File:** `new-site/public/assets/api-adapter.js` lines 99-113

`_apiAvailable` 只探测一次。若首次 `GET /api/listings` 因服务器冷启动、网络抖动等原因失败，`_apiAvailable` 锁定为 `false`，后续所有 AI 调用静默降级到 mock（mock 不分析图片）。

**Fix:** 加 30 秒 TTL，过期自动重新探测。
```js
let _apiCheckedAt = 0;
const API_PROBE_TTL = 30_000;
async function ensureApi() {
  if (_apiAvailable === null || Date.now() - _apiCheckedAt > API_PROBE_TTL) {
    _apiAvailable = await probeApi();
    _apiCheckedAt = Date.now();
  }
  return _apiAvailable;
}
```

### BUG-004 · Service Worker 缓存了 POST 请求

**Severity:** High
**File:** `new-site/public/sw.js` lines 54-69

`/api/ai/analyze` 的 POST 请求被 Service Worker 缓存。网络失败时返回上次缓存的旧结果。POST 请求语义上不应被缓存。

**Fix:** POST/PUT/DELETE 直接透传，不经过缓存逻辑。缓存版本升至 v3 强制刷新。

### BUG-005 · image-utils.js 压缩工具从未被使用（死代码）

**Severity:** High
**File:** `new-site/public/assets/image-utils.js`, `new-site/public/assets/pages/publish.js`

`compressForApi()` (800px/0.7) 存在但从未被 import。图片以 1200px/0.82 发送到后端，部分图片超过 4MB 限制被拒绝。

**Fix:** `publish.js` 的 `runAI()` 在调 API 前先 `compressForApi()` 压缩图片。

### BUG-006 · ZhipuAI 模型名错误（spec 与实现不符）

**Severity:** High (已验证无影响)
**File:** `netlify/functions/_lib/ai-client.js` line 37

任务规格要求 `glm-4v-flash-plus`，实际使用 `glm-4v-flash`。经实测：
- `glm-4v-flash-plus` 不存在（API 返回 1211 错误）
- `glm-4v-flash` 正常工作，支持 base64 图片
- `glm-4.6v-flash` 存在但限流严重（~60% 请求失败）

**Fix:** 保持 `glm-4v-flash`，更新文档说明。

### BUG-007 · glm-4v-flash 只支持单图，多图请求被静默忽略

**Severity:** High
**File:** `netlify/functions/_lib/ai-client.js` lines 38-44

原代码 `...images.map(url => ...)` 发送所有图片，但模型只处理第 1 张，其余被忽略。

**Fix:** 重构 `ai-client.js`：每张图独立调用 `glm-4v-flash`（并行 `Promise.allSettled`），`mergeResults()` 按置信度选取 + 分类投票提升置信度。5 张图并行约 4.5 秒完成。

### 修改文件清单

- `new-site/public/assets/api-adapter.js` — API probe TTL
- `new-site/public/assets/pages/publish.js` — 图片压缩 + mock 降级警告 toast
- `new-site/public/sw.js` — POST 不缓存 + 版本升级 v3
- `netlify/functions/_lib/ai-client.js` — 单图并行 + 结果合并
- `AGENTS.md` — 模型名文档更正
- `.planning/codebase/ARCHITECTURE.md` — 架构文档更新
- `.planning/codebase/STACK.md` — 技术栈文档更新
- `.planning/codebase/CONCERNS.md` — concerns 更新


