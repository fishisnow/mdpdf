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
        <h1 className="mb-3 text-3xl font-heading sm:text-4xl">{t("h1")}</h1>
        <p className="mx-auto text-base text-foreground/70 sm:text-lg md:whitespace-nowrap">
          {t("subtitle")}
        </p>
      </div>

      <div className="mb-12 flex flex-col gap-5 neo-panel p-5 sm:gap-6 sm:p-6 md:mb-16 md:p-8">
        <div
          ref={viewerRef}
          className="flex min-h-0 flex-col [&:fullscreen]:box-border [&:fullscreen]:size-full [&:fullscreen]:min-h-0 [&:fullscreen]:bg-secondary-background [&:fullscreen]:p-4 sm:[&:fullscreen]:p-6"
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
              <label className="shrink-0 text-sm text-foreground/80" htmlFor="text-replacer-filename">
                {tCommon("filename")}
              </label>
              <input
                id="text-replacer-filename"
                type="text"
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
                className="min-w-0 max-w-[12rem] flex-1 rounded-base border-2 border-border bg-secondary-background px-2 py-1.5 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black sm:max-w-[14rem]"
                placeholder="replaced"
              />
              <span className="shrink-0 text-sm text-foreground/50">.txt</span>
              <span className="inline-flex items-center rounded-base border-2 border-border bg-chart-3 px-2.5 py-1 text-xs font-heading">
                {result.error ? t("patternError") : t("replacements", { count: result.count })}
              </span>
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
                >
                  {tCommon("openFile")}
                </button>
                <button
                  type="button"
                  onClick={() => setSource(result.output)}
                  disabled={Boolean(result.error) || result.output === source}
                  className="rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none disabled:pointer-events-none disabled:opacity-50"
                >
                  {t("useResult")}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
                >
                  {copyState === "copied" ? tCommon("copied") : tCommon("copy")}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded-base border-2 border-border bg-main px-3 py-2 text-sm font-base text-main-foreground shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
                >
                  {tCommon("download")}
                </button>
                <button
                  type="button"
                  onClick={handleFullscreenToggle}
                  className="rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
                >
                  {isFullscreen ? tCommon("exit") : tCommon("fullscreen")}
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex min-w-0 flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                  {useRegex ? t("findRegex") : t("find")}
                </span>
                <input
                  value={find}
                  onChange={(event) => setFind(event.target.value)}
                  spellCheck={false}
                  className="rounded-base border-2 border-border bg-secondary-background px-3 py-2 font-mono text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black"
                  placeholder={useRegex ? "(\\d+)" : "\\n"}
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-foreground/60">{t("replaceWith")}</span>
                <input
                  value={replace}
                  onChange={(event) => setReplace(event.target.value)}
                  spellCheck={false}
                  className="rounded-base border-2 border-border bg-secondary-background px-3 py-2 font-mono text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black"
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
                      "rounded-base border-2 px-3 py-1.5 text-xs font-heading transition-all " +
                      (active
                        ? "border-border bg-main text-main-foreground shadow-shadow"
                        : "border-border bg-secondary-background hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-shadow")
                    }
                  >
                    {t(preset.labelKey)}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-foreground/80">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={interpretReplace}
                  onChange={(event) => setInterpretReplace(event.target.checked)}
                  className="rounded border-border text-foreground underline decoration-2 focus:ring-black"
                />
                {t("interpretReplace")}
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={interpretFind}
                  disabled={useRegex}
                  onChange={(event) => setInterpretFind(event.target.checked)}
                  className="rounded border-border text-foreground underline decoration-2 focus:ring-black disabled:opacity-50"
                />
                {t("interpretFind")}
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!caseSensitive}
                  onChange={(event) => setCaseSensitive(!event.target.checked)}
                  className="rounded border-border text-foreground underline decoration-2 focus:ring-black"
                />
                {t("ignoreCase")}
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useRegex}
                  onChange={(event) => setUseRegex(event.target.checked)}
                  className="rounded border-border text-foreground underline decoration-2 focus:ring-black"
                />
                {t("useRegex")}
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={greedy}
                  disabled={!useRegex}
                  onChange={(event) => setGreedy(event.target.checked)}
                  className="rounded border-border text-foreground underline decoration-2 focus:ring-black disabled:opacity-50"
                />
                {t("greedy")}
              </label>
            </div>
            <p className="text-xs text-foreground/60">
              {useRegex
                ? greedy
                  ? t("hintRegexGreedy")
                  : t("hintRegexLazy")
                : t("hintLiteral")}
            </p>
          </div>

          {result.error && (
            <div className="mb-3 rounded-base border-2 border-border bg-chart-2 p-3 text-sm font-base shadow-shadow">{result.error}</div>
          )}

          <div
            className={
              (isFullscreen ? "grid min-h-0 flex-1 gap-4 pt-1 md:gap-6 md:pt-2" : "grid min-h-0 gap-4 md:gap-6") +
              (isSplit ? " grid-cols-1 md:grid-cols-2" : " grid-cols-1")
            }
          >
            {isSplit && (
              <div className={editorColumnClass}>
                <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-foreground/60">{tCommon("original")}</span>
                <textarea
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  spellCheck={false}
                  placeholder={t("placeholder")}
                  className="min-h-0 w-full flex-1 resize-none rounded-base border-2 border-border bg-secondary-background p-3 font-mono text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black sm:p-4"
                />
              </div>
            )}
            <div className={previewColumnClass}>
              <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-foreground/60">{tCommon("result")}</span>
              <textarea
                value={result.output}
                readOnly
                spellCheck={false}
                className="min-h-0 w-full flex-1 resize-none rounded-base border-2 border-border bg-secondary-background p-3 font-mono text-sm sm:p-4"
              />
            </div>
          </div>
        </div>
      </div>

      <p className="mx-auto mb-12 max-w-4xl text-center text-sm leading-relaxed text-foreground/80 sm:mb-16 sm:text-base">
        {t("intro")}
      </p>

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-6 text-center text-2xl font-heading sm:mb-8">{t("whyTitle")}</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="neo-panel p-5 sm:p-6">
            <h3 className="mb-2 text-lg font-heading">{t("newlineTitle")}</h3>
            <p className="text-sm leading-relaxed text-foreground/80">
              {t("newlineBody")}
            </p>
          </div>
          <div className="neo-panel p-5 sm:p-6">
            <h3 className="mb-2 text-lg font-heading">{t("liveTitle")}</h3>
            <p className="text-sm leading-relaxed text-foreground/80">{t("liveBody")}</p>
          </div>
          <div className="neo-panel p-5 sm:p-6">
            <h3 className="mb-2 text-lg font-heading">{t("privateTitle")}</h3>
            <p className="text-sm leading-relaxed text-foreground/80">{t("privateBody")}</p>
          </div>
        </div>
      </section>

      <SeoSections className="mb-12 sm:mb-16" sections={t.raw("seoSections") as SeoSection[]} />

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-4 text-center text-2xl font-heading">{t("faqTitle")}</h2>
        <FaqList items={t.raw("faqs")} />
      </section>

      <MoreTools currentHref="/text-replacer" />
    </main>
  );
}
