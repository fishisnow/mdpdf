"use client";

import dynamic from "next/dynamic";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import ViewModeToggle, { type ResultViewMode } from "@/components/ViewModeToggle";
import MoreTools from "@/components/MoreTools";
import { trackEvent } from "@/lib/analytics";
import type { MarkdownCitation } from "@/lib/markdown-citations";
import { downloadTextFile, workspacePaneHeight } from "@/lib/tools";

const MarkdownHtmlPreview = dynamic(() => import("@/components/MarkdownHtmlPreview"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
      Loading preview…
    </div>
  ),
});

const DEFAULT_MARKDOWN = `# MD Viewer

Write on the left. The MD Viewer updates as you type.

The FDA approved a higher-dose semaglutide product under the National Priority Voucher program [FDA Approves Fourth Product Under National Priority ...](https://www.fda.gov/news-events/press-announcements/fda-approves-fourth-product-under-national-priority-voucher-program-higher-dose-semaglutide).

## Lists and emphasis

- **Bold**, *italic*, and \`inline code\`
- Numbered citations turn Markdown links into [1], [2]
- Task-style notes work as regular lists

## Code

\`\`\`ts
function greet(name: string) {
  return \`Hello, \${name}\`;
}
\`\`\`

## Table

| Tool | What it does |
| --- | --- |
| MD Viewer | Live render while you edit |
| MD to PDF | Export the same document as PDF |

> Everything runs in your browser. Nothing is uploaded.

## References

This References heading is part of the source document. Generated citations appear in a separate list below the preview.
`;

const PREVIEW_CLASS =
  "h-full min-h-0 flex-1 overflow-auto rounded-none border-0 bg-white !p-3 sm:!p-4 !shadow-none";

const faqs = [
  {
    question: "Does MD Viewer upload my text?",
    answer: "No. The editor and renderer run in your browser, so your Markdown stays on your device.",
  },
  {
    question: "How is MD Viewer different from MD to PDF?",
    answer: "MD Viewer is for writing and checking rendered Markdown. Use MD to PDF when you are ready to save the document through the browser print dialog.",
  },
  {
    question: "Can I open an existing .md file in MD Viewer?",
    answer: "Yes. Use Open file to load a Markdown file from your computer, then keep editing it in the split view.",
  },
  {
    question: "Which Markdown features does MD Viewer support?",
    answer:
      "MD Viewer supports GitHub-flavored Markdown, including headings, lists, tables, code blocks, and blockquotes. With Numbered citations on, [title](url) links render as [1], [2]. Generated references appear in a separate list below the preview, so any References already in the source stay in the document.",
  },
  {
    question: "Is MD Viewer free?",
    answer: "Yes. It is free to use in the browser, with no account required.",
  },
] as const;

