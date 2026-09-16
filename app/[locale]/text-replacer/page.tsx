"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import ViewModeToggle, { type ResultViewMode } from "@/components/ViewModeToggle";
import MoreTools from "@/components/MoreTools";
import FaqList from "@/components/FaqList";
import SeoSections, { type SeoSection } from "@/components/SeoSections";
import { trackEvent } from "@/lib/analytics";
import { applyTextReplace } from "@/lib/text-replacer";
import { downloadTextFile, workspacePaneHeight } from "@/lib/tools";

const DEFAULT_TEXT = `Hello\\nWorld\\nColumn A\\tColumn B`;

type PresetId = "literal-newline" | "literal-tab" | "encode-newline" | "crlf-to-newline";

const PRESETS: {
  id: PresetId;
  labelKey: "presetNewline" | "presetTab" | "presetEncode" | "presetCrlf";
  find: string;
  replace: string;
  interpretFind: boolean;
  interpretReplace: boolean;
}[] = [
  {
    id: "literal-newline",
    labelKey: "presetNewline",
    find: "\\n",
    replace: "\\n",
    interpretFind: false,
    interpretReplace: true,
  },
  {
    id: "literal-tab",
    labelKey: "presetTab",
    find: "\\t",
    replace: "\\t",
    interpretFind: false,
    interpretReplace: true,
  },
  {
    id: "encode-newline",
    labelKey: "presetEncode",
    find: "\\n",
    replace: "\\n",
    interpretFind: true,
    interpretReplace: false,
  },
  {
    id: "crlf-to-newline",
    labelKey: "presetCrlf",
    find: "\\r\\n",
    replace: "\\n",
    interpretFind: true,
    interpretReplace: true,
  },
];

