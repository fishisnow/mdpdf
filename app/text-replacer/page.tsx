"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ViewModeToggle, { type ResultViewMode } from "@/components/ViewModeToggle";
import MoreTools from "@/components/MoreTools";
import { trackEvent } from "@/lib/analytics";
import { applyTextReplace } from "@/lib/text-replacer";
import { downloadTextFile, workspacePaneHeight } from "@/lib/tools";

const DEFAULT_TEXT = `Hello\\nWorld\\nColumn A\\tColumn B`;

const faqs = [
  {
    question: "How do I turn \\n into real line breaks in Text Replacer?",
    answer:
      "In Text Replacer, keep Find as \\n and Replace as \\n, with “Interpret escapes in replace” turned on. Find stays literal, so it matches the two characters backslash and n. Replace then inserts a real newline.",
  },
  {
    question: "What escape sequences work in Text Replacer?",
    answer: "With interpret-replace enabled, \\n becomes a newline, \\t a tab, \\r a carriage return, and \\\\ a backslash.",
  },
  {
    question: "Does Text Replacer upload my text?",
    answer: "No. Text Replacer runs find, replace, and preview in your browser.",
  },
  {
    question: "When should I use regex in Text Replacer?",
    answer:
      "Turn on Use regex in Text Replacer to treat Find as a JavaScript regular expression. For example, Find (\\d+) and Replace [$1] wraps each number in brackets. Greedy matching (the default) lets .* consume as much as possible; uncheck it to match the shortest span instead. In regex mode, \\n matches a real newline; to match the two characters backslash and n, use \\\\n.",
  },
  {
    question: "Is Text Replacer free?",
    answer: "Yes. It is free to use in the browser, with no account required.",
  },
] as const;

type PresetId = "literal-newline" | "literal-tab" | "encode-newline" | "crlf-to-newline";

const PRESETS: {
  id: PresetId;
  label: string;
  find: string;
  replace: string;
  interpretFind: boolean;
  interpretReplace: boolean;
}[] = [
  {
    id: "literal-newline",
    label: "\\n → newline",
    find: "\\n",
    replace: "\\n",
    interpretFind: false,
    interpretReplace: true,
  },
  {
    id: "literal-tab",
    label: "\\t → tab",
    find: "\\t",
    replace: "\\t",
    interpretFind: false,
    interpretReplace: true,
  },
  {
    id: "encode-newline",
    label: "newline → \\n",
    find: "\\n",
    replace: "\\n",
    interpretFind: true,
    interpretReplace: false,
  },
  {
    id: "crlf-to-newline",
    label: "\\r\\n → newline",
    find: "\\r\\n",
    replace: "\\n",
    interpretFind: true,
    interpretReplace: true,
  },
];

export default function TextReplacerPage() {
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
  const [openFaq, setOpenFaq] = useState<number | null>(0);
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
        <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">Text Replacer</h1>
        <p className="mx-auto text-base text-gray-500 sm:text-lg md:whitespace-nowrap">
          Free Text Replacer for find and replace, including turning \n into line breaks.
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
                Filename
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
                {result.error ? "Pattern error" : `${result.count} replacement${result.count === 1 ? "" : "s"}`}
              </span>
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Open file
                </button>
                <button
                  type="button"
                  onClick={() => setSource(result.output)}
                  disabled={Boolean(result.error) || result.output === source}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Use result as input
                </button>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {copyState === "copied" ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={handleFullscreenToggle}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {isFullscreen ? "Exit" : "Fullscreen"}
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex min-w-0 flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {useRegex ? "Find (regular expression)" : "Find"}
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
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Replace with</span>
                <input
                  value={replace}
                  onChange={(event) => setReplace(event.target.value)}
                  spellCheck={false}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={useRegex ? "$1" : "\\n"}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Replace presets">
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
                    {preset.label}
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
                Interpret escapes in replace
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={interpretFind}
                  disabled={useRegex}
                  onChange={(event) => setInterpretFind(event.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                Interpret escapes in find
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!caseSensitive}
                  onChange={(event) => setCaseSensitive(!event.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Ignore case
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useRegex}
                  onChange={(event) => setUseRegex(event.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Use regex in Find
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={greedy}
                  disabled={!useRegex}
                  onChange={(event) => setGreedy(event.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                Greedy matching
              </label>
            </div>
            <p className="text-xs text-gray-500">
              {useRegex
                ? greedy
                  ? "Find is a JavaScript regular expression. Quantifiers like .* match as much as possible. Uncheck Greedy matching to take the shortest match. Replacement supports $1, $2, and $&."
                  : "Greedy matching is off, so * + ? and {n,m} match as little as possible (same as writing .*? or +?). Replacement supports $1, $2, and $&."
                : "Find is literal by default, so \\n matches a backslash plus n. With interpret-replace on, \\n in Replace becomes a real line break."}
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
                <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500">Original</span>
                <textarea
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  spellCheck={false}
                  placeholder="Paste text that contains \n or other characters to replace…"
                  className="min-h-0 w-full flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:p-4"
                />
              </div>
            )}
            <div className={previewColumnClass}>
              <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500">Result</span>
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
        Use this Text Replacer to find and replace text without leaving the browser. Paste source on the left, set Find and Replace, and the result updates as you type. Copy or download the output; nothing is uploaded.
      </p>

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">Why use Text Replacer?</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Literal \n to newlines</h3>
            <p className="text-sm leading-relaxed text-gray-600">
              Text copied from JSON, logs, or chat often shows \n as two characters. The default replace turns those into real line breaks.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Live result</h3>
            <p className="text-sm leading-relaxed text-gray-600">The right pane updates as you edit Find and Replace, and shows how many replacements were made.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Stays in the browser</h3>
            <p className="text-sm leading-relaxed text-gray-600">Open a local file in Text Replacer, copy the result, or download a .txt file without uploading anything.</p>
          </div>
        </div>
      </section>

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">Text Replacer FAQs</h2>
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
              <div className={openFaq === index ? "px-4 pb-4 text-sm leading-relaxed text-gray-600 sm:px-6" : "hidden"}>{faq.answer}</div>
            </div>
          ))}
        </div>
      </section>

      <MoreTools currentHref="/text-replacer" />
    </main>
  );
}
