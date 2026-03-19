import type {
  Content,
  ContentText,
  TableCell,
  TDocumentDefinitions,
} from "pdfmake/interfaces";

type TokenLike = {
  type?: string;
  text?: string;
  depth?: number;
  lang?: string;
  href?: string;
  task?: boolean;
  checked?: boolean;
  align?: "left" | "center" | "right" | null;
  ordered?: boolean;
  tokens?: TokenLike[];
  items?: TokenLike[];
  header?: TokenLike[];
  rows?: TokenLike[][];
};

type PdfMakeClient = {
  addVirtualFileSystem: (vfs: Record<string, string>) => void;
  setFonts?: (fonts: Record<string, Record<"normal" | "bold" | "italics" | "bolditalics", string>>) => void;
  createPdf: (docDefinition: TDocumentDefinitions) => {
    getBlob: () => Promise<Blob>;
  };
};

const INLINE_CODE_STYLE = {
  font: "Roboto",
  background: "#f3f4f6",
};

function isTokenLike(value: unknown): value is TokenLike {
  return Boolean(value) && typeof value === "object";
}

function toTokenArray(value: unknown): TokenLike[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isTokenLike);
}

function extractPlainText(tokens: TokenLike[]): string {
  let text = "";

  for (const token of tokens) {
    if (token.type === "text" && token.text) {
      text += token.text;
      continue;
    }

    if (token.type === "codespan" && token.text) {
      text += token.text;
      continue;
    }

    if (token.type === "br") {
      text += "\n";
      continue;
    }

    if (token.text && !token.tokens) {
      text += token.text;
      continue;
    }

    if (token.tokens) {
      text += extractPlainText(token.tokens);
    }
  }

  return text;
}

function parseInline(tokens: TokenLike[]): ContentText[] {
  const nodes: ContentText[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case "text":
        if (token.text) nodes.push({ text: token.text });
        break;
      case "strong":
        nodes.push(...parseInline(toTokenArray(token.tokens)).map((n) => ({ ...n, bold: true })));
        break;
      case "em":
        nodes.push(...parseInline(toTokenArray(token.tokens)).map((n) => ({ ...n, italics: true })));
        break;
      case "del":
        nodes.push(
          ...parseInline(toTokenArray(token.tokens)).map((n) => ({
            ...n,
            decoration: "lineThrough" as const,
          })),
        );
        break;
      case "codespan":
        if (token.text) {
          nodes.push({
            text: token.text,
            ...INLINE_CODE_STYLE,
          });
        }
        break;
      case "link": {
        const innerText = extractPlainText(toTokenArray(token.tokens)).trim();
        if (innerText) {
          nodes.push({
            text: innerText,
            link: token.href,
            color: "#1d4ed8",
            decoration: "underline",
          });
        }
        break;
      }
      case "br":
        nodes.push({ text: "\n" });
        break;
      default: {
        if (token.tokens) {
          nodes.push(...parseInline(token.tokens));
        } else if (token.text) {
          nodes.push({ text: token.text });
        }
      }
    }
  }

  return nodes;
}

function headingStyleByDepth(depth: number | undefined): string {
  if (depth === 1) return "h1";
  if (depth === 2) return "h2";
  if (depth === 3) return "h3";
  return "h4";
}

function parseListItem(item: TokenLike): Content {
  const childTokens = toTokenArray(item.tokens);
  if (childTokens.length === 0) {
    return { text: item.text ?? "" };
  }

  if (childTokens.length === 1 && childTokens[0]?.type === "text") {
    const label = childTokens[0].text ?? "";
    const prefix = item.task ? (item.checked ? "☑ " : "☐ ") : "";
    return { text: `${prefix}${label}` };
  }

  if (childTokens.length === 1 && childTokens[0]?.type === "paragraph") {
    const inline = parseInline(toTokenArray(childTokens[0].tokens));
    if (inline.length > 0) {
      const prefix = item.task ? (item.checked ? "☑ " : "☐ ") : "";
      if (prefix) {
        return { text: [{ text: prefix }, ...inline] };
      }
      return { text: inline };
    }
  }

  const blocks = parseBlocks(childTokens);
  if (blocks.length === 1) {
    return blocks[0];
  }

  return {
    stack: blocks,
    margin: [0, 0, 0, 4],
  };
}

function toTableCellText(cell: TokenLike): string {
  return extractPlainText(toTokenArray(cell.tokens)).trim();
}

