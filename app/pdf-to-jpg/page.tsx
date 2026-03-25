"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import UploadZone from "@/components/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import {
  buildZipFromImages,
  convertPdfToImages,
  getPdfPageCount,
  parsePageRanges,
  type ImageFormat,
  type QualityPreset,
} from "@/lib/pdf-to-image";

type ConvertState = "idle" | "ready" | "converting" | "done" | "error";

const faqs = [
  {
    question: "How do I convert PDF to JPG online?",
    answer:
      "Upload your PDF, choose the pages you want, keep JPG selected, then click Convert and Download. A single page downloads as a JPG file, while multiple pages are bundled into a ZIP.",
  },
  {
    question: "Can I convert only selected PDF pages?",
    answer:
      "Yes. Enter page ranges such as 1-3,5,8 in the Pages field to export only the pages you need. If you leave the field blank, the tool converts all pages in the PDF.",
  },
  {
    question: "Should I choose JPG or PNG?",
    answer:
      "Choose JPG when you want smaller files for faster sharing. Choose PNG when you want sharper text, diagrams, screenshots, or other pages where image clarity matters more than file size.",
  },
  {
    question: "Are my PDF files uploaded to a server?",
    answer:
      "No. This PDF to JPG converter runs in your browser, so your file stays on your device during conversion. That keeps the workflow fast and gives you better privacy than upload-first tools.",
  },
  {
    question: "Why do multiple converted pages download as a ZIP?",
    answer:
      "Each selected page becomes its own image file. When you convert more than one page, the tool packages them into a ZIP so you can download everything in one step.",
  },
] as const;

