import type { MarkedExtension, TokenizerThis } from "marked";

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

function skipLinkWhitespace(src: string, index: number): number {
  while (index < src.length) {
    const char = src[index];
    if (char !== " " && char !== "\t" && char !== "\n") break;
    index += 1;
  }
  return index;
}

/**
 * Parse `[label](href)` even when the label contains unmatched backticks.
 * Marked's default link rule forbids those backticks, so consecutive citations
 * like `[News - 02 Jan `25](url)[CMS(867.HK)](url)` never become links.
 */
function parseMarkdownInlineLink(
  src: string,
): { raw: string; text: string; href: string; title: string | null } | null {
  if (src[0] !== "[") return null;

  let index = 1;
  let depth = 1;
  while (index < src.length) {
    const char = src[index];
    if (char === "\n" && src[index + 1] === "\n") return null;
    if (char === "\\" && index + 1 < src.length) {
      index += 2;
      continue;
    }
    if (char === "[") depth += 1;
    else if (char === "]") {
      depth -= 1;
      if (depth === 0) break;
    }
    index += 1;
  }
  if (depth !== 0) return null;

  const text = src.slice(1, index);
  index += 1;
  if (src[index] !== "(") return null;
  index += 1;
  index = skipLinkWhitespace(src, index);

  let href: string;
  if (src[index] === "<") {
    const hrefStart = index + 1;
    index += 1;
    while (index < src.length && src[index] !== ">" && src[index] !== "\n") {
      if (src[index] === "\\") index += 1;
      index += 1;
    }
    if (src[index] !== ">") return null;
    href = src.slice(hrefStart, index);
    index += 1;
  } else {
    const hrefStart = index;
    let parens = 0;
    while (index < src.length) {
      const char = src[index];
      if (char === "\\" && index + 1 < src.length) {
        index += 2;
        continue;
      }
      if (char === " " || char === "\t" || char === "\n") break;
      if (char === "(") parens += 1;
      else if (char === ")") {
        if (parens === 0) break;
        parens -= 1;
      }
      index += 1;
    }
    href = src.slice(hrefStart, index);
    if (!href) return null;
  }

  index = skipLinkWhitespace(src, index);
  let title: string | null = null;
  const opener = src[index];
  if (opener === '"' || opener === "'" || opener === "(") {
    const closer = opener === "(" ? ")" : opener;
    index += 1;
    const titleStart = index;
    while (index < src.length && src[index] !== closer) {
      if (src[index] === "\\") index += 1;
      if (src[index] === "\n" && src[index + 1] === "\n") return null;
      index += 1;
    }
    if (src[index] !== closer) return null;
    title = src.slice(titleStart, index);
    index += 1;
    index = skipLinkWhitespace(src, index);
  }

  if (src[index] !== ")") return null;
  return { raw: src.slice(0, index + 1), text, href, title };
}

/** Render `[title](url)` citations as [1] [2]. Does not append a references section. Skips autolinks and code. */
export function numberedCitationsExtension(): {
  citations: MarkdownCitation[];
  extension: MarkedExtension;
} {
  const citations: MarkdownCitation[] = [];
  const hrefToIndex = new Map<string, number>();

  return {
    citations,
    extension: {
      extensions: [
        {
          name: "citationLink",
          level: "inline",
          tokenizer(this: TokenizerThis, src: string) {
            const parsed = parseMarkdownInlineLink(src);
            if (!parsed || !isHttpUrl(parsed.href) || !parsed.text || parsed.text === parsed.href) {
              return undefined;
            }

            this.lexer.state.inLink = true;
            const tokens = this.lexer.inlineTokens(parsed.text);
            this.lexer.state.inLink = false;

            return {
              type: "link",
              raw: parsed.raw,
              href: parsed.href,
              title: parsed.title,
              text: parsed.text,
              tokens,
            };
          },
        },
      ],
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
    },
  };
}
