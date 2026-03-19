# MdPdf

MdPdf 是一个文档转换工具仓库，当前采用 monorepo 结构，包含：

- `apps/web`：Next.js 网站，当前对外提供 PDF to Markdown 和浏览器端 Markdown to PDF
- `apps/pdf-api`：独立的 Node 服务边界，当前提供健康检查和预留的服务端 MD-to-PDF 接口

当前目标是让网站继续部署在 Cloudflare Pages，同时为后续独立部署 `pdf-api` 预留同仓协作空间。

## 仓库结构

```text
.
├── apps/
│   ├── web/        # Next.js 16 网站
│   └── pdf-api/    # 预留的 PDF API 服务
├── package.json    # workspace 根脚本
├── package-lock.json
└── tsconfig.json   # workspace 基础 TS 配置
```

## 技术栈

### apps/web

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- `unpdf`：PDF to Markdown
- `react-markdown` + `remark-gfm`：Markdown 预览
- `pdfmake` + `marked`：浏览器端 Markdown to PDF

### apps/pdf-api

- Node.js HTTP server
- TypeScript
- `pdfmake` + `marked`

## 本地开发

### 环境要求

- Node.js 20+
- npm 10+

### 安装依赖

在仓库根目录执行：

```bash
npm install
```

### 启动 web

```bash
npm run dev:web
```

默认启动的是 `apps/web`。

启动后访问：

- `http://localhost:3000/`：PDF to Markdown
- `http://localhost:3000/md-to-pdf`：Markdown to PDF

如果 3000 端口被占用，Next.js 会自动切换到其他端口。

### 启动 pdf-api

```bash
npm run dev:pdf-api
```

默认端口：`8788`

可用接口：

- `GET /health`：健康检查
- `POST /api/md-to-pdf`：预留的服务端 Markdown 转 PDF 接口

健康检查示例：

```bash
curl http://localhost:8788/health
```

### 同时开发

建议开两个终端：

终端 1：

```bash
npm run dev:web
```

终端 2：

```bash
npm run dev:pdf-api
```

## 常用命令

在仓库根目录执行：

```bash
# web
npm run dev:web
npm run build:web
npm run start:web
npm run typecheck:web

# pdf-api
npm run dev:pdf-api
npm run build:pdf-api
npm run start:pdf-api
npm run typecheck:pdf-api

# 全仓
npm run build
npm run typecheck
```

## 部署说明

## 1. 部署 apps/web 到 Cloudflare Pages

当前推荐继续将 `apps/web` 作为 Cloudflare Pages 项目部署目录。

### Cloudflare Pages 构建配置

建议配置如下：

- Framework preset: `Next.js`
- Root directory: `apps/web`
- Build command: `npm install && npm run build:web`
- Build output directory: `.next`

如果你的 Pages 项目界面支持 monorepo / root directory 配置，优先使用上面这组配置。

### 可直接复制的 Pages 配置

#### 方案 A：项目 Root directory 设为 `apps/web`

适合 Cloudflare Pages 已正确识别 monorepo 的情况。

- Production branch: `main`
- Root directory: `apps/web`
- Build command: `npm install && npm run build:web`
- Build output directory: `.next`
- Node.js version: `20` 或更高

#### 方案 B：项目 Root directory 保持仓库根目录

适合你已经把 Pages 项目绑定在仓库根目录，暂时不想调整目录设置。

- Production branch: `main`
- Root directory: `/`
- Build command: `npm install && npm run build:web`
- Build output directory: `apps/web/.next`
- Node.js version: `20` 或更高

### 部署前自检

在本地仓库根目录执行：

```bash
npm install
npm run typecheck
npm run build:web
```

通过后再推送到 Cloudflare Pages，通常能减少构建失败。

### Cloudflare Pages 环境变量

当前仓库没有强依赖的公开环境变量才能运行基础功能。

如果后续接入分析、外部 API 或 `pdf-api` 地址，再在 Pages 项目里补充对应变量即可。

### 本地验证生产构建

在提交前可先验证：

```bash
npm run build:web
npm run start:web
```

## 2. 部署 apps/pdf-api

`apps/pdf-api` 不建议部署到 Cloudflare Pages。它是一个独立 Node 服务，更适合部署到支持长期运行 Node 进程的平台，例如：

- Cloudflare Workers（如果后续改造成 Worker 运行时）
- Fly.io
- Railway
- Render
- VPS / Docker / 自建 Node 服务

### 当前启动方式

```bash
npm run build:pdf-api
npm run start:pdf-api
```

默认监听端口：

- `PORT` 未设置时为 `8788`
- 生产环境可通过 `PORT` 覆盖

例如：

```bash
PORT=3001 npm run start:pdf-api
```

### 反向代理或网关建议

如果未来要让 `apps/web` 调用 `apps/pdf-api`，建议：

- 给 `pdf-api` 配置独立域名，例如 `api.mdpdf.net`
- 在 web 端通过环境变量注入 API 地址
- 保持浏览器端 MD-to-PDF 逻辑不变，逐步切换服务端能力

## 当前能力边界

### apps/web

- `/`：PDF to Markdown，当前继续使用 `apps/web/app/api/convert/route.ts`
- `/md-to-pdf`：继续使用浏览器端 PDF 生成逻辑
- `/api/md-to-pdf`：当前仍返回 410，明确提示用户使用页面端功能

### apps/pdf-api

- 已提供 `/health`
- 已提供 `POST /api/md-to-pdf` 占位接口
- 未来可以逐步承接服务端 Markdown 转 PDF 能力

## SEO 与路由说明

这次结构迁移保留了 web 站点的既有公开行为：

- 首页仍是 `/`
- Markdown to PDF 页面仍是 `/md-to-pdf`
- 站点 metadata 保持原值不变
- sitemap 和页面链接中不再引用已移除的 `/pdf-to-md`

## 关键文件

- `package.json`：workspace 根配置与根脚本
- `apps/web/package.json`：web 应用脚本与依赖
- `apps/web/tsconfig.json`：web 本地 TS 配置与别名
- `apps/web/app/layout.tsx`：站点全局 metadata
- `apps/web/app/md-to-pdf/layout.tsx`：MD-to-PDF 页面 metadata
- `apps/web/app/api/convert/route.ts`：PDF to Markdown API
- `apps/pdf-api/src/server.ts`：pdf-api 服务入口
- `apps/pdf-api/src/md-to-pdf.ts`：服务端 MD-to-PDF 起始实现

## 开发建议

- 结构迁移后，优先保持 `apps/web` 行为稳定，不要急着抽共享包
- 等 `apps/pdf-api` 的接口形态稳定后，再考虑把通用逻辑抽到 `packages/*`
- 如果要部署 `pdf-api`，优先先定运行时目标，再决定是否改造成 Worker / Express / Hono 等形式
