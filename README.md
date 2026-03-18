# PDF to MD Converter

将 PDF 文档转换为 Markdown 格式的在线工具。

## 技术栈

- **前端**: Next.js 16 + React 19 + TypeScript
- **样式**: Tailwind CSS 4
- **PDF 解析**: [unpdf](https://github.com/unjs/unpdf) - 基于 PDF.js 的 Node.js 封装
- **Markdown 预览**: react-markdown + remark-gfm

## 架构概述

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   UploadZone    │────▶│   /api/convert   │────▶│  pdf-to-md.ts   │
│  (文件上传组件)  │     │   (API 路由)      │     │  (核心转换逻辑)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │ MarkdownPreview  │
                        │  (结果预览组件)   │
                        └──────────────────┘
```

## 前后端分离

本项目采用 **BFF (Backend for Frontend)** 模式，Next.js 同时承担前端渲染和后端 API 服务：

### 前端 (客户端)

| 组件 | 说明 |
|------|------|
| `app/page.tsx` | 主页面组件，管理转换状态和流程 |
| `components/UploadZone.tsx` | 拖拽/点击上传组件，支持 PDF 文件选择 |
| `components/MarkdownPreview.tsx` | Markdown 预览组件，支持源码/预览切换 |
| `components/ProgressBar.tsx` | 转换进度条组件 |

### 后端 (服务端 API)

| 路由 | 说明 |
|------|------|
| `app/api/convert/route.ts` | PDF 转换 API 端点 |

- 使用 Next.js App Router 的 Route Handler
- 配置 `maxDuration: 60` 支持较长的转换时间
- 接收 FormData 上传的 PDF 文件

### 核心转换逻辑

位于 `lib/pdf-to-md.ts`，核心流程：

1. **PDF 解析**: 使用 `unpdf` 库读取 PDF 文档，获取每页文本内容
2. **文本提取**: 获取每个文本项的坐标 (x, y)、字体高度等信息
3. **过滤页脚**: 过滤掉页面底部 10% 的短文本（页码、日期等）
4. **行分组**: 根据 Y 坐标相近原则，将文本项分组为行
5. **Markdown 生成**:
   - 根据字体大小判断标题级别（h1/h2/h3）
   - 检测列表标记（•, -, *）转换为 Markdown 列表
   - 根据行间距判断段落分隔
   - 保留普通文本段落

### 转换算法要点

- **字体大小检测**: 计算中位字体大小，较大者判定为标题
  - `ratio >= 1.8` → H1
  - `ratio >= 1.4` → H2
  - `ratio >= 1.15` → H3
- **行间距检测**: 计算中位行间距，间距大于 1.2 倍时判定为段落分隔
- **页脚过滤**: 页面底部 10% 区域中，少于 20 字符的文本视为页脚

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

打开 http://localhost:3000 即可使用。

## 环境要求

- Node.js 18+
- npm 或 yarn