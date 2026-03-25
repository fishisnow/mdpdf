"use client";

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
        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">PDF to JPG / PNG</h1>
        <p className="mx-auto max-w-2xl text-base text-gray-500 sm:text-lg">Convert PDF pages into images directly in your browser. Multi-page exports are downloaded as ZIP.</p>
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
    </main>
  );
}
