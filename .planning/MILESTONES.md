# Milestones

## v2.1 Engagement Features

**Shipped:** 2026-05-09
**Phases:** 10-11 | **Plans:** 2 | **Tasks:** 12

**Delivered:** 成就徽章系统（eco_points + 6 种 badge 自动授予）+ 扫码快速发布（摄像头拍照 → AI 识别 → 一键发布）

**Key accomplishments:**
1. Achievement system: 6 badges with automatic milestone detection
2. Badge shelf UI on "me" page with earned/locked states
3. QR scan quick publish: camera → AI → simplified form → 1-tap submit
4. getUserMedia camera with front/back switch and file picker fallback
5. Badge toasts on listing creation and completion

**Archived:** `.planning/milestones/v2.1-ROADMAP.md`, `.planning/milestones/v2.1-REQUIREMENTS.md`

---

## v2.0 Real Campus Platform

**Shipped:** 2026-05-08
**Phases:** 8-9 | **Plans:** 6 | **Tasks:** 17

**Delivered:** 数据可视化看板（趋势图 + 分类饼图 + 校区对比）+ PWA 离线支持 + AI 识别 bug 修复

**Key accomplishments:**
1. Carbon stats API with period filter, daily trend, campus comparison
2. Chart.js interactive charts (TrendChart, CategoryDoughnut, CampusBar)
3. Homepage animated number counters (ease-out cubic rAF)
4. PWA: Service Worker precache + IndexedDB offline + install prompt
5. AI recognition: multi-image parallel analysis + 5 bug fixes

**Archived:** `.planning/milestones/v2.0-ROADMAP.md`, `.planning/milestones/v2.0-REQUIREMENTS.md`

---

## v1.0 MVP

**Shipped:** 2026-05-07
**Phases:** 1-4 | **Plans:** 7 | **Tasks:** 23

**Delivered:** 完整的校园二手流转平台：Vue 3 SPA + Netlify Functions 后端 + Turso 数据库 + ZhipuAI 图片识别 + 用户认证 + 前后端集成

**Key accomplishments:**
1. Netlify Functions 后端（16 个 API 端点）
2. Turso 数据库集成（schema + 种子数据）
3. ZhipuAI GLM-4v-Flash 图片识别
4. 前端完整 API 集成
5. 用户注册/登录 + token 认证
6. E2E Demo 验证通过

**Archived:** Phase 01 artifacts in `.planning/phases/01-deploy-backend-verification/`
