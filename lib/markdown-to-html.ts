import { marked } from "marked";
import { parseMarkdownWithNumberedCitations, type MarkdownCitation } from "./markdown-citations";

export type MarkdownToHtmlOptions = {
  numberedCitations?: boolean;
};

export type MarkdownDocument = {
  html: string;
  citations: MarkdownCitation[];
};

let configured = false;

function ensureMarkedConfigured() {
  if (configured) return;
  marked.setOptions({ gfm: true, breaks: true });
  configured = true;
}

export function parseMarkdownDocument(markdown: string, options: MarkdownToHtmlOptions = {}): MarkdownDocument {
  if (options.numberedCitations) {
    return parseMarkdownWithNumberedCitations(markdown);
  }

  ensureMarkedConfigured();
  const result = marked.parse(markdown, { async: false });
  if (typeof result !== "string") {
    throw new Error("Unexpected async markdown parse");
  }
  return { html: result, citations: [] };
}

/** 将 Markdown 转为 HTML（不做 XSS 清洗，调用方需再 sanitize） */
export function parseMarkdownToHtmlUnsafe(markdown: string, options: MarkdownToHtmlOptions = {}): string {
  return parseMarkdownDocument(markdown, options).html;
}
