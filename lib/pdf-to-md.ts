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

interface MarkdownBlock {
  kind: "lines" | "code";
  lines: Line[];
  paragraphBoundaries?: number[];  // Indices where paragraph breaks should be inserted
}

interface CodeCandidate {
  line: Line;
  kind: "plain" | "weak" | "strong";
}

interface LineMetadata {
  line: Line;
  index: number;
  kind: CodeCandidate["kind"];
  previousLine: Line | null;
  nextLine: Line | null;
  hasNearbyCodeSignal: boolean;
  codeLikeText: boolean;
}

interface CodeSpan {
  start: number;
  end: number;
}

interface Paragraph {
  lines: Line[];
  startIndex: number;
  endIndex: number;
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
const CODE_BLOCK_MIN_LINES = 2;
const CODE_FONT_RATIO_TOLERANCE = 0.08;
const CODE_INDENT_TOLERANCE = 12;
const HEADING_GAP_RATIO = 1.6;
const NATURAL_LANGUAGE_WORD_THRESHOLD = 12;
const CONTINUATION_PREFIX_PATTERN = /^\s*(?:["'`({\[|]|\)|\}|\])/;
const CODE_ANCHOR_SEARCH_RADIUS = 3;
const MAX_CODE_SPAN_BLANK_GAP = 1;
const MAX_CODE_SPAN_PLAIN_RUN = 3;
const MAX_CODE_SPAN_NEIGHBOR_DISTANCE = 3;
const MAX_CODE_SPAN_CODELIKE_RUN = 6;
const MAX_CODE_SPAN_PRELUDE_LINES = 1;
const DEBUG_CODE_DETECTION = true;
const PARAGRAPH_GAP_RATIO = 1.5;  // Gap threshold to split paragraphs
const CODE_DENSITY_THRESHOLD = 0.3;  // 30% of lines need code signals to be a code block
const INLINE_CODE_PATTERNS = [
  /^\s*#/,
  /^\s*import\s+/,
  /^\s*from\s+\S+\s+import/,  // Must be "from X import" pattern
  /^\s*(?:export|const|let|var|def|class|function)\s+/,
  /^\s*(?:pip|npm|pnpm|yarn|poetry|python|node|uv)\s+/,
  /=>|::/,  // Arrow functions or scope resolution
  /^\s*(?:if|elif|else|while|try|except|finally|with|async|await|return)\s+/,  // No 'for' - too common in prose
  /^["']{3}/,  // Triple quotes (Python docstrings)
  /^\s*\|/,  // Pipe operator
  /^[{[]/,  // Lines starting with dict/list/object literal
];
const STRONG_CODE_PATTERNS = [
  /^\s*from\s+\S+\s+import\s+/,
  /^\s*import\s+\S+/,
  /^\s*pip\s+install\b/,
  /^\s*#/,
  /^\s*def\s+\w+\s*\(/,
  /^\s*class\s+\w+/,
  /^\s*print\s*\(/,
  /^\s*return\s+/,
  /^\s*(?:if|elif|else|for|while|try|except|finally|with|async|await)\s+/,
  /^\s*(?:if|elif|else|for|while|try|except|finally|with|async|await)\s*:/,
  /^"""/,  // Python docstring
  /^'''/,  // Python docstring
];

export async function convertPdfToMarkdown(
  data: Uint8Array,
  onProgress?: (progress: ConversionProgress) => void,
): Promise<string> {
  if (data.byteLength === 0) {
    throw new Error("The uploaded PDF is empty.");
  }
  onProgress?.({ stage: "loading" });

  const pdf = await loadPdfDocument(data);
  const allPageLines: Line[][] = [];
  const allFontHeights: number[] = [];

  try {
    // First pass: extract all lines and collect font heights across entire PDF
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      onProgress?.({ stage: "parsing", currentPage: pageNumber, totalPages: pdf.numPages });

      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const operatorList = await page.getOperatorList();
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
      allPageLines.push(lines);

      // Collect font heights from this page
      for (const line of lines) {
        allFontHeights.push(line.avgFontHeight);
      }
    }

    // Calculate global median font across entire PDF
    const globalMedianFont = allFontHeights.length > 0 ? median(allFontHeights) : 12;

    // Second pass: convert to markdown using global median
    const pages: string[] = [];
    for (const lines of allPageLines) {
      const pageMarkdown = linesToMarkdown(lines, globalMedianFont);
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

export function linesToMarkdown(lines: Line[], globalMedianFont?: number): string {
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

  // Use global median if provided, otherwise calculate from current page
  const medianFont = globalMedianFont ?? median(fontHeights);

  // Also calculate page-level median for local context
  const pageMedianFont = median(fontHeights);

  const medianGap = gaps.length > 0 ? median(gaps) : medianFont * 1.5;
  const blocks = groupLinesIntoMarkdownBlocks(lines, medianFont, pageMedianFont);
  const result: string[] = [];

  for (const block of blocks) {
    if (block.kind === "code") {
      // Ensure there's a blank line before code block if result is not empty
      if (result.length > 0 && result[result.length - 1] !== "") {
        result.push("");
      }

      result.push("```");

      // Calculate base indentation (minimum x position in this code block)
      let minX = Infinity;
      let avgCharWidth = 0;
      let charCount = 0;

      for (const line of block.lines) {
        if (line.items.length > 0 && line.text.trim()) {
          const lineX = line.items[0].x;
          if (lineX < minX) {
            minX = lineX;
          }

          // Estimate average character width from this code block
          for (const item of line.items) {
            if (item.text && item.width > 0) {
              avgCharWidth += item.width / item.text.length;
              charCount++;
            }
          }
        }
      }

      // Fallback to 6 pixels per char if we can't calculate
      const charWidth = charCount > 0 ? avgCharWidth / charCount : 6;

      // Convert indentation to spaces and insert paragraph breaks
      for (let lineIndex = 0; lineIndex < block.lines.length; lineIndex++) {
        // Check if we need to insert a paragraph break before this line
        if (block.paragraphBoundaries?.includes(lineIndex)) {
          result.push("");  // Add blank line at paragraph boundary
        }

        const line = block.lines[lineIndex];
        const text = line.text.replace(/\s+$/, "");
        if (!text) {
          result.push("");  // Preserve blank lines in code
          continue;
        }

        // Calculate relative indentation
        const lineX = line.items[0]?.x ?? minX;
        const relativeIndent = Math.max(0, lineX - minX);
        const indentSpaces = Math.round(relativeIndent / charWidth);
        const indent = " ".repeat(indentSpaces);

        result.push(indent + text);
      }
      result.push("```");
      result.push("");
      continue;
    }

    for (let i = 0; i < block.lines.length; i++) {
      const line = block.lines[i];
      const text = line.text.trim();
      if (!text) {
        continue;
      }

      const ratio = line.avgFontHeight / medianFont;
      const isShortLine = text.length < BODY_LINE_MAX_LENGTH;
      const isBullet = BULLET_PATTERN.test(text);

      let formatted = text;
      let needsTrailingSpaces = true;

      // Check if this line contains code fence markers
      const hasCodeFence = /^```/.test(text);

      if (ratio >= HEADING_LEVEL_1_RATIO && isShortLine && !hasCodeFence) {
        formatted = `# ${text}`;
        needsTrailingSpaces = false;
      } else if (ratio >= HEADING_LEVEL_2_RATIO && isShortLine && !hasCodeFence) {
        formatted = `## ${text}`;
        needsTrailingSpaces = false;
      } else if (ratio >= HEADING_LEVEL_3_RATIO && isShortLine && !hasCodeFence) {
        formatted = `### ${text}`;
        needsTrailingSpaces = false;
      } else if (isBullet && !hasCodeFence) {
        formatted = `- ${text.replace(BULLET_PATTERN, "")}`;
        needsTrailingSpaces = false;
      }

      let willHaveBlankLine = false;
      if (i < block.lines.length - 1) {
        const nextLine = block.lines[i + 1];
        const gap = nextLine.y - line.y;
        const isLargeGap = gap > medianGap * PARAGRAPH_BREAK_RATIO;
        const isStructural = formatted.startsWith("#") || formatted.startsWith("-");
        const isTocEntry = isShortLine && /\d+\s*$/.test(text) && nextLine.text.trim().length > 0;
        willHaveBlankLine = isLargeGap || isStructural || isTocEntry;
      } else if (result.length > 0 && result[result.length - 1] === "") {
        willHaveBlankLine = false;
      }

      result.push(needsTrailingSpaces && !willHaveBlankLine ? `${formatted}  ` : formatted);
      if (willHaveBlankLine) {
        result.push("");
      }
    }
  }

  while (result[result.length - 1] === "") {
    result.pop();
  }

  // Fix unmatched code fences in the result
  let inCodeFence = false;
  const fixedResult: string[] = [];

  for (let i = 0; i < result.length; i++) {
    const line = result[i];
    fixedResult.push(line);

    // Track code fence state
    if (/^```/.test(line.trim())) {
      inCodeFence = !inCodeFence;
    }
  }

  // If we end with an unclosed code fence, close it
  if (inCodeFence) {
    fixedResult.push("```");
  }

  // Ensure code blocks at the end are properly closed
  const lastNonEmpty = fixedResult.filter(line => line.trim()).pop();
  if (lastNonEmpty === "```") {
    // Last line is code block closing - add back an empty line
    fixedResult.push("");
  }

  return fixedResult.join("\n");
}

function groupLinesIntoMarkdownBlocks(lines: Line[], globalMedianFont: number, pageMedianFont: number): MarkdownBlock[] {
  if (DEBUG_CODE_DETECTION) {
    console.info("[page-processing]", {
      totalLines: lines.length,
      globalMedianFont: globalMedianFont.toFixed(2),
      pageMedianFont: pageMedianFont.toFixed(2),
      fontDiff: (globalMedianFont - pageMedianFont).toFixed(2),
    });
  }

  // Split lines into paragraphs based on gaps
  const paragraphs = splitIntoParagraphs(lines, pageMedianFont);

  // Classify each paragraph as code or text
  const blocks: MarkdownBlock[] = [];

  for (const paragraph of paragraphs) {
    const isCodeBlock = isParagraphCodeBlock(paragraph, pageMedianFont);

    if (isCodeBlock) {
      blocks.push({ kind: "code", lines: paragraph.lines });
    } else {
      blocks.push({ kind: "lines", lines: paragraph.lines });
    }
  }

  // Post-process: check for text paragraphs sandwiched between code blocks
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.kind === "lines" && block.lines.length <= 3) {
      const prevBlock = i > 0 ? blocks[i - 1] : null;
      const nextBlock = i < blocks.length - 1 ? blocks[i + 1] : null;

      // If surrounded by code blocks, check if this is likely a continuation
      if (prevBlock?.kind === "code" && nextBlock?.kind === "code") {
        const allLinesLookLikeContinuation = block.lines.every(line => {
          const text = line.text.trim();
          if (!text) return true;

          // Continuation patterns: closing parens, dashes, etc.
          if (/^[)\]}]/.test(text) || /---$/.test(text) || /^\).*---$/.test(text)) {
            return true;
          }

          // Short lines that might be split fragments
          if (text.length < 50 && !/\b(the|is|are|was|were|this|that|these|those)\b/.test(text)) {
            return true;
          }

          return false;
        });

        if (allLinesLookLikeContinuation) {
          block.kind = "code";  // Convert to code block
        }
      }
    }
  }

  // Merge consecutive code blocks
  const mergedBlocks = mergeConsecutiveCodeBlocks(blocks);

  if (DEBUG_CODE_DETECTION) {
    debugParagraphDetection(paragraphs, mergedBlocks);
  }

  return mergedBlocks.filter((block) => block.lines.length > 0);
}

function splitIntoParagraphs(lines: Line[], medianFont: number): Paragraph[] {
  if (lines.length === 0) {
    return [];
  }

  const paragraphs: Paragraph[] = [];
  let currentParagraph: Line[] = [];
  let paragraphStartIndex = 0;
  let emptyLineCount = 0;  // Track empty lines between paragraphs

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line.text.trim();

    // Empty lines always create paragraph breaks
    if (!text) {
      if (currentParagraph.length > 0) {
        paragraphs.push({
          lines: currentParagraph,
          startIndex: paragraphStartIndex,
          endIndex: i - 1,
        });
        currentParagraph = [];
        emptyLineCount = 1;
      } else {
        emptyLineCount++;
      }
      paragraphStartIndex = i + 1;
      continue;
    }

    // If we had empty lines, add them as a separator paragraph
    if (emptyLineCount > 0 && paragraphs.length > 0) {
      // Create empty line objects to represent the gap
      const emptyLines: Line[] = [];
      for (let j = 0; j < emptyLineCount; j++) {
        emptyLines.push({
          items: [],
          y: line.y - (emptyLineCount - j) * medianFont,
          text: "",
          avgFontHeight: medianFont,
          totalFontHeight: medianFont,
        });
      }
      paragraphs.push({
        lines: emptyLines,
        startIndex: paragraphStartIndex - emptyLineCount,
        endIndex: paragraphStartIndex - 1,
      });
      emptyLineCount = 0;
    }

    // Check for large gap from previous line
    if (currentParagraph.length > 0) {
      const previousLine = currentParagraph[currentParagraph.length - 1];
      const gap = line.y - previousLine.y;
      const threshold = medianFont * PARAGRAPH_GAP_RATIO;

      // Don't split if previous line is a # comment and current line looks like continuation
      const previousIsComment = /^\s*#/.test(previousLine.text.trim());
      const currentLooksContinuation = /^[a-z]/.test(text) || /^\)/.test(text) || /^---/.test(text) || text.length < 50;

      if (gap > threshold && !(previousIsComment && currentLooksContinuation)) {
        paragraphs.push({
          lines: currentParagraph,
          startIndex: paragraphStartIndex,
          endIndex: i - 1,
        });
        currentParagraph = [];
        paragraphStartIndex = i;
      }
    }

    currentParagraph.push(line);
  }

  // Add the last paragraph
  if (currentParagraph.length > 0) {
    paragraphs.push({
      lines: currentParagraph,
      startIndex: paragraphStartIndex,
      endIndex: lines.length - 1,
    });
  }

  return paragraphs;
}

function isParagraphCodeBlock(paragraph: Paragraph, medianFont: number): boolean {
  const { lines } = paragraph;

  if (lines.length === 0) {
    return false;
  }

  // PRIORITY CHECK: If any line starts with #, the whole paragraph is code
  const hasCommentLine = lines.some(line => {
    const text = line.text.trim();
    return text && /^\s*#/.test(text);
  });

  if (hasCommentLine) {
    return true;
  }

  // PRIORITY CHECK: If first non-empty line is a class or function definition, likely code
  const firstNonEmptyLine = lines.find(line => line.text.trim());
  if (firstNonEmptyLine) {
    const text = firstNonEmptyLine.text.trim();
    if (/^\s*(?:class|def|async\s+def)\s+\w+/.test(text)) {
      return true;
    }
  }

  // PRIORITY CHECK: If paragraph contains triple-quoted strings, likely code
  let inTripleQuote = false;
  let tripleQuoteLineCount = 0;
  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;

    // Check for triple quote delimiters
    const hasTripleQuote = /"""/.test(text) || /'''/.test(text);
    if (hasTripleQuote) {
      // Count opening/closing quotes
      const tripleDoubleCount = (text.match(/"""/g) || []).length;
      const tripleSingleCount = (text.match(/'''/g) || []).length;

      if (tripleDoubleCount % 2 === 1) {
        inTripleQuote = !inTripleQuote;
      }
      if (tripleSingleCount % 2 === 1) {
        inTripleQuote = !inTripleQuote;
      }
    }

    if (inTripleQuote || hasTripleQuote) {
      tripleQuoteLineCount++;
    }
  }

  // If >30% of lines are in triple-quoted strings, likely code with embedded text
  if (tripleQuoteLineCount > lines.length * 0.3) {
    return true;
  }

  // Count lines with code signals
  let codeSignalCount = 0;
  let totalNonEmptyLines = 0;
  let proseSignalCount = 0;
  const debugInfo: any[] = [];

  // Track triple-quote state while iterating
  inTripleQuote = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line.text.trim();

    if (!text) {
      continue;
    }

    totalNonEmptyLines++;

    // Update triple-quote state
    const hasTripleQuote = /"""/.test(text) || /'''/.test(text);
    if (hasTripleQuote) {
      const tripleDoubleCount = (text.match(/"""/g) || []).length;
      const tripleSingleCount = (text.match(/'''/g) || []).length;

      if (tripleDoubleCount % 2 === 1) {
        inTripleQuote = !inTripleQuote;
      }
      if (tripleSingleCount % 2 === 1) {
        inTripleQuote = !inTripleQuote;
      }
    }

    let lineCodeScore = 0;
    let lineReason = "";

    // Check if line has strong code patterns (highest priority)
    const hasStrongPattern = STRONG_CODE_PATTERNS.some((pattern) => pattern.test(text));
    if (hasStrongPattern) {
      lineCodeScore = 1;
      lineReason = "strong pattern";
      codeSignalCount++;
      // Don't check for prose if it's a strong code pattern (like # comments)
      if (DEBUG_CODE_DETECTION && lineCodeScore > 0) {
        debugInfo.push({
          text: text.substring(0, 60),
          score: lineCodeScore,
          reason: lineReason,
        });
      }
      continue;
    }

    // Check for prose signals (natural language indicators)
    // Only count as prose if it's clearly a full sentence
    const wordCount = text.split(/\s+/).length;
    const hasMultipleCommonWords = (text.match(/\b(the|a|an|is|are|was|were|in|on|at|to|for|of|and|or|but|with|from|by|this|that|these|those|which|what|when|where|how|why)\b/gi) || []).length >= 2;
    const endsWithSentencePunctuation = /[.!?]$/.test(text);
    const isLongSentence = wordCount > 12 && text.length > 70;

    // Don't count as prose if inside triple quotes (it's code content)
    if (inTripleQuote) {
      // Skip prose detection for lines inside triple-quoted strings
    } else {
      // Only count as prose if it looks like a complete sentence
      if (hasMultipleCommonWords && endsWithSentencePunctuation && wordCount > 5) {
        proseSignalCount++;
      } else if (isLongSentence && hasMultipleCommonWords) {
        proseSignalCount++;
      }
    }

    // Check if line has inline code patterns
    const hasInlinePattern = INLINE_CODE_PATTERNS.some((pattern) => pattern.test(text));
    if (hasInlinePattern) {
      lineCodeScore = 1;
      lineReason = "inline pattern";
      codeSignalCount++;
    } else if (looksCodeLikeText(text)) {
      lineCodeScore = 1;
      lineReason = "looksCodeLike";
      codeSignalCount++;
    }
    // Note: Removed font-based scoring - too inconsistent across different PDFs

    if (DEBUG_CODE_DETECTION && lineCodeScore > 0) {
      debugInfo.push({
        text: text.substring(0, 60),
        score: lineCodeScore,
        reason: lineReason,
      });
    }
  }

  if (totalNonEmptyLines === 0) {
    return false;
  }

  const codeDensity = codeSignalCount / totalNonEmptyLines;
  const proseDensity = proseSignalCount / totalNonEmptyLines;

  const isCode = proseDensity <= 0.6 && codeDensity >= CODE_DENSITY_THRESHOLD;

  if (DEBUG_CODE_DETECTION && (isCode || debugInfo.length > 0)) {
    console.info("[paragraph-code-check]", {
      totalLines: totalNonEmptyLines,
      codeSignals: codeSignalCount,
      proseSignals: proseSignalCount,
      codeDensity: codeDensity.toFixed(2),
      proseDensity: proseDensity.toFixed(2),
      tripleQuoteLines: tripleQuoteLineCount,
      isCode,
      debugInfo,
    });
  }

  // If majority of lines look like prose, it's not code
  if (proseDensity > 0.6) {
    return false;
  }

  // If density is high enough, it's a code block
  if (codeDensity >= CODE_DENSITY_THRESHOLD) {
    return true;
  }

  // Special case: If code signals are weak but we have strong structural indicators
  // (assignment, function calls, brackets) along with triple quotes, likely code
  const hasStrongStructure = lines.some(line => {
    const text = line.text.trim();
    return /^[A-Za-z_][A-Za-z0-9_]*\s*=/.test(text) ||  // Assignment
           /^[A-Za-z_][A-Za-z0-9_]*\([^)]*\)/.test(text) ||  // Function call
           /^\[/.test(text) || /^\{/.test(text);  // Bracket/brace start
  });

  if (hasStrongStructure && tripleQuoteLineCount > 0 && codeDensity >= 0.15) {
    return true;  // Lower threshold (15%) if has strong structure + triple quotes
  }

  // Even if density is low, if ALL lines have strong patterns, it's code
  const allStrongPatterns = lines.every((line) => {
    const text = line.text.trim();
    return !text || STRONG_CODE_PATTERNS.some((pattern) => pattern.test(text));
  });

  if (allStrongPatterns && totalNonEmptyLines >= CODE_BLOCK_MIN_LINES) {
    return true;
  }

  return false;
}

function debugParagraphDetection(paragraphs: Paragraph[], blocks: MarkdownBlock[]): void {
  const summary = paragraphs.map((paragraph, index) => {
    const block = blocks[index];
    const lines = paragraph.lines.map((line) => line.text);

    return {
      paragraphIndex: index,
      blockKind: block?.kind || "unknown",
      lineCount: paragraph.lines.length,
      lines: lines,
    };
  });

  console.info("[pdf-paragraph-detection]", summary);
}

function mergeConsecutiveCodeBlocks(blocks: MarkdownBlock[]): MarkdownBlock[] {
  if (blocks.length === 0) {
    return [];
  }

  const merged: MarkdownBlock[] = [];
  let currentBlock: MarkdownBlock = {
    kind: blocks[0].kind,
    lines: [...blocks[0].lines],
    paragraphBoundaries: []
  };

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];

    // If current is code and next is empty lines, check if the block after is also code
    if (currentBlock.kind === "code" && block.lines.every(line => !line.text.trim())) {
      // This is an empty paragraph between blocks
      const nextBlock = blocks[i + 1];

      if (nextBlock && nextBlock.kind === "code") {
        // Mark the boundary before merging
        const boundaryIndex = currentBlock.lines.length;
        currentBlock.paragraphBoundaries = currentBlock.paragraphBoundaries || [];
        currentBlock.paragraphBoundaries.push(boundaryIndex);

        // Merge: code + empty + code → single code block
        currentBlock.lines = [...currentBlock.lines, ...nextBlock.lines];
        i++;  // Skip the next code block since we already merged it
        continue;
      }
    }

    // If current and next are both code blocks (directly adjacent), merge them
    if (currentBlock.kind === "code" && block.kind === "code") {
      // Mark the boundary before merging
      const boundaryIndex = currentBlock.lines.length;
      currentBlock.paragraphBoundaries = currentBlock.paragraphBoundaries || [];
      currentBlock.paragraphBoundaries.push(boundaryIndex);

      currentBlock.lines = [...currentBlock.lines, ...block.lines];
    } else {
      // Different types, push current and start new
      merged.push(currentBlock);
      currentBlock = {
        kind: block.kind,
        lines: [...block.lines],
        paragraphBoundaries: []
      };
    }
  }

  // Don't forget the last block
  merged.push(currentBlock);

  return merged;
}

function buildLineMetadata(lines: Line[], medianFont: number): LineMetadata[] {
  return lines.map((line, index) => {
    const previousLine = index > 0 ? lines[index - 1] : null;
    const nextLine = index < lines.length - 1 ? lines[index + 1] : null;
    const kind = classifyLine(lines, index, medianFont);
    const hasNearbyCodeSignal = hasNearbyCodeNeighbor(lines, index, medianFont);
    const codeLikeText = looksCodeLikeText(line.text.trim());
    return {
      line,
      index,
      kind,
      previousLine,
      nextLine,
      hasNearbyCodeSignal,
      codeLikeText,
    };
  });
}

function hasNearbyCodeNeighbor(lines: Line[], index: number, medianFont: number): boolean {
  const start = Math.max(0, index - CODE_ANCHOR_SEARCH_RADIUS);
  const end = Math.min(lines.length - 1, index + CODE_ANCHOR_SEARCH_RADIUS);

  for (let candidateIndex = start; candidateIndex <= end; candidateIndex++) {
    if (candidateIndex === index) {
      continue;
    }

    const candidateLine = lines[candidateIndex];
    const candidateText = candidateLine.text.trim();
    if (!candidateText) {
      continue;
    }

    const candidateKind = classifyLine(lines, candidateIndex, medianFont);
    if (candidateKind !== "plain") {
      return true;
    }

    const previousLine = candidateIndex > 0 ? lines[candidateIndex - 1] : null;
    const nextLine = candidateIndex < lines.length - 1 ? lines[candidateIndex + 1] : null;
    if (isContinuationLine(candidateLine, previousLine, nextLine, medianFont, true)) {
      return true;
    }

    if (looksCodeLikeText(candidateText)) {
      return true;
    }
  }

  return false;
}

function expandCodeAnchors(metadata: LineMetadata[], medianFont: number): CodeSpan[] {
  const spans: CodeSpan[] = [];

  for (const entry of metadata) {
    if (!isCodeAnchor(entry, medianFont)) {
      continue;
    }

    let start = entry.index;
    let end = entry.index;

    while (start > 0 && shouldIncludeCodeNeighbor(metadata, start - 1, start, medianFont, -1)) {
      start -= 1;
    }

    while (end < metadata.length - 1 && shouldIncludeCodeNeighbor(metadata, end + 1, end, medianFont, 1)) {
      end += 1;
    }

    spans.push({ start, end });
  }

  return spans;
}

function isCodeAnchor(entry: LineMetadata, medianFont: number): boolean {
  if (entry.kind === "strong") {
    return true;
  }

  if (entry.kind !== "weak") {
    return false;
  }

  const candidate: CodeCandidate = { line: entry.line, kind: entry.kind };
  if (blockLooksLikeBodyText([candidate], medianFont)) {
    return false;
  }

  return entry.hasNearbyCodeSignal || isContinuationLine(entry.line, entry.previousLine, entry.nextLine, medianFont, true);
}

function shouldIncludeCodeNeighbor(
  metadata: LineMetadata[],
  candidateIndex: number,
  anchorIndex: number,
  medianFont: number,
  direction: -1 | 1,
): boolean {
  const entry = metadata[candidateIndex];
  const text = entry.line.text.trim();
  if (!text) {
    return countBlankGap(metadata, candidateIndex, anchorIndex, direction) <= MAX_CODE_SPAN_BLANK_GAP;
  }

  const anchorEntry = metadata[anchorIndex];

  if (entry.kind !== "plain") {
    return true;
  }

  if (direction === -1) {
    if (countPreludeLines(metadata, candidateIndex, anchorIndex) > MAX_CODE_SPAN_PRELUDE_LINES) {
      return false;
    }

    if (anchorEntry.kind === "strong" && !entry.codeLikeText && !isShortCommandLikeText(text) && !isNarrativeCodeBridge(entry, direction)) {
      return false;
    }
  }

  if (direction === 1) {
    if (anchorEntry.kind === "strong" && !entry.codeLikeText && !isShortCommandLikeText(text) && !isNarrativeCodeBridge(entry, direction)) {
      return false;
    }
  }

  if (countPlainRun(metadata, candidateIndex, anchorIndex, direction) > MAX_CODE_SPAN_PLAIN_RUN) {
    return false;
  }

  const previousLine = entry.previousLine;
  const nextLine = entry.nextLine;
  if (isContinuationLine(entry.line, previousLine, nextLine, medianFont, true)) {
    return true;
  }

  if (isNarrativeCodeBridge(entry, direction)) {
    return true;
  }

  if (!entry.hasNearbyCodeSignal) {
    return false;
  }

  if (entry.codeLikeText && countCodeLikeRun(metadata, candidateIndex, anchorIndex, direction) <= MAX_CODE_SPAN_CODELIKE_RUN) {
    return true;
  }

  const neighborDistance = Math.min(
    distanceToNearestSignal(metadata, candidateIndex, direction, medianFont),
    distanceToNearestSignal(metadata, candidateIndex, direction * -1 as -1 | 1, medianFont),
  );

  return neighborDistance <= MAX_CODE_SPAN_NEIGHBOR_DISTANCE && !blockLooksLikeBodyText([{ line: entry.line, kind: "plain" }], medianFont);
}

function countBlankGap(metadata: LineMetadata[], candidateIndex: number, anchorIndex: number, direction: -1 | 1): number {
  let blanks = 0;
  for (let index = anchorIndex + direction; direction === 1 ? index <= candidateIndex : index >= candidateIndex; index += direction) {
    if (!metadata[index].line.text.trim()) {
      blanks += 1;
    }
  }
  return blanks;
}

function countPreludeLines(metadata: LineMetadata[], candidateIndex: number, anchorIndex: number): number {
  let proseLikeCount = 0;
  for (let index = anchorIndex - 1; index >= candidateIndex; index -= 1) {
    const entry = metadata[index];
    const text = entry.line.text.trim();
    if (!text) {
      continue;
    }

    if (entry.kind !== "plain") {
      break;
    }

    if (!entry.codeLikeText && !isShortCommandLikeText(text) && !isNarrativeCodeBridge(entry, -1)) {
      proseLikeCount += 1;
    }
  }
  return proseLikeCount;
}

function countPlainRun(metadata: LineMetadata[], candidateIndex: number, anchorIndex: number, direction: -1 | 1): number {
  let plainCount = 0;
  for (let index = candidateIndex; direction === 1 ? index >= anchorIndex : index <= anchorIndex; index -= direction) {
    if (metadata[index].line.text.trim() && metadata[index].kind === "plain") {
      plainCount += 1;
      continue;
    }

    if (metadata[index].kind !== "plain") {
      break;
    }
  }
  return plainCount;
}

function countCodeLikeRun(metadata: LineMetadata[], candidateIndex: number, anchorIndex: number, direction: -1 | 1): number {
  let codeLikeCount = 0;
  for (let index = candidateIndex; direction === 1 ? index >= anchorIndex : index <= anchorIndex; index -= direction) {
    const entry = metadata[index];
    if (!entry.line.text.trim()) {
      continue;
    }

    if (entry.kind !== "plain" || entry.codeLikeText) {
      codeLikeCount += 1;
      continue;
    }

    break;
  }
  return codeLikeCount;
}

function distanceToNearestSignal(metadata: LineMetadata[], index: number, direction: -1 | 1, medianFont: number): number {
  let distance = 0;
  for (let cursor = index + direction; cursor >= 0 && cursor < metadata.length; cursor += direction) {
    distance += 1;
    const entry = metadata[cursor];
    if (!entry.line.text.trim()) {
      continue;
    }

    if (entry.kind !== "plain" || isContinuationLine(entry.line, entry.previousLine, entry.nextLine, medianFont, true)) {
      return distance;
    }

    if (distance > MAX_CODE_SPAN_NEIGHBOR_DISTANCE) {
      break;
    }
  }

  return Number.POSITIVE_INFINITY;
}

function mergeCodeSpans(spans: CodeSpan[], metadata: LineMetadata[], medianFont: number): CodeSpan[] {
  if (spans.length === 0) {
    return [];
  }

  const sorted = [...spans].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: CodeSpan[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const previous = merged[merged.length - 1];
    const current = sorted[i];
    if (current.start <= previous.end + 1) {
      previous.end = Math.max(previous.end, current.end);
      continue;
    }

    merged.push({ ...current });
  }

  return merged
    .map((span) => trimCodeSpan(span, metadata, medianFont))
    .filter((span): span is CodeSpan => span !== null)
    .filter((span) => span.end - span.start + 1 >= CODE_BLOCK_MIN_LINES);
}

function trimCodeSpan(span: CodeSpan, metadata: LineMetadata[], medianFont: number): CodeSpan | null {
  let start = span.start;
  let end = span.end;

  while (start <= end && shouldTrimCodeEdge(metadata, start, medianFont, 1)) {
    start += 1;
  }

  while (end >= start && shouldTrimCodeEdge(metadata, end, medianFont, -1)) {
    end -= 1;
  }

  if (end - start + 1 < CODE_BLOCK_MIN_LINES) {
    return null;
  }

  return { start, end };
}

function shouldTrimCodeEdge(
  metadata: LineMetadata[],
  index: number,
  medianFont: number,
  direction: -1 | 1,
): boolean {
  const entry = metadata[index];
  const text = entry.line.text.trim();
  if (!text) {
    return true;
  }

  if (entry.kind === "strong") {
    return false;
  }

  if (entry.kind === "weak" && !blockLooksLikeBodyText([{ line: entry.line, kind: entry.kind }], medianFont)) {
    return false;
  }

  if (isContinuationLine(entry.line, entry.previousLine, entry.nextLine, medianFont, true)) {
    return false;
  }

  if (isNarrativeCodeBridge(entry, direction)) {
    return false;
  }

  if (entry.codeLikeText) {
    return false;
  }

  const inward = metadata[index + direction * -1];
  const inwardLooksCode = inward
    ? inward.kind !== "plain" || inward.codeLikeText || isContinuationLine(inward.line, inward.previousLine, inward.nextLine, medianFont, true)
    : false;

  return !inwardLooksCode || blockLooksLikeBodyText([{ line: entry.line, kind: entry.kind }], medianFont);
}

function isHeadingBoundary(lines: Line[], index: number, medianFont: number): boolean {
  const line = lines[index];
  const text = line.text.trim();
  if (!text) {
    return false;
  }

  const previousLine = index > 0 ? lines[index - 1] : null;
  const nextLine = index < lines.length - 1 ? lines[index + 1] : null;
  const gapBefore = previousLine ? line.y - previousLine.y : 0;
  const gapAfter = nextLine ? nextLine.y - line.y : 0;
  const hasLargeGapBefore = previousLine ? gapBefore > line.avgFontHeight * HEADING_GAP_RATIO : false;
  const hasLargeGapAfter = nextLine ? gapAfter > line.avgFontHeight * HEADING_GAP_RATIO : false;
  const fontRatio = Math.abs(line.avgFontHeight - medianFont) / Math.max(medianFont, 1);
  const isShortLine = text.length < BODY_LINE_MAX_LENGTH;
  return fontRatio >= HEADING_LEVEL_3_RATIO || (isShortLine && hasLargeGapBefore && hasLargeGapAfter);
}

function isListBoundary(text: string): boolean {
  return BULLET_PATTERN.test(text) || /^\d+[.)]\s+/.test(text);
}

function isBridgeCandidate(line: Line, previousLine: Line | null, nextLine: Line | null): boolean {
  const text = line.text.trim();
  if (!text || text.length > BODY_LINE_MAX_LENGTH) {
    return false;
  }

  const previousText = previousLine?.text.trim() ?? "";
  const nextText = nextLine?.text.trim() ?? "";
  const neighborCodeLike = [previousText, nextText].filter(Boolean).filter((value) => looksCodeLikeText(value) || INLINE_CODE_PATTERNS.some((pattern) => pattern.test(value)));
  const looksQuotedIdentifier = /^['"`][A-Za-z_][A-Za-z0-9_]*['"`]$/.test(text);
  const looksStringLiteralLine = /^['"`].*['"`]?$/.test(text) || /^['"`].*[{:][^"'`]*$/.test(text);
  const looksPipeStep = /^\|\s*[A-Za-z_][A-Za-z0-9_]*(?:\([^)]*\))?$/.test(text);
  const looksDelimiter = /^[(){}\[\],.:]+$/.test(text) || /^[)\]}]$/.test(text);
  const looksShortFragment = /^[A-Za-z0-9_./-]+(?:\s+[A-Za-z0-9_./-]+){0,4}$/.test(text);

  if (looksQuotedIdentifier) {
    return neighborCodeLike.length >= 2;
  }

  if (looksStringLiteralLine) {
    return neighborCodeLike.length >= 1;
  }

  return neighborCodeLike.length >= 1 && (looksPipeStep || looksDelimiter || looksShortFragment);
}

function isContinuationLine(
  line: Line,
  previousLine: Line | null,
  nextLine: Line | null,
  medianFont: number,
  allowLooseAnchoring = false,
): boolean {
  const text = line.text.trim();
  if (!text) {
    return false;
  }

  const fontRatio = Math.abs(line.avgFontHeight - medianFont) / Math.max(medianFont, 1);
  const previousText = previousLine?.text.trim() ?? "";
  const nextText = nextLine?.text.trim() ?? "";
  const previousIndent = previousLine?.items[0]?.x ?? 0;
  const currentIndent = line.items[0]?.x ?? 0;
  const nextIndent = nextLine?.items[0]?.x ?? 0;
  const isIndentedRelativeToPrevious = currentIndent - previousIndent > 8;
  const isAlignedWithPrevious = previousLine ? Math.abs(currentIndent - previousIndent) <= CODE_INDENT_TOLERANCE : false;
  const isAlignedWithNext = nextLine ? Math.abs(currentIndent - nextIndent) <= CODE_INDENT_TOLERANCE : false;
  const startsLikeContinuation = CONTINUATION_PREFIX_PATTERN.test(text);
  const previousOpensContinuation = /[=({\[|,:+]$/.test(previousText) || /from_template\($/.test(previousText);
  const currentLooksLikeLiteral = /^[:"'`]/.test(text) || /^\{/.test(text) || /^\|/.test(text) || /^[)\]}]$/.test(text);
  const currentLooksLikeContinuationClause = /^(?:[)}\]]\s*[.,]?|else\b|elif\b|except\b|finally\b|catch\b)/.test(text);
  const currentLooksShort = text.length <= BODY_LINE_MAX_LENGTH;
  const currentLooksLikePipeStep = /^\|\s*[A-Za-z_][A-Za-z0-9_]*(?:\([^)]*\))?$/.test(text);
  const nextLooksCodeLike = nextText.length > 0 && (INLINE_CODE_PATTERNS.some((pattern) => pattern.test(nextText)) || /^\s*#/.test(nextText) || looksCodeLikeText(nextText));
  const previousLooksCodeLike = previousText.length > 0 && (INLINE_CODE_PATTERNS.some((pattern) => pattern.test(previousText)) || /^\s*#/.test(previousText) || looksCodeLikeText(previousText));
  const looksLikeBareWordLine = /^[A-Za-z0-9_./-]+(?:\s+[A-Za-z0-9_./-]+){0,4}$/.test(text);
  const looksLikeUnderscoreFragment = /^[A-Za-z0-9]+(?:_[A-Za-z0-9]+)+$/.test(text);
  const neighborsSuggestSplitIdentifier = previousText === "_" || nextText === "_" || previousText.endsWith("_") || nextText.startsWith("_");

  if (fontRatio < CODE_FONT_RATIO_TOLERANCE * 0.5) {
    return false;
  }

  if (
    (previousOpensContinuation && currentLooksShort) ||
    (startsLikeContinuation && (isAlignedWithNext || isIndentedRelativeToPrevious || isAlignedWithPrevious)) ||
    (currentLooksLikeLiteral && (isAlignedWithNext || isAlignedWithPrevious || previousOpensContinuation)) ||
    (currentLooksLikeContinuationClause && (previousLooksCodeLike || nextLooksCodeLike)) ||
    (currentLooksLikePipeStep && (previousLooksCodeLike || nextLooksCodeLike)) ||
    (looksLikeUnderscoreFragment && neighborsSuggestSplitIdentifier && (previousLooksCodeLike || nextLooksCodeLike)) ||
    (text === "_" && (previousLooksCodeLike || nextLooksCodeLike)) ||
    (isIndentedRelativeToPrevious && nextLooksCodeLike)
  ) {
    return true;
  }

  if (!allowLooseAnchoring) {
    return false;
  }

  return (
    (looksLikeBareWordLine && (previousLooksCodeLike || nextLooksCodeLike)) ||
    ((isAlignedWithPrevious || isAlignedWithNext) && (previousLooksCodeLike || nextLooksCodeLike) && currentLooksShort)
  );
}

function blockLooksLikeBodyText(candidates: CodeCandidate[], medianFont: number): boolean {
  let proseLikeLines = 0;

  for (const candidate of candidates) {
    const text = candidate.line.text.trim();
    if (!text) {
      continue;
    }

    const wordCount = text.split(/\s+/).length;
    const looksLikeSentence = /[.!?]$/.test(text) && text.includes(" ");
    const fontRatio = Math.abs(candidate.line.avgFontHeight - medianFont) / Math.max(medianFont, 1);
    if (looksLikeSentence && wordCount >= NATURAL_LANGUAGE_WORD_THRESHOLD && fontRatio < CODE_FONT_RATIO_TOLERANCE) {
      proseLikeLines += 1;
    }
  }

  return proseLikeLines >= Math.ceil(candidates.length / 2);
}

function classifyLine(lines: Line[], index: number, medianFont: number): CodeCandidate["kind"] {
  const line = lines[index];
  const text = line.text;
  const trimmed = text.trim();
  if (!trimmed) {
    return "plain";
  }

  const previousLine = index > 0 ? lines[index - 1] : null;
  const nextLine = index < lines.length - 1 ? lines[index + 1] : null;
  const gapBefore = previousLine ? line.y - previousLine.y : 0;
  const gapAfter = nextLine ? nextLine.y - line.y : 0;
  const hasLargeGapBefore = previousLine ? gapBefore > line.avgFontHeight * HEADING_GAP_RATIO : false;
  const hasLargeGapAfter = nextLine ? gapAfter > line.avgFontHeight * HEADING_GAP_RATIO : false;
  const fontRatio = Math.abs(line.avgFontHeight - medianFont) / Math.max(medianFont, 1);
  const matchesStrongPattern = STRONG_CODE_PATTERNS.some((pattern) => pattern.test(text));
  const matchesInlinePattern = INLINE_CODE_PATTERNS.some((pattern) => pattern.test(text));
  const looksLikeSentence = /[.!?]$/.test(trimmed) && trimmed.includes(" ");
  const wordCount = trimmed.split(/\s+/).length;
  const isShortLine = trimmed.length < BODY_LINE_MAX_LENGTH;
  const isBullet = BULLET_PATTERN.test(trimmed);
  const looksLikeHeading = fontRatio >= HEADING_LEVEL_3_RATIO || (isShortLine && hasLargeGapBefore && hasLargeGapAfter);
  const looksLikeBodyProse = looksLikeSentence && wordCount >= NATURAL_LANGUAGE_WORD_THRESHOLD;

  if (looksLikeHeading || isBullet || looksLikeBodyProse) {
    return "plain";
  }

  if (matchesStrongPattern) {
    return "strong";
  }

  if (fontRatio < CODE_FONT_RATIO_TOLERANCE) {
    return "plain";
  }

  if (matchesInlinePattern || trimmed.includes("_") || looksCodeLikeText(trimmed)) {
    return "weak";
  }

  return "plain";
}

function looksCodeLikeText(text: string): boolean {
  if (!text) {
    return false;
  }

  // Triple-quoted strings (Python docstrings)
  if (/^["']{3}/.test(text)) {
    return true;
  }

  // Single quoted identifiers (common in code, rare in prose)
  if (/^['"][A-Za-z_][A-Za-z0-9_]*['"]$/.test(text)) {
    return true;
  }

  // Lines that are ONLY punctuation (closing braces, etc.)
  if (/^[)}\]]+$/.test(text)) {
    return true;
  }

  // Dict/object/array literals
  if (/^[{[]/.test(text)) {
    return true;
  }

  // Pipe operators (standalone or at start)
  if (/^\s*\|/.test(text) || /\|\s*$/.test(text)) {
    return true;
  }

  // Assignment patterns (must not be part of prose)
  if (/^[A-Za-z_][A-Za-z0-9_]*\s*=\s*[^=]/.test(text) && !/ = /.test(text)) {
    // Matches: var=value or var= but NOT "I = something" (with spaces around =)
    return true;
  }

  // Function calls with typical syntax
  if (/^[A-Za-z_][A-Za-z0-9_]*\([^)]*\)/.test(text)) {
    return true;
  }

  // Method chaining (dot notation)
  if (/\.[A-Za-z_][A-Za-z0-9_]*\(/.test(text)) {
    return true;
  }

  // Arrow functions or lambda
  if (/=>|->|\blambda\b/.test(text)) {
    return true;
  }

  // Variable names with multiple underscores (common in code, rare in prose)
  if (/^[A-Za-z0-9]+(?:_[A-Za-z0-9]+){2,}$/.test(text)) {
    return true;
  }

  // Lines that start with common code-specific characters
  if (/^[\t ]*[@$]/.test(text)) {
    return true;
  }

  return false;
}

function isShortCommandLikeText(text: string): boolean {
  return /^\s*(?:pip|npm|pnpm|yarn|python|node|uv)\b/.test(text) && text.length <= BODY_LINE_MAX_LENGTH;
}

function isNarrativeCodeBridge(entry: LineMetadata, direction: -1 | 1): boolean {
  const text = entry.line.text.trim();
  if (!text || text.length > BODY_LINE_MAX_LENGTH) {
    return false;
  }

  const previousText = entry.previousLine?.text.trim() ?? "";
  const nextText = entry.nextLine?.text.trim() ?? "";
  const nearerText = direction === -1 ? nextText : previousText;
  const fartherText = direction === -1 ? previousText : nextText;

  const looksQuotedIdentifier = /^['"`][A-Za-z_][A-Za-z0-9_]*['"`]$/.test(text);
  const looksStringLiteralLine = /^['"`].*['"`]?$/.test(text) || /^['"`].*[{:][^"'`]*$/.test(text);
  const looksCodeComment = fartherText.startsWith("#") || nearerText.startsWith("#");
  const mentionsPromptOrChain = /\b(?:prompt|chain|variable|output|input|specifications?)\b/i.test(text);
  const nearbyCodeContext = [previousText, nextText].filter(Boolean).filter((value) => looksCodeLikeText(value) || INLINE_CODE_PATTERNS.some((pattern) => pattern.test(value))).length;

  if (looksQuotedIdentifier) {
    return nearbyCodeContext >= 2;
  }

  if (looksStringLiteralLine) {
    return nearbyCodeContext >= 1;
  }

  return looksCodeComment && mentionsPromptOrChain;
}

function debugCodeDetection(metadata: LineMetadata[], spans: CodeSpan[]): void {
  const lines = metadata.map((entry) => {
    const spanKind = spans.some((span) => entry.index >= span.start && entry.index <= span.end) ? "code" : "text";
    return {
      index: entry.index,
      kind: entry.kind,
      spanKind,
      hasNearbyCodeSignal: entry.hasNearbyCodeSignal,
      codeLikeText: entry.codeLikeText,
      text: entry.line.text,
    };
  });

  console.info("[pdf-code-detection]", {
    spans,
    lines,
  });
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}
