import { marked } from "marked";

let configured = false;

function ensureMarkedConfigured() {
  if (configured) return;
  marked.setOptions({ gfm: true, breaks: true });
  configured = true;
}

/** 将 Markdown 转为 HTML（不做 XSS 清洗，调用方需再 sanitize） */
export function parseMarkdownToHtmlUnsafe(markdown: string): string {
  ensureMarkedConfigured();
  const result = marked.parse(markdown, { async: false });
  if (typeof result !== "string") {
    throw new Error("Unexpected async markdown parse");
  }
  return result;
}
