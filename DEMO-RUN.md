# 碳循校园 EcoTrace — 演示运行指南

## 一键启动（本地演示）

### Windows

```
双击 demo.bat
```

### Mac / Linux

```bash
chmod +x demo.sh
./demo.sh
```

脚本会自动完成：
1. 检测 Node.js ≥ 18，缺失时从**中国镜像**自动下载安装
2. 检测 `.env` 配置，缺失时自动从 `.env.example` 创建
3. 启动演示服务器，浏览器自动打开 `http://localhost:3456`

### 唯一前置条件

**只需要 `.env` 文件**（含 3 个 API key）。Node.js 会自动安装。

如果仓库中已包含 `.env`（比赛分发版），双击即可运行，零配置。

`.env` 示例：
```
TURSO_DATABASE_URL=libsql://eco-ppa96.aws-us-east-2.turso.io
TURSO_AUTH_TOKEN=eyJhbGci...（完整 token）
ZHIPUAI_API_KEY=4a15d372...（完整 key）
```

> 无需安装 Node.js、无需 npm install、无需构建步骤、无需 Netlify CLI。

---

## 演示流程建议（5 分钟）

### 1. 首页（30 秒）
- 展示碳减排实时数据卡片（滚动数字动画）
- 展示最新发布列表、热门分类

### 2. AI 发布流程（90 秒）
- 点击"发布新物品"
- 上传一张实物照片（书、耳机、衣服等）
- 点击"下一步" → **AI 自动识别**物品类型、估算重量、碳减排量
- 展示识别结果（分类、置信度、碳减排估算）
- 补充信息 → 预览 → 确认发布

### 3. 减碳看板（60 秒）
- 展示趋势折线图（日/周/月）
- 展示分类饼图 + 校区对比柱状图
- 展示个人贡献排行榜
- 点击"生成分享海报" → PNG 自动下载

### 4. 个人碳足迹（30 秒）
- 进入"我的"页面
- 展示"我的碳足迹"卡片（分类减碳明细 + 排名）
- 展示身份卡（减碳量、流转次数、发布中数量）

### 5. 完整流转演示（60 秒）
- 回到首页 → 浏览物品详情
- 点击"我想要" → 发起认领
- 发布者确认完成流转 → 碳减排数据实时更新
- 回到看板 → 数据已刷新

---

## 功能清单

| 功能 | 说明 |
|------|------|
| AI 图片识别 | ZhipuAI GLM-4v-Flash，多图并行分析，降级时有提示 |
| 碳减排量化 | 分类系数 × 重量 × 替代率，DB 驱动可配置 |
| 数据可视化 | Chart.js 趋势图/饼图/柱状图，支持时间段筛选 |
| 排行榜 | 个人减碳排名（Top 10），支持 API + 本地 fallback |
| 个人碳足迹 | 分类减碳明细 + 排名 badge |
| 分享海报 | html2canvas 生成 PNG 卡片，可下载分享 |
| PWA | Service Worker 离线缓存 + IndexedDB + 安装提示 |
| 用户系统 | 注册/登录/token 认证 |
| 响应式 | 移动端/桌面端双布局 |

---

## Netlify 部署

### 自动部署（推荐）

1. GitHub 仓库连接 Netlify
2. Netlify 自动读取 `netlify.toml` 配置：
   - **Publish directory:** `new-site/public`
   - **Functions directory:** `netlify/functions`
3. 在 Netlify Dashboard → Site settings → Environment variables 添加：
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `ZHIPUAI_API_KEY`
4. Push 到 master 即自动部署

### 手动部署

```bash
npm i -g netlify-cli
netlify login
netlify link
netlify env:set TURSO_DATABASE_URL "libsql://..."
netlify env:set TURSO_AUTH_TOKEN "..."
netlify env:set ZHIPUAI_API_KEY "..."
netlify deploy --prod
```

---

## 技术架构

```
浏览器 (Vue 3 SPA)
  ├── 静态资源: new-site/public/
  ├── API 请求: /api/*
  │     ↓
Netlify Functions (serverless)
  ├── netlify/functions/*.mjs
  ├── _lib/db.js          → Turso HTTP API
  ├── _lib/ai-client.js   → ZhipuAI GLM-4v-Flash
  ├── _lib/auth.js        → PBKDF2 + JWT session
  └── _lib/carbon-engine.js → 碳系数 DB 查询
  │     ↓
Turso (cloud SQLite) + ZhipuAI API
```

### 本地演示服务器 (`demo-server.mjs`)

- 直接加载 Netlify Functions 模块，无需 Netlify CLI
- 自动读取 `.env` 环境变量
- SPA fallback 路由
- 零依赖，Node.js 18+ 内置模块即可运行

---

## 常见问题

### Q: 启动报错 "缺少环境变量"
A: 检查 `.env` 文件是否存在且包含完整的 3 个 key。

### Q: AI 识别返回"置信度 0"
A: ZhipuAI API Key 可能过期或余额不足。glm-4v-flash 是免费模型，但需要有效 key。

### Q: 页面空白 / 控制台报错
A: 确认 Node.js 版本 ≥ 18（`node -v`）。低版本不支持全局 `Request`/`Response`。

### Q: 如何重置演示数据
A: 页面底部"我的" → "重置演示数据"按钮，或在浏览器控制台执行 `localStorage.clear()`。

### Q: 移动端如何演示
A: 确保手机和电脑在同一 WiFi，在手机浏览器输入 `http://电脑IP:3456`。
