"use client";

import dynamic from "next/dynamic";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

const MarkdownHtmlPreview = dynamic(() => import("@/components/MarkdownHtmlPreview"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
      Loading preview…
    </div>
  ),
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
  "h-full min-h-0 flex-1 overflow-auto rounded-none border-0 bg-white !p-3 sm:!p-4 !shadow-none";

export default function MdToPdfPage() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [isPrinting, setIsPrinting] = useState(false);
  const [filename, setFilename] = useState("document");
  const [errorMessage, setErrorMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement | null>(null);

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
      setErrorMessage("Please enter some Markdown content first.");
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
      const message = err instanceof Error ? err.message : "Failed to open the print dialog. Please try again.";
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
  const splitColumnHeights = isFullscreen ? "min-h-0 flex-1" : "h-[320px] sm:h-[360px] md:h-[400px]";
  const editorColumnClass = `flex min-h-0 flex-col print:hidden ${splitColumnHeights}`;
  const previewColumnClass = `flex min-h-0 flex-col print:h-auto print:min-h-0 print:max-h-none print:overflow-visible ${splitColumnHeights}`;

  const previewShellClass =
    "print-document-shell flex w-full min-h-0 flex-1 flex-col overflow-y-auto rounded-lg border border-gray-200 bg-white p-0 print:h-auto print:min-h-0 print:max-h-none print:overflow-visible print:rounded-none print:border-0 print:bg-transparent print:p-0 " +
    (isFullscreen ? "min-h-0" : "");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 print:block print:h-auto print:max-h-none print:overflow-visible sm:py-10 md:py-12">
      <nav className="mb-6 print:hidden sm:mb-8">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← PDF to MD Converter</Link>
      </nav>

      <div className="mb-8 text-center print:hidden sm:mb-10">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">MD to PDF Converter</h1>
        <p className="mx-auto max-w-3xl text-base text-gray-500 sm:text-lg">
          Write, preview, and export Markdown to PDF directly in your browser.
        </p>
      </div>

      <div className="mb-12 flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm print:mb-0 print:block print:h-auto print:max-h-none print:overflow-visible print:rounded-none print:border-0 print:bg-transparent print:p-0 print:shadow-none sm:gap-6 sm:p-6 md:mb-16 md:p-8">
        <div
          ref={viewerRef}
          className={
            "flex min-h-0 flex-col print:h-auto print:min-h-0 print:max-h-none print:overflow-visible " +
            "[&:fullscreen]:box-border [&:fullscreen]:size-full [&:fullscreen]:min-h-0 [&:fullscreen]:bg-white [&:fullscreen]:p-4 sm:[&:fullscreen]:p-6"
          }
        >
          {errorMessage && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 print:hidden">
              {errorMessage}
            </div>
          )}

          {isFullscreen && (
            <div className="mb-3 flex shrink-0 flex-col gap-3 border-b border-gray-200 pb-3 print:hidden sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <span className="text-sm font-medium text-gray-700">Write & Preview</span>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <label className="shrink-0 text-xs text-gray-600 sm:text-sm" htmlFor="md-pdf-filename-fs">
                    Filename
                  </label>
                  <input
                    id="md-pdf-filename-fs"
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="min-w-0 max-w-[12rem] flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-[14rem]"
                    placeholder="document"
                  />
                  <span className="shrink-0 text-sm text-gray-400">.pdf</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    disabled={!markdown.trim() || isPrinting}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPrinting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Opening…
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V4h12v5M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v6H6v-6z" />
                        </svg>
                        Save as PDF
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleFullscreenToggle}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Exit
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            className={
              (isFullscreen
                ? "grid min-h-0 flex-1 grid-cols-1 gap-4 pt-1 md:grid-cols-2 md:gap-6 md:pt-2"
                : "grid min-h-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-6") +
              " print:overflow-visible print:h-auto print:max-h-none"
            }
          >
            <div className={editorColumnClass}>
              <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500">Write Markdown</span>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="# Start writing your Markdown here...

## Example

- Item 1
- Item 2

**Bold text** and *italic text*"
                className="min-h-0 w-full flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:p-4"
              />
            </div>

            <div className={previewColumnClass}>
              <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500 print:hidden">Preview</span>
              <div className={previewShellClass}>
                <article className="print-document flex h-full min-h-0 w-full max-w-none flex-1 flex-col bg-white print:block print:h-auto print:max-h-none print:min-h-0 print:overflow-visible print:max-w-none">
                  <MarkdownHtmlPreview markdown={markdown} className={MD_TO_PDF_PREVIEW_CLASS} />
                </article>
              </div>
            </div>
          </div>
        </div>

        {!isFullscreen && (
          <div className="flex flex-col gap-4 print:hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                <label className="shrink-0 text-sm text-gray-600" htmlFor="md-pdf-filename">
                  Filename:
                </label>
                <input
                  id="md-pdf-filename"
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-xs sm:flex-none"
                  placeholder="document"
                />
                <span className="shrink-0 text-sm text-gray-400">.pdf</span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={handleFullscreenToggle}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Fullscreen
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!markdown.trim() || isPrinting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPrinting ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Opening…
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V4h12v5M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v6H6v-6z" />
                      </svg>
                      Save as PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <section className="mb-12 print:hidden sm:mb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">Why Use Our MD to PDF Converter?</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Native browser flow</h3>
            <p className="text-sm leading-relaxed text-gray-600">Render Markdown in the page, then export it through your browser's built-in print dialog.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Preview before saving</h3>
            <p className="text-sm leading-relaxed text-gray-600">The live preview updates as you type so you can review headings, lists, and tables before printing.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Frontend only</h3>
            <p className="text-sm leading-relaxed text-gray-600">Your Markdown stays in the browser for the print workflow, with no separate PDF API dependency.</p>
          </div>
        </div>
      </section>

      <section className="mb-12 print:hidden sm:mb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">How to Save Markdown as PDF</h2>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 md:p-8">
          <ol className="space-y-4">
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">1</span>
              <div>
                <p className="font-medium text-gray-900">Write or paste your Markdown</p>
                <p className="text-sm text-gray-600">Use the editor on the left to prepare the content you want to export.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">2</span>
              <div>
                <p className="font-medium text-gray-900">Check the preview</p>
                <p className="text-sm text-gray-600">Review the rendered document on the right; it updates as you edit.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">3</span>
              <div>
                <p className="font-medium text-gray-900">Save as PDF</p>
                <p className="text-sm text-gray-600">Open the browser print dialog and choose Save as PDF or your preferred print destination.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <div className="text-center print:hidden">
        <p className="mb-4 text-gray-600">Need the opposite conversion?</p>
        <Link href="/" className="inline-flex max-w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-center text-white transition-colors hover:bg-blue-700">
          Try PDF to Markdown Converter →
        </Link>
      </div>
    </main>
  );
}
