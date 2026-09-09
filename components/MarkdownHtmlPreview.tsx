"use client";

import { memo, useEffect, useMemo, useState } from "react";
import type { MarkdownCitation } from "@/lib/markdown-citations";
import { parseMarkdownDocument } from "@/lib/markdown-to-html";
import { sanitizeMarkdownHtml } from "@/lib/sanitize-markdown-html";

/** 超过此长度在 Worker 中解析 Markdown，避免阻塞主线程（全屏、滚动等） */
const WORKER_THRESHOLD = 150_000;

const PREVIEW_ROOT_CLASS =
  "markdown-preview min-h-0 flex-1 overflow-auto rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-800 contain-content sm:p-5 md:p-6";

function previewRootClass(extra?: string) {
  return extra ? `${PREVIEW_ROOT_CLASS} ${extra}` : PREVIEW_ROOT_CLASS;
}

const MarkdownHtmlPreview = memo(
  function MarkdownHtmlPreview({
    markdown,
    className,
    numberedCitations = false,
    onCitationsChange,
  }: {
    markdown: string;
    className?: string;
    numberedCitations?: boolean;
    onCitationsChange?: (citations: MarkdownCitation[]) => void;
  }) {
    const smallDoc = useMemo(() => {
      if (markdown.length > WORKER_THRESHOLD) return null;
      const parsed = parseMarkdownDocument(markdown, { numberedCitations });
      return { html: sanitizeMarkdownHtml(parsed.html), citations: parsed.citations };
    }, [markdown, numberedCitations]);

    const [largeHtml, setLargeHtml] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (smallDoc) onCitationsChange?.(smallDoc.citations);
    }, [smallDoc, onCitationsChange]);

    useEffect(() => {
      if (markdown.length <= WORKER_THRESHOLD) {
        setLargeHtml(null);
        setError(null);
        return;
      }

      setLargeHtml(null);
      setError(null);
      onCitationsChange?.([]);
      let cancelled = false;
      let worker: Worker | null = null;

      const runOnMainWhenIdle = () => {
        if (cancelled) return;
        try {
          const parsed = parseMarkdownDocument(markdown, { numberedCitations });
          const safe = sanitizeMarkdownHtml(parsed.html);
          if (!cancelled) {
            setLargeHtml(safe);
            onCitationsChange?.(parsed.citations);
          }
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

      worker.onmessage = (
        e: MessageEvent<{ ok: boolean; html?: string; citations?: MarkdownCitation[]; error?: string }>,
      ) => {
        if (cancelled) return;
        worker?.terminate();
        worker = null;
        if (e.data.ok && e.data.html !== undefined) {
          try {
            setLargeHtml(sanitizeMarkdownHtml(e.data.html));
            onCitationsChange?.(e.data.citations ?? []);
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
        worker.postMessage({ markdown, numberedCitations });
      } catch {
        requestIdleCallback(runOnMainWhenIdle);
      }

      return () => {
        cancelled = true;
        worker?.terminate();
      };
    }, [markdown, numberedCitations, onCitationsChange]);

    if (markdown.length <= WORKER_THRESHOLD) {
      return <div className={previewRootClass(className)} dangerouslySetInnerHTML={{ __html: smallDoc?.html ?? "" }} />;
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
  (prev, next) =>
    prev.markdown === next.markdown &&
    prev.className === next.className &&
    prev.numberedCitations === next.numberedCitations &&
    prev.onCitationsChange === next.onCitationsChange,
);

export default MarkdownHtmlPreview;
