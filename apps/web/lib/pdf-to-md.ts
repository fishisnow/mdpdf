import { extractText, getDocumentProxy } from "unpdf";

interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontHeight: number;
}

export async function convertPdfToMarkdown(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const numPages = pdf.numPages;
  const pages: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });

    const items: TextItem[] = textContent.items
      .filter((item: any) => item.str && item.str.trim())
      .map((item: any) => {
        const tx = item.transform;
        return {
          text: item.str,
          x: tx[4],
          y: viewport.height - tx[5],
          width: item.width,
          height: item.height,
          fontHeight: Math.abs(tx[3]) || item.height || 12,
        };
      });

    if (items.length === 0) continue;

    // Filter out footer items: bottom 10% of page, short text (page numbers, dates, etc.)
    const footerY = viewport.height * 0.9;
    const filtered = items.filter((item) => {
      if (item.y < footerY) return true;
      return item.text.trim().length > 20;
    });

    // Group items into lines by y-coordinate proximity
    const lines = groupIntoLines(filtered);
    const pageMarkdown = linesToMarkdown(lines);
    pages.push(pageMarkdown);
  }

  return pages.join("\n\n---\n\n");
}

interface Line {
  items: TextItem[];
  y: number;
  text: string;
  avgFontHeight: number;
}

function groupIntoLines(items: TextItem[]): Line[] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: Line[] = [];
  const Y_THRESHOLD = 3;

  for (const item of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(item.y - last.y) <= Y_THRESHOLD) {
      const prevItem = last.items[last.items.length - 1];
      const gap = item.x - (prevItem.x + prevItem.width);
      const needsSpace = gap > prevItem.fontHeight * 0.2;
      last.items.push(item);
      last.text += (needsSpace ? " " : "") + item.text;
      last.avgFontHeight =
        last.items.reduce((s, i) => s + i.fontHeight, 0) / last.items.length;
    } else {
      lines.push({
        items: [item],
        y: item.y,
        text: item.text,
        avgFontHeight: item.fontHeight,
      });
    }
  }

  return lines;
}

function linesToMarkdown(lines: Line[]): string {
  if (lines.length === 0) return "";

  const fontHeights = lines.map((l) => l.avgFontHeight);
  const medianFont = median(fontHeights);

  // Compute typical line spacing to detect paragraph breaks
  const gaps: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    const gap = lines[i].y - lines[i - 1].y;
    if (gap > 0) gaps.push(gap);
  }
  const medianGap = gaps.length > 0 ? median(gaps) : medianFont * 1.5;

  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line.text.trim();
    if (!text) continue;

    const ratio = line.avgFontHeight / medianFont;
    const isShortLine = text.length < 80;

    let formatted: string;
    let needsTrailingSpaces = false;

    if (ratio >= 1.8 && isShortLine) {
      formatted = `# ${text}`;
    } else if (ratio >= 1.4 && isShortLine) {
      formatted = `## ${text}`;
    } else if (ratio >= 1.15 && isShortLine) {
      formatted = `### ${text}`;
    } else if (/^[\u2022\u2023\u25E6\u2043\-\*]\s/.test(text)) {
      formatted = `- ${text.replace(/^[\u2022\u2023\u25E6\u2043\-\*]\s+/, "")}`;
    } else {
      formatted = text;
      needsTrailingSpaces = true; // 普通文本需要尾部空格
    }

    // Insert blank line when gap to next line is larger than normal spacing,
    // or when current line looks like a standalone entry (heading / toc / bullet)
    let willHaveBlankLine = false;
    if (i < lines.length - 1) {
      const gap = lines[i + 1].y - line.y;
      const isLargeGap = gap > medianGap * 1.2;
      const isStructural = formatted.startsWith("#") || formatted.startsWith("-");
      const nextText = lines[i + 1].text.trim();
      const isTocEntry = isShortLine && /\d+\s*$/.test(text) && nextText.length > 0;
      willHaveBlankLine = isLargeGap || isStructural || isTocEntry;
    }

    // 普通文本且后面没有空行时，加尾部两个空格强制 Markdown 换行
    result.push(needsTrailingSpaces && !willHaveBlankLine ? `${formatted}  ` : formatted);

    if (willHaveBlankLine) {
      result.push("");
    }
  }

  return result.join("\n");
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
