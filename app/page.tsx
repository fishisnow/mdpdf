"use client";

import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import MarkdownPreview from "@/components/MarkdownPreview";
import ProgressBar from "@/components/ProgressBar";

type State = "idle" | "converting" | "done" | "error";

const features = [
  {
    icon: "⚡",
    title: "Lightning Fast",
    description: "Convert your documents in seconds. Our optimized processing pipeline delivers results quickly without compromising accuracy."
  },
  {
    icon: "🎯",
    title: "High Accuracy",
    description: "Smart layout detection preserves headings, lists, and formatting. Get clean, editable Markdown that matches your original document."
  },
  {
    icon: "🔒",
    title: "Privacy First",
    description: "All conversions happen in your browser or on our secure servers. Your documents are never stored or shared with third parties."
  },
  {
    icon: "🌐",
    title: "Cross-Platform",
    description: "Works seamlessly on desktop and mobile. No software installation required – just open your browser and start converting."
  },
  {
    icon: "📝",
    title: "Clean Formatting",
    description: "Automatically detects and preserves document structure including headers, bullet points, tables, and code blocks."
  },
  {
    icon: "💯",
    title: "Completely Free",
    description: "No hidden fees, no watermarks, no limits. Convert as many files as you need without any cost."
  }
];

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
    answer: "Currently MdPdf focuses on PDF to MD conversion. For MD to PDF, you can use any standard Markdown viewer or editor with export functionality."
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
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
      setState("error");
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">PDF to MD Converter</h1>
        <p className="text-gray-500 text-lg">Convert PDF to MD instantly. Free online tool for developers, writers, and content creators</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col gap-6 mb-16">
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
          <MarkdownPreview markdown={markdown} filename={filename} />
        )}
      </div>

      {/* Features Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Choose MdPdf?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
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
