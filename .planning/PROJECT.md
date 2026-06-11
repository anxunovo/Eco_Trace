# 碳循校园 EcoTrace

## What This Is

汕头大学校园二手漂流与碳减排估算 Web 平台。学生发布闲置物品 / 剩余食品 / 可再利用资源，平台用 AI 多模态识别物品类型，通过权威碳系数数据库自动估算每次流转的碳减排量。比赛参赛项目（节能减排科技作品类），面向桑浦山校区 / 东海岸校区真实场景部署。

## Core Value

每一次闲置物品成功流转 → 可视化的碳减排贡献。平台核心是资源再利用信息撮合 + 减碳量化，不是电商交易。

## Current Milestone: v2.2 Green Impact & Education

**Goal:** 三个面向比赛评委的核心功能，突出可量化减碳成效与环保教育价值

**Target features:**
- 碳贡献报告 — 个人/全校减碳报告，等效换算（树/行驶/电），可导出
- 环保知识/节能贴士 — 内嵌教育内容，覆盖减碳常识与校园场景
- 碳足迹计算器 — 多场景（出行/用电/饮食）日常碳足迹估算，扩展减碳维度

## Current State

**Shipped:** v2.1 Engagement Features (2026-05-09)
- Phase 10: Achievement system (eco_points + 6 badges, auto-awarded)
- Phase 11: QR scan quick publish (camera → AI → 1-tap)
- 12/12 requirements complete

**Previous:** v2.0 Real Campus Platform (2026-05-08)
- 2 phases (8-9), 6 plans, 8/9 UAT criteria PASS
- Carbon dashboard: trend line, category doughnut, campus bar chart
- PWA: Service Worker + IndexedDB + install prompt
- AI recognition: ZhipuAI glm-4v-flash with multi-image parallel analysis
- 216 files, ~45K LOC across frontend + backend

## Requirements

### Validated

- ✓ 响应式 SPA 架构（Vue 3 + Vue Router + Tailwind）— Phase 0
- ✓ 7 路由页面（首页/列表/详情/发布/我的/碳看板/管理）— Phase 0
- ✓ 4 步分步发布表单 + AI 识别（真实 API + mock 降级）— Phase 0
- ✓ 物品分类浏览 / 搜索 / 筛选 — Phase 0
- ✓ 碳减排估算公式（单通道，静态系数）— Phase 0
- ✓ localStorage 数据层 + 种子数据 — Phase 0
- ✓ 移动端优先响应式布局 — Phase 0
- ✓ 身份切换（发布者 / 认领者 / 管理员）— Phase 0
- ✓ 食物保质期 + 过期自动标记 — Phase 0
- ✓ Netlify Functions 后端（16 个 API 端点）— Phase 0 (Jules)
- ✓ Turso 数据库集成（schema + 种子数据：5 users, 20 listings, 10 interests, 10 carbon_records, 11 coefficients）— Phase 0
- ✓ 前端 API adapter（自动探测 + localStorage 回退）— Phase 0
- ✓ ZhipuAI GLM-4v-Flash 集成（图片识别走真实 API，限流时降级 mock）— Phase 0
- ✓ 碳系数数据库引擎（carbon-engine.js）— Phase 0
- ✓ 校区/学校真实信息（汕头大学、桑浦山校区、东海岸校区）— Phase 0
- ✓ SPA 路由（netlify.toml redirect 已验证）— Phase 0
- ✓ Netlify 部署成功（stu-eco-trace.netlify.app）— Phase 1
- ✓ 用户注册/登录系统 + token 认证 — Phase 2
- ✓ 前端完整 API 集成（所有页面连接后端）— Phase 3

### Validated (v2.0)

- ✓ 校园碳减排总看板（趋势图 + 分类饼图 + 校区对比）— Phase 8
- ✓ 首页数据卡片升级（滚动数字动画 + 实时统计）— Phase 8
- ✓ PWA 离线可用（Service Worker + IndexedDB）— Phase 9
- ✓ AI 识别 bug 修复（API probe TTL / 图片压缩 / 多图并行）— Phase 8-9 hotfix

### Validated (v2.0+)

