"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import MarkdownDiffPreviewView from "@/components/MarkdownDiffPreviewView";
import MarkdownDiffView from "@/components/MarkdownDiffView";
import MoreTools from "@/components/MoreTools";
import FaqList from "@/components/FaqList";
import { trackEvent } from "@/lib/analytics";
import type { MarkdownCitation } from "@/lib/markdown-citations";
import { countLines, countMarkdownCitations, diffMarkdownLines, listMarkdownCitations } from "@/lib/md-diff";
import { workspacePaneHeight } from "@/lib/tools";

type CompareMode = "preview" | "source";

const DEFAULT_LEFT = `# Product notes

Keep the md diff sample short.

## Spec

See the [spec](https://example.com/spec).
`;

const DEFAULT_RIGHT = `# Product notes

Keep the md diff sample short, then add a changelog.

## Spec

See the [spec](https://example.com/spec) and the [guide](https://example.com/guide).
`;

export default function MdDiffPage() {
  const t = useTranslations("mdDiff");
  const tCommon = useTranslations("common");
  const [left, setLeft] = useState(DEFAULT_LEFT);
  const [right, setRight] = useState(DEFAULT_RIGHT);
  const [comparing, setComparing] = useState(false);
  const [compareMode, setCompareMode] = useState<CompareMode>("preview");
  const [numberedCitations, setNumberedCitations] = useState(true);
  const [referencesOpen, setReferencesOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const leftFileRef = useRef<HTMLInputElement | null>(null);
  const rightFileRef = useRef<HTMLInputElement | null>(null);

  const leftCitationList = useMemo(() => listMarkdownCitations(left), [left]);
  const rightCitationList = useMemo(() => listMarkdownCitations(right), [right]);
  const leftCitations = leftCitationList.length;
  const rightCitations = rightCitationList.length;
  const leftLines = useMemo(() => countLines(left), [left]);
  const rightLines = useMemo(() => countLines(right), [right]);
  const rows = useMemo(
    () => (comparing && compareMode === "source" ? diffMarkdownLines(left, right) : []),
    [comparing, compareMode, left, right],
  );
  const paneHeight = workspacePaneHeight(isFullscreen, true);

  const syncFullscreenState = useCallback(() => {
    const active = document.fullscreenElement === viewerRef.current;
    startTransition(() => {
      setIsFullscreen(active);
      if (!active) setComparing(false);
    });
  }, []);

  const enterCompare = useCallback(() => {
    const el = viewerRef.current;
    setComparing(true);
    trackEvent("md_diff_compare", {
      mode: compareMode,
      left_lines: countLines(left),
      right_lines: countLines(right),
      left_citations: countMarkdownCitations(left),
      right_citations: countMarkdownCitations(right),
    });
    if (!el) return;
    void el.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
  }, [compareMode, left, right]);

  const exitCompare = useCallback(() => {
    if (document.fullscreenElement === viewerRef.current) {
      void document.exitFullscreen();
      return;
    }
    setComparing(false);
    setIsFullscreen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, [syncFullscreenState]);

  const openFile = async (file: File, side: "left" | "right") => {
    const text = await file.text();
    if (side === "left") setLeft(text);
    else setRight(text);
    trackEvent("md_diff_open_file", { side, file_name: file.name, input_length: text.length });
  };

  return (
    <main className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10 md:py-12">
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">{t("h1")}</h1>
        <p className="mx-auto text-base text-gray-500 sm:text-lg md:whitespace-nowrap">{t("subtitle")}</p>
      </div>

      <div className="mb-12 flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:gap-6 sm:p-6 md:mb-16 md:p-8">
        <div
          ref={viewerRef}
          className="flex min-h-0 flex-col [&:fullscreen]:box-border [&:fullscreen]:size-full [&:fullscreen]:min-h-0 [&:fullscreen]:bg-white [&:fullscreen]:p-4 sm:[&:fullscreen]:p-6"
        >
          <input
            ref={leftFileRef}
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void openFile(file, "left");
              event.target.value = "";
            }}
          />
          <input
            ref={rightFileRef}
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void openFile(file, "right");
              event.target.value = "";
            }}
          />

          <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={numberedCitations}
                onChange={(event) => setNumberedCitations(event.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {t("numberedCitations")}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <CompareModeToggle value={compareMode} onChange={setCompareMode} />
              {comparing ? (
                <button
                  type="button"
                  onClick={exitCompare}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {isFullscreen ? tCommon("exit") : t("edit")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={enterCompare}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {t("compare")}
                </button>
              )}
            </div>
          </div>

          {comparing ? (
            <div className={`flex min-h-0 flex-col ${paneHeight}`}>
              <div className="flex min-h-0 flex-1 flex-col">
                {compareMode === "preview" ? (
                  <MarkdownDiffPreviewView
                    leftMarkdown={left}
                    rightMarkdown={right}
                    numberedCitations={numberedCitations}
                  />
                ) : (
                  <MarkdownDiffView rows={rows} />
                )}
              </div>
              {numberedCitations ? (
                <GeneratedReferences
                  left={leftCitationList}
                  right={rightCitationList}
                  title={t("generatedReferences")}
                  collapsible
                  open={referencesOpen}
                  onOpenChange={setReferencesOpen}
                />
              ) : null}
            </div>
          ) : (
            <>
              <div className="grid min-h-0 gap-4 md:grid-cols-2 md:gap-6">
                <EditorPane
                  label={t("original")}
                  value={left}
                  onChange={setLeft}
                  lineLabel={t("lines", { count: leftLines })}
                  citationLabel={t("citations", { count: leftCitations })}
                  openLabel={tCommon("openFile")}
                  onOpen={() => leftFileRef.current?.click()}
                  placeholder={t("leftPlaceholder")}
                  paneHeight={paneHeight}
                />
                <EditorPane
                  label={t("modified")}
                  value={right}
                  onChange={setRight}
                  lineLabel={t("lines", { count: rightLines })}
                  citationLabel={t("citations", { count: rightCitations })}
                  openLabel={tCommon("openFile")}
                  onOpen={() => rightFileRef.current?.click()}
                  placeholder={t("rightPlaceholder")}
                  paneHeight={paneHeight}
                />
              </div>
              {numberedCitations ? (
                <GeneratedReferences
                  left={leftCitationList}
                  right={rightCitationList}
                  title={t("generatedReferences")}
                />
              ) : null}
            </>
          )}
        </div>
      </div>

      <p className="mx-auto mb-12 max-w-4xl text-center text-sm leading-relaxed text-gray-600 sm:mb-16 sm:text-base">
        {t("intro")}
      </p>

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">{t("whyTitle")}</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("sideTitle")}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{t("sideBody")}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("citeTitle")}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{t("citeBody")}</p>
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

      <MoreTools currentHref="/md-diff" />
    </main>
  );
}

function GeneratedReferences({
  left,
  right,
  title,
  collapsible = false,
  open = true,
  onOpenChange,
}: {
  left: MarkdownCitation[];
  right: MarkdownCitation[];
  title: string;
  collapsible?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  if (left.length === 0 && right.length === 0) return null;
  const expanded = !collapsible || open;

  return (
    <aside className="mt-3 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      {collapsible ? (
        <button
          type="button"
          onClick={() => onOpenChange?.(!open)}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-100"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</span>
          <span className="text-lg leading-none text-gray-400">{expanded ? "−" : "+"}</span>
        </button>
      ) : (
        <div className="border-b border-gray-200 px-4 py-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</span>
        </div>
      )}
      <div
        className={
          "grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-gray-200 " +
          (expanded ? "" : "hidden") +
          (collapsible && expanded ? "border-t border-gray-200" : "")
        }
      >
        <CitationColumn citations={left} />
        <CitationColumn citations={right} />
      </div>
    </aside>
  );
}

