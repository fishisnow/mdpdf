"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import UploadZone from "@/components/UploadZone";
import MarkdownPreview from "@/components/MarkdownPreview";
import ProgressBar from "@/components/ProgressBar";
import { trackEvent } from "@/lib/analytics";
import type { ConversionProgress } from "@/lib/pdf-to-md";

type State = "idle" | "converting" | "done" | "error";

const faqs = [
  {
    question: "How does MdPdf work?",
    answer: "Simply upload your PDF document, and our system will extract the text while preserving its structure. It analyzes headings, lists, tables, and code-like content so the Markdown is easier to edit right away."
  },
  {
    question: "Is it really free to use?",
    answer: "Yes, absolutely. MdPdf is free to use, with no hidden charges, watermarks, or file limits. You can convert as many documents as you need."
  },
  {
    question: "Do I need to install any software?",
    answer: "Not at all. MdPdf runs entirely in your web browser, so you can upload a file and start working with the output right away."
  },
  {
    question: "Can I convert Markdown back to PDF?",
    answer: "Yes! Use our MD to PDF converter to transform your Markdown documents into polished PDF files."
  },
  {
    question: "What happens to my files after conversion?",
    answer: "Your files are processed securely and are automatically deleted after conversion. We don't store or share any of your documents."
  },
  {
    question: "Will the formatting be preserved?",
    answer: "MdPdf preserves document structure including headers, bullet points, numbered lists, tables, and basic formatting. It also does a better job with code blocks, so the Markdown stays cleaner and easier to edit."
  }
];

function describeProgress(progress: ConversionProgress): { label: string; percent: number } {
  if (progress.stage === "loading") {
    return { label: "Reading file in your browser...", percent: 15 };
  }

  if (progress.stage === "parsing") {
    const current = progress.currentPage ?? 0;
    const total = progress.totalPages ?? 0;
    const safeTotal = total > 0 ? total : 1;
    const percent = 20 + Math.round((current / safeTotal) * 65);
    return {
      label: total > 0
        ? `Parsing page ${current} of ${total} in a background worker...`
        : "Parsing PDF pages in a background worker...",
      percent,
    };
  }

  return { label: "Generating Markdown...", percent: 95 };
}

function normalizeConversionError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("password") || lower.includes("encrypted")) {
    return "This PDF is encrypted or password-protected and cannot be converted in the browser.";
  }

  if (
    lower.includes("invalid") ||
    lower.includes("corrupt") ||
    lower.includes("formaterror") ||
    lower.includes("unexpected response") ||
    lower.includes("missing pdf")
  ) {
    return "This file does not look like a valid PDF, or it may be corrupted.";
  }

  if (
    lower.includes("no selectable text") ||
    lower.includes("no text") ||
    lower.includes("image-based") ||
    lower.includes("scanned")
  ) {
    return "This PDF appears to be scanned or image-based, so there may not be selectable text to convert.";
  }

  if (
    lower.includes("worker crashed") ||
    lower.includes("unknownerrorexception") ||
    lower.includes("abortexception") ||
    lower.includes("out of memory")
  ) {
    return "The browser could not finish parsing this PDF. Try a smaller file, a different browser, or a text-based PDF.";
  }

  return message || "Conversion failed";
}

