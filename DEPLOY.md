# 部署说明

本文档说明如何把“碳循校园 EcoTrace”部署到 Netlify，并说明静态演示部署和完整后端部署的区别。

## 当前线上地址

- Netlify 站点: https://eco-trace-anxunovo.netlify.app
- GitHub 仓库: https://github.com/anxunovo/Eco_Trace

## 部署模式

### 静态演示部署

静态演示部署只上传 `new-site/public` 目录。它可以展示首页、发现闲置、发布流程、减碳看板等前端页面，并使用内置 seed 数据和浏览器本地存储完成演示。

限制:

- Netlify Functions 不会被打包部署
- 真实登录、数据库写入、AI 服务等后端能力不可用或会回退到演示模式

### 完整 Netlify 部署

完整部署需要把 GitHub 仓库连接到 Netlify，由 Netlify 根据 `netlify.toml` 构建并部署静态目录和 Functions。

适合:

- 需要真实 API 的线上版本
- 需要 Turso 数据库持久化
- 需要 ZhipuAI 图片识别和语义能力

## Netlify 配置

```toml
[build]
  command = "echo 'No build step needed'"
  functions = "netlify/functions"
  publish = "new-site/public"

[functions]
  node_bundler = "esbuild"
  directory = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 必需环境变量

```text
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
ZHIPUAI_API_KEY
```

配置路径:

```text
Netlify Dashboard -> Site configuration -> Environment variables
```

如果只做静态演示，可以暂时不配置这些变量。

## 通过 GitHub 部署

1. 打开 Netlify 控制台。
2. 选择 `Add new site`。
3. 选择 `Import an existing project`。
4. 连接 GitHub，并选择仓库 `anxunovo/Eco_Trace`。
5. 确认构建配置:

```text
Build command: echo 'No build step needed'
Publish directory: new-site/public
Functions directory: netlify/functions
Production branch: main
```

6. 添加环境变量。
7. 点击部署。

## 本地运行

```bash
npm run demo:static
```

默认地址:

```text
http://localhost:8099
```

## 部署后检查

- 首页是否返回 `200`
- `/assets/app.js` 是否正常加载
- 刷新二级路由，例如 `/listings`，是否仍能打开
- `/manifest.json` 和 `/sw.js` 是否正常返回
- 如果启用了 Functions，检查健康接口和登录/发布相关接口

## 常见问题

### 页面可以打开，但后端功能不可用

通常是因为当前是静态部署，或 Netlify Functions 没有部署成功。请确认是否通过 GitHub 仓库完整部署，并检查 Netlify 的 Functions 日志。

### GitHub 自动部署失败

确认 Netlify 已经授权访问 GitHub 仓库，并且仓库存在 `main` 分支。如果 Netlify 报无法 clone 仓库，需要在 Netlify 的 Git provider 设置中重新授权 GitHub。

### 二级路由刷新后 404

确认 `netlify.toml` 或 `_redirects` 中存在 SPA fallback:

```text
/* /index.html 200
```
