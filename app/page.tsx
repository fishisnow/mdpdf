"use client";

import { useEffect, useMemo, useState } from "react";
import UploadZone from "@/components/UploadZone";
import MarkdownPreview from "@/components/MarkdownPreview";
import MoreTools from "@/components/MoreTools";
import ProgressBar from "@/components/ProgressBar";
import { trackEvent } from "@/lib/analytics";
import {
  convertPdfToMarkdown,
  preloadPdfInspectorEngine,
  type ConversionProgress,
} from "@/lib/pdf-to-md";

type State = "idle" | "converting" | "done" | "error";

const faqs = [
  {
    question: "How does pdf to md work?",
    answer:
      "Upload a PDF and pdf to md extracts the text while keeping headings, lists, tables, and code-like blocks easier to edit as Markdown.",
  },
  {
    question: "Is it free to use?",
    answer: "Yes. This pdf to md converter is free, with no hidden charges, watermarks, or file limits.",
  },
  {
    question: "Do I need to install any software?",
    answer: "No. pdf to md runs in your browser. Upload a file and start editing the Markdown without installing an app.",
  },
  {
    question: "Can I convert Markdown back to PDF?",
    answer: "Yes. After pdf to md, use the MD to PDF converter when you need a polished PDF again.",
  },
  {
    question: "What happens to my files after conversion?",
    answer: "pdf to md processes files in your browser workflow, and they are deleted after conversion. We do not store or share your documents.",
  },
  {
    question: "Will the formatting be preserved?",
    answer: "pdf to md keeps headers, lists, tables, and basic formatting, and it does a better job with code blocks so the Markdown stays cleaner to edit.",
  },
];

function describeProgress(progress: ConversionProgress): { label: string; percent: number } {
  if (progress.stage === "loading") {
    return { label: "Reading file in your browser...", percent: 15 };
  }

  if (progress.stage === "initializing") {
    return { label: "Parsing PDF pages in a background worker...", percent: 38 };
  }

  if (progress.stage === "parsing") {
    return { label: "Parsing PDF pages in a background worker...", percent: 78 };
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
    lower.includes("imagebased") ||
    lower.includes("scanned")
  ) {
    return "This PDF appears to be scanned or image-based, so there may not be selectable text to convert.";
  }

  if (
    lower.includes("worker crashed") ||
    lower.includes("failed to load pdf-inspector") ||
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
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [progress, setProgress] = useState<ConversionProgress>({ stage: "loading" });
  const [conversionId, setConversionId] = useState(0);

  const progressView = useMemo(() => describeProgress(progress), [progress]);

  useEffect(() => {
    void preloadPdfInspectorEngine().catch((preloadError: unknown) => {
      console.warn("PDF conversion engine preload failed", preloadError);
    });
  }, []);

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

    const startedAt = performance.now();
    try {
      const arrayBuffer = await file.arrayBuffer();
      const convertStartedAt = performance.now();
      const conversion = await convertPdfToMarkdown(new Uint8Array(arrayBuffer), setProgress);
      const convertMs = Math.round(performance.now() - convertStartedAt);
      const totalMs = Math.round(performance.now() - startedAt);

      console.info("[pdf-to-md timing]", {
        engine: "pdf-inspector",
        fileName: file.name,
        fileSizeKb: Math.round(file.size / 1024),
        convertMs,
        engineMs: Math.round(conversion.processingTimeMs),
        totalMs,
        pageCount: conversion.pageCount,
        pdfType: conversion.pdfType,
        markdownChars: conversion.markdown.length,
      });

      setMarkdown(conversion.markdown);
      setProgress({ stage: "rendering" });
      setState("done");
      setConversionId((n) => n + 1);
      trackEvent("pdf_to_md_success", {
        file_name: file.name,
        output_length: conversion.markdown.length,
        source_page: "home",
      });
    } catch (err: unknown) {
      console.info("[pdf-to-md timing]", {
        engine: "pdf-inspector",
        fileName: file.name,
        fileSizeKb: Math.round(file.size / 1024),
        totalMs: Math.round(performance.now() - startedAt),
        ok: false,
      });
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
    <main className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10 md:py-12">
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">MdPdf - PDF to MD Converter</h1>
        <p className="mx-auto text-base text-gray-500 sm:text-lg md:whitespace-nowrap">
          Convert pdf to md in your browser and get clean Markdown you can edit and reuse.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:gap-6 sm:p-6 md:p-8">
        <div className="mb-1 text-center sm:mb-2">
          <h2 className="text-xl font-bold text-gray-900">PDF to MD Converter</h2>
          <p className="text-sm text-gray-500">Upload a PDF and get Markdown that is easier to edit, reuse, and publish.</p>
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
            key={conversionId}
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

      <MoreTools currentHref="/" heading="More tools" />

      <p className="mx-auto mb-12 max-w-4xl text-center text-sm leading-relaxed text-gray-600 sm:mb-16 sm:text-base">
        Use this pdf to md converter when a PDF is hard to copy. It runs in your browser, so headings, lists, tables, and code stay structured as Markdown you can edit and publish.
      </p>

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">Why choose pdf to md?</h2>
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 md:p-8">
          <p className="text-sm leading-7 text-gray-600 sm:text-base">
            Many PDF files are hard to reuse after copy and paste. pdf to md turns them into structured Markdown that is easier to clean up, edit, and publish. The workflow is fast, free, and useful for notes, docs, tables, and code.
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
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">pdf to md FAQs</h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-gray-500">Common questions about turning PDFs into Markdown.</p>
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
              <div className={openFaq === index ? "px-4 pb-4 text-sm leading-relaxed text-gray-600 sm:px-6" : "hidden"}>
                {faq.answer}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
