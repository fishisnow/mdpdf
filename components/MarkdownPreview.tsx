"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const mdComponents = {
  h1: ({ children }: any) => <h1 className="text-2xl font-bold mt-6 mb-3">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-xl font-bold mt-5 mb-2">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
  p: ({ children }: any) => <div className="mb-3 leading-relaxed">{children}</div>,
  ul: ({ children }: any) => <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  hr: () => <hr className="my-4 border-gray-300" />,
  code: ({ inline, children }: any) =>
    inline
      ? <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
      : <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-3"><code className="text-sm font-mono">{children}</code></pre>,
  blockquote: ({ children }: any) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3">{children}</blockquote>,
};

interface Props {
  markdown: string;
  filename: string;
}

type Tab = "source" | "preview";
type CopyState = "idle" | "copied";

export default function MarkdownPreview({ markdown, filename }: Props) {
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
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.replace(/\.pdf$/i, ".md");
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">Result</h2>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          Download .md
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "preview"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setActiveTab("source")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "source"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Source
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === "source" && (
          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors z-10"
            >
              {copyState === "copied" ? "Copied!" : "Copy"}
            </button>
            <textarea
              readOnly
              value={markdown}
              className="w-full h-[600px] p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-lg resize-none border-0 outline-none"
            />
          </div>
        )}
        {activeTab === "preview" && (
          <div className="w-full h-[600px] p-6 bg-white rounded-lg border border-gray-200 overflow-y-auto text-gray-800 text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{markdown}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
