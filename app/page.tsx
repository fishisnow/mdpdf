"use client";

import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import MarkdownPreview from "@/components/MarkdownPreview";
import ProgressBar from "@/components/ProgressBar";

type State = "idle" | "converting" | "done" | "error";

export default function Home() {
  const [state, setState] = useState<State>("idle");
  const [markdown, setMarkdown] = useState("");
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");

  const handleUpload = async (file: File) => {
    setState("converting");
    setFilename(file.name);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/convert", { method: "POST", body: formData });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Conversion failed");
      }
      const text = await res.text();
      setMarkdown(text);
      setState("done");
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
      setState("error");
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">PDF → Markdown</h1>
        <p className="text-gray-500">Upload a PDF and get clean Markdown instantly</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col gap-6">
        <UploadZone onUpload={handleUpload} disabled={state === "converting"} />

        {state === "converting" && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500">Converting <span className="font-medium">{filename}</span>…</p>
            <ProgressBar progress={70} />
          </div>
        )}

        {state === "error" && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {state === "done" && (
          <MarkdownPreview markdown={markdown} filename={filename} />
        )}
      </div>
    </main>
  );
}
