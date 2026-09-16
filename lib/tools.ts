export const SITE_TOOLS = [
  { href: "/", id: "home", accent: "blue" },
  { href: "/md-to-pdf", id: "mdToPdf", accent: "indigo" },
  { href: "/pdf-to-jpg", id: "pdfToJpg", accent: "sky" },
  { href: "/md-viewer", id: "mdViewer", accent: "emerald" },
  { href: "/json-viewer", id: "jsonViewer", accent: "amber" },
  { href: "/text-replacer", id: "textReplacer", accent: "rose" },
] as const;

export type SiteToolHref = (typeof SITE_TOOLS)[number]["href"];
export type SiteToolId = (typeof SITE_TOOLS)[number]["id"];

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
