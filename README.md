# MdPdf

MdPdf is a fast, browser-based document converter for turning PDFs into clean Markdown and exporting Markdown into polished, print-ready PDFs. It is built for creators, developers, and AI/documentation workflows that need content to stay easy to edit, reuse, and publish.

## Features

- Convert `PDF -> Markdown` directly in the browser
- Convert `Markdown -> PDF` with a live preview and the browser's native print dialog
- Keep document workflows simple for editing, copying, and reusing content
- Use a single Next.js app for both tools

## How It Works

### PDF to Markdown

Open `http://localhost:3000/`, upload a PDF, and let the app extract Markdown in the browser UI. The converted content can then be previewed, copied, or downloaded as a `.md` file.

### Markdown to PDF

Open `http://localhost:3000/md-to-pdf` and follow this flow:

1. Write or paste Markdown into the editor
2. Review the live preview
3. Click `Print / Save as PDF`
4. Choose `Save as PDF` in the browser's native print dialog

The page temporarily updates `document.title` before printing so browsers that support it can suggest a better default filename.

## Quick Start

### Requirements

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open:

- `http://localhost:3000/` for PDF to Markdown
- `http://localhost:3000/md-to-pdf` for Markdown to PDF

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- `pdfjs-dist` for PDF parsing
- `react-markdown` and `remark-gfm` for Markdown rendering
- `marked` and `dompurify` for HTML generation and sanitization

## Architecture Notes

MdPdf runs as a single Next.js application with both conversion workflows exposed through the web UI.

- `PDF -> Markdown` runs client-side in the browser
- `Markdown -> PDF` renders HTML in the browser and relies on the native print flow to save as PDF

## Privacy and Network Behavior

The core document conversion flows run in the browser after the page loads. This keeps the editing, rendering, and export experience local to the web UI.

## Deployment

This project can be deployed as a standard Next.js application.

## Contributing

Issues and pull requests are welcome. If you plan to change conversion behavior, UI copy, or deployment-related behavior, keep the browser-first workflow and current architecture notes in sync with the code.

## License

This project is licensed under the MIT License. See `LICENSE` for details.
