# Netlify 部署补充说明

本文档是根目录 [DEPLOY.md](../DEPLOY.md) 的补充，面向开发和运维人员。

## 构建策略

本项目没有 Vite、Webpack 或其他前端构建步骤。浏览器直接加载 `new-site/public` 中的 ESM 模块。

```text
Build command: echo 'No build step needed'
Publish directory: new-site/public
Functions directory: netlify/functions
```

## 推荐部署路径

```text
GitHub repo: anxunovo/Eco_Trace
Branch: main
```

这样 Netlify 会同时部署静态前端、SPA fallback、缓存 headers 和 Netlify Functions。

## 静态直传部署

如果 GitHub 授权暂时不可用，可以只上传 `new-site/public` 做静态演示。静态直传需要额外提供:

```text
/_redirects
/_headers
```

其中 `_redirects` 至少包含:

```text
/* /index.html 200
```

这种模式适合临时演示，但不会部署 `netlify/functions`。

## 环境变量清单

| 变量 | 用途 | 必需场景 |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | Turso/libSQL 数据库地址 | 完整后端 |
| `TURSO_AUTH_TOKEN` | Turso 数据库访问 token | 完整后端 |
| `ZHIPUAI_API_KEY` | ZhipuAI 多模态和文本能力 | AI 识别、语义搜索 |

## 验证命令

```bash
npm run test:local-demo
npm run demo:static
curl -I https://eco-trace-anxunovo.netlify.app/
curl -I https://eco-trace-anxunovo.netlify.app/assets/app.js
```

## 部署故障排查

### Netlify 无法访问 GitHub 仓库

确认仓库存在且为 `main` 分支，在 Netlify 中重新连接 GitHub provider，并确认 Netlify GitHub App 有权限访问该仓库。

### Functions 没有生效

确认是否通过 GitHub 完整部署，而不是静态直传部署；检查 `netlify/functions`、Netlify deploy log 和必需环境变量。

### 页面路由刷新后 404

确认 `netlify.toml` 中 SPA fallback 是最后一条 redirect。
