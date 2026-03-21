"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "@/components/markdown-components";
import { trackEvent } from "@/lib/analytics";

type Tab = "write" | "preview";

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

export default function MdToPdfPage() {
  const [activeTab, setActiveTab] = useState<Tab>("write");
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [isPrinting, setIsPrinting] = useState(false);
  const [filename, setFilename] = useState("document");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setErrorMessage("");
      window.setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Failed to copy markdown:", error);
      setErrorMessage("Failed to copy markdown to clipboard.");
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10 md:py-12">
      <nav className="mb-6 print:hidden sm:mb-8">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← PDF to MD Converter</Link>
      </nav>

      <div className="mb-8 text-center print:hidden sm:mb-10">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">MD to PDF Converter</h1>
        <p className="mx-auto max-w-3xl text-base text-gray-500 sm:text-lg">
          Write, preview, and export Markdown to PDF directly in your browser.
        </p>
      </div>

      <div className="mb-12 flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm print:mb-0 print:rounded-none print:border-0 print:bg-transparent print:p-0 print:shadow-none sm:gap-6 sm:p-6 md:mb-16 md:p-8">
        <div className="overflow-x-auto border-b border-gray-200 print:hidden">
          <div className="flex min-w-max gap-1">
            <button
              onClick={() => setActiveTab("write")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "write"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Write Markdown
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "preview"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {activeTab === "write" && (
          <div className="relative print:hidden">
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="# Start writing your Markdown here...

## Example

- Item 1
- Item 2

**Bold text** and *italic text*"
              className="h-[320px] w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:h-[360px] md:h-[400px]"
            />
          </div>
        )}

        <div className={activeTab === "preview" ? "block" : "hidden print:block"}>
          <div className="print-document-shell h-[320px] w-full overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 sm:h-[360px] sm:p-5 md:h-[400px] md:p-6 print:h-auto print:overflow-visible print:rounded-none print:border-0 print:bg-transparent print:p-0">
            <article className="print-document mx-auto max-w-none bg-white print:max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {markdown}
              </ReactMarkdown>
            </article>
          </div>
        </div>

        <div className="flex flex-col gap-2 print:hidden sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 md:gap-4">
          <label className="text-sm text-gray-600">Filename:</label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto sm:min-w-[220px]"
            placeholder="document"
          />
          <span className="text-sm text-gray-400">.pdf</span>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 print:hidden">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:flex-wrap sm:gap-4">
          <button
            onClick={handlePrint}
            disabled={!markdown.trim() || isPrinting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isPrinting ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Opening print dialog...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V4h12v5M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v6H6v-6z" />
                </svg>
                Print / Save as PDF
              </>
            )}
          </button>
          <button
            onClick={handleCopy}
            disabled={!markdown}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 sm:w-auto"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? "Copied!" : "Copy Markdown"}
          </button>
        </div>
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
            <p className="text-sm leading-relaxed text-gray-600">Use the same rendered document for on-screen review before saving it as a PDF.</p>
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
                <p className="text-sm text-gray-600">Use the editor to prepare the content you want to export.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">2</span>
              <div>
                <p className="font-medium text-gray-900">Check the preview</p>
                <p className="text-sm text-gray-600">Switch to Preview to review headings, lists, tables, code blocks, and links.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">3</span>
              <div>
                <p className="font-medium text-gray-900">Print and save as PDF</p>
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
