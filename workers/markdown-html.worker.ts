/// <reference lib="webworker" />

import { parseMarkdownDocument } from "@/lib/markdown-to-html";

self.onmessage = (e: MessageEvent<{ markdown: string; numberedCitations?: boolean }>) => {
  try {
    const { html, citations } = parseMarkdownDocument(e.data.markdown, {
      numberedCitations: e.data.numberedCitations,
    });
    self.postMessage({ ok: true as const, html, citations });
  } catch (err) {
    self.postMessage({
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
