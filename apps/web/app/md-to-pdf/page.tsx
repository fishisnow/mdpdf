"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { trackEvent } from "@/lib/analytics";

type Tab = "write" | "preview";

const PDF_API_BASE_URL = process.env.NEXT_PUBLIC_PDF_API_BASE_URL;

const previewComponents: Components = {
  h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-900 mb-4">{children}</h1>,
  h2: ({ children }) => <h2 className="text-2xl font-semibold text-gray-900 mb-3 mt-6">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">{children}</h3>,
  p: ({ children }) => <p className="text-gray-800 leading-7 mb-3">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1.5 text-gray-800">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-gray-800">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-300 bg-gray-50 pl-4 py-2 my-4 text-gray-600 italic rounded-r">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-5 border-gray-300" />,
  code: ({ children, className }) => {
    const isBlock = Boolean(className);
    if (!isBlock) {
      return (
        <code className="px-1.5 py-0.5 bg-gray-200 rounded text-sm font-mono text-gray-900">
          {children}
        </code>
      );
    }

    const language = className?.replace(/^language-/, "").toUpperCase();
    return (
      <div className="mb-4">
        {language ? (
          <div className="text-[11px] font-semibold text-gray-500 mb-1 tracking-wide">{language}</div>
        ) : null}
        <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg text-sm leading-6 font-mono overflow-x-auto">
          {children}
        </code>
      </div>
    );
  },
  pre: ({ children }) => <pre className="mb-0">{children}</pre>,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full border border-gray-300 text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
  th: ({ children }) => <th className="border border-gray-300 px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-gray-300 px-3 py-2">{children}</td>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700">
      {children}
    </a>
  ),
};

export default function MdToPdfPage() {
  const [activeTab, setActiveTab] = useState<Tab>("write");
  const [markdown, setMarkdown] = useState("# Welcome to MdPdf\n\nStart writing your Markdown here...\n\n## Features\n\n- Fast conversion\n- Clean output\n- Free to use\n\n## Code Example\n\n```javascript\nconst hello = \"world\";\nconsole.log(hello);\n```\n\n> This is a blockquote example.\n\n---\n\nEnd of document.");
  const [isConverting, setIsConverting] = useState(false);
  const [filename, setFilename] = useState("document");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const getSafeFilename = (value: string): string => {
    const trimmed = value.replace(/\.pdf$/i, "").trim();
    const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
    return safe || "document";
  };

  const handleConvert = async () => {
    if (!markdown.trim()) {
      setErrorMessage("Please enter some Markdown content first.");
      return;
    }

    if (!PDF_API_BASE_URL) {
      setErrorMessage("PDF service is not configured. Please set NEXT_PUBLIC_PDF_API_BASE_URL.");
      return;
    }

    setIsConverting(true);
    setErrorMessage("");

    try {
      const safeFilename = getSafeFilename(filename);
      trackEvent("md_to_pdf_click", {
        file_name: `${safeFilename}.pdf`,
        input_length: markdown.length,
      });

      const response = await fetch(`${PDF_API_BASE_URL}/api/md-to-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markdown }),
      });

      if (!response.ok) {
        let message = "Failed to convert. Please try again.";

        try {
          const data = (await response.json()) as { error?: unknown };
          if (typeof data.error === "string" && data.error.trim()) {
            message = data.error;
          }
        } catch {
          // Ignore JSON parsing failures and use the fallback message.
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      trackEvent("md_to_pdf_success", {
        file_name: `${safeFilename}.pdf`,
        input_length: markdown.length,
        output_size_kb: Math.round(blob.size / 1024),
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeFilename}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      trackEvent("md_to_pdf_download", {
        file_name: `${safeFilename}.pdf`,
        output_size_kb: Math.round(blob.size / 1024),
      });
    } catch (err) {
      console.error("Failed to convert markdown to pdf:", err);
      const message =
        err instanceof Error ? err.message : "Failed to convert. Please try again.";
      setErrorMessage(
        message,
      );
      trackEvent("md_to_pdf_error", {
        error_message: message.slice(0, 120),
        input_length: markdown.length,
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Failed to copy markdown:", error);
      setErrorMessage("Failed to copy markdown to clipboard.");
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 sm:mb-8">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Back to MdPdf</Link>
      </nav>

      {/* Hero Section */}
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">Markdown to PDF Converter</h1>
        <p className="mx-auto max-w-3xl text-base text-gray-500 sm:text-lg">Convert Markdown to PDF instantly. Free online tool for developers, writers, and content creators</p>
      </div>

      {/* Tool Section */}
      <div className="mb-12 flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:gap-6 sm:p-6 md:mb-16 md:p-8">
        {/* Tab Navigation */}
        <div className="overflow-x-auto border-b border-gray-200">
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
          <div className="relative">
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

        {activeTab === "preview" && (
          <div className="h-[320px] w-full overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 sm:h-[360px] sm:p-5 md:h-[400px] md:p-6">
            <div className="max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={previewComponents}>
                {markdown}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Filename input */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 md:gap-4">
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
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <button
            onClick={handleConvert}
            disabled={!markdown.trim() || isConverting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isConverting ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Converting...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Convert to PDF
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

      {/* Features Section */}
      <section className="mb-12 sm:mb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">Why Use Our Markdown to PDF Converter?</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 text-3xl">⚡</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Lightning Fast</h3>
            <p className="text-sm leading-relaxed text-gray-600">Convert your Markdown to PDF in seconds. No delays, no hassle.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 text-3xl">🎯</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Clean Formatting</h3>
            <p className="text-sm leading-relaxed text-gray-600">Preserves headers, lists, code blocks, and links in your PDF output.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 text-3xl">💯</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Completely Free</h3>
            <p className="text-sm leading-relaxed text-gray-600">No watermarks, no limits. Convert as many files as you need.</p>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="mb-12 sm:mb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">How to Convert Markdown to PDF</h2>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 md:p-8">
          <ol className="space-y-4">
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">1</span>
              <div>
                <p className="font-medium text-gray-900">Write or paste your Markdown</p>
                <p className="text-sm text-gray-600">Use the editor above to write your Markdown content</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">2</span>
              <div>
                <p className="font-medium text-gray-900">Preview your content</p>
                <p className="text-sm text-gray-600">Switch to preview tab to see how it will look</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">3</span>
              <div>
                <p className="font-medium text-gray-900">Download as PDF</p>
                <p className="text-sm text-gray-600">Click the button to convert and download your PDF file</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Related Link */}
      <div className="text-center">
        <p className="mb-4 text-gray-600">Need the opposite conversion?</p>
        <Link href="/" className="inline-flex max-w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-center text-white transition-colors hover:bg-blue-700">
          Try PDF to Markdown Converter →
        </Link>
      </div>
    </main>
  );
}