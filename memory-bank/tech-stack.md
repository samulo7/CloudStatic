# CloudStatic 技术栈

## 技术栈结论

CloudStatic 最适合采用 **Astro SSG + React Islands + Cloudflare Workers Static Assets + GitHub Actions + Wrangler** 技术栈。

核心原则：**Build Time Heavy，Runtime Zero**。图片处理、Markdown/MDX 渲染、索引生成、SEO 文件生成全部放在构建阶段完成；部署后由 Cloudflare Edge 直接返回静态文件，不启动 Worker 实例，不消耗 Worker 请求。

## 核心技术选型

| 层级 | 技术 | 用途 | 选择理由 |
| --- | --- | --- | --- |
| 前端框架 | Astro | SSG 静态站点生成 | 原生 SSG、HTML 优先、产物小，契合 0 Runtime 架构 |
| 交互组件 | React Islands | 上传页、图片管理页等局部交互 | 只给需要交互的区域加载 JS，博客阅读页保持纯静态 |
| 内容系统 | MDX + Astro Content Collections | 博客文章、页面内容、类型化元数据 | 支持 Markdown 写作、组件嵌入、frontmatter 类型校验 |
| 图片处理 | sharp | WebP 转换、缩略图、尺寸读取、哈希命名 | Node.js 构建阶段处理成熟稳定，无需运行时图片服务 |
| 样式方案 | Tailwind CSS | 全站 UI 样式 | 构建时裁剪未使用样式，适合静态站点小体积输出 |
| 客户端搜索 | Fuse.js | 静态 JSON 索引搜索 | 无需服务端搜索服务，适合个人博客和图库规模 |
| 包管理 | pnpm | 依赖管理、脚本运行 | 安装快、锁文件稳定、适合后续 CLI/脚本扩展 |
| 构建运行时 | Node.js LTS | Astro、sharp、CLI、构建脚本 | GitHub Actions 支持好，生态完整 |
| 部署目标 | Cloudflare Workers Static Assets | 托管 HTML、图片、CSS、JS、JSON | 直接使用 Cloudflare 静态资源额度，无需 R2/KV/OSS |
| 部署工具 | Wrangler CLI | 构建产物发布到 Cloudflare | Cloudflare 官方工具，支持 Workers Static Assets |
| CI/CD | GitHub Actions | 图片处理、Manifest 更新、SSG 构建、部署 | 与 Git 仓库天然集成，适合上传触发和 push 触发 |
| 评论系统 | Giscus | 博客评论 | 基于 GitHub Discussions，无需自建后端 |
| 统计分析 | Cloudflare Web Analytics | 访问统计 | 与 Cloudflare 生态一致，无需服务端日志系统 |

## 推荐项目结构

```text
/
├─ content-assets/
│  └─ incoming-images/           # 本地/CI 临时图片输入，默认不进 git history
├─ public/
│  ├─ manifest.json
│  ├─ feed.xml
│  └─ sitemap.xml
├─ src/
│  ├─ content/
│  │  └─ blog/*.mdx
│  ├─ components/
│  ├─ layouts/
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ blog/[slug].astro
│  │  ├─ gallery.astro
│  │  └─ upload.astro
│  └─ styles/
├─ scripts/
│  ├─ process-images.ts
│  ├─ generate-manifest.ts
│  └─ generate-search-index.ts
├─ .github/workflows/deploy.yml
├─ astro.config.mjs
├─ wrangler.toml
├─ package.json
└─ pnpm-lock.yaml
```

> 长期不要把海量图片直接放进 `public/images/`。Astro 会原样复制 `public/` 到 `dist/`，图片增长到几万张后，每次构建扫描和复制都会拖慢 CI。推荐在 CI 图片处理后直接写入 `dist/images/`，或使用 Wrangler assets 配置让图片目录绕开 Astro 构建管道。

## 构建与部署流程

1. 用户通过 Git push 提交文章，或通过 Web 上传流程提交图片。
2. GitHub Actions 安装依赖并运行图片处理脚本。
3. sharp 生成 WebP 原图、400w 缩略图、图片尺寸和 SHA-256 哈希文件名。
4. 脚本更新 manifest.json，记录图片路径、尺寸、类型、标签、时间。
5. Astro 读取 MDX、manifest.json，生成博客页、图库页、标签页、分类页。
6. 构建阶段生成 RSS、sitemap、搜索索引 JSON、OG 元数据。
7. CI 将处理后的图片复制到 dist/images/，或交给 Wrangler assets 配置单独上传。
8. Wrangler 将 dist/ 与图片资产发布为 Cloudflare Workers Static Assets。
9. Cloudflare Edge 直接响应所有 HTML、图片、CSS、JS、JSON 请求。

