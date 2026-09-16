"use client";

import dynamic from "next/dynamic";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import ViewModeToggle, { type ResultViewMode } from "@/components/ViewModeToggle";
import MoreTools from "@/components/MoreTools";
import FaqList from "@/components/FaqList";
import SeoSections, { type SeoSection } from "@/components/SeoSections";

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

const DEFAULT_MARKDOWN = `# Welcome to MdPdf

Start writing your Markdown here...

## Features

- Native browser print flow
- Print-friendly preview
- Free to use

## Code Example

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`

> This is a blockquote example.

| Language | Notes |
| --- | --- |
| English | Printable in the browser |
| 中文 | 支持中英文混排预览 |

---

End of document.`;

/** 嵌在带边框的 shell 内：用 !padding 覆盖 MarkdownHtmlPreview 默认大内边距，避免「边框离正文过远」 */
const MD_TO_PDF_PREVIEW_CLASS =
  "h-full min-h-0 flex-1 overflow-auto rounded-none border-0 bg-secondary-background !p-3 sm:!p-4 !shadow-none";

export default function MdToPdfPage() {
  const t = useTranslations("mdToPdf");
  const tCommon = useTranslations("common");
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [isPrinting, setIsPrinting] = useState(false);
  const [filename, setFilename] = useState("document");
  const [errorMessage, setErrorMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ResultViewMode>("split");
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const isSplit = viewMode === "split";

  const getSafeFilename = (value: string): string => {
    const trimmed = value.replace(/\.pdf$/i, "").trim();
    const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
    return safe || "document";
  };

  useEffect(() => {
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

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
    const req = el.requestFullscreen({ navigationUI: "hide" });
    req?.catch(() => {});
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, [syncFullscreenState]);

  const handlePrint = async () => {
    if (!markdown.trim()) {
      setErrorMessage(t("emptyError"));
      return;
    }

    const safeFilename = getSafeFilename(filename);
    const previousTitle = document.title;

    setErrorMessage("");
    setIsPrinting(true);

    try {
      document.title = `${safeFilename}.pdf`;
      trackEvent("md_to_pdf_print_start", {
        file_name: `${safeFilename}.pdf`,
        input_length: markdown.length,
      });
      window.print();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("printError");
      console.error("Failed to print markdown:", err);
      setErrorMessage(message);
      setIsPrinting(false);
      trackEvent("md_to_pdf_print_error", {
        error_message: message.slice(0, 120),
        input_length: markdown.length,
      });
    } finally {
      window.setTimeout(() => {
        document.title = previousTitle;
      }, 0);
    }
  };

  /** 两列共用同一总高度（含栏目标题），避免左右边框底不齐 */
  const splitColumnHeights = isFullscreen
    ? "min-h-0 flex-1"
    : isSplit
      ? "h-[480px] sm:h-[620px] md:h-[860px]"
      : "h-[580px] sm:h-[740px] md:h-[980px]";
  const editorColumnClass = `flex min-h-0 flex-col print:hidden ${splitColumnHeights}`;
  const previewColumnClass = `flex min-h-0 flex-col print:h-auto print:min-h-0 print:max-h-none print:overflow-visible ${splitColumnHeights}`;

  const previewShellClass =
    "print-document-shell flex w-full min-h-0 flex-1 flex-col overflow-y-auto rounded-lg border border-border bg-secondary-background p-0 print:h-auto print:min-h-0 print:max-h-none print:overflow-visible print:rounded-none print:border-0 print:bg-transparent print:p-0 " +
    (isFullscreen ? "min-h-0" : "");

  return (
    <main className="mx-auto w-full max-w-[90rem] px-4 py-8 print:block print:h-auto print:max-h-none print:overflow-visible sm:px-6 sm:py-10 md:py-12">
      <div className="mb-8 text-center print:hidden sm:mb-10">
        <h1 className="mb-3 text-3xl font-heading sm:text-4xl">{t("h1")}</h1>
        <p className="mx-auto text-base text-foreground/70 sm:text-lg md:whitespace-nowrap">
          {t("subtitle")}
        </p>
      </div>

      <div className="mb-12 flex flex-col gap-5 neo-panel p-5 print:mb-0 print:block print:h-auto print:max-h-none print:overflow-visible print:rounded-none print:border-0 print:bg-transparent print:p-0 print:shadow-none sm:gap-6 sm:p-6 md:mb-16 md:p-8">
        <div
          ref={viewerRef}
          className={
            "flex min-h-0 flex-col print:h-auto print:min-h-0 print:max-h-none print:overflow-visible " +
            "[&:fullscreen]:box-border [&:fullscreen]:size-full [&:fullscreen]:min-h-0 [&:fullscreen]:bg-secondary-background [&:fullscreen]:p-4 sm:[&:fullscreen]:p-6"
          }
        >
          {errorMessage && (
            <div className="mb-3 rounded-base border-2 border-border bg-chart-2 p-3 text-sm font-base shadow-shadow print:hidden">
              {errorMessage}
            </div>
          )}

          {isFullscreen && (
            <div className="mb-3 flex shrink-0 flex-col gap-3 border-b border-border pb-3 print:hidden sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <span className="text-sm font-heading">{tCommon("writeAndPreview")}</span>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <label className="shrink-0 text-xs text-foreground/70 sm:text-sm" htmlFor="md-pdf-filename-fs">
                    {tCommon("filename")}
                  </label>
                  <input
                    id="md-pdf-filename-fs"
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="min-w-0 max-w-[12rem] flex-1 rounded-base border-2 border-border bg-secondary-background px-2 py-1.5 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black sm:max-w-[14rem]"
                    placeholder="document"
                  />
                  <span className="shrink-0 text-sm text-foreground/50">.pdf</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    disabled={!markdown.trim() || isPrinting}
                    className="inline-flex items-center justify-center gap-1.5 rounded-base border-2 border-border bg-main px-3 py-2 text-sm font-base text-main-foreground shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isPrinting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {tCommon("opening")}
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V4h12v5M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v6H6v-6z" />
                        </svg>
                        {tCommon("saveAsPdf")}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleFullscreenToggle}
                    className="rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
                  >
                    {tCommon("exit")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isFullscreen && (
            <div className="mb-4 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                <label className="shrink-0 text-sm text-foreground/80" htmlFor="md-pdf-filename">
                  {tCommon("filename")}
                </label>
                <input
                  id="md-pdf-filename"
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="min-w-0 flex-1 rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black sm:max-w-xs sm:flex-none"
                  placeholder="document"
                />
                <span className="shrink-0 text-sm text-foreground/50">.pdf</span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
                <button
                  type="button"
                  onClick={handleFullscreenToggle}
                  className="rounded-base border-2 border-border bg-secondary-background px-4 py-2.5 text-sm shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
                >
                  {tCommon("fullscreen")}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!markdown.trim() || isPrinting}
                  className="inline-flex items-center justify-center gap-2 rounded-base border-2 border-border bg-main px-5 py-2.5 text-sm font-base text-main-foreground shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none disabled:pointer-events-none disabled:opacity-50"
                >
                  {isPrinting ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {tCommon("opening")}
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V4h12v5M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v6H6v-6z" />
                      </svg>
                      {tCommon("saveAsPdf")}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div
            className={
              (isFullscreen
                ? "grid min-h-0 flex-1 gap-4 pt-1 md:gap-6 md:pt-2"
                : "grid min-h-0 gap-4 md:gap-6") +
              (isSplit ? " grid-cols-1 md:grid-cols-2" : " grid-cols-1") +
              " print:grid-cols-1 print:h-auto print:max-h-none print:overflow-visible"
            }
          >
            {isSplit && (
            <div className={editorColumnClass}>
              <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-foreground/60">{tCommon("writeMarkdown")}</span>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="# Start writing your Markdown here...

## Example

- Item 1
- Item 2

**Bold text** and *italic text*"
                className="min-h-0 w-full flex-1 resize-none rounded-base border-2 border-border bg-secondary-background p-3 font-mono text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black sm:p-4"
              />
            </div>
            )}

            <div className={previewColumnClass}>
              <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-foreground/60 print:hidden">{tCommon("preview")}</span>
              <div className={previewShellClass}>
                <article className="print-document flex h-full min-h-0 w-full max-w-none flex-1 flex-col bg-secondary-background print:block print:h-auto print:max-h-none print:min-h-0 print:overflow-visible print:max-w-none">
                  <MarkdownHtmlPreview markdown={markdown} className={MD_TO_PDF_PREVIEW_CLASS} />
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mx-auto mb-12 max-w-4xl text-center text-sm leading-relaxed text-foreground/80 print:hidden sm:mb-16 sm:text-base">
        {t("intro")}
      </p>

      <section className="mb-12 print:hidden sm:mb-16">
        <h2 className="mb-6 text-center text-2xl font-heading sm:mb-8">{t("whyTitle")}</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="neo-panel p-5 sm:p-6">
            <h3 className="mb-2 text-lg font-heading">{t("nativeTitle")}</h3>
            <p className="text-sm leading-relaxed text-foreground/80">{t("nativeBody")}</p>
          </div>
          <div className="neo-panel p-5 sm:p-6">
            <h3 className="mb-2 text-lg font-heading">{t("previewTitle")}</h3>
            <p className="text-sm leading-relaxed text-foreground/80">{t("previewBody")}</p>
          </div>
          <div className="neo-panel p-5 sm:p-6">
            <h3 className="mb-2 text-lg font-heading">{t("frontendTitle")}</h3>
            <p className="text-sm leading-relaxed text-foreground/80">{t("frontendBody")}</p>
          </div>
        </div>
      </section>

      <section className="mb-12 print:hidden sm:mb-16">
        <h2 className="mb-6 text-center text-2xl font-heading sm:mb-8">{t("howTitle")}</h2>
        <div className="neo-panel p-5 sm:p-6 md:p-8">
          <ol className="space-y-4">
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main font-heading">1</span>
              <div>
                <p className="font-heading">{t("step1Title")}</p>
                <p className="text-sm text-foreground/80">{t("step1Body")}</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main font-heading">2</span>
              <div>
                <p className="font-heading">{t("step2Title")}</p>
                <p className="text-sm text-foreground/80">{t("step2Body")}</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main font-heading">3</span>
              <div>
                <p className="font-heading">{t("step3Title")}</p>
                <p className="text-sm text-foreground/80">{t("step3Body")}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <SeoSections
        className="mb-12 print:hidden sm:mb-16"
        sections={t.raw("seoSections") as SeoSection[]}
      />

      <section className="mb-12 print:hidden sm:mb-16">
        <h2 className="mb-4 text-center text-2xl font-heading">{t("faqTitle")}</h2>
        <FaqList items={t.raw("faqs")} />
      </section>

      <div className="print:hidden">
        <MoreTools currentHref="/md-to-pdf" />
      </div>
    </main>
  );
}