function downloadBlob(bytes: Uint8Array, fileName: string, mimeType: string) {
  const normalized = new Uint8Array(bytes.byteLength);
  normalized.set(bytes);
  const blob = new Blob([normalized], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

function clampJpgQuality(value: number): number {
  return Math.min(0.98, Math.max(0.5, value));
}

export default function PdfToImagePage() {
  const [state, setState] = useState<ConvertState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageRangeInput, setPageRangeInput] = useState("");
  const [format, setFormat] = useState<ImageFormat>("jpg");
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>("high");
  const [jpgQuality, setJpgQuality] = useState(0.9);
  const [error, setError] = useState("");
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [resultMessage, setResultMessage] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const progressPercent = useMemo(() => {
    if (!progressTotal) return 0;
    return Math.round((progressCurrent / progressTotal) * 100);
  }, [progressCurrent, progressTotal]);

  const onUpload = async (nextFile: File) => {
    setState("idle");
    setError("");
    setResultMessage("");

    try {
      const bytes = new Uint8Array(await nextFile.arrayBuffer());
      const totalPages = await getPdfPageCount(bytes);

      setFile(nextFile);
      setFileBytes(bytes);
      setPageCount(totalPages);
      setPageRangeInput("");
      setState("ready");
    } catch (uploadError) {
      setFile(null);
      setFileBytes(null);
      setPageCount(0);
      setState("error");
      setError(uploadError instanceof Error ? uploadError.message : "Failed to read PDF.");
    }
  };

  const onConvert = async () => {
    if (!file || !fileBytes) {
      setError("Please upload a PDF first.");
      setState("error");
      return;
    }

    setState("converting");
    setError("");
    setResultMessage("");

    try {
      const selectedPages = parsePageRanges(pageRangeInput, pageCount);
      setProgressCurrent(0);
      setProgressTotal(selectedPages.length);

      const images = await convertPdfToImages(fileBytes, {
        format,
        pages: selectedPages,
        qualityPreset,
        jpgQuality: clampJpgQuality(jpgQuality),
        fileName: file.name,
        onProgress: (current, total) => {
          setProgressCurrent(current);
          setProgressTotal(total);
        },
      });

      if (images.length === 1) {
        const single = images[0];
        downloadBlob(single.bytes, single.fileName, single.mimeType);
        setResultMessage(`Converted 1 page and downloaded ${single.fileName}.`);
      } else {
        const zipBytes = buildZipFromImages(images);
        const ext = format === "png" ? "png" : "jpg";
        const zipName = `${stripExtension(file.name)}_${ext}.zip`;
        downloadBlob(zipBytes, zipName, "application/zip");
        setResultMessage(`Converted ${images.length} pages and downloaded ${zipName}.`);
      }

      setState("done");
    } catch (convertError) {
      setState("error");
      setError(convertError instanceof Error ? convertError.message : "Conversion failed.");
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10 md:py-12">
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">PDF to JPG Converter Free Online</h1>
        <p className="mx-auto max-w-2xl text-base text-gray-500 sm:text-lg">Convert PDF to JPG or PDF to PNG directly in your browser. Fast exports, private processing, and multi-page downloads as ZIP files.</p>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:gap-6 sm:p-6 md:p-8">
        <UploadZone onUpload={onUpload} disabled={state === "converting"} />

        {file && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">File</p>
              <p className="break-all text-sm font-medium text-gray-800">{file.name}</p>
              <p className="mt-1 text-xs text-gray-500">{pageCount} pages</p>
            </div>
            <label className="rounded-lg border border-gray-200 p-4">
              <span className="mb-2 block text-sm font-medium text-gray-700">Pages</span>
              <input
                type="text"
                value={pageRangeInput}
                onChange={(event) => setPageRangeInput(event.target.value)}
                placeholder="All pages (or e.g. 1-3,5,8)"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                disabled={state === "converting"}
              />
              <span className="mt-2 block text-xs text-gray-500">Leave this blank to convert every page, or enter specific pages like 1-3,5.</span>
            </label>

            <label className="rounded-lg border border-gray-200 p-4">
              <span className="mb-2 block text-sm font-medium text-gray-700">Format</span>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={format}
                onChange={(event) => setFormat(event.target.value as ImageFormat)}
                disabled={state === "converting"}
              >
                <option value="jpg">JPG</option>
                <option value="png">PNG</option>
              </select>
              <span className="mt-2 block text-xs text-gray-500">Choose JPG for smaller files or PNG for sharper screenshots, diagrams, and text-heavy pages.</span>
            </label>

            <label className="rounded-lg border border-gray-200 p-4">
              <span className="mb-2 block text-sm font-medium text-gray-700">Quality</span>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={qualityPreset}
                onChange={(event) => setQualityPreset(event.target.value as QualityPreset)}
                disabled={state === "converting"}
              >
                <option value="standard">Standard</option>
                <option value="high">High</option>
                <option value="ultra">Ultra</option>
              </select>
              <span className="mt-2 block text-xs text-gray-500">Higher quality creates larger images. JPG quality control appears below when JPG is selected.</span>
            </label>

            {format === "jpg" && (
              <label className="rounded-lg border border-gray-200 p-4 sm:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">JPG Quality</span>
                  <span className="text-xs text-gray-500">{Math.round(jpgQuality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={0.98}
                  step={0.01}
                  value={jpgQuality}
                  onChange={(event) => setJpgQuality(Number(event.target.value))}
                  className="w-full"
                  disabled={state === "converting"}
                />
              </label>
            )}
          </div>
        )}

        {state === "converting" && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500">Converting page {progressCurrent} of {progressTotal} in your browser...</p>
            <ProgressBar progress={progressPercent} />
          </div>
        )}

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {resultMessage && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{resultMessage}</div>}

        <button
          onClick={onConvert}
          disabled={!file || state === "converting"}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {state === "converting" ? "Converting..." : "Convert and Download"}
        </button>
      </div>

      <section className="mt-12 sm:mt-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">Why Use This PDF to JPG Converter?</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Fast in-browser conversion</h3>
            <p className="text-sm leading-relaxed text-gray-600">Convert PDF to JPG in your browser without waiting for large uploads, queue times, or extra download steps from a remote server.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Private PDF processing</h3>
            <p className="text-sm leading-relaxed text-gray-600">Your PDF stays on your device during conversion, which makes this PDF to JPG tool a better fit for privacy-sensitive files.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Flexible page exports</h3>
            <p className="text-sm leading-relaxed text-gray-600">Convert one page or many pages, export JPG or PNG, and download multi-page results as a ZIP so each page is easy to reuse.</p>
          </div>
        </div>
      </section>

      <section className="mt-12 sm:mt-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">How to Convert PDF to JPG Online</h2>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 md:p-8">
          <ol className="space-y-4">
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">1</span>
              <div>
                <p className="font-medium text-gray-900">Upload your PDF</p>
                <p className="text-sm text-gray-600">Choose the PDF file you want to convert. The tool reads the file in your browser and shows the total page count.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">2</span>
              <div>
                <p className="font-medium text-gray-900">Pick all pages or selected pages</p>
                <p className="text-sm text-gray-600">Leave the Pages field empty to convert the full PDF, or enter page ranges like 1-3,5 if you only need specific pages.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">3</span>
              <div>
                <p className="font-medium text-gray-900">Choose JPG or PNG and set quality</p>
                <p className="text-sm text-gray-600">Use JPG for smaller files and easier sharing. Use PNG for sharper exports. Then choose your quality preset and adjust JPG quality if needed.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">4</span>
              <div>
                <p className="font-medium text-gray-900">Convert and download</p>
                <p className="text-sm text-gray-600">Click Convert and Download to create your images. A single converted page downloads directly, while multiple pages are delivered in one ZIP file.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="mt-12 sm:mt-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">Common Use Cases for PDF to JPG</h2>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Share document pages faster</h3>
              <p className="text-sm leading-relaxed text-gray-600">Convert PDF pages into JPG images when you want to send previews in chat, email, support tickets, or social posts without attaching the full PDF.</p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Export slides or reports as images</h3>
              <p className="text-sm leading-relaxed text-gray-600">Use this tool to turn presentation slides, reports, invoices, or handouts into separate images that are easier to reuse in docs, decks, or image galleries.</p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Save only the pages you need</h3>
              <p className="text-sm leading-relaxed text-gray-600">If you only need a cover page, signature page, chart, or appendix, enter a page range and convert just those pages instead of exporting the entire file.</p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Use PNG for sharper visuals</h3>
              <p className="text-sm leading-relaxed text-gray-600">When a page contains diagrams, UI screenshots, or text that needs cleaner edges, convert PDF to PNG instead of JPG for a sharper result.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 sm:mt-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">PDF to JPG vs PDF to PNG</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Choose JPG for smaller files</h3>
            <p className="text-sm leading-relaxed text-gray-600">JPG is usually the best choice when you want smaller images that are quick to download, attach, and share. It works well for photos, mixed-layout pages, and everyday document previews.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Choose PNG for sharper detail</h3>
            <p className="text-sm leading-relaxed text-gray-600">PNG is better when you want crisp text, screenshots, diagrams, or other detailed page elements. The files are often larger, but the image quality stays cleaner.</p>
          </div>
        </div>
      </section>

      <section className="mt-12 sm:mt-16">
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">PDF to JPG FAQs</h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-gray-500">Quick answers about converting PDF to JPG or PNG, selecting pages, download behavior, and privacy.</p>
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
              {openFaq === index && <div className="px-4 pb-4 text-sm leading-relaxed text-gray-600 sm:px-6">{faq.answer}</div>}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 text-center sm:mt-16">
        <p className="mb-4 text-gray-600">Need another document workflow?</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex max-w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-6 py-3 text-center text-gray-700 transition-colors hover:bg-gray-50">
            Open PDF to Markdown
          </Link>
          <Link href="/md-to-pdf" className="inline-flex max-w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-6 py-3 text-center text-gray-700 transition-colors hover:bg-gray-50">
            Open MD to PDF
          </Link>
        </div>
      </div>
    </main>
  );
}
