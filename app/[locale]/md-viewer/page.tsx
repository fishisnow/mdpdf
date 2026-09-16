"use client";

import dynamic from "next/dynamic";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import MarkdownOutline from "@/components/MarkdownOutline";
import ViewModeToggle, { type ResultViewMode } from "@/components/ViewModeToggle";
import MoreTools from "@/components/MoreTools";
import FaqList from "@/components/FaqList";
import { trackEvent } from "@/lib/analytics";
import type { MarkdownCitation } from "@/lib/markdown-citations";
import { extractMarkdownHeadings } from "@/lib/markdown-headings";
import { downloadTextFile, workspacePaneHeight } from "@/lib/tools";

function PreviewLoading() {
  const tCommon = useTranslations("common");
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
      {tCommon("loadingPreview")}
    </div>
  );
}

const MarkdownHtmlPreview = dynamic(() => import("@/components/MarkdownHtmlPreview"), {
  ssr: false,
  loading: PreviewLoading,
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

export default function MarkdownPreviewPage() {
  const t = useTranslations("mdViewer");
  const tCommon = useTranslations("common");
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [filename, setFilename] = useState("preview");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ResultViewMode>("split");
  const [numberedCitations, setNumberedCitations] = useState(true);
  const [citations, setCitations] = useState<MarkdownCitation[]>([]);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [referencesOpen, setReferencesOpen] = useState(true);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isSplit = viewMode === "split";
  const paneHeight = workspacePaneHeight(isFullscreen, isSplit);
  const headings = useMemo(() => extractMarkdownHeadings(markdown), [markdown]);

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

  const handleSelectHeading = useCallback((id: string) => {
    setActiveHeadingId(id);
    const root = previewRef.current;
    const heading = root?.querySelector(`#${CSS.escape(id)}`);
    if (!root || !(heading instanceof HTMLElement)) return;
    const nextTop = root.scrollTop + heading.getBoundingClientRect().top - root.getBoundingClientRect().top;
    root.scrollTo({ top: nextTop, behavior: "smooth" });
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
      {!isFullscreen && <ViewModeToggle value={viewMode} onChange={setViewMode} />}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
      >
        {tCommon("openFile")}
      </button>
      <button
        type="button"
        onClick={() => void handleCopy()}
        disabled={!markdown}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copyState === "copied" ? tCommon("copied") : tCommon("copy")}
      </button>
      <button
        type="button"
        onClick={handleDownload}
        disabled={!markdown.trim()}
        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {tCommon("downloadMd")}
      </button>
      <button
        type="button"
        onClick={handleFullscreenToggle}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
      >
        {isFullscreen ? tCommon("exit") : tCommon("fullscreen")}
      </button>
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10 md:py-12">
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">{t("h1")}</h1>
        <p className="mx-auto text-base text-gray-500 sm:text-lg md:whitespace-nowrap">
          {t("subtitle")}
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
                {tCommon("filename")}
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
                {t("numberedCitations")}
              </label>
            </div>
            {toolbar}
          </div>

          <div
            className={
              isFullscreen
                ? "flex min-h-0 flex-1 gap-3 pt-1"
                : "grid min-h-0 gap-4 md:gap-6" + (isSplit ? " grid-cols-1 md:grid-cols-2" : " grid-cols-1")
            }
          >
            {isFullscreen && (
              <MarkdownOutline
                headings={headings}
                activeId={activeHeadingId}
                open={outlineOpen}
                onOpenChange={setOutlineOpen}
                onSelect={handleSelectHeading}
              />
            )}
            {isSplit && !isFullscreen && (
              <div className={editorColumnClass}>
                <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500">{tCommon("markdown")}</span>
                <textarea
                  value={markdown}
                  onChange={(event) => setMarkdown(event.target.value)}
                  placeholder={t("placeholder")}
                  className="min-h-0 w-full flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:p-4"
                />
              </div>
            )}
            <div className={isFullscreen ? "flex min-h-0 min-w-0 flex-1 flex-col" : previewColumnClass}>
              {!isFullscreen && (
                <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500">{tCommon("preview")}</span>
              )}
              <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
                <MarkdownHtmlPreview
                  markdown={markdown}
                  className={PREVIEW_CLASS}
                  numberedCitations={numberedCitations}
                  onCitationsChange={handleCitationsChange}
                  containerRef={previewRef}
                />
              </div>
            </div>
          </div>

          {numberedCitations && citations.length > 0 && (
            <aside className="mt-4 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {isFullscreen ? (
                <button
                  type="button"
                  onClick={() => setReferencesOpen((value) => !value)}
                  aria-expanded={referencesOpen}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-100"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{t("generatedReferences")}</span>
                  <span className="text-lg leading-none text-gray-400">{referencesOpen ? "−" : "+"}</span>
                </button>
              ) : (
                <div className="border-b border-gray-200 px-4 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{t("generatedReferences")}</span>
                </div>
              )}
              <ol
                className={
                  "max-h-48 space-y-2 overflow-auto px-4 py-3 text-sm text-gray-800 " +
                  (isFullscreen && !referencesOpen ? "hidden" : "") +
                  (isFullscreen && referencesOpen ? "border-t border-gray-200" : "")
                }
              >
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
        {t("intro")}
      </p>

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">{t("whyTitle")}</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("liveTitle")}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{t("liveBody")}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("splitTitle")}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{t("splitBody")}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("privateTitle")}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{t("privateBody")}</p>
          </div>
        </div>
      </section>

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">{t("faqTitle")}</h2>
        <FaqList items={t.raw("faqs")} />
      </section>

      <MoreTools currentHref="/md-viewer" />
    </main>
  );
}