function CitationColumn({ citations }: { citations: MarkdownCitation[] }) {
  if (citations.length === 0) {
    return <div className="min-h-10 px-4 py-3" />;
  }

  return (
    <ol className="max-h-40 space-y-2 overflow-auto px-4 py-3 text-sm text-gray-800">
      {citations.map((citation) => (
        <li key={`${citation.index}-${citation.href}`} className="leading-6">
          <span className="mr-1.5 font-semibold text-gray-700">[{citation.index}]</span>
          <a href={citation.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {citation.label}
          </a>
        </li>
      ))}
    </ol>
  );
}

function CompareModeToggle({
  value,
  onChange,
}: {
  value: CompareMode;
  onChange: (mode: CompareMode) => void;
}) {
  const t = useTranslations("mdDiff");
  const options: { id: CompareMode; label: string }[] = [
    { id: "preview", label: t("viewPreview") },
    { id: "source", label: t("viewSource") },
  ];

  return (
    <div
      className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5"
      role="group"
      aria-label={t("compareMode")}
    >
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
              (active ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900")
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function EditorPane({
  label,
  value,
  onChange,
  lineLabel,
  citationLabel,
  openLabel,
  onOpen,
  placeholder,
  paneHeight,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  lineLabel: string;
  citationLabel: string;
  openLabel: string;
  onOpen: () => void;
  placeholder: string;
  paneHeight: string;
}) {
  return (
    <div className={`flex min-h-0 flex-col ${paneHeight}`}>
      <div className="mb-2 flex h-7 shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
          <span className="truncate text-xs text-gray-400">
            {lineLabel} · {citationLabel}
          </span>
        </div>
        <button type="button" onClick={onOpen} className="text-xs text-blue-600 hover:underline">
          {openLabel}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        placeholder={placeholder}
        className="min-h-0 w-full flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:p-4"
      />
    </div>
  );
}
