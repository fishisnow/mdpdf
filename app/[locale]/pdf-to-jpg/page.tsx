"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import UploadZone from "@/components/UploadZone";
import MoreTools from "@/components/MoreTools";
import ProgressBar from "@/components/ProgressBar";
import FaqList from "@/components/FaqList";
import SeoSections, { type SeoSection } from "@/components/SeoSections";
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
  const t = useTranslations("pdfToJpg");
  const tCommon = useTranslations("common");
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
      setError(uploadError instanceof Error ? uploadError.message : t("readError"));
    }
  };

  const onConvert = async () => {
    if (!file || !fileBytes) {
      setError(t("needPdf"));
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
        setResultMessage(t("doneOne", { name: single.fileName }));
      } else {
        const zipBytes = buildZipFromImages(images);
        const ext = format === "png" ? "png" : "jpg";
        const zipName = `${stripExtension(file.name)}_${ext}.zip`;
        downloadBlob(zipBytes, zipName, "application/zip");
        setResultMessage(t("doneMany", { count: images.length, name: zipName }));
      }

      setState("done");
    } catch (convertError) {
      setState("error");
      setError(convertError instanceof Error ? convertError.message : t("convertError"));
    }
  };

  return (
    <main className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10 md:py-12">
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="mb-3 text-3xl font-heading sm:text-4xl">{t("h1")}</h1>
        <p className="mx-auto text-base text-foreground/70 sm:text-lg md:whitespace-nowrap">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-5 neo-panel p-5 sm:gap-6 sm:p-6 md:p-8">
        <UploadZone onUpload={onUpload} disabled={state === "converting"} />

        {file && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-foreground/70">{t("file")}</p>
              <p className="break-all text-sm font-medium text-foreground">{file.name}</p>
              <p className="mt-1 text-xs text-foreground/60">{t("pagesLabel", { count: pageCount })}</p>
            </div>
            <label className="rounded-lg border border-border p-4">
              <span className="mb-2 block text-sm font-heading">{t("pages")}</span>
              <input
                type="text"
                value={pageRangeInput}
                onChange={(event) => setPageRangeInput(event.target.value)}
                placeholder={t("pagesPlaceholder")}
                className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-blue-500"
                disabled={state === "converting"}
              />
              <span className="mt-2 block text-xs text-foreground/60">{t("pagesHint")}</span>
            </label>

            <label className="rounded-base border-2 border-border bg-background p-4">
              <span className="mb-2 block text-sm font-heading">{t("format")}</span>
              <select
                className="w-full rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm"
                value={format}
                onChange={(event) => setFormat(event.target.value as ImageFormat)}
                disabled={state === "converting"}
              >
                <option value="jpg">JPG</option>
                <option value="png">PNG</option>
              </select>
              <span className="mt-2 block text-xs text-foreground/60">{t("formatHint")}</span>
            </label>

            <label className="rounded-base border-2 border-border bg-background p-4">
              <span className="mb-2 block text-sm font-heading">{t("quality")}</span>
              <select
                className="w-full rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm"
                value={qualityPreset}
                onChange={(event) => setQualityPreset(event.target.value as QualityPreset)}
                disabled={state === "converting"}
              >
                <option value="standard">{t("qualityStandard")}</option>
                <option value="high">{t("qualityHigh")}</option>
                <option value="ultra">{t("qualityUltra")}</option>
              </select>
              <span className="mt-2 block text-xs text-foreground/60">{t("qualityHint")}</span>
            </label>

            {format === "jpg" && (
              <label className="rounded-base border-2 border-border bg-background p-4 sm:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-heading">{t("jpgQuality")}</span>
                  <span className="text-xs text-foreground/60">{Math.round(jpgQuality * 100)}%</span>
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
            <p className="text-sm text-foreground/70">{t("progress", { current: progressCurrent, total: progressTotal })}</p>
            <ProgressBar progress={progressPercent} />
          </div>
        )}

        {error && <div className="rounded-base border-2 border-border bg-chart-2 p-4 text-sm font-base shadow-shadow">{error}</div>}

        {resultMessage && <div className="rounded-base border-2 border-border bg-chart-4 p-4 text-sm font-base shadow-shadow">{resultMessage}</div>}

        <button
          onClick={onConvert}
          disabled={!file || state === "converting"}
          className="inline-flex items-center justify-center rounded-base border-2 border-border bg-main px-4 py-2 text-sm font-base text-main-foreground shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none disabled:pointer-events-none disabled:opacity-50"
        >
          {state === "converting" ? tCommon("converting") : tCommon("convertAndDownload")}
        </button>
      </div>

      <section className="mt-12 sm:mt-16">
        <h2 className="mb-6 text-center text-2xl font-heading sm:mb-8">{t("whyTitle")}</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="neo-panel p-5 sm:p-6">
            <h3 className="mb-2 text-lg font-heading">{t("fastTitle")}</h3>
            <p className="text-sm leading-relaxed text-foreground/80">{t("fastBody")}</p>
          </div>
          <div className="neo-panel p-5 sm:p-6">
            <h3 className="mb-2 text-lg font-heading">{t("privateTitle")}</h3>
            <p className="text-sm leading-relaxed text-foreground/80">{t("privateBody")}</p>
          </div>
          <div className="neo-panel p-5 sm:p-6">
            <h3 className="mb-2 text-lg font-heading">{t("flexTitle")}</h3>
            <p className="text-sm leading-relaxed text-foreground/80">{t("flexBody")}</p>
          </div>
        </div>
      </section>

      <section className="mt-12 sm:mt-16">
        <h2 className="mb-6 text-center text-2xl font-heading sm:mb-8">{t("howTitle")}</h2>
        <div className="neo-panel p-5 sm:p-6 md:p-8">
          <ol className="space-y-4">
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main font-heading">1</span>
              <div>
                <p className="font-heading">{t("step1Title")}</p>
                <p className="text-sm text-foreground/80">{t("step1Body")}</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main font-heading">2</span>
              <div>
                <p className="font-heading">{t("step2Title")}</p>
                <p className="text-sm text-foreground/80">{t("step2Body")}</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main font-heading">3</span>
              <div>
                <p className="font-heading">{t("step3Title")}</p>
                <p className="text-sm text-foreground/80">{t("step3Body")}</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main font-heading">4</span>
              <div>
                <p className="font-heading">{t("step4Title")}</p>
                <p className="text-sm text-foreground/80">{t("step4Body")}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="mt-12 sm:mt-16">
        <h2 className="mb-6 text-center text-2xl font-heading sm:mb-8">{t("useTitle")}</h2>
        <div className="neo-panel p-5 sm:p-6 md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-lg font-heading">{t("useShareTitle")}</h3>
              <p className="text-sm leading-relaxed text-foreground/80">{t("useShareBody")}</p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-heading">{t("useSlidesTitle")}</h3>
              <p className="text-sm leading-relaxed text-foreground/80">{t("useSlidesBody")}</p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-heading">{t("useRangeTitle")}</h3>
              <p className="text-sm leading-relaxed text-foreground/80">{t("useRangeBody")}</p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-heading">{t("usePngTitle")}</h3>
              <p className="text-sm leading-relaxed text-foreground/80">{t("usePngBody")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 sm:mt-16">
        <h2 className="mb-6 text-center text-2xl font-heading sm:mb-8">{t("vsTitle")}</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <div className="neo-panel p-5 sm:p-6">
            <h3 className="mb-2 text-lg font-heading">{t("jpgTitle")}</h3>
            <p className="text-sm leading-relaxed text-foreground/80">{t("jpgBody")}</p>
          </div>
          <div className="neo-panel p-5 sm:p-6">
            <h3 className="mb-2 text-lg font-heading">{t("pngTitle")}</h3>
            <p className="text-sm leading-relaxed text-foreground/80">{t("pngBody")}</p>
          </div>
        </div>
      </section>

      <SeoSections className="mt-12 sm:mt-16" sections={t.raw("seoSections") as SeoSection[]} />

      <section className="mt-12 sm:mt-16">
        <h2 className="mb-4 text-center text-2xl font-heading">{t("faqTitle")}</h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-foreground/70">{t("faqIntro")}</p>
        <FaqList items={t.raw("faqs")} />
      </section>

      <MoreTools currentHref="/pdf-to-jpg" />
    </main>
  );
}
