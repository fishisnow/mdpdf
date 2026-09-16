import { Marked } from "marked";
import { numberedCitationsExtension, type MarkdownCitation } from "./markdown-citations";
import { headingIdExtension } from "./markdown-headings";

export type MarkdownToHtmlOptions = {
  numberedCitations?: boolean;
};

export type MarkdownDocument = {
  html: string;
  citations: MarkdownCitation[];
};

export function parseMarkdownDocument(markdown: string, options: MarkdownToHtmlOptions = {}): MarkdownDocument {
  const parser = new Marked({ gfm: true, breaks: true });
  parser.use(headingIdExtension());

  let citations: MarkdownCitation[] = [];
  if (options.numberedCitations) {
    const numbered = numberedCitationsExtension();
    parser.use(numbered.extension);
    citations = numbered.citations;
  }

  const result = parser.parse(markdown, { async: false });
  if (typeof result !== "string") {
    throw new Error("Unexpected async markdown parse");
  }
  return { html: result, citations };
}

/** 将 Markdown 转为 HTML（不做 XSS 清洗，调用方需再 sanitize） */
export function parseMarkdownToHtmlUnsafe(markdown: string, options: MarkdownToHtmlOptions = {}): string {
  return parseMarkdownDocument(markdown, options).html;
}
