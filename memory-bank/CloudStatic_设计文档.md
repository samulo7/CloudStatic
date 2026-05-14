
**CloudStatic — 设计文档**  v1.0   |   基于 Cloudflare Workers Static Assets

**☁  CloudStatic**

图床 + 静态博客一体化平台

基于 Cloudflare Workers Static Assets 免费额度构建，零运维、近乎零成本

|**100,000 文件**|**25MB / 文件**|**Workers Paid**|**0 Worker 请求消耗（SSG）**|
| :-: | :-: | :-: | :-: |

## **一、Cloudflare 免费资源额度**

项目完全基于以下 Cloudflare Workers Paid 计划的静态资源额度，无需 R2、KV 等付费存储：


|**资源项**|**Free 计划(本项目使用)**|**Paid 计划** |
| - | - | - |
|Static Asset 文件数|**20,000 个**|**100,000 个**|
|单文件大小上限|**25 MiB**|**25 MiB**|
|Workers 请求数（SSG）|100,000 / 天|实质为 0（纯静态）|
|自定义域名|支持|支持|
|全球 CDN 分发|支持|支持|
|R2 / KV 额外费用|无需|无需|


|<p>**💡 关键洞察**</p><p>20,000 个文件 × 25MB = 最高 0.5TB 存储容量，用于存放图片、短视频、CSS/JS、HTML 等所有静态资源。</p><p>整站使用 SSG 预生成，部署后所有访问均由 Cloudflare Edge 直接响应，不消耗任何 Worker 请求次数。</p>|
| - |

## **二、项目概述**
### **2.1 产品定位**
CloudStatic 是一个面向独立开发者和内容创作者的自托管平台，将图床服务与静态博客系统深度整合，完全运行在 Cloudflare Workers 的免费静态资源额度之上，实现真正的「部署即完成，访问即免费」。

### **2.2 核心价值主张**
- 零依赖存储：图片、媒体文件直接作为 Static Asset 部署，无需 S3、R2、OSS
- 零 Worker 消耗：整站 SSG，所有页面和资源由 CDN Edge 直接响应
- 一键发布：上传图片 → 自动生成 Markdown 链接 → 插入博客文章
- 全球低延迟：Cloudflare 全球 300+ 节点 CDN 自动加速
- 成本趋近于零：仅需 Cloudflare Workers Paid 计划（约 $5/月），无其他费用

## **三、系统架构**
### **3.1 整体架构图**


|<p>**架构设计原则：Build Time Heavy，Runtime Zero**</p><p>所有计算（图片处理、页面渲染、Markdown 解析）都在构建阶段完成。</p><p>运行时完全静态，Cloudflare Edge 直接返回文件，Workers 实例不启动。</p><p>上传流程通过 GitHub Actions CI/CD 触发，开发者无需维护任何服务器。</p>|
| - |


|**层次**|**组件与说明**|
| - | - |
|用户层|Web 上传界面（React SPA）、博客前台（SSG HTML）、CLI 工具（Node.js）|
|CI/CD 层|GitHub Actions：接收上传 → 图片压缩/WebP 转换 → 生成 Manifest → 触发 Wrangler 部署|
|部署层|Cloudflare Wrangler：将所有 Static Assets 推送到 Workers 绑定存储|
|边缘层|Cloudflare Edge（300+ 节点）：直接响应静态资源请求，0 Worker 实例|
|构建引擎|Astro / Next.js（SSG 模式）：读取图片 Manifest，预生成所有博客页面|

### **3.2 文件组织结构**


|<p>**Static Assets 目录规划（100,000 文件预算分配）**</p><p>/images/[year]/[month]/[hash].[ext]    — 用户上传图片（原图），预算 60,000 文件</p><p>/images/thumb/[hash]\_400w.webp          — 自动生成缩略图，预算 60,000 文件（与原图 1:1）</p><p>/blog/[slug]/index.html                 — SSG 预生成博客文章页</p><p>/blog/index.html                        — 文章列表页</p><p>/assets/[hash].js  /assets/[hash].css   — 前端资源（带 Hash 缓存）</p><p>/manifest.json                          — 图片索引 JSON（供前端检索使用）</p>|
| - |

## **四、核心功能模块**
### **4.1 图床服务**

|**功能**|**说明**|
| - | - |
|拖拽/粘贴上传|支持批量上传，前端预览，上传前在浏览器端压缩（Canvas API）|
|自动格式转换|PNG/JPG → WebP，构建时使用 sharp 处理，减少约 30-70% 体积|
|自动缩略图|构建时生成 400px 宽缩略图，用于列表页展示|
|哈希命名|SHA-256 前 16 位作为文件名，天然去重，防止冲突|
|链接生成|上传完成后自动生成 Markdown、HTML、BBCode 三种格式链接|
|图片管理页|SSG 预生成图库页，支持按月份/标签筛选|
|防盗链|通过 Cloudflare Transform Rules 设置 Referer 白名单（可选）|

### **4.2 博客系统**

