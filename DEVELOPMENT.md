<div align="center">

# 碳循校园 EcoTrace

### 校园二手漂流 × AI 碳减排估算平台

**让每一件闲置物品的流转，都变成可见的减碳贡献**

[![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Play_CDN-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Netlify](https://img.shields.io/badge/Deployed_on-Netlify-00C7B7?logo=netlify&logoColor=white)](https://www.netlify.com/)
[![Turso](https://img.shields.io/badge/Database-Turso_SQLite-4FF8D2?logo=sqlite&logoColor=black)](https://turso.tech/)
[![ZhipuAI](https://img.shields.io/badge/AI-ZhipuAI_GLM-blueviolet)](https://open.bigmodel.cn/)
[![Chart.js](https://img.shields.io/badge/Charts-Chart.js_4-FF6384)](https://www.chartjs.org/)
[![PWA](https://img.shields.io/badge/PWA-Offline_Ready-5A0FC8)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## 项目简介

**碳循校园** 是面向中国高校的闲置物品流转 Web 平台。学生发布闲置物品、剩余食品和可再利用资源，平台通过 **AI 多模态识别** 自动分析物品类型，基于权威碳排放系数数据库（CLCD/ecoinvent）**估算每次流转的碳减排量**，将校园里的每一次资源流转转化为可量化的环保贡献。

> 平台不接入支付、不托管资金——只做**信息撮合 + 减碳量化**。

**竞赛背景：** 节能减排科技作品类参赛项目，面向汕头大学桑浦山校区/东海岸校区实际场景部署。

---

## 核心功能 (v2.0)

### 数据可视化
| 功能 | 说明 |
|------|------|
| 减碳趋势折线图 | 按日聚合碳减排数据，支持本周/本月/全部时间切换 |
| 分类环形图 | 各物品类型（教材/电子/衣物等）减碳占比一目了然 |
| 校区对比柱状图 | 桑浦山 vs 东海岸校区减碳量对比 |
| 首页动态计数器 | 数字从 0 平滑动画到目标值（ease-out cubic） |
| 时间周期筛选器 | 一键切换数据范围，图表实时重载 |

### AI 智能能力
| 功能 | 模型 | 说明 |
|------|------|------|
| AI 物品识别 | GLM-4v-Flash | 上传图片自动识别类别、估算重量、生成标题和描述建议 |
| 碳减排自然语言解释 | GLM-4-Flash | 将碳减排数据转化为通俗易懂的生活类比 |
| 智能定价建议 | GLM-4-Flash | 根据物品类别、成色建议合理价格区间 |
| AI 语义搜索 | Embedding-3 | 输入自然语言查询匹配语义相关的物品 |

### PWA 与离线
- Service Worker 静态资源预缓存（27 个文件）
- IndexedDB 离线数据层（列表和仪表盘数据缓存）
- 网络优先 API 策略，断网时从缓存读取
- 可安装到手机桌面（manifest.json + SVG 图标）

### 平台功能
| 模块 | 说明 |
|------|------|
| 闲置发布 | 四步分步表单 + AI 辅助填写 |
| 发现闲置 | 关键词/语义搜索 + 多维筛选（分类/方式/价格/校区） |
| 食物分享 | 保质期管理 + 到期自动过期 + 食品安全提示 |
| 确认流转 | 发布者确认完成后碳减排值计入总贡献 |
| 减碳看板 | 个人贡献 + 校园总览 + 最近流转 + 排行榜 |
| 排行榜 | 个人/校区减碳排名 |
| 成就系统 | 环保徽章 + eco_points 积分 |
| 通知系统 | 站内消息（意向/流转/系统通知） |
| 管理后台 | 全部发布管理 + 内容审核 + 数据导出 |

---

## 技术架构

```
前端 (Vue 3 SPA, 无构建工具)
  Vue 3.5 ESM + Vue Router 4 + Tailwind Play CDN
  Chart.js 4 图表 | Service Worker 离线 | IndexedDB 缓存
  api-adapter.js: API/localStorage 自动切换
        |
        | HTTP (fetch)
        v
后端 (Netlify Functions, 25+ 端点)
  认证 / CRUD / AI分析 / 碳统计 / 排行榜 / 通知 / 审核
        |
        +-- Turso (libSQL): 用户/物品/碳记录/通知
        +-- ZhipuAI GLM: 图像识别/语义搜索/定价/碳解释
```

**零构建方案：** 无 Vite/Webpack，所有 JS 通过浏览器原生 ESM import 加载，vendor 库本地托管。

---

## 仓库结构

```
Eco_Trace/
├── new-site/public/              # Vue 3 SPA 静态站点
│   ├── index.html                # 入口 (importmap + Chart.js CDN + SW 注册)
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service Worker (预缓存 + 网络策略)
│   ├── robots.txt                # SEO
│   ├── sitemap.xml               # SEO
│   └── assets/
│       ├── app.js                # Vue app + router
│       ├── store.js              # 响应式状态 + 碳估算
│       ├── api-adapter.js        # API 适配层
│       ├── charts.js             # Chart.js Vue 组件 (趋势/环形/柱状)
│       ├── offline-db.js         # IndexedDB 离线缓存
│       ├── components.js         # 通用组件
│       ├── seed.js               # 种子数据 + 碳系数
│       ├── styles.css            # 自定义样式
│       └── pages/                # 路由页面
│
├── netlify/functions/            # Netlify 无服务器后端
│   ├── _lib/
│   │   ├── db.js                 # Turso HTTP API 连接
│   │   ├── auth.js               # JWT 身份验证
│   │   ├── ai-client.js          # ZhipuAI 客户端 (识别/搜索/定价/解释)
│   │   ├── carbon-engine.js      # 碳减排估算引擎
│   │   ├── response.js           # 统一响应格式
│   │   └── schema.sql            # 数据库 Schema
│   ├── *.mjs                     # 25+ API 端点
│
├── docs/                         # 项目文档
├── .planning/                    # GSD 规划 (ROADMAP/STATE/PLANs)
└── netlify.toml                  # 部署配置
```

---

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/listings` | 物品列表（筛选/分页/搜索） |
| POST | `/api/listings` | 发布新物品 |
| GET | `/api/listings/:id` | 物品详情 |
| PUT | `/api/listings/update` | 更新物品 |
| DELETE | `/api/listings/delete` | 下架物品 |
| POST | `/api/listings/:id/complete` | 确认流转 |
| POST | `/api/ai/analyze` | AI 图像识别 + 字段建议 |
| GET | `/api/dashboard` | 校园减碳总览 |
| GET | `/api/carbon/stats` | 碳统计 (支持 period/ trend/ campus) |
| GET | `/api/leaderboard` | 排行榜 |
| GET/POST | `/api/interests` | 意向记录 |
| GET/PUT | `/api/user` | 用户信息 |
| GET/POST | `/api/notifications` | 通知系统 |
| GET | `/api/admin/export` | 数据导出 (CSV/JSON) |

---

## 碳减排估算

| 分类 | 计算方式 | 系数来源 |
|------|----------|----------|
| 教材书籍 | 重量(kg) × 1.3 × 0.7 | CLCD |
| 衣物鞋包 | 按件 × 8.0 × 0.7 | ecoinvent |
| 电子产品 | 按件或重量 × 系数 | CLCD |
| 宿舍用品 | 重量(kg) × 3.0 × 0.7 | CLCD |
| 食物(通用) | 重量(kg) × 2.5 | IPCC |
| 食物(肉类) | 重量(kg) × 8.0 | IPCC |
| 食物(蔬菜) | 重量(kg) × 0.8 | IPCC |

> 所有碳数据均为估算值，前端文案统一标注"预计"或"估算"。

---

## 路由

| 路径 | 页面 | 功能 |
|------|------|------|
| `/` | 首页 | 动态计数器 · 分类入口 · 最新发布 |
| `/listings` | 发现闲置 | 语义搜索 · 多维筛选 · 瀑布流 |
| `/listings/:id` | 物品详情 | 完整信息 · AI 碳解释 · 联系发布者 |
| `/publish` | 发布物品 | AI 识别 · 四步表单 · 智能定价 |
| `/impact` | 减碳看板 | 交互图表 · 校区对比 · 排行榜 |
| `/me` | 个人中心 | 成就徽章 · 通知 · 个人数据 |
| `/me/listings` | 我的发布 | 状态管理 · 确认流转 |
| `/admin` | 管理后台 | 全部发布 · 审核 · 数据导出 |
| `/auth` | 登录注册 | 身份认证 |

---

## 快速开始

### 本地预览（零配置）

```bash
git clone https://github.com/Yuuqq/Eco_Trace.git
cd Eco_Trace
npx serve new-site/public
# 访问 http://localhost:8080
```

内置种子数据，无需后端即可体验完整页面。

### 完整部署（Netlify + Turso + ZhipuAI）

1. Turso 创建数据库，执行 `netlify/functions/_lib/schema.sql`
2. Netlify 环境变量配置 `TURSO_DATABASE_URL`、`TURSO_AUTH_TOKEN`、`ZHIPUAI_API_KEY`
3. 推送到 GitHub，Netlify 自动部署
4. Netlify Identity 需要**关闭**（我们的认证系统不依赖它）

---

## 依赖

| 依赖 | 版本 | 加载方式 |
|------|------|----------|
| Vue 3 | 3.5 | 本地 vendor/ |
| Vue Router | 4.5 | 本地 vendor/ |
| Tailwind CSS | Play CDN | CDN (runtime JIT) |
| Chart.js | 4.4.7 | CDN (Service Worker 缓存) |
| Turso | @tursodatabase/serverless 1.1.3 | npm (Netlify Functions) |

---

## 项目信息

- **类型：** 节能减排科技作品类参赛项目
- **团队：** 汕头大学 EcoTrace 团队
- **校区：** 桑浦山校区 · 东海岸校区
- **版本：** v2.0

---

## 相关文档

- [环境配置](docs/ENV_SETUP.md) — 环境变量、Turso、Netlify 部署
- [碳方法学](docs/CARBON-METHODOLOGY.md) — 碳减排估算方法和数据来源
- [技术架构](docs/ARCHITECTURE.md) — 系统架构和数据流
- [API 文档](docs/API.md) — 接口规范
- [演示脚本](docs/DEMO-SCRIPT.md) — 比赛演示步骤
- [安全审计](SECURITY_AUDIT.md) — 安全评估报告
