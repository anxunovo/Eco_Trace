# 碳循校园 EcoTrace

校园二手漂流与碳减排估算平台。项目面向高校场景，帮助同学发布闲置物品、剩余食品和可再利用资源，并把每一次线下流转估算为可视化的减碳贡献。

- 在线体验: https://eco-trace-anxunovo.netlify.app
- GitHub 仓库: https://github.com/anxunovo/Eco_Trace
- 技术栈: Vue 3 ESM、Vue Router、Tailwind CDN、Chart.js、Netlify Functions、Turso/libSQL、ZhipuAI
- 部署方式: Netlify 静态站点 + 可选 Functions 后端

> 平台不接入在线支付、不托管资金、不提供担保交易，只做信息撮合、资源复用记录和碳减排估算展示。

## 项目亮点

### 闲置物品发布

用户可以上传图片、填写物品信息、选择流转方式，并发布到校园闲置列表。支持付费转让、免费赠送、物品交换和线下面议。

### AI 辅助识别

上传图片后，系统可调用 AI 识别物品类别，生成标题、描述、重量和价格建议，减少发布时的填写成本。

### 碳减排估算

平台根据物品类别、重量和碳排放系数估算本次流转可能减少的碳排放量。数据用于环保传播和校园活动展示，不作为精确碳核算凭证。

### 数据看板

首页和减碳看板展示累计流转数、累计减碳量、食物减少浪费量、分类贡献和校园排行榜。

### PWA 和移动端适配

项目支持移动端浏览、底部导航和 Service Worker 缓存，可作为校园活动现场演示页面使用。

## 页面结构

| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 首页 | `/` | 展示项目价值、核心数据和最新闲置 |
| 发现闲置 | `/listings` | 浏览、搜索和筛选闲置物品 |
| 物品详情 | `/listings/:id` | 查看物品图片、描述、联系人和预计减碳量 |
| 发布物品 | `/publish` | 四步式发布流程，支持 AI 辅助填写 |
| 减碳看板 | `/impact` | 展示全站减碳趋势、分类和排行 |
| 个人中心 | `/me` | 查看个人发布、积分和环保贡献 |
| 管理后台 | `/admin` | 管理内容、用户和演示数据 |

## 项目目录

```text
Eco_Trace-master/
├─ new-site/public/          # 前端静态站点
├─ netlify/functions/        # Netlify Functions 后端接口
├─ docs/                     # API、部署、演示和截图文档
├─ tests/                    # 本地 smoke test 和单元测试
├─ scripts/                  # 本地静态演示服务脚本
├─ netlify.toml              # Netlify 构建和路由配置
├─ package.json
└─ README.md
```

## 本地运行

项目没有前端构建步骤，静态文件位于 `new-site/public`。

```bash
npm run demo:static
```

默认访问:

```text
http://localhost:8099
```

也可以直接使用 Node 脚本指定端口:

```bash
node scripts/static-demo.mjs 8099
```

## 本地测试

```bash
npm run test:local-demo
```

测试会检查静态入口文件、Service Worker 预缓存列表、关键模块语法、相对导入和演示数据完整性。

## Netlify 部署

项目已包含 `netlify.toml`，核心配置如下:

```toml
[build]
  command = "echo 'No build step needed'"
  publish = "new-site/public"
  functions = "netlify/functions"
```

在 Netlify 中连接 GitHub 仓库后，通常不需要额外配置构建命令和发布目录。完整说明见 [DEPLOY.md](DEPLOY.md)。

## 环境变量

如果只部署静态演示页面，可以不配置后端环境变量。若要启用真实 API、数据库和 AI 能力，需要在 Netlify 后台配置:

```text
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
ZHIPUAI_API_KEY
```

本地参考文件: [.env.example](.env.example)

## 碳减排估算说明

平台使用简化估算模型，根据物品类型、重量和复用系数估算 `kgCO2e`。

| 分类 | 估算方式 | 参考来源 |
| --- | --- | --- |
| 教材书籍 | 重量 x 1.3 x 0.7 | CLCD |
| 衣物鞋包 | 件数或重量 x 系数 | ecoinvent |
| 电子产品 | 件数或重量 x 系数 | CLCD |
| 宿舍用品 | 重量 x 3.0 x 0.7 | CLCD |
| 食物 | 重量 x 食物类别系数 | IPCC |

所有碳数据均为估算值，适合用于校园环保传播、活动展示和项目原型验证。

## 相关文档

- [用户指南](USER_GUIDE.md)
- [部署说明](DEPLOY.md)
- [API 文档](docs/API.md)
- [环境配置](docs/ENV_SETUP.md)
- [演示脚本](docs/DEMO-SCRIPT.md)
- [演示准备](docs/DEMO-SETUP.md)

## 当前状态

- GitHub: https://github.com/anxunovo/Eco_Trace
- Netlify: https://eco-trace-anxunovo.netlify.app
- 本地演示端口: `8099`

## License

本项目用于课程、竞赛和校园环保场景演示。正式商用或真实交易场景上线前，应补充隐私政策、内容审核、安全风控和交易责任声明。