export default function MarkdownPreviewPage() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [filename, setFilename] = useState("preview");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ResultViewMode>("split");
  const [numberedCitations, setNumberedCitations] = useState(true);
  const [citations, setCitations] = useState<MarkdownCitation[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isSplit = viewMode === "split";
  const paneHeight = workspacePaneHeight(isFullscreen, isSplit);

  const syncFullscreenState = useCallback(() => {
    const active = document.fullscreenElement === viewerRef.current;
    startTransition(() => setIsFullscreen(active));
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    const el = viewerRef.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      void document.exitFullscreen();
      return;
    }
    void el.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, [syncFullscreenState]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 2000);
    trackEvent("markdown_preview_copy", { input_length: markdown.length });
  };

  const handleDownload = () => {
    const safe = filename.replace(/\.md$/i, "").replace(/[^a-zA-Z0-9._-]/g, "_") || "preview";
    downloadTextFile(markdown, `${safe}.md`, "text/markdown");
    trackEvent("markdown_preview_download", { file_name: `${safe}.md`, input_length: markdown.length });
  };

  const handleCitationsChange = useCallback((next: MarkdownCitation[]) => {
    setCitations(next);
  }, []);

  const handleOpenFile = async (file: File) => {
    const text = await file.text();
    setMarkdown(text);
    setFilename(file.name.replace(/\.[^.]+$/, "") || "preview");
    trackEvent("markdown_preview_open_file", { file_name: file.name, input_length: text.length });
  };

  const editorColumnClass = `flex min-h-0 flex-col ${paneHeight}`;
  const previewColumnClass = `flex min-h-0 flex-col ${paneHeight}`;

  const toolbar = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <ViewModeToggle value={viewMode} onChange={setViewMode} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
      >
        Open file
      </button>
      <button
        type="button"
        onClick={() => void handleCopy()}
        disabled={!markdown}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copyState === "copied" ? "Copied" : "Copy"}
      </button>
      <button
        type="button"
        onClick={handleDownload}
        disabled={!markdown.trim()}
        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Download .md
      </button>
      <button
        type="button"
        onClick={handleFullscreenToggle}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
      >
        {isFullscreen ? "Exit" : "Fullscreen"}
      </button>
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10 md:py-12">
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">MD Viewer</h1>
        <p className="mx-auto text-base text-gray-500 sm:text-lg md:whitespace-nowrap">
          Free MD Viewer for live Markdown preview in your browser.
        </p>
      </div>

      <div className="mb-12 flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:gap-6 sm:p-6 md:mb-16 md:p-8">
        <div
          ref={viewerRef}
          className="flex min-h-0 flex-col [&:fullscreen]:box-border [&:fullscreen]:size-full [&:fullscreen]:min-h-0 [&:fullscreen]:bg-white [&:fullscreen]:p-4 sm:[&:fullscreen]:p-6"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleOpenFile(file);
              event.target.value = "";
            }}
          />

          <div className="mb-3 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <label className="shrink-0 text-sm text-gray-600" htmlFor="md-preview-filename">
                Filename
              </label>
              <input
                id="md-preview-filename"
                type="text"
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
                className="min-w-0 max-w-[12rem] flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-[14rem]"
                placeholder="preview"
              />
              <span className="shrink-0 text-sm text-gray-400">.md</span>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={numberedCitations}
                  onChange={(event) => setNumberedCitations(event.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Numbered citations
              </label>
            </div>
            {toolbar}
          </div>

          <div
            className={
              (isFullscreen ? "grid min-h-0 flex-1 gap-4 pt-1 md:gap-6 md:pt-2" : "grid min-h-0 gap-4 md:gap-6") +
              (isSplit ? " grid-cols-1 md:grid-cols-2" : " grid-cols-1")
            }
          >
            {isSplit && (
              <div className={editorColumnClass}>
                <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500">Markdown</span>
                <textarea
                  value={markdown}
                  onChange={(event) => setMarkdown(event.target.value)}
                  placeholder="# Start writing Markdown…"
                  className="min-h-0 w-full flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:p-4"
                />
              </div>
            )}
            <div className={previewColumnClass}>
              <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500">Preview</span>
              <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
                <MarkdownHtmlPreview
                  markdown={markdown}
                  className={PREVIEW_CLASS}
                  numberedCitations={numberedCitations}
                  onCitationsChange={handleCitationsChange}
                />
              </div>
            </div>
          </div>

          {numberedCitations && citations.length > 0 && (
            <aside className="mt-4 shrink-0 rounded-lg border border-gray-200 bg-gray-50">
              <div className="border-b border-gray-200 px-4 py-2">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Generated references</span>
              </div>
              <ol className="max-h-48 space-y-2 overflow-auto px-4 py-3 text-sm text-gray-800">
                {citations.map((citation) => (
                  <li key={`${citation.index}-${citation.href}`} className="leading-6">
                    <span className="mr-1.5 font-semibold text-gray-700">[{citation.index}]</span>
                    <a
                      href={citation.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {citation.label}
                    </a>
                  </li>
                ))}
              </ol>
            </aside>
          )}
        </div>
      </div>

      <p className="mx-auto mb-12 max-w-4xl text-center text-sm leading-relaxed text-gray-600 sm:mb-16 sm:text-base">
        Use this MD Viewer to write and check Markdown without leaving the browser. Paste source on the left, and the preview renders headings, lists, tables, and code as you type. Copy or download the file when you are done; nothing is uploaded.
      </p>

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">Why use MD Viewer?</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Live rendering</h3>
            <p className="text-sm leading-relaxed text-gray-600">MD Viewer updates headings, lists, tables, and code as you type so you can catch formatting issues early.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Split or preview</h3>
            <p className="text-sm leading-relaxed text-gray-600">Keep the source beside the rendered output, or hide the editor when you only need to read the preview.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Stays on your device</h3>
            <p className="text-sm leading-relaxed text-gray-600">The preview runs in the browser. Open a local file, copy the source, or download a .md file without uploading.</p>
          </div>
        </div>
      </section>

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">MD Viewer FAQs</h2>
        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((faq, index) => (
            <div key={faq.question} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <button
                className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-gray-50 sm:px-6"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <span className="ml-auto shrink-0 text-xl text-gray-400">{openFaq === index ? "−" : "+"}</span>
              </button>
              <div className={openFaq === index ? "px-4 pb-4 text-sm leading-relaxed text-gray-600 sm:px-6" : "hidden"}>{faq.answer}</div>
            </div>
          ))}
        </div>
      </section>

      <MoreTools currentHref="/md-viewer" />
    </main>
  );
}
