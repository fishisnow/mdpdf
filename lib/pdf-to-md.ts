import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from "pdfjs-dist";
import type { TextItem as PdfJsTextItem } from "pdfjs-dist/types/src/display/api";

let workerInitialized = false;

function ensurePdfJsWorker() {
  if (workerInitialized || typeof window === "undefined") {
    return;
  }

  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  workerInitialized = true;
}

async function loadPdfDocument(data: Uint8Array): Promise<PDFDocumentProxy> {
  ensurePdfJsWorker();
  const loadingTask = getDocument({ data });

  try {
    return await loadingTask.promise;
  } catch (error) {
    await loadingTask.destroy();
    throw error;
  }
}


export interface ConversionProgress {
  stage: "loading" | "parsing" | "rendering";
  currentPage?: number;
  totalPages?: number;
}

interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  fontHeight: number;
}

interface Line {
  items: TextItem[];
  y: number;
  text: string;
  avgFontHeight: number;
  totalFontHeight: number;
}

const LINE_Y_THRESHOLD = 3;
const FOOTER_REGION_RATIO = 0.9;
const SHORT_FOOTER_TEXT_LENGTH = 20;
const BODY_LINE_MAX_LENGTH = 80;
const PAGE_SEPARATOR = "\n\n---\n\n";
const BULLET_PATTERN = /^[\u2022\u2023\u25E6\u2043\-*]\s+/;
const HEADING_LEVEL_1_RATIO = 1.8;
const HEADING_LEVEL_2_RATIO = 1.4;
const HEADING_LEVEL_3_RATIO = 1.15;
const PARAGRAPH_BREAK_RATIO = 1.2;

export async function convertPdfToMarkdown(
  data: Uint8Array,
  onProgress?: (progress: ConversionProgress) => void,
): Promise<string> {
  if (data.byteLength === 0) {
    throw new Error("The uploaded PDF is empty.");
  }
  onProgress?.({ stage: "loading" });

  const pdf = await loadPdfDocument(data);
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      onProgress?.({ stage: "parsing", currentPage: pageNumber, totalPages: pdf.numPages });

      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1 });
      const pageHeight = viewport.height;
      const footerY = pageHeight * FOOTER_REGION_RATIO;
      const items: TextItem[] = [];

      for (const rawItem of textContent.items as PdfJsTextItem[]) {
        if (!rawItem || !("str" in rawItem) || !("transform" in rawItem)) {
          continue;
        }

        const text = rawItem.str?.trim();
        const transform = rawItem.transform;
        if (!text || !transform) {
          continue;
        }

        items.push({
          text,
          x: transform[4],
          y: pageHeight - transform[5],
          width: rawItem.width ?? 0,
          fontHeight: Math.abs(transform[3]) || rawItem.height || 12,
        });
      }

      const filteredItems = items.filter((item) => {
        if (item.y < footerY) {
          return true;
        }

        return item.text.length > SHORT_FOOTER_TEXT_LENGTH;
      });

      if (filteredItems.length === 0) {
        continue;
      }

      const lines = extractPageLines(filteredItems);
      const pageMarkdown = linesToMarkdown(lines);
      if (pageMarkdown) {
        pages.push(pageMarkdown);
      }
    }

    onProgress?.({ stage: "rendering", currentPage: pages.length, totalPages: pdf.numPages });

    if (pages.length === 0) {
      throw new Error("No selectable text was found in this PDF. It may be scanned, image-based, or empty.");
    }

    return pages.join(PAGE_SEPARATOR);
  } finally {
    await pdf.destroy();
  }
}

export function extractPageLines(items: TextItem[]): Line[] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: Line[] = [];

  for (const item of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(item.y - last.y) <= LINE_Y_THRESHOLD) {
      const previousItem = last.items[last.items.length - 1];
      const gap = item.x - (previousItem.x + previousItem.width);
      const needsSpace = gap > previousItem.fontHeight * 0.2;
      last.items.push(item);
      last.text += `${needsSpace ? " " : ""}${item.text}`;
      last.totalFontHeight += item.fontHeight;
      last.avgFontHeight = last.totalFontHeight / last.items.length;
      continue;
    }

    lines.push({
      items: [item],
      y: item.y,
      text: item.text,
      avgFontHeight: item.fontHeight,
      totalFontHeight: item.fontHeight,
    });
  }

  return lines;
}

export function linesToMarkdown(lines: Line[]): string {
  if (lines.length === 0) {
    return "";
  }

  const fontHeights = new Array<number>(lines.length);
  const gaps: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    fontHeights[i] = lines[i].avgFontHeight;
    if (i === 0) {
      continue;
    }

    const gap = lines[i].y - lines[i - 1].y;
    if (gap > 0) {
      gaps.push(gap);
    }
  }

  const medianFont = median(fontHeights);
  const medianGap = gaps.length > 0 ? median(gaps) : medianFont * 1.5;
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line.text.trim();
    if (!text) {
      continue;
    }

    const ratio = line.avgFontHeight / medianFont;
    const isShortLine = text.length < BODY_LINE_MAX_LENGTH;
    const isBullet = BULLET_PATTERN.test(text);

    let formatted = text;
    let needsTrailingSpaces = true;

    if (ratio >= HEADING_LEVEL_1_RATIO && isShortLine) {
      formatted = `# ${text}`;
      needsTrailingSpaces = false;
    } else if (ratio >= HEADING_LEVEL_2_RATIO && isShortLine) {
      formatted = `## ${text}`;
      needsTrailingSpaces = false;
    } else if (ratio >= HEADING_LEVEL_3_RATIO && isShortLine) {
      formatted = `### ${text}`;
      needsTrailingSpaces = false;
    } else if (isBullet) {
      formatted = `- ${text.replace(BULLET_PATTERN, "")}`;
      needsTrailingSpaces = false;
    }

    let willHaveBlankLine = false;
    if (i < lines.length - 1) {
      const nextLine = lines[i + 1];
      const gap = nextLine.y - line.y;
      const isLargeGap = gap > medianGap * PARAGRAPH_BREAK_RATIO;
      const isStructural = formatted.startsWith("#") || formatted.startsWith("-");
      const isTocEntry = isShortLine && /\d+\s*$/.test(text) && nextLine.text.trim().length > 0;
      willHaveBlankLine = isLargeGap || isStructural || isTocEntry;
    }

    result.push(needsTrailingSpaces && !willHaveBlankLine ? `${formatted}  ` : formatted);
    if (willHaveBlankLine) {
      result.push("");
    }
  }

  return result.join("\n");
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}