## 前端与内容实现建议

### Astro 负责主体页面

- 首页、博客列表、文章详情、标签页、分类页、图库页全部使用 Astro 静态生成。
- 文章内容使用 MDX，frontmatter 存储 title、description、date、tags、category、cover。
- 图片默认输出 loading="lazy"、srcset、width、height，减少 CLS 和首屏压力。

### React 只用于交互岛

React 仅用于这些页面局部：

- 拖拽/粘贴上传组件
- 图片筛选和复制链接组件
- 客户端搜索框
- 暗色模式切换

避免把整站做成 React SPA。博客阅读、图库展示、SEO 页面必须保持静态 HTML 优先。

### 图片处理放在构建阶段

推荐生成：

- `/images/[year]/[month]/[hash].webp`：主图
- `/images/thumb/[hash]_400w.webp`：缩略图
- `/manifest.json`：图片索引
- `/search-index.json`：搜索索引

图片命名使用 SHA-256 前 16 位，天然去重并避免中文路径、空格、重复文件名问题。

## Cloudflare 配置建议

### Wrangler

使用 Wrangler 管理部署，目标保持纯静态资源托管。不要引入 R2、KV、D1，除非后续明确需要服务端能力。

### 缓存策略

| 资源 | 缓存建议 |
| --- | --- |
| `/assets/*` | 长缓存，文件名带 hash |
| `/images/*` | 长缓存，hash 文件名不可变 |
| `/manifest.json` | 短缓存或每次部署刷新 |
| `/search-index.json` | 短缓存或每次部署刷新 |
| HTML 页面 | 由 Cloudflare 默认静态资源策略处理 |

### 可选规则

- Transform Rules：配置防盗链 Referer 白名单。
- Redirect Rules：处理旧链接跳转。
- Web Analytics：统计页面访问。

## GitHub Actions 建议

工作流应包含这些步骤：

```text
checkout
setup-node
setup-pnpm
pnpm install --frozen-lockfile
pnpm process:images
pnpm generate:manifest
pnpm build
wrangler deploy
```

如 Web 上传流程需要自动提交处理结果，建议只 commit manifest.json 和文章元数据。图片二进制文件默认加入 .gitignore，不进入 git history；CI 处理后直接上传到 Cloudflare Static Assets。这样仓库不会因大量图片长期膨胀。

需要保留原图审计或备份时，再单独接入外部对象存储或归档仓库，不放入主代码仓库。

## 不推荐技术

| 技术 | 不推荐原因 |
| --- | --- |
| Next.js SSR | 会引入运行时请求，不符合 Runtime Zero 目标 |
| R2 / S3 / OSS | 项目目标是利用 Static Assets 额度，额外对象存储会增加成本和复杂度 |
| KV / D1 | 当前需求无服务端状态，使用会破坏纯静态架构 |
| 完整 React SPA | SEO、首屏性能、JS 体积都不如 Astro SSG |
| 运行时图片优化服务 | 会消耗 Worker/服务器资源，违背构建时处理原则 |
| 自建评论后端 | 增加运维成本，不符合零运维定位 |

## MVP 技术栈

第一阶段只需要跑通核心闭环：**上传图片 → 生成链接 → 写文章 → 构建 → 部署**。

- Astro
- MDX + Content Collections
- React Islands
- Tailwind CSS
- sharp
- pnpm
- GitHub Actions
- Wrangler
- Cloudflare Workers Static Assets

延后加入：

- Fuse.js 搜索
- Giscus 评论
- Cloudflare Web Analytics
- CLI 上传工具
- 防盗链规则

## 最终推荐

采用 **Astro + MDX + React Islands + Tailwind CSS + sharp + GitHub Actions + Wrangler + Cloudflare Workers Static Assets**。

这套技术栈最符合 CloudStatic 文档中的目标：低成本、零运维、纯静态、图床与博客一体、构建阶段完成所有计算、运行时由 Cloudflare Edge 直接分发。