function parseBlocks(tokens: TokenLike[]): Content[] {
  const content: Content[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case "space":
        break;
      case "heading": {
        const heading = parseInline(toTokenArray(token.tokens));
        if (heading.length > 0) {
          content.push({
            text: heading,
            style: headingStyleByDepth(token.depth),
          });
        }
        break;
      }
      case "paragraph": {
        const paragraph = parseInline(toTokenArray(token.tokens));
        if (paragraph.length > 0) {
          content.push({
            text: paragraph,
            style: "paragraph",
          });
        }
        break;
      }
      case "blockquote": {
        const quoteBlocks = parseBlocks(toTokenArray(token.tokens));
        if (quoteBlocks.length > 0) {
          content.push({
            table: {
              widths: [4, "*"],
              body: [[
                { text: "", fillColor: "#d1d5db", border: [false, false, false, false] },
                {
                  stack: quoteBlocks,
                  fillColor: "#f9fafb",
                  border: [false, false, false, false],
                },
              ]],
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              paddingLeft: (index: number) => (index === 1 ? 10 : 0),
              paddingRight: () => 0,
              paddingTop: () => 8,
              paddingBottom: () => 8,
            },
            margin: [0, 0, 0, 10],
          });
        }
        break;
      }
      case "list": {
        const listItems = toTokenArray(token.items).map(parseListItem);
        if (listItems.length > 0) {
          content.push(
            token.ordered
              ? { ol: listItems, style: "listBlock" }
              : { ul: listItems, style: "listBlock" },
          );
        }
        break;
      }
      case "code": {
        const language = (token.lang ?? "").trim().toUpperCase();
        const codeLines = (token.text ?? "").replace(/\t/g, "  ");
        const blockStack: Content[] = [];
        if (language) {
          blockStack.push({ text: language, style: "codeBadge" });
        }
        blockStack.push({ text: codeLines, style: "codeBlock" });

        content.push({
          table: {
            widths: ["*"],
            body: [[{
              stack: blockStack,
              fillColor: "#0b1220",
              border: [false, false, false, false],
            }]],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 14,
            paddingRight: () => 14,
            paddingTop: () => 10,
            paddingBottom: () => 12,
          },
          margin: [0, 2, 0, 12],
        });
        break;
      }
      case "hr":
        content.push({
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 1,
              lineColor: "#e5e7eb",
            },
          ],
          margin: [0, 8, 0, 12],
        });
        break;
      case "table": {
        const headerRow = toTokenArray(token.header);
        const bodyRows = toTokenArray(token.rows).map((row) => toTokenArray(row));
        if (headerRow.length === 0) break;

        const alignments = headerRow.map((cell) => cell.align ?? "left");
        const widths = headerRow.map(() => "*");
        const headerCells: TableCell[] = headerRow.map((cell, index) => ({
          text: toTableCellText(cell),
          bold: true,
          fillColor: "#f3f4f6",
          margin: [0, 4, 0, 4],
          alignment: alignments[index],
        }));

        const bodyCells: TableCell[][] = bodyRows.map((row) =>
          row.map((cell, index) => ({
            text: toTableCellText(cell),
            margin: [0, 3, 0, 3],
            alignment: alignments[index] ?? "left",
          })),
        );

        content.push({
          table: {
            headerRows: 1,
            widths,
            body: [headerCells, ...bodyCells],
          },
          layout: {
            hLineColor: () => "#d1d5db",
            vLineColor: () => "#d1d5db",
            fillColor: (rowIndex: number) =>
              rowIndex === 0 ? "#f3f4f6" : rowIndex % 2 === 0 ? "#fcfcfd" : null,
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
          margin: [0, 0, 0, 12],
        });
        break;
      }
      default: {
        const fallbackText = token.text?.trim();
        if (fallbackText) {
          content.push({
            text: fallbackText,
            style: "paragraph",
          });
        }
      }
    }
  }

  return content;
}

function createDocumentDefinition(content: Content[]): TDocumentDefinitions {
  return {
    content,
    pageMargins: [40, 48, 40, 48],
    defaultStyle: {
      font: "Roboto",
      fontSize: 11,
      lineHeight: 1.45,
      color: "#111827",
    },
    styles: {
      h1: { fontSize: 24, bold: true, margin: [0, 0, 0, 14] },
      h2: { fontSize: 20, bold: true, margin: [0, 10, 0, 12] },
      h3: { fontSize: 16, bold: true, margin: [0, 8, 0, 10] },
      h4: { fontSize: 14, bold: true, margin: [0, 8, 0, 10] },
      paragraph: { margin: [0, 0, 0, 10] },
      listBlock: { margin: [0, 0, 0, 10], lineHeight: 1.4 },
      codeBadge: {
        font: "Roboto",
        fontSize: 8.5,
        bold: true,
        color: "#9ca3af",
        characterSpacing: 0.6,
        margin: [0, 0, 0, 6],
      },
      codeBlock: {
        font: "Roboto",
        fontSize: 10.5,
        color: "#f9fafb",
        lineHeight: 1.45,
        preserveLeadingSpaces: true,
        margin: [0, 0, 0, 0],
      },
    },
  };
}

export async function convertMarkdownToPdfInBrowser(markdown: string): Promise<Blob> {
  const source = typeof markdown === "string" ? markdown : "";
  const normalized = source.trimEnd();

  if (!normalized.trim()) {
    throw new Error("Markdown content is empty");
  }

  const [{ marked }, pdfmakeModule, vfsModule] = await Promise.all([
    import("marked"),
    import("pdfmake/build/pdfmake.js"),
    import("pdfmake/build/vfs_fonts.js"),
  ]);

  const pdfMake = (pdfmakeModule.default ?? pdfmakeModule) as unknown as PdfMakeClient;
  const vfs = (vfsModule.default ?? vfsModule) as Record<string, string>;

  pdfMake.addVirtualFileSystem(vfs);
  pdfMake.setFonts?.({
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-MediumItalic.ttf",
    },
  });

  const tokens = marked.lexer(normalized, {
    gfm: true,
    breaks: false,
  });
  const content = parseBlocks(toTokenArray(tokens));

  if (content.length === 0) {
    throw new Error("No printable content found in markdown");
  }

  return pdfMake.createPdf(createDocumentDefinition(content)).getBlob();
}

