import { Marked } from "marked";

export type MarkdownCitation = {
  index: number;
  href: string;
  label: string;
};

export type MarkdownCitationParseResult = {
  html: string;
  citations: MarkdownCitation[];
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function isHttpUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** Render `[title](url)` citations as [1] [2]. Does not append a references section. Skips autolinks and code. */
export function parseMarkdownWithNumberedCitations(markdown: string): MarkdownCitationParseResult {
  const citations: MarkdownCitation[] = [];
  const hrefToIndex = new Map<string, number>();
  const parser = new Marked();
  parser.setOptions({ gfm: true, breaks: true });
  parser.use({
    renderer: {
      link({ href, text }) {
        if (!href || !isHttpUrl(href) || !text || text === href) return false;

        const key = href.trim();
        let index = hrefToIndex.get(key);
        if (index === undefined) {
          index = citations.length + 1;
          hrefToIndex.set(key, index);
          citations.push({ index, href: key, label: text });
        }

        return `<a class="md-cite" href="${escapeHtml(key)}" title="${escapeHtml(text)}">[${index}]</a>`;
      },
    },
  });

  const result = parser.parse(markdown, { async: false });
  if (typeof result !== "string") {
    throw new Error("Unexpected async markdown parse");
  }

  return { html: result, citations };
}