export default function TextReplacerPage() {
  const t = useTranslations("textReplacer");
  const tCommon = useTranslations("common");
  const [source, setSource] = useState(DEFAULT_TEXT);
  const [find, setFind] = useState("\\n");
  const [replace, setReplace] = useState("\\n");
  const [interpretFind, setInterpretFind] = useState(false);
  const [interpretReplace, setInterpretReplace] = useState(true);
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [useRegex, setUseRegex] = useState(false);
  const [greedy, setGreedy] = useState(true);
  const [filename, setFilename] = useState("replaced");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ResultViewMode>("split");
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isSplit = viewMode === "split";
  const paneHeight = workspacePaneHeight(isFullscreen, isSplit);

  const result = useMemo(
    () =>
      applyTextReplace(source, find, replace, {
        interpretFind,
        interpretReplace,
        caseSensitive,
        useRegex,
        greedy,
      }),
    [source, find, replace, interpretFind, interpretReplace, caseSensitive, useRegex, greedy],
  );

  const syncFullscreenState = useCallback(() => {
    const active = document.fullscreenElement === viewerRef.current;
    startTransition(() => setIsFullscreen(active));
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    const el = viewerRef.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      void document.exitFullscreen();
      return;
    }
    void el.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, [syncFullscreenState]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.output);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 2000);
    trackEvent("text_replacer_copy", { replacements: result.count, input_length: source.length });
  };

  const handleDownload = () => {
    const safe = filename.replace(/\.txt$/i, "").replace(/[^a-zA-Z0-9._-]/g, "_") || "replaced";
    downloadTextFile(result.output, `${safe}.txt`, "text/plain");
    trackEvent("text_replacer_download", { file_name: `${safe}.txt`, replacements: result.count });
  };

  const handleOpenFile = async (file: File) => {
    const text = await file.text();
    setSource(text);
    setFilename(file.name.replace(/\.[^.]+$/, "") || "replaced");
    trackEvent("text_replacer_open_file", { file_name: file.name, input_length: text.length });
  };

  const applyPreset = (id: PresetId) => {
    const preset = PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setFind(preset.find);
    setReplace(preset.replace);
    setInterpretFind(preset.interpretFind);
    setInterpretReplace(preset.interpretReplace);
    setUseRegex(false);
    trackEvent("text_replacer_preset", { preset: id });
  };

  const activePreset =
    PRESETS.find(
      (preset) =>
        preset.find === find &&
        preset.replace === replace &&
        preset.interpretFind === interpretFind &&
        preset.interpretReplace === interpretReplace &&
        !useRegex,
    )?.id ?? null;

  const editorColumnClass = `flex min-h-0 flex-col ${paneHeight}`;
  const previewColumnClass = `flex min-h-0 flex-col ${paneHeight}`;

  return (
    <main className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10 md:py-12">
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">{t("h1")}</h1>
        <p className="mx-auto text-base text-gray-500 sm:text-lg md:whitespace-nowrap">
          {t("subtitle")}
        </p>
      </div>

      <div className="mb-12 flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:gap-6 sm:p-6 md:mb-16 md:p-8">
        <div
          ref={viewerRef}
          className="flex min-h-0 flex-col [&:fullscreen]:box-border [&:fullscreen]:size-full [&:fullscreen]:min-h-0 [&:fullscreen]:bg-white [&:fullscreen]:p-4 sm:[&:fullscreen]:p-6"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.json,.csv,.log,text/plain"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleOpenFile(file);
              event.target.value = "";
            }}
          />

          <div className="mb-4 flex shrink-0 flex-col gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <label className="shrink-0 text-sm text-gray-600" htmlFor="text-replacer-filename">
                {tCommon("filename")}
              </label>
              <input
                id="text-replacer-filename"
                type="text"
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
                className="min-w-0 max-w-[12rem] flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-[14rem]"
                placeholder="replaced"
              />
              <span className="shrink-0 text-sm text-gray-400">.txt</span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                {result.error ? t("patternError") : t("replacements", { count: result.count })}
              </span>
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {tCommon("openFile")}
                </button>
                <button
                  type="button"
                  onClick={() => setSource(result.output)}
                  disabled={Boolean(result.error) || result.output === source}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("useResult")}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {copyState === "copied" ? tCommon("copied") : tCommon("copy")}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {tCommon("download")}
                </button>
                <button
                  type="button"
                  onClick={handleFullscreenToggle}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {isFullscreen ? tCommon("exit") : tCommon("fullscreen")}
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex min-w-0 flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {useRegex ? t("findRegex") : t("find")}
                </span>
                <input
                  value={find}
                  onChange={(event) => setFind(event.target.value)}
                  spellCheck={false}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={useRegex ? "(\\d+)" : "\\n"}
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{t("replaceWith")}</span>
                <input
                  value={replace}
                  onChange={(event) => setReplace(event.target.value)}
                  spellCheck={false}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={useRegex ? "$1" : "\\n"}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label={t("presetsLabel")}>
              {PRESETS.map((preset) => {
                const active = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => applyPreset(preset.id)}
                    className={
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                      (active
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50")
                    }
                  >
                    {t(preset.labelKey)}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-700">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={interpretReplace}
                  onChange={(event) => setInterpretReplace(event.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {t("interpretReplace")}
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={interpretFind}
                  disabled={useRegex}
                  onChange={(event) => setInterpretFind(event.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                {t("interpretFind")}
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!caseSensitive}
                  onChange={(event) => setCaseSensitive(!event.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {t("ignoreCase")}
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useRegex}
                  onChange={(event) => setUseRegex(event.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {t("useRegex")}
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={greedy}
                  disabled={!useRegex}
                  onChange={(event) => setGreedy(event.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                {t("greedy")}
              </label>
            </div>
            <p className="text-xs text-gray-500">
              {useRegex
                ? greedy
                  ? t("hintRegexGreedy")
                  : t("hintRegexLazy")
                : t("hintLiteral")}
            </p>
          </div>

          {result.error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{result.error}</div>
          )}

          <div
            className={
              (isFullscreen ? "grid min-h-0 flex-1 gap-4 pt-1 md:gap-6 md:pt-2" : "grid min-h-0 gap-4 md:gap-6") +
              (isSplit ? " grid-cols-1 md:grid-cols-2" : " grid-cols-1")
            }
          >
            {isSplit && (
              <div className={editorColumnClass}>
                <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500">{tCommon("original")}</span>
                <textarea
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  spellCheck={false}
                  placeholder={t("placeholder")}
                  className="min-h-0 w-full flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:p-4"
                />
              </div>
            )}
            <div className={previewColumnClass}>
              <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500">{tCommon("result")}</span>
              <textarea
                value={result.output}
                readOnly
                spellCheck={false}
                className="min-h-0 w-full flex-1 resize-none rounded-lg border border-gray-200 bg-white p-3 font-mono text-sm text-gray-800 sm:p-4"
              />
            </div>
          </div>
        </div>
      </div>

      <p className="mx-auto mb-12 max-w-4xl text-center text-sm leading-relaxed text-gray-600 sm:mb-16 sm:text-base">
        {t("intro")}
      </p>

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">{t("whyTitle")}</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("newlineTitle")}</h3>
            <p className="text-sm leading-relaxed text-gray-600">
              {t("newlineBody")}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("liveTitle")}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{t("liveBody")}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("privateTitle")}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{t("privateBody")}</p>
          </div>
        </div>
      </section>

      <SeoSections className="mb-12 sm:mb-16" sections={t.raw("seoSections") as SeoSection[]} />

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">{t("faqTitle")}</h2>
        <FaqList items={t.raw("faqs")} />
      </section>

      <MoreTools currentHref="/text-replacer" />
    </main>
  );
}
