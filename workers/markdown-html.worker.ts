/// <reference lib="webworker" />

import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

self.onmessage = (e: MessageEvent<{ markdown: string }>) => {
  try {
    const html = marked.parse(e.data.markdown, { async: false });
    if (typeof html !== "string") {
      throw new Error("Unexpected async markdown parse");
    }
    self.postMessage({ ok: true as const, html });
  } catch (err) {
    self.postMessage({
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
