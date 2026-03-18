"use client";

import { useState } from "react";
import Link from "next/link";
import UploadZone from "@/components/UploadZone";
import MarkdownPreview from "@/components/MarkdownPreview";
import ProgressBar from "@/components/ProgressBar";
import { trackEvent } from "@/lib/analytics";

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
  }
];

export default function PdfToMdPage() {
  const [state, setState] = useState<State>("idle");
  const [markdown, setMarkdown] = useState("");
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");

  const handleUpload = async (file: File) => {
    trackEvent("pdf_to_md_click", {
      file_name: file.name,
      file_size_kb: Math.round(file.size / 1024),
      source_page: "pdf_to_md",
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
        source_page: "pdf_to_md",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setState("error");
      trackEvent("pdf_to_md_error", {
        file_name: file.name,
        error_message: message.slice(0, 120),
        source_page: "pdf_to_md",
      });
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link href="/" className="text-blue-600 hover:underline text-sm">← Back to MdPdf</Link>
      </nav>

      {/* Hero Section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">PDF to Markdown Converter</h1>
        <p className="text-gray-500 text-lg">Convert PDF to Markdown instantly. Free online tool for developers, writers, and content creators</p>
      </div>

      {/* Tool Section */}
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
          <MarkdownPreview
            markdown={markdown}
            filename={filename}
            onDownload={({ filename: downloadName, markdownLength }) => {
              trackEvent("pdf_to_md_download", {
                file_name: downloadName,
                output_length: markdownLength,
                source_page: "pdf_to_md",
              });
            }}
          />
        )}
      </div>

      {/* Features Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Choose Our PDF to Markdown Converter?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to Use Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How to Convert PDF to Markdown</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
              <div>
                <p className="font-medium text-gray-900">Upload your PDF file</p>
                <p className="text-gray-600 text-sm">Click the upload area or drag and drop your PDF document</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
              <div>
                <p className="font-medium text-gray-900">Automatic conversion</p>
                <p className="text-gray-600 text-sm">Our system analyzes your document and extracts text with proper formatting</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
              <div>
                <p className="font-medium text-gray-900">Download or copy Markdown</p>
                <p className="text-gray-600 text-sm">Preview the result, copy to clipboard, or download as .md file</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Example Output Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Example Output</h2>
        <p className="text-gray-500 text-center mb-8">See what your converted Markdown will look like</p>
        <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
          <pre className="text-green-400 text-sm font-mono">
{`# Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that
enables systems to learn and improve from experience.

## Types of Machine Learning

- **Supervised Learning**: Learning from labeled data
- **Unsupervised Learning**: Finding patterns in unlabeled data
- **Reinforcement Learning**: Learning through trial and error

## Applications

Machine learning is used in various fields including:

1. Image recognition
2. Natural language processing
3. Recommendation systems

> Note: This is an example of how your PDF content will be
converted to clean, editable Markdown format.`}
          </pre>
        </div>
      </section>

      {/* Related Link */}
      <div className="text-center">
        <p className="text-gray-600 mb-4">Need the opposite conversion?</p>
        <Link href="/md-to-pdf" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Try MD to PDF Converter →
        </Link>
      </div>
    </main>
  );
}