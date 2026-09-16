"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import UploadZone from "@/components/UploadZone";
import MarkdownPreview from "@/components/MarkdownPreview";
import MoreTools from "@/components/MoreTools";
import ProgressBar from "@/components/ProgressBar";
import FaqList from "@/components/FaqList";
import { trackEvent } from "@/lib/analytics";
import {
  convertPdfToMarkdown,
  preloadPdfInspectorEngine,
  type ConversionProgress,
} from "@/lib/pdf-to-md";

type State = "idle" | "converting" | "done" | "error";

function describeProgress(
  progress: ConversionProgress,
  t: (key: string) => string,
): { label: string; percent: number } {
  if (progress.stage === "loading") {
    return { label: t("progress.loading"), percent: 15 };
  }

  if (progress.stage === "initializing" || progress.stage === "parsing") {
    return { label: t("progress.parsing"), percent: progress.stage === "initializing" ? 38 : 78 };
  }

  return { label: t("progress.rendering"), percent: 95 };
}

function normalizeConversionError(message: string, t: (key: string) => string): string {
  const lower = message.toLowerCase();

  if (lower.includes("password") || lower.includes("encrypted")) {
    return t("errors.encrypted");
  }

  if (
    lower.includes("invalid") ||
    lower.includes("corrupt") ||
    lower.includes("formaterror") ||
    lower.includes("unexpected response") ||
    lower.includes("missing pdf")
  ) {
    return t("errors.invalid");
  }

  if (
    lower.includes("no selectable text") ||
    lower.includes("no text") ||
    lower.includes("image-based") ||
    lower.includes("imagebased") ||
    lower.includes("scanned")
  ) {
    return t("errors.scanned");
  }

  if (
    lower.includes("worker crashed") ||
    lower.includes("failed to load pdf-inspector") ||
    lower.includes("unknownerrorexception") ||
    lower.includes("abortexception") ||
    lower.includes("out of memory")
  ) {
    return t("errors.worker");
  }

  return message || t("errors.failed");
}

export default function Home() {
  const t = useTranslations("home");
  const [state, setState] = useState<State>("idle");
  const [markdown, setMarkdown] = useState("");
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<ConversionProgress>({ stage: "loading" });
  const [conversionId, setConversionId] = useState(0);

  const progressView = useMemo(() => describeProgress(progress, t), [progress, t]);

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

      const message = normalizeConversionError(err instanceof Error ? err.message : "Unknown error", t);
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
        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">{t("h1")}</h1>
        <p className="mx-auto text-base text-gray-500 sm:text-lg md:whitespace-nowrap">
          {t("subtitle")}
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:gap-6 sm:p-6 md:p-8">
        <div className="mb-1 text-center sm:mb-2">
          <h2 className="text-xl font-bold text-gray-900">{t("boxTitle")}</h2>
          <p className="text-sm text-gray-500">{t("boxHint")}</p>
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

      <MoreTools currentHref="/" />

      <p className="mx-auto mb-12 max-w-4xl text-center text-sm leading-relaxed text-gray-600 sm:mb-16 sm:text-base">
        {t("intro")}
      </p>

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">{t("whyTitle")}</h2>
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 md:p-8">
          <p className="text-sm leading-7 text-gray-600 sm:text-base">
            {t("whyBody")}
          </p>
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 text-3xl">⚡</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("fastTitle")}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{t("fastBody")}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 text-3xl">🎯</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("accurateTitle")}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{t("accurateBody")}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 text-3xl">🔒</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("privacyTitle")}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{t("privacyBody")}</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">{t("faqTitle")}</h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-gray-500">{t("faqIntro")}</p>
        <FaqList items={t.raw("faqs")} />
      </section>
    </main>
  );
}
