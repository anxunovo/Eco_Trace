# Roadmap v2 — Real Campus Deployment

**Project:** 碳循校园 EcoTrace
**Milestone:** v2 (Post-Competition)
**Created:** 2026-05-07
**Predecessor:** v1 Launch (Phase 1-4 complete)

---

## v2 目标

从"比赛 Demo"升级到"汕头大学学生真正在用的校园闲置流转平台"。
优先提升用户体验和数据价值（Phase 8-9），再补齐基础设施（Phase 10-12）。

---

## Phase 8: Data & Impact Visualization

**Goal:** 用数据证明平台价值，支撑论文/报告，增强用户成就感
**Depends on:** v1 全部完成

### Success Criteria
1. 校园碳减排总看板（按学院/校区/时间段统计）
2. 物品流转效率分析（发布→完成耗时分布）
3. 排行榜：个人/院系/宿舍楼减碳排名
4. 数据导出（CSV/JSON）用于研究报告
5. 趋势图表：周/月/学期维度的碳减排曲线

### Plans
| Plan | Description | Status |
|------|-------------|--------|
| 8-1 | 聚合查询 API：按日期/校区/分类聚合统计，新增 /api/stats/summary、/api/stats/timeline | — |
| 8-2 | 前端可视化升级：impact.js 引入 Chart.js，碳减排趋势图 + 分类饼图 + 校区对比 | — |
| 8-3 | 排行榜：/leaderboard 页面（个人 top50 / 校区排行 / 月度之星），数据从 API 实时获取 | — |
| 8-4 | 数据导出：/api/admin/export?format=csv&scope=all，管理员可导出完整数据 | — |
| 8-5 | 首页数据卡片升级：滚动数字动画 + 实时统计 | — |

---

## Phase 9: Mobile & Engagement

**Goal:** 提升移动端体验和用户粘性，让学生"愿意回来"
**Depends on:** Phase 8

### Success Criteria
1. PWA 离线可用（浏览已缓存 listing）
2. 安装提示 + 桌面图标 + 启动画面
3. 社交分享卡片（"我通过碳循校园节约了 X kg CO₂"）
4. 成就系统（首次发布、连续流转、碳减排里程碑）
5. 扫码发布：拍照 → AI 识别 → 快速发布

### Plans
| Plan | Description | Status |
|------|-------------|--------|
| 9-1 | PWA 完整化：Service Worker 缓存策略 + IndexedDB 离线数据 + 启动画面 | — |
| 9-2 | 社交分享：完成流转后生成分享卡片（Canvas 截图），可保存/分享到微信朋友圈 | — |
| 9-3 | 成就系统：里程碑 badge（首次发布、流转 10 次、减碳 50kg）+ eco_points 积分展示 | — |
| 9-4 | 扫码快速发布：调用摄像头拍照 → AI 自动识别 → 预填表单 → 一键发布 | — |
| 9-5 | 推送通知：Web Push API + Netlify Function（新消息、兴趣通知、系统公告） | — |

---

## Phase 10: Production Hardening

**Goal:** 解决 v1 技术债务，确保生产环境稳定可靠
**Depends on:** Phase 9

### Success Criteria
1. 图片存储从 base64 迁移到对象存储
2. API 端点速率限制 + 滥用防护
3. 前端构建系统引入（Vite + TypeScript 渐进迁移）
4. 集成测试套件覆盖全部 API 端点

### Plans
| Plan | Description | Status |
|------|-------------|--------|
| 10-1 | 图片存储迁移：base64 → Netlify Blobs / Cloudflare R2，上传/压缩/CDN | — |
| 10-2 | API 速率限制：每 IP 每分钟上限，防刷防爬 | — |
| 10-3 | 前端构建系统：引入 Vite（渐进迁移，不破坏现有代码） | — |
| 10-4 | 集成测试：覆盖全部 API 端点 + 前端关键流程 | — |

---

## Phase 11: Trust & Identity

**Goal:** 建立用户信任体系
**Depends on:** Phase 10

### Plans
| Plan | Description | Status |
|------|-------------|--------|
| 11-1 | 邮箱验证注册：发送验证码到 @stu.edu.cn | — |
| 11-2 | 评价系统：完成流转后双方互评（1-5 星 + 标签） | — |
| 11-3 | 举报功能：举报 listing / 举报用户 + 管理员处理队列 | — |
| 11-4 | 用户主页：公开展示评分、历史发布、碳贡献 | — |

---

## Phase 12: Real-Time Communication

**Goal:** 买卖双方可以在平台内沟通
**Depends on:** Phase 11

### Plans
| Plan | Description | Status |
|------|-------------|--------|
| 12-1 | 私信数据模型：conversations + messages 表，API 端点 | — |
| 12-2 | 前端消息中心：消息列表 + 聊天界面 + 角标 | — |
| 12-3 | 实时推送：SSE endpoint 或 WebSocket | — |
| 12-4 | 通知系统：新消息、新意向、系统公告统一入口 | — |

---

## Backlog (v3)

- 桌面端 Electron 封装（离线教室场景）
- 多校扩展（其他大学接入）
- 微信小程序
- AI 碳排放估算模型本地化
- 碳积分兑换系统（与学校合作）
- AR 物品识别（手机摄像头实时分类）
