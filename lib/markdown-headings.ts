import { Marked, type MarkedExtension, type Token, type Tokens } from "marked";

export type MarkdownHeading = {
  id: string;
  text: string;
  level: number;
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function headingPlainText(raw: string): string {
  return raw
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`]+/g, "")
    .trim();
}

function uniqueHeadingId(text: string, used: Map<string, number>): string {
  const base =
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "heading";
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

export function headingIdExtension(): MarkedExtension {
  const ids = new WeakMap<object, string>();
  const used = new Map<string, number>();

  return {
    walkTokens(token: Token) {
      if (token.type !== "heading") return;
      const heading = token as Tokens.Heading;
      ids.set(token, uniqueHeadingId(headingPlainText(heading.text), used));
    },
    renderer: {
      heading(token) {
        const inner = this.parser.parseInline(token.tokens);
        const id = ids.get(token) ?? "heading";
        return `<h${token.depth} id="${escapeHtml(id)}">${inner}</h${token.depth}>\n`;
      },
    },
  };
}

export function extractMarkdownHeadings(markdown: string): MarkdownHeading[] {
  const parser = new Marked({ gfm: true, breaks: true });
  const tokens = parser.lexer(markdown);
  const used = new Map<string, number>();
  const headings: MarkdownHeading[] = [];

  parser.walkTokens(tokens, (token) => {
    if (token.type !== "heading") return;
    const heading = token as Tokens.Heading;
    const text = headingPlainText(heading.text);
    headings.push({
      id: uniqueHeadingId(text, used),
      text: text || "Untitled",
      level: heading.depth,
    });
  });

  return headings;
}