- ✓ 排行榜（个人减碳排名 Top 10）— Phase 8 (impact.js)
- ✓ 社交分享卡片（html2canvas 生成 PNG）— Phase 8-9 hotfix (impact.js)
- ✓ 个人碳足迹详情（分类减碳 + 排名 badge）— Phase 8-9 hotfix (me.js)

### Validated (v2.1)

- ✓ 成就系统（6 种 badge + eco_points 积分）— Phase 10
- ✓ 扫码快速发布（摄像头拍照 → AI 识别 → 一键发布）— Phase 11

### Active (v2.2)

- [ ] 碳贡献报告（个人/全校减碳报告 + 等效换算 + 可导出）
- [ ] 环保知识/节能贴士模块（内嵌教育内容）
- [ ] 碳足迹计算器（多场景日常碳足迹估算）

### Deferred (post-v2.2)

- 物品流转效率分析（发布→完成耗时分布）
- 数据导出（CSV/JSON）

### Deferred

- 物品流转效率分析（发布→完成耗时分布）
- 数据导出（CSV/JSON）
- Web Push 推送通知（需 Netlify Pro）

### Out of Scope

- 微信支付/支付宝/银行卡接入 — 平台只做信息撮合，不介入资金
- 物流系统 — 线下自取/面交，零物流碳排放
- 即时聊天 — v2 不做，deferred to Phase 12
- 学籍认证 — Demo 用模拟身份
- 食品安全担保 — 只做信息提示
- 精确碳审计 — 数据为估算值，用于展示
- 前端构建系统迁移 (Vite/TypeScript) — deferred to Phase 10
- 图片存储迁移 (base64 → 对象存储) — deferred to Phase 10
- 评价系统 / 举报功能 — deferred to Phase 11

## Context

- **比赛背景**: 节能减排科技作品类，需要展示完整技术架构 + 可运行 Demo
- **部署平台**: Netlify 免费版 — stu-eco-trace.netlify.app（注意：额度有限，避免频繁部署）
- **数据库**: Turso（libSQL）— `libsql://eco-ppa96.aws-us-east-2.turso.io`，种子数据已加载
- **AI**: 智谱 GLM-4v-Flash（从 4.6v-flash 切换，后者被限流），API Key 已配置在 Netlify env
- **前端**: Vue 3 无构建方案（ESM 直接引入），保持不引入 Vite/Webpack
- **校区信息**: 汕头大学 · 桑浦山校区 / 东海岸校区
- **当前进度**: v2.0 已发布（Phase 8+9 完成），准备 v2.1 规划

## Constraints

- **Tech Stack**: Vue 3 ESM + Netlify Functions + Turso，不引入构建工具（v2.0 保持）
- **Budget**: Netlify 免费版 + Turso 免费版 + 智谱免费 API，零成本运营
- **Deployment**: stu-eco-trace.netlify.app，注意 Netlify 额度限制

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Netlify Functions 作为后端 | 零服务器管理，前后端同平台部署 | ✓ 16 个端点已实现并上线 |
| Turso 作为数据库 | SQLite 兼容，云持久化，与 serverless 搭配好 | ✓ Schema + 种子数据已上线 |
| 保留 Vue 3 无构建方案 | 不引入 Vite/Webpack，保持开发简单性 | ✓ 前端不变 |
| 智谱 GLM-4v-Flash | 免费多模态识别，支持 base64 图片；从 4.6v-flash 切换（限流） | ✓ ai-client.js 已实现 |
| 多图并行分析 | glm-4v-flash 限单图，每图独立请求 + 结果合并 | ✓ 5 张图 ~4.5s |
| Service Worker v3 | POST 不缓存 + 30s API probe TTL | ✓ 修复 5 个 bug |
| Adapter pattern 前端集成 | api-adapter.js 自动探测 API 可用性，无 API 时回退 localStorage | ✓ 已集成 |
| db.js 直接 HTTP API | @tursodatabase/serverless 客户端库 1.1.3 不兼容，改用 fetch 直连 Turso HTTP API | ✓ 已验证 |
| SPA redirect 无 Role condition | `conditions = { Role = ["none"] }` 导致本地 404 | ✓ 已移除 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-09 — v2.2 milestone started (Green Impact & Education)*
