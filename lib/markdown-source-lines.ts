import type { Marked, Token } from "marked";

const BLOCK_RENDERERS = ["heading", "paragraph", "list", "blockquote", "code", "table", "hr", "html"] as const;

function injectSourceLine(html: string, line: number | undefined): string {
  if (!line) return html;
  return html.replace(/^(\s*<[a-zA-Z][\w:-]*)/, `$1 data-line="${line}"`);
}

function attachSourceLines(tokens: Token[], lineMap: WeakMap<object, number>) {
  let line = 1;
  for (const token of tokens) {
    lineMap.set(token, line);
    line += token.raw.match(/\n/g)?.length ?? 0;
  }
}

export function enableMarkdownSourceLines(parser: Marked) {
  const lineMap = new WeakMap<object, number>();

  parser.use({
    hooks: {
      processAllTokens(tokens) {
        attachSourceLines(tokens as Token[], lineMap);
        return tokens;
      },
    },
  });

  const renderer = parser.defaults.renderer;
  if (!renderer) return;

  for (const method of BLOCK_RENDERERS) {
    const original = renderer[method].bind(renderer) as (token: Token) => string;
    renderer[method] = ((token: Token) => injectSourceLine(original(token), lineMap.get(token))) as never;
  }
}
