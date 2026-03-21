"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { parseMarkdownToHtmlUnsafe } from "@/lib/markdown-to-html";
import { sanitizeMarkdownHtml } from "@/lib/sanitize-markdown-html";

/** 超过此长度在 Worker 中解析 Markdown，避免阻塞主线程（全屏、滚动等） */
const WORKER_THRESHOLD = 150_000;

const PREVIEW_ROOT_CLASS =
  "markdown-preview min-h-0 flex-1 overflow-auto rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-800 contain-content sm:p-5 md:p-6";

function previewRootClass(extra?: string) {
  return extra ? `${PREVIEW_ROOT_CLASS} ${extra}` : PREVIEW_ROOT_CLASS;
}

const MarkdownHtmlPreview = memo(
  function MarkdownHtmlPreview({ markdown, className }: { markdown: string; className?: string }) {
    const smallHtml = useMemo(() => {
      if (markdown.length > WORKER_THRESHOLD) return null;
      return sanitizeMarkdownHtml(parseMarkdownToHtmlUnsafe(markdown));
    }, [markdown]);

    const [largeHtml, setLargeHtml] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (markdown.length <= WORKER_THRESHOLD) {
        setLargeHtml(null);
        setError(null);
        return;
      }

      setLargeHtml(null);
      setError(null);
      let cancelled = false;
      let worker: Worker | null = null;

      const runOnMainWhenIdle = () => {
        if (cancelled) return;
        try {
          const raw = parseMarkdownToHtmlUnsafe(markdown);
          const safe = sanitizeMarkdownHtml(raw);
          if (!cancelled) setLargeHtml(safe);
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : "Preview failed");
        }
      };

      try {
        worker = new Worker(new URL("../workers/markdown-html.worker.ts", import.meta.url));
      } catch {
        const id = requestIdleCallback(runOnMainWhenIdle);
        return () => {
          cancelled = true;
          cancelIdleCallback(id);
        };
      }

      worker.onmessage = (e: MessageEvent<{ ok: boolean; html?: string; error?: string }>) => {
        if (cancelled) return;
        worker?.terminate();
        worker = null;
        if (e.data.ok && e.data.html !== undefined) {
          try {
            setLargeHtml(sanitizeMarkdownHtml(e.data.html));
          } catch {
            setError("Preview sanitize failed");
          }
        } else {
          setError(e.data.error ?? "Preview failed");
        }
      };

      worker.onerror = () => {
        worker?.terminate();
        worker = null;
        if (!cancelled) requestIdleCallback(runOnMainWhenIdle);
      };

      try {
        worker.postMessage({ markdown });
      } catch {
        requestIdleCallback(runOnMainWhenIdle);
      }

      return () => {
        cancelled = true;
        worker?.terminate();
      };
    }, [markdown]);

    if (markdown.length <= WORKER_THRESHOLD) {
      return <div className={previewRootClass(className)} dangerouslySetInnerHTML={{ __html: smallHtml ?? "" }} />;
    }

    if (error) {
      return <div className={`${previewRootClass(className)} text-red-600`}>{error}</div>;
    }

    if (largeHtml === null) {
      return (
        <div className={`${previewRootClass(className)} flex items-center justify-center text-gray-500`}>
          Rendering preview…
        </div>
      );
    }

    return <div className={previewRootClass(className)} dangerouslySetInnerHTML={{ __html: largeHtml }} />;
  },
  (prev, next) => prev.markdown === next.markdown && prev.className === next.className,
);

export default MarkdownHtmlPreview;
