# Phase 1: Deploy + Backend Verification — Plan

**Phase:** 01-deploy-backend-verification
**Created:** 2026-05-06
**Plans:** 2
**Status:** Ready for execution

---

## Plan 1-1: Netlify 站点配置与首次部署

**Goal:** 将代码仓库链接到 Netlify，配置环境变量，完成首次部署

**Tasks:**

### Task 1: 链接仓库并配置 Netlify
- **type:** manual
- **what:** 在 Netlify Dashboard 创建新站点，连接 GitHub 仓库 `Yuuqq/Eco_Trace`
- **config:**
  - Build command: `echo 'No build step needed'`（或留空）
  - Publish directory: `new-site/public`
  - Functions directory: `netlify/functions`
- **验证:** Netlify 识别到 `netlify.toml` 并自动应用配置

### Task 2: 配置环境变量
- **type:** manual
- **what:** 在 Netlify Dashboard → Site Settings → Environment Variables 添加：
  - `TURSO_DATABASE_URL` = `libsql://eco-ppa96.aws-us-east-2.turso.io`
  - `TURSO_AUTH_TOKEN` = _(从 .env 文件获取)_
  - `ZHIPUAI_API_KEY` = _(从 .env 文件获取)_
- **验证:** 环境变量出现在 Netlify 站点设置中

### Task 3: 触发首次部署并确认
- **type:** shell
- **what:** `git push origin master` 触发 Netlify 自动部署
- **验证:**
  - Netlify 部署成功（状态变绿）
  - 站点 URL 可访问（默认 `xxx.netlify.app`）
  - 首页 HTML 加载正常
  - 静态资源（JS/CSS/图片）加载正常

**Success Criteria:**
- [ ] 站点在 Netlify 上部署成功
- [ ] 首页和 SPA 路由正常工作
- [ ] 环境变量已配置

---

## Plan 1-2: API 端点烟雾测试

**Goal:** 编写自动化测试脚本验证全部 16 个 API 端点在生产环境正常工作

**Tasks:**

### Task 4: 编写烟雾测试脚本
- **type:** code
- **file:** `tests/api-smoke.mjs`
- **what:** 编写 Node.js 脚本，测试以下端点：

| # | Method | Path | 预期行为 |
|---|--------|------|----------|
| 1 | OPTIONS | /api/listings | 返回 204 + CORS 头 |
| 2 | GET | /api/listings | 返回 200 + `{ listings: [...], total: 20 }` |
| 3 | GET | /api/listings?category=BOOKS | 返回 BOOKS 类别列表 |
| 4 | GET | /api/listings?q=矿泉水 | 返回搜索结果 |
| 5 | OPTIONS | /api/listing | 返回 204 |
| 6 | GET | /api/listing?id=l_001 | 返回物品详情 + owner nickname |
| 7 | GET | /api/listing?id=nonexistent | 返回 404 |
| 8 | OPTIONS | /api/listings/create | 返回 204 |
| 9 | POST | /api/listings/create | 创建测试物品，返回 id + carbonSavedKg |
| 10 | PUT | /api/listings/update?id={新id} | 更新标题，返回 `{ updated: true }` |
| 11 | DELETE | /api/listings/delete?id={新id} | 状态变 REMOVED |
| 12 | POST | /api/listings/{id}/complete | 完成 l_001，验证 carbon_record 创建 |
| 13 | GET | /api/dashboard | 返回 totalCarbonSaved > 0 |
| 14 | GET | /api/carbon/stats | 返回 totalCarbonSavedKg |
| 15 | GET | /api/users | 返回 5 个用户 |
| 16 | GET | /api/user/profile | 返回当前用户信息 |

- **输出格式:** 每个端点打印 ✓/✗ + 状态码 + 响应时间
- **结束:** 汇总通过/失败数量

### Task 5: 运行烟雾测试并修复问题
- **type:** shell
- **what:** `node tests/api-smoke.mjs` 运行测试
- **如果端点失败:**
  1. 检查 Netlify Function 日志（Dashboard → Functions 标签）
  2. 定位具体错误（缺少环境变量、bundle 失败、运行时错误）
  3. 修复代码或配置
  4. 重新部署并重新测试
- **验证:** 全部 16 个端点测试通过（或失败数 = 0）

### Task 6: 清理测试数据
- **type:** code
- **what:** 删除烟雾测试创建的临时物品和碳记录（如有必要），保持种子数据干净
- **验证:** 种子数据仍为 5 用户 + 20 物品

**Success Criteria:**
- [ ] 烟雾测试脚本覆盖全部 16 个端点
- [ ] 全部端点在生产环境返回预期状态码和数据
- [ ] CORS preflight 正常工作
- [ ] 碳引擎返回正确的系数值（非 undefined/NaN）
- [ ] Listing 完整生命周期验证：创建 → 更新 → 完成 → 碳记录生成

---

## Verification Checklist

- [ ] DEPLOY-01: 站点部署到 Netlify，netlify.toml 生效
- [ ] DEPLOY-02: 3 个环境变量已配置
- [ ] DEPLOY-03: 全部 16 个端点响应正确
- [ ] DEPLOY-04: CORS OPTIONS 返回 204
- [ ] DATA-01: Turso schema 已应用
- [ ] DATA-02: 种子数据可被 API 返回
- [ ] CARBON-01: 碳引擎返回正确值
- [ ] CARBON-03: 完成物品时生成碳记录
- [ ] LIFE-02: 食物过期端点可用（POST /api/listings/check-expiry）
- [ ] LIFE-03: 完成端点正常工作（ACTIVE → COMPLETED）
- [ ] LIFE-04: 删除端点正常工作（状态 → REMOVED）
