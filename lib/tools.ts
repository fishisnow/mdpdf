export const SITE_TOOLS = [
  {
    href: "/",
    navLabel: "Home",
    cardTitle: "PDF to MD",
    description: "Turn PDFs into clean, editable Markdown in your browser.",
    accent: "blue",
  },
  {
    href: "/md-to-pdf",
    navLabel: "MD to PDF",
    cardTitle: "MD to PDF",
    description: "Write Markdown and export it as a PDF from the print dialog.",
    accent: "indigo",
  },
  {
    href: "/pdf-to-jpg",
    navLabel: "PDF to JPG",
    cardTitle: "PDF to JPG",
    description: "Convert PDF pages to JPG or PNG images without uploading.",
    accent: "sky",
  },
  {
    href: "/markdown-preview",
    navLabel: "MD Preview",
    cardTitle: "Markdown Preview",
    description: "Live Markdown editor with a rendered preview, split or full-width.",
    accent: "emerald",
  },
  {
    href: "/json-preview",
    navLabel: "JSON Preview",
    cardTitle: "JSON Preview",
    description: "Validate, format, and inspect JSON as pretty text or a collapsible tree.",
    accent: "amber",
  },
  {
    href: "/text-replacer",
    navLabel: "Text Replacer",
    cardTitle: "Text Replacer",
    description: "Replace characters in text, including turning literal \\n into real line breaks.",
    accent: "rose",
  },
] as const;

export type SiteToolHref = (typeof SITE_TOOLS)[number]["href"];

export const WORKSPACE_PANE_SPLIT = "h-[480px] sm:h-[620px] md:h-[860px]";
export const WORKSPACE_PANE_PREVIEW = "h-[580px] sm:h-[740px] md:h-[980px]";

export function workspacePaneHeight(isFullscreen: boolean, isSplit: boolean): string {
  if (isFullscreen) return "min-h-0 flex-1";
  return isSplit ? WORKSPACE_PANE_SPLIT : WORKSPACE_PANE_PREVIEW;
}

export function downloadTextFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
