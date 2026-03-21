"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "@/components/markdown-components";

interface Props {
  markdown: string;
  filename: string;
  onDownload?: (payload: { filename: string; markdownLength: number }) => void;
}

type Tab = "source" | "preview";
type CopyState = "idle" | "copied";

function MarkdownContent({ markdown, className }: { markdown: string; className: string }) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

export default function MarkdownPreview({ markdown, filename, onDownload }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("preview");
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

  const syncFullscreenState = () => {
    setIsFullscreen(document.fullscreenElement === viewerRef.current);
  };

  const handleFullscreenToggle = () => {
    const el = viewerRef.current;
    if (!el) {
      return;
    }

    if (document.fullscreenElement === el) {
      void document.exitFullscreen();
      return;
    }

    setIsFullscreen(true);
    const req = el.requestFullscreen({ navigationUI: "hide" });
    if (req !== undefined) {
      req.catch(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, []);

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
            onClick={handleDownload}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 sm:w-auto"
          >
            Download .md
          </button>
        </div>
      </div>

      <div
        ref={viewerRef}
        className={`flex flex-col ${isFullscreen ? "box-border size-full min-h-0 bg-white p-4 sm:p-6" : ""}`}
      >
        {!isFullscreen && (
          <div className="overflow-x-auto border-b border-gray-200">
            <div className="flex min-w-max gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "preview"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("source")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "source"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Source
              </button>
            </div>
          </div>
        )}

        {isFullscreen && (
          <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
            <span className="text-sm font-medium text-gray-700">Source & Preview</span>
            <button
              type="button"
              onClick={handleFullscreenToggle}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              Exit fullscreen
            </button>
          </div>
        )}

        <div
          className={
            isFullscreen
              ? "grid min-h-0 flex-1 grid-cols-1 gap-4 pt-2 md:grid-cols-2 md:gap-6 md:pt-4"
              : "w-full pt-4"
          }
        >
          {isFullscreen ? (
            <>
              <div className="flex min-h-0 flex-col">
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
                <textarea
                  readOnly
                  value={markdown}
                  className="min-h-[min(60vh,520px)] w-full flex-1 resize-none rounded-lg border-0 bg-gray-900 p-4 font-mono text-sm text-green-400 outline-none md:min-h-0"
                />
              </div>
              <div className="flex min-h-0 flex-col">
                <span className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Preview</span>
                <MarkdownContent
                  markdown={markdown}
                  className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-800"
                />
              </div>
            </>
          ) : (
            <>
              {activeTab === "source" && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="absolute right-3 top-3 z-10 rounded bg-gray-700 px-3 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-600"
                  >
                    {copyState === "copied" ? "Copied!" : "Copy"}
                  </button>
                  <textarea
                    readOnly
                    value={markdown}
                    className="h-[320px] w-full resize-none rounded-lg border-0 bg-gray-900 p-4 pr-20 font-mono text-sm text-green-400 outline-none sm:h-[420px] md:h-[600px]"
                  />
                </div>
              )}
              {activeTab === "preview" && (
                <MarkdownContent
                  markdown={markdown}
                  className="h-[320px] w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-800 sm:h-[420px] sm:p-5 md:h-[600px] md:p-6"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
