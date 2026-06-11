# README 截图指南

README.md 中引用了以下截图，需要你手动截取后放入 `docs/screenshots/` 目录。

建议统一宽度 **800px**，格式 **PNG**。

| 文件名 | 对应页面 | 操作说明 |
|--------|----------|----------|
| `hero.png` | 首页全景 | 首屏截图，展示数据计数器 + 分类入口 + 最新发布 |
| `ai-analyze.png` | 发布页 | 上传图片后，AI 识别结果（分类/重量/标题建议）弹出的状态 |
| `carbon-detail.png` | 物品详情 | 打开任一物品详情，截取碳减排卡片区域 |
| `impact-dashboard.png` | 减碳看板 | `/impact` 页面，确保图表已加载（折线图 + 环形图 + 柱状图） |
| `mobile.png` | 手机端 | 浏览器 F12 → 手机模拟，截取首页 + 发现页 |
| `home.png` | 首页 | `/` 完整页面截图 |
| `listings.png` | 发现闲置 | `/listings` 带筛选器和物品列表 |
| `detail.png` | 物品详情 | `/listings/:id` 完整页面 |
| `publish.png` | 发布物品 | `/publish` 四步表单中的任一步 |
| `impact.png` | 减碳看板 | `/impact` 完整页面 |
| `me.png` | 个人中心 | `/me` 个人中心页面 |
| `admin.png` | 管理后台 | `/admin` 管理员视图 |

## 快速截图流程

1. 启动本地预览：`npx serve new-site/public`
2. 浏览器访问 `http://localhost:8080`
3. 依次访问上述路径，F12 模拟手机截取 `mobile.png`
4. 截图保存到 `docs/screenshots/`
5. README.md 中已有的 `![...](docs/screenshots/xxx.png)` 会自动显示

> 注：README 中 `<!-- TODO -->` 注释的图片行需要取消注释（去掉 `<!-- -->` 包裹）才能显示。
