# MdPdf

MdPdf 是一个普通单应用结构的 Next.js 项目，提供两种文档转换能力：

- `PDF to Markdown`：上传 PDF，在站内完成解析并导出 Markdown
- `Markdown to PDF`：在浏览器中渲染打印友好的 HTML，然后通过系统原生打印对话框保存为 PDF

## 仓库结构

```text
.
├── app/                # Next.js App Router 页面与接口
├── components/         # 页面组件
├── lib/                # 转换与分析逻辑
├── public/             # 静态资源
├── package.json
├── package-lock.json
├── next.config.ts
├── postcss.config.mjs
└── tsconfig.json
```

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- `unpdf`：PDF to Markdown
- `react-markdown` + `remark-gfm`：Markdown 预览与打印文档渲染

## 本地开发

### 环境要求

- Node.js 20+
- npm 10+

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

启动后访问：

- `http://localhost:3000/`：PDF to Markdown
- `http://localhost:3000/md-to-pdf`：Markdown to PDF

## 常用命令

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Markdown to PDF 工作方式

`/md-to-pdf` 不依赖独立服务，也不需要额外环境变量。

使用方式：

1. 在编辑器中输入或粘贴 Markdown
2. 切换到 Preview 检查排版效果
3. 点击 `Print / Save as PDF`
4. 在浏览器原生打印对话框中选择 `Save as PDF`

页面会在打印前临时设置 `document.title`，以便浏览器在支持时使用更合适的默认文件名。

## 部署说明

当前项目可直接作为单个 Next.js 应用部署。

### Cloudflare Pages 构建配置

建议配置如下：

- Framework preset: `Next.js`
- Root directory: `/`
- Build command: `npm install && npm run build`
- Build output directory: `.next`
- Node.js version: `20` 或更高

### 部署前自检

```bash
npm install
npm run typecheck
npm run build
```

## 隐私与架构说明

### PDF to Markdown

首页上传的 PDF 仍通过站内接口处理，用于提取 Markdown 内容。

### Markdown to PDF

`/md-to-pdf` 的打印与保存流程在浏览器内完成，不依赖单独的 PDF API 服务。你的 Markdown 内容仅用于当前页面渲染和本地打印预览。

### 兼容性占位接口

`app/api/md-to-pdf/route.ts` 仍保留 `410 Gone` 响应，用于明确提示旧调用方：Markdown to PDF 已迁移为浏览器端打印流程。

## 关键文件

- `package.json`：项目脚本与依赖
- `app/page.tsx`：PDF to Markdown 页面
- `app/md-to-pdf/page.tsx`：Markdown to PDF 页面
- `app/api/convert/route.ts`：PDF to Markdown API
- `app/api/md-to-pdf/route.ts`：旧接口兼容占位响应
- `components/MarkdownPreview.tsx`：PDF to Markdown 结果预览
- `components/markdown-components.tsx`：共享 Markdown 渲染配置
- `app/globals.css`：全局与打印样式
