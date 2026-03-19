"use client";

import { useState } from "react";
import Link from "next/link";
import UploadZone from "@/components/UploadZone";
import MarkdownPreview from "@/components/MarkdownPreview";
import ProgressBar from "@/components/ProgressBar";
import { trackEvent } from "@/lib/analytics";

type State = "idle" | "converting" | "done" | "error";

const faqs = [
  {
    question: "How does MdPdf work?",
    answer: "Simply upload your PDF document, and our system will extract the text while preserving its structure. The converter analyzes font sizes to identify headings, detects lists and tables, and generates clean Markdown output you can edit immediately."
  },
  {
    question: "Is it really free to use?",
    answer: "Yes, absolutely! MdPdf is 100% free with no hidden charges. There are no watermarks, no file limits, and you can convert as many documents as you need."
  },
  {
    question: "Do I need to install any software?",
    answer: "Not at all. MdPdf runs entirely in your web browser. Just visit the page, upload your file, and get your Markdown – no downloads or installations required."
  },
  {
    question: "Can I convert Markdown back to PDF?",
    answer: "Yes! Use our MD to PDF converter to transform your Markdown documents into polished PDF files."
  },
  {
    question: "What happens to my files after conversion?",
    answer: "Your files are processed securely and are automatically deleted from our servers after conversion. We don't store or share any of your documents."
  },
  {
    question: "Will the formatting be preserved?",
    answer: "Our converter intelligently preserves document structure including headers (H1-H3), bullet points, numbered lists, and basic formatting. Complex layouts are simplified to ensure clean, editable Markdown."
  }
];

export default function Home() {
  const [state, setState] = useState<State>("idle");
  const [markdown, setMarkdown] = useState("");
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleUpload = async (file: File) => {
    trackEvent("pdf_to_md_click", {
      file_name: file.name,
      file_size_kb: Math.round(file.size / 1024),
      source_page: "home",
    });

    setState("converting");
    setFilename(file.name);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/convert", { method: "POST", body: formData });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Conversion failed");
      }
      const text = await res.text();
      setMarkdown(text);
      setState("done");
      trackEvent("pdf_to_md_success", {
        file_name: file.name,
        output_length: text.length,
        source_page: "home",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
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
    <main className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">MdPdf – Free Online Converter</h1>
        <p className="text-gray-500 text-lg">Fast, accurate, and free document conversion tools</p>
      </div>

      {/* PDF to MD Tool - Direct Use */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col gap-6 mb-8">
        <div className="text-center mb-2">
          <h2 className="text-xl font-bold text-gray-900">PDF to Markdown Converter</h2>
          <p className="text-gray-500 text-sm">Upload a PDF and get clean Markdown instantly</p>
        </div>
        <UploadZone onUpload={handleUpload} disabled={state === "converting"} />

        {state === "converting" && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500">Converting <span className="font-medium">{filename}</span>…</p>
            <ProgressBar progress={70} />
          </div>
        )}

        {state === "error" && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
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

      {/* Quick Link to MD to PDF Page */}
      <div className="mb-16">
        <Link
          href="/md-to-pdf"
          className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-indigo-200 transition-all block"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Try MD to PDF →</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Features Summary */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Choose MdPdf?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Convert your documents in seconds. Our optimized processing pipeline delivers results quickly.</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">High Accuracy</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Smart layout detection preserves headings, lists, and formatting in your documents.</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy First</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Your documents are processed securely and automatically deleted after conversion.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">MdPdf FAQs</h2>
        <p className="text-gray-500 text-center mb-8">Everything you need to know about converting documents with MdPdf — fast, simple, and accurate.</p>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <span className="text-gray-400 text-xl ml-4">{openFaq === index ? "−" : "+"}</span>
              </button>
              {openFaq === index && (
                <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed">
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