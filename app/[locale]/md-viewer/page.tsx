"use client";

import dynamic from "next/dynamic";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import MarkdownOutline from "@/components/MarkdownOutline";
import ViewModeToggle, { type ResultViewMode } from "@/components/ViewModeToggle";
import MoreTools from "@/components/MoreTools";
import FaqList from "@/components/FaqList";
import SeoSections, { type SeoSection } from "@/components/SeoSections";
import { trackEvent } from "@/lib/analytics";
import type { MarkdownCitation } from "@/lib/markdown-citations";
import { extractMarkdownHeadings } from "@/lib/markdown-headings";
import { countLines } from "@/lib/md-diff";
import { downloadTextFile, workspacePaneHeight } from "@/lib/tools";

function PreviewLoading() {
  const tCommon = useTranslations("common");
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center rounded-base border-2 border-dashed border-border bg-background text-sm text-foreground/70">
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
  "markdown-preview-lines h-auto min-h-0 min-w-0 flex-1 !overflow-visible rounded-none border-0 bg-secondary-background !py-3 !pr-3 !pl-11 sm:!py-4 sm:!pr-4 sm:!pl-12 !shadow-none";

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
  const lineCount = useMemo(() => countLines(markdown), [markdown]);

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
        className="rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
      >
        {tCommon("openFile")}
      </button>
      <button
        type="button"
        onClick={() => void handleCopy()}
        disabled={!markdown}
        className="rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none disabled:pointer-events-none disabled:opacity-50"
      >
        {copyState === "copied" ? tCommon("copied") : tCommon("copy")}
      </button>
      <button
        type="button"
        onClick={handleDownload}
        disabled={!markdown.trim()}
        className="rounded-base border-2 border-border bg-main px-3 py-2 text-sm font-base text-main-foreground shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none disabled:pointer-events-none disabled:opacity-50"
      >
        {tCommon("downloadMd")}
      </button>
      <button
        type="button"
        onClick={handleFullscreenToggle}
        className="rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
      >
        {isFullscreen ? tCommon("exit") : tCommon("fullscreen")}
      </button>
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10 md:py-12">
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="mb-3 text-3xl font-heading sm:text-4xl">{t("h1")}</h1>
        <p className="mx-auto text-base text-foreground/70 sm:text-lg md:whitespace-nowrap">
          {t("subtitle")}
        </p>
      </div>

      <div className="mb-12 flex flex-col gap-5 neo-panel p-5 sm:gap-6 sm:p-6 md:mb-16 md:p-8">
        <div
          ref={viewerRef}
          className="flex min-h-0 flex-col [&:fullscreen]:box-border [&:fullscreen]:size-full [&:fullscreen]:min-h-0 [&:fullscreen]:bg-secondary-background [&:fullscreen]:p-4 sm:[&:fullscreen]:p-6"
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
              <label className="shrink-0 text-sm text-foreground/80" htmlFor="md-preview-filename">
                {tCommon("filename")}
              </label>
              <input
                id="md-preview-filename"
                type="text"
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
                className="min-w-0 max-w-[12rem] flex-1 rounded-base border-2 border-border bg-secondary-background px-2 py-1.5 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black sm:max-w-[14rem]"
                placeholder="preview"
              />
              <span className="shrink-0 text-sm text-foreground/50">.md</span>
              <label className="inline-flex items-center gap-2 text-sm text-foreground/80">
                <input
                  type="checkbox"
                  checked={numberedCitations}
                  onChange={(event) => setNumberedCitations(event.target.checked)}
                  className="rounded border-border text-foreground underline decoration-2 focus:ring-black"
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
                <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-foreground/60">{tCommon("markdown")}</span>
                <textarea
                  value={markdown}
                  onChange={(event) => setMarkdown(event.target.value)}
                  placeholder={t("placeholder")}
                  className="min-h-0 w-full flex-1 resize-none rounded-base border-2 border-border bg-secondary-background p-3 font-mono text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black sm:p-4"
                />
              </div>
            )}
            <div className={isFullscreen ? "flex min-h-0 min-w-0 flex-1 flex-col" : previewColumnClass}>
              {!isFullscreen && (
                <div className="mb-2 flex h-7 shrink-0 items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-foreground/60">{tCommon("preview")}</span>
                  <span className="text-xs text-foreground/50">{t("lines", { count: lineCount })}</span>
                </div>
              )}
              <div
                ref={previewRef}
                className="min-h-0 w-full flex-1 overflow-auto rounded-lg border border-border bg-secondary-background"
              >
                <MarkdownHtmlPreview
                  markdown={markdown}
                  className={PREVIEW_CLASS}
                  numberedCitations={numberedCitations}
                  sourceLines
                  onCitationsChange={handleCitationsChange}
                />
              </div>
            </div>
          </div>

          {numberedCitations && citations.length > 0 && (
            <aside className="mt-4 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
              {isFullscreen ? (
                <button
                  type="button"
                  onClick={() => setReferencesOpen((value) => !value)}
                  aria-expanded={referencesOpen}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-100"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-foreground/60">{t("generatedReferences")}</span>
                  <span className="text-lg leading-none text-foreground/50">{referencesOpen ? "−" : "+"}</span>
                </button>
              ) : (
                <div className="border-b border-border px-4 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-foreground/60">{t("generatedReferences")}</span>
                </div>
              )}
              <ol
                className={
                  "max-h-48 space-y-2 overflow-auto px-4 py-3 text-sm text-foreground " +
                  (isFullscreen && !referencesOpen ? "hidden" : "") +
                  (isFullscreen && referencesOpen ? "border-t border-border" : "")
                }
              >
                {citations.map((citation) => (
                  <li key={`${citation.index}-${citation.href}`} className="leading-6">
                    <span className="mr-1.5 font-semibold text-foreground/80">[{citation.index}]</span>
                    <a
                      href={citation.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground underline decoration-2 hover:underline"
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

      <p className="mx-auto mb-12 max-w-4xl text-center text-sm leading-relaxed text-foreground/80 sm:mb-16 sm:text-base">
        {t("intro")}
      </p>

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-6 text-center text-2xl font-heading sm:mb-8">{t("whyTitle")}</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="neo-panel p-5 sm:p-6">
            <h3 className="mb-2 text-lg font-heading">{t("liveTitle")}</h3>
            <p className="text-sm leading-relaxed text-foreground/80">{t("liveBody")}</p>
          </div>
          <div className="neo-panel p-5 sm:p-6">
            <h3 className="mb-2 text-lg font-heading">{t("splitTitle")}</h3>
            <p className="text-sm leading-relaxed text-foreground/80">{t("splitBody")}</p>
          </div>
          <div className="neo-panel p-5 sm:p-6">
            <h3 className="mb-2 text-lg font-heading">{t("privateTitle")}</h3>
            <p className="text-sm leading-relaxed text-foreground/80">{t("privateBody")}</p>
          </div>
        </div>
      </section>

      <SeoSections className="mb-12 sm:mb-16" sections={t.raw("seoSections") as SeoSection[]} />

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-4 text-center text-2xl font-heading">{t("faqTitle")}</h2>
        <FaqList items={t.raw("faqs")} />
      </section>

      <MoreTools currentHref="/md-viewer" />
    </main>
  );
}