export default function Home() {
  const [state, setState] = useState<State>("idle");
  const [markdown, setMarkdown] = useState("");
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [progress, setProgress] = useState<ConversionProgress>({ stage: "loading" });

  const progressView = useMemo(() => describeProgress(progress), [progress]);

  const handleUpload = async (file: File) => {
    trackEvent("pdf_to_md_click", {
      file_name: file.name,
      file_size_kb: Math.round(file.size / 1024),
      source_page: "home",
    });

    setState("converting");
    setFilename(file.name);
    setError("");
    setMarkdown("");
    setProgress({ stage: "loading" });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const { convertPdfToMarkdown } = await import("@/lib/pdf-to-md");
      const text = await convertPdfToMarkdown(new Uint8Array(arrayBuffer), setProgress);

      setMarkdown(text);
      setProgress({ stage: "rendering" });
      setState("done");
      trackEvent("pdf_to_md_success", {
        file_name: file.name,
        output_length: text.length,
        source_page: "home",
      });
    } catch (err: unknown) {
      console.error("PDF to Markdown conversion failed", {
        fileName: file.name,
        fileSize: file.size,
        rawError: err,
        message: err instanceof Error ? err.message : "Unknown error",
      });

      const message = normalizeConversionError(err instanceof Error ? err.message : "Unknown error");
      setError(message);
      setState("error");
      trackEvent("pdf_to_md_error", {
        file_name: file.name,
        error_message: message.slice(0, 120),
        source_page: "home",
      });
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10 md:py-12">
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">MdPdf - PDF to MD Converter</h1>
        <p className="mx-auto max-w-2xl text-base text-gray-500 sm:text-lg">Turn hard-to-edit PDFs into clean Markdown, then use our MD to PDF Converter when you need to export back.</p>
      </div>

      <div className="mb-8 flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:gap-6 sm:p-6 md:p-8">
        <div className="mb-1 text-center sm:mb-2">
          <h2 className="text-xl font-bold text-gray-900">PDF to MD Converter</h2>
          <p className="text-sm text-gray-500">Upload a PDF and get clean Markdown that is easier to edit, reuse, and publish.</p>
        </div>
        <UploadZone onUpload={handleUpload} disabled={state === "converting"} />

        {state === "converting" && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500">
              {progressView.label} <span className="font-medium break-all">{filename}</span>
            </p>
            <ProgressBar progress={progressView.percent} />
          </div>
        )}

        {state === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {state === "done" && (
          <MarkdownPreview
            markdown={markdown}
            filename={filename}
            onDownload={({ filename: downloadName, markdownLength }) => {
              trackEvent("pdf_to_md_download", {
                file_name: downloadName,
                output_length: markdownLength,
                source_page: "home",
              });
            }}
          />
        )}
      </div>

      <div className="mb-12 sm:mb-16">
        <Link
          href="/md-to-pdf"
          className="group block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md sm:p-6"
        >
          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
              <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-gray-900 transition-colors group-hover:text-indigo-600">MD to PDF Converter →</span>
            </div>
          </div>
        </Link>
      </div>

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">Why Choose MdPdf?</h2>
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 md:p-8">
          <p className="text-sm leading-7 text-gray-600 sm:text-base">
            Many PDF files are hard to reuse because headings, lists, tables, and code samples become messy after manual copy and paste. MdPdf helps you turn PDFs into structured Markdown that is easier to clean up, edit, and publish. The workflow is fast, free, and especially useful when you need readable output for technical notes, documentation, tables, or code blocks.
          </p>
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 text-3xl">⚡</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Lightning Fast</h3>
            <p className="text-sm leading-relaxed text-gray-600">Convert pdf to md in seconds with a streamlined workflow that helps you move from PDF files to editable Markdown faster.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 text-3xl">🎯</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">High Accuracy</h3>
            <p className="text-sm leading-relaxed text-gray-600">Our pdf to md converter keeps headings, lists, tables, and code blocks more organized when turning PDFs into Markdown.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 text-3xl">🔒</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Privacy First</h3>
            <p className="text-sm leading-relaxed text-gray-600">Convert pdf to md securely in your browser workflow, and your files are deleted after processing.</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">MdPdf FAQs</h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-gray-500">Everything you need to know about converting PDFs into clean Markdown and exporting Markdown back to PDF.</p>
        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <button
                className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-gray-50 sm:px-6"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <span className="ml-auto shrink-0 text-xl text-gray-400">{openFaq === index ? "−" : "+"}</span>
              </button>
              {openFaq === index && (
                <div className="px-4 pb-4 text-sm leading-relaxed text-gray-600 sm:px-6">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