|**功能**|**说明**|
| - | - |
|Markdown 写作|支持 MDX，可直接引用图床图片链接|
|SSG 全量预构建|Astro 构建，每次新增文章/图片后重新部署|
|自动 TOC|根据文章 Heading 自动生成目录|
|标签 & 分类|构建时生成标签页、分类页，均为纯静态|
|RSS Feed|自动生成 /feed.xml，支持订阅|
|SEO 优化|自动生成 sitemap.xml、OG 标签、结构化数据|
|图片懒加载|所有博客图片自动添加 loading=lazy 和 srcset|

### **4.3 部署与 CI/CD**

|**步骤**|**说明**|
| - | - |
|1\. 触发|开发者 git push 或通过 Web UI 上传图片，触发 GitHub Actions|
|2\. 图片处理|Actions 运行 sharp：格式转换、生成缩略图、计算 Hash|
|3\. 更新 Manifest|将新图片元数据写入 manifest.json，commit 到仓库|
|4\. SSG 构建|Astro build：读取所有 Markdown 文章和 manifest.json，生成静态页面|
|5\. Wrangler 部署|wrangler deploy 将所有 dist/ 文件推送为 Static Assets|
|6\. 生效|Cloudflare 全球 CDN 立即生效，全程约 2-4 分钟|

## **五、技术选型**


|**类别**|**选型**|**理由**|
| - | - | - |
|前端框架|**Astro 4.x**|**原生 SSG，Islands 架构，构建产物极小**|
|博客内容|**MDX + Content Collections**|**类型安全，支持组件嵌入**|
|图片处理|sharp（Node.js）|构建时处理，Edge 无需计算|
|部署工具|Wrangler CLI|Cloudflare 官方工具，完美支持 Static Assets|
|CI/CD|GitHub Actions|免费，与 GitHub 仓库无缝集成|
|前端交互|React（Island）|仅上传组件需要交互，其余纯 HTML|
|样式|Tailwind CSS|构建时 Purge，产物体积最小|
|包管理|pnpm|速度快，monorepo 友好|

## **六、成本分析**
### **6.1 费用估算（月度）**


|**费用项**|**Free 计划**|**Paid 计划**|
| - | - | - |
|Cloudflare Workers|**$0**|**$5/月（含 Paid 额度）**|
|Static Assets 存储|**$0（20k 文件）**|**$0（100k 文件，已含）**|
|CDN 流量|$0（无限）|$0（无限）|
|R2 对象存储|无需|无需|
|域名|自备（约 $10/年）|自备（约 $10/年）|
|服务器 / VPS|无需|无需|
|总计|约 $10/年|约 $70/年|


|<p>**对比传统方案节省费用**</p><p>传统方案（VPS + OSS）：VPS $5-20/月 + OSS $2-10/月 = 约 $84-360/年</p><p>CloudStatic 方案：Cloudflare Paid $5/月 + 域名 $10/年 = 约 $70/年</p><p>节省比例：相比传统方案节省约 20-80%，且完全无需运维服务器。</p>|
| - |

## **七、限制与注意事项**


|<p>**⚠ 已知限制**</p><p>单文件最大 25MB：短视频（<25MB）可存储，长视频不适合，建议嵌入 YouTube/B站。</p><p>总文件数 100,000：普通博客 + 图床够用，若大量 4K 原图需提前规划，可用 WebP 压缩节省配额。</p><p>部署时间约 2-4 分钟：非实时，上传后需等待构建完成才生效，不适合需要即时发布的场景。</p><p>无服务端逻辑：评论系统需借助第三方（Giscus/Waline），搜索需构建时生成 JSON 索引。</p><p>图片无访问统计：Static Assets 无内置访问日志，需接入 Cloudflare Analytics 或第三方。</p>|
| - |

## **八、开发路线图**


|**阶段**|**目标与任务**|
| - | - |
|Phase 1（Week 1-2）|基础搭建：Astro 项目初始化、Wrangler 配置、GitHub Actions 自动部署流水线|
|Phase 2（Week 3-4）|图床核心：Web 上传界面、图片 Hash 命名、sharp 转 WebP、manifest.json 生成|
|Phase 3（Week 5-6）|博客系统：MDX 文章支持、标签/分类页、RSS Feed、sitemap.xml 自动生成|
|Phase 4（Week 7-8）|体验优化：图片懒加载、搜索（Fuse.js 客户端搜索）、暗色模式、Lighthouse 100分|
|Phase 5（Week 9+）|扩展功能：CLI 工具（快速上传图片到图床）、Giscus 评论集成、访问统计看板|

## **九、总结**
CloudStatic 充分挖掘了 Cloudflare Workers Paid 计划中 Static Assets 的核心价值：

- 100,000 个文件 + 每个 25MB 的额度，对于个人博客 + 图床场景而言绰绰有余
- 整站 SSG 化，部署后 Workers 请求数为零，彻底释放请求配额
- 无独立对象存储，图片与代码共用一套 CI/CD 流程，运维极简
- 全球 CDN 自动加速，无需额外配置，访问延迟优于自建 OSS + CDN 方案

**这是目前成本最低、架构最简单、可完全自主控制的个人内容托管方案之一。**

© 2025 CloudStatic Project	第 1 页
