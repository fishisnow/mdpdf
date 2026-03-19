"use client";

import { useState } from "react";
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

export default function MarkdownPreview({ markdown, filename, onDownload }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("preview");
  const [copyState, setCopyState] = useState<CopyState>("idle");

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-700">Result</h2>
        <button
          onClick={handleDownload}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 sm:w-auto"
        >
          Download .md
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="overflow-x-auto border-b border-gray-200">
        <div className="flex min-w-max gap-1">
          <button
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

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === "source" && (
          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute right-3 top-3 z-10 rounded bg-gray-700 px-3 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-600"
            >
              {copyState === "copied" ? "Copied!" : "Copy"}
            </button>
            <textarea
              readOnly
              value={markdown}
              className="h-[320px] w-full rounded-lg border-0 bg-gray-900 p-4 pr-20 font-mono text-sm text-green-400 outline-none resize-none sm:h-[420px] md:h-[600px]"
            />
          </div>
        )}
        {activeTab === "preview" && (
          <div className="h-[320px] w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-800 sm:h-[420px] sm:p-5 md:h-[600px] md:p-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{markdown}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
