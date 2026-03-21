"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import MarkdownHtmlPreview from "@/components/MarkdownHtmlPreview";
import SourceTextarea from "@/components/SourceTextarea";

interface Props {
  markdown: string;
  filename: string;
  onDownload?: (payload: { filename: string; markdownLength: number }) => void;
}

type CopyState = "idle" | "copied";

export default function MarkdownPreview({ markdown, filename, onDownload }: Props) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopyState("copied");
    setTimeout(() => setCopyState("idle"), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const downloadName = filename.replace(/\.pdf$/i, ".md");
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(url);

    onDownload?.({
      filename: downloadName,
      markdownLength: markdown.length,
    });
  };

  const syncFullscreenState = useCallback(() => {
    const active = document.fullscreenElement === viewerRef.current;
    startTransition(() => {
      setIsFullscreen(active);
    });
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    const el = viewerRef.current;
    if (!el) {
      return;
    }

    if (document.fullscreenElement === el) {
      void document.exitFullscreen();
      return;
    }

    const req = el.requestFullscreen({ navigationUI: "hide" });
    req?.catch(() => {});
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, [syncFullscreenState]);

  const paneShellClass =
    "flex min-h-0 flex-col " +
    (isFullscreen ? "min-h-0 flex-1" : "h-[320px] sm:h-[420px] md:h-[600px]");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-700">Result</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {!isFullscreen && (
            <button
              type="button"
              onClick={handleFullscreenToggle}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
            >
              Fullscreen
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 sm:w-auto"
          >
            Download .md
          </button>
        </div>
      </div>

      <div
        ref={viewerRef}
        className="flex min-h-0 flex-col [&:fullscreen]:box-border [&:fullscreen]:size-full [&:fullscreen]:min-h-0 [&:fullscreen]:bg-white [&:fullscreen]:p-4 sm:[&:fullscreen]:p-6"
      >
        {isFullscreen && (
          <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
            <span className="text-sm font-medium text-gray-700">Source & Preview</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
              >
                Download .md
              </button>
              <button
                type="button"
                onClick={handleFullscreenToggle}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                Exit fullscreen
              </button>
            </div>
          </div>
        )}

        <div
          className={
            isFullscreen
              ? "grid min-h-0 flex-1 grid-cols-1 gap-4 pt-2 md:grid-cols-2 md:gap-6 md:pt-4"
              : "grid w-full grid-cols-1 gap-4 pt-4 md:grid-cols-2 md:gap-6"
          }
        >
          <div className={paneShellClass}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Source</span>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded bg-gray-700 px-3 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-600"
              >
                {copyState === "copied" ? "Copied!" : "Copy"}
              </button>
            </div>
            <SourceTextarea markdown={markdown} />
          </div>
          <div className={paneShellClass}>
            <span className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Preview</span>
            <MarkdownHtmlPreview markdown={markdown} />
          </div>
        </div>
      </div>
    </div>
  );
}
