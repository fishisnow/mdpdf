"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import ViewModeToggle, { type ResultViewMode } from "@/components/ViewModeToggle";
import MoreTools from "@/components/MoreTools";
import FaqList from "@/components/FaqList";
import JsonFormattedView from "@/components/JsonFormattedView";
import JsonTreeView from "@/components/JsonTreeView";
import { trackEvent } from "@/lib/analytics";
import {
  canHighlightJson,
  canRenderJsonTree,
  deleteJsonPath,
  formatJson,
  minifyJson,
  parseJsonInput,
  unescapeJsonText,
  stringifyJsonLikeSource,
  type JsonPath,
} from "@/lib/json-preview";
import { downloadTextFile, workspacePaneHeight } from "@/lib/tools";

const DEFAULT_JSON = `{
  "name": "MdPdf",
  "private": true,
  "tools": [
    { "id": "pdf-to-md", "ready": true },
    { "id": "md-viewer", "ready": true },
    { "id": "json-viewer", "ready": true }
  ],
  "privacy": {
    "runsInBrowser": true,
    "uploadRequired": false
  }
}`;

type PreviewKind = "formatted" | "tree";

export default function JsonPreviewPage() {
  const t = useTranslations("jsonViewer");
  const tCommon = useTranslations("common");
  const [source, setSource] = useState(DEFAULT_JSON);
  const [filename, setFilename] = useState("data");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ResultViewMode>("split");
  const [previewKind, setPreviewKind] = useState<PreviewKind>("formatted");
  const [expandDepth, setExpandDepth] = useState(1);
  const [treeKey, setTreeKey] = useState(0);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isSplit = viewMode === "split";
  const paneHeight = workspacePaneHeight(isFullscreen, isSplit);

  const parsed = useMemo(() => parseJsonInput(source), [source]);
  const formatted = parsed.ok ? formatJson(parsed.value) : "";
  const showTree = parsed.ok && previewKind === "tree" && canRenderJsonTree(parsed.value);
  const showHighlighted = parsed.ok && previewKind === "formatted" && canHighlightJson(formatted);

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

  const outputText = parsed.ok ? formatted : source;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputText);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 2000);
    trackEvent("json_preview_copy", { input_length: source.length, valid: parsed.ok });
  };

  const handleDownload = () => {
    const safe = filename.replace(/\.json$/i, "").replace(/[^a-zA-Z0-9._-]/g, "_") || "data";
    downloadTextFile(outputText, `${safe}.json`, "application/json");
    trackEvent("json_preview_download", { file_name: `${safe}.json`, valid: parsed.ok });
  };

  const handleFormat = () => {
    if (!parsed.ok) return;
    setSource(formatted);
    trackEvent("json_preview_format", { input_length: source.length });
  };

  const handleMinify = () => {
    if (!parsed.ok) return;
    setSource(minifyJson(parsed.value));
    trackEvent("json_preview_minify", { input_length: source.length });
  };

  const unescapedSource = useMemo(() => unescapeJsonText(source), [source]);

  const handleUnescape = () => {
    if (unescapedSource === null) return;
    setSource(unescapedSource);
    trackEvent("json_preview_unescape", { input_length: source.length });
  };

  const handleDeletePath = useCallback((path: JsonPath) => {
    setSource((current) => {
      const currentParsed = parseJsonInput(current);
      if (!currentParsed.ok) return current;
      const next = deleteJsonPath(currentParsed.value, path);
      return stringifyJsonLikeSource(next, current);
    });
    trackEvent("json_preview_delete", { path_length: path.length });
  }, []);

  const handleOpenFile = async (file: File) => {
    const text = await file.text();
    setSource(text);
    setFilename(file.name.replace(/\.[^.]+$/, "") || "data");
    trackEvent("json_preview_open_file", { file_name: file.name, input_length: text.length });
  };

  const resetTree = (depth: number) => {
    setExpandDepth(depth);
    setTreeKey((key) => key + 1);
  };

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
            accept=".json,.txt,application/json,text/plain"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleOpenFile(file);
              event.target.value = "";
            }}
          />

          <div className="mb-3 flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <label className="shrink-0 text-sm text-gray-600" htmlFor="json-preview-filename">
                {tCommon("filename")}
              </label>
              <input
                id="json-preview-filename"
                type="text"
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
                className="min-w-0 max-w-[12rem] flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-[14rem]"
                placeholder="data"
              />
              <span className="shrink-0 text-sm text-gray-400">.json</span>
              <span
                className={
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium " +
                  (parsed.ok
                    ? "bg-emerald-50 text-emerald-700"
                    : source.trim()
                      ? "bg-red-50 text-red-700"
                      : "bg-gray-100 text-gray-600")
                }
              >
                {parsed.ok ? t("valid") : source.trim() ? t("invalid") : t("empty")}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5" role="group" aria-label={t("kindLabel")}>
                {(["formatted", "tree"] as const).map((kind) => {
                  const active = previewKind === kind;
                  return (
                    <button
                      key={kind}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPreviewKind(kind)}
                      className={
                        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                        (active ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900")
                      }
                    >
                      {kind === "formatted" ? t("formatted") : t("tree")}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleFormat}
                disabled={!parsed.ok}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("format")}
              </button>
              <button
                type="button"
                onClick={handleMinify}
                disabled={!parsed.ok}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("minify")}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                {tCommon("openFile")}
              </button>
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={!source}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {copyState === "copied" ? tCommon("copied") : tCommon("copy")}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!source.trim()}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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

          <div
            className={
              (isFullscreen ? "grid min-h-0 flex-1 gap-4 pt-1 md:gap-6 md:pt-2" : "grid min-h-0 gap-4 md:gap-6") +
              (isSplit ? " grid-cols-1 md:grid-cols-2" : " grid-cols-1")
            }
          >
            {isSplit && (
              <div className={editorColumnClass}>
                <div className="mb-2 flex h-7 shrink-0 items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{tCommon("json")}</span>
                  <button
                    type="button"
                    onClick={handleUnescape}
                    disabled={unescapedSource === null}
                    className="h-6 rounded-md border border-gray-300 px-2 text-xs leading-none text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("unescape")}
                  </button>
                </div>
                <textarea
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  spellCheck={false}
                  placeholder='{"hello": "world"}'
                  className="min-h-0 w-full flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:p-4"
                />
              </div>
            )}
            <div className={previewColumnClass}>
              <div className="mb-2 flex h-7 shrink-0 items-center justify-between gap-2">
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{tCommon("preview")}</span>
                  <span className="hidden truncate text-xs text-gray-400 sm:inline">{t("hoverHint")}</span>
                </div>
                {previewKind === "tree" && parsed.ok && (
                  <div className="flex gap-2">
                    <button type="button" className="text-xs text-blue-600 hover:underline" onClick={() => resetTree(99)}>
                      {t("expandAll")}
                    </button>
                    <button type="button" className="text-xs text-blue-600 hover:underline" onClick={() => resetTree(0)}>
                      {t("collapseAll")}
                    </button>
                  </div>
                )}
              </div>
              {!parsed.ok ? (
                <div className="flex min-h-0 flex-1 items-start overflow-auto rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  {source.trim() ? (
                    <p className="text-red-700">{parsed.message}</p>
                  ) : (
                    <p>{t("pasteHint")}</p>
                  )}
                </div>
              ) : previewKind === "tree" ? (
                showTree ? (
                  <JsonTreeView key={treeKey} value={parsed.value} expandDepth={expandDepth} onDelete={handleDeletePath} />
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <p className="mb-2 shrink-0 text-xs text-gray-500">{t("tooLarge")}</p>
                    <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-white p-3 font-mono text-[13px] leading-6 text-gray-800 sm:p-4">
                      {formatted}
                    </pre>
                  </div>
                )
              ) : showHighlighted ? (
                <JsonFormattedView value={parsed.value} formatted={formatted} onDelete={handleDeletePath} />
              ) : (
                <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-white p-3 font-mono text-[13px] leading-6 text-gray-800 sm:p-4">
                  {formatted}
                </pre>
              )}
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
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("validateTitle")}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{t("validateBody")}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("inspectTitle")}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{t("inspectBody")}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("privateTitle")}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{t("privateBody")}</p>
          </div>
        </div>
      </section>

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">{t("faqTitle")}</h2>
        <FaqList items={t.raw("faqs")} />
      </section>

      <MoreTools currentHref="/json-viewer" />
    </main>
  );
}
