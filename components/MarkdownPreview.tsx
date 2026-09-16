"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import MarkdownHtmlPreview from "@/components/MarkdownHtmlPreview";
import SourceTextarea from "@/components/SourceTextarea";
import ViewModeToggle, { type ResultViewMode } from "@/components/ViewModeToggle";
import { Button } from "@/components/ui/button";

interface Props {
  markdown: string;
  filename: string;
  onDownload?: (payload: { filename: string; markdownLength: number }) => void;
}

type CopyState = "idle" | "copied";

export default function MarkdownPreview({ markdown, filename, onDownload }: Props) {
  const t = useTranslations("common");
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ResultViewMode>("split");
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const isSplit = viewMode === "split";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopyState("copied");
    setTimeout(() => setCopyState("idle"), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const downloadName = filename.replace(/\.pdf$/i, ".md");
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(url);

    onDownload?.({
      filename: downloadName,
      markdownLength: markdown.length,
    });
  };

  const syncFullscreenState = useCallback(() => {
    const active = document.fullscreenElement === viewerRef.current;
    startTransition(() => {
      setIsFullscreen(active);
    });
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    const el = viewerRef.current;
    if (!el) {
      return;
    }

    if (document.fullscreenElement === el) {
      void document.exitFullscreen();
      return;
    }

    const req = el.requestFullscreen({ navigationUI: "hide" });
    req?.catch(() => {});
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, [syncFullscreenState]);

  const paneShellClass =
    "flex min-h-0 flex-col " +
    (isFullscreen
      ? "min-h-0 flex-1"
      : isSplit
        ? "h-[480px] sm:h-[620px] md:h-[860px]"
        : "h-[580px] sm:h-[740px] md:h-[980px]");

  const viewToggle = <ViewModeToggle value={viewMode} onChange={setViewMode} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-heading">{t("result")}</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {viewToggle}
          {!isFullscreen && (
            <Button type="button" variant="neutral" onClick={handleFullscreenToggle} className="w-full sm:w-auto">
              {t("fullscreen")}
            </Button>
          )}
          <Button type="button" onClick={handleDownload} className="w-full sm:w-auto">
            {t("downloadMd")}
          </Button>
        </div>
      </div>

      <div
        ref={viewerRef}
        className="flex min-h-0 flex-col [&:fullscreen]:box-border [&:fullscreen]:size-full [&:fullscreen]:min-h-0 [&:fullscreen]:bg-secondary-background [&:fullscreen]:p-4 sm:[&:fullscreen]:p-6"
      >
        {isFullscreen && (
          <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-2 border-border pb-3">
            <span className="text-sm font-heading">{t("sourceAndPreview")}</span>
            <div className="flex flex-wrap items-center gap-2">
              {viewToggle}
              <Button type="button" size="sm" onClick={handleDownload}>
                {t("downloadMd")}
              </Button>
              <Button type="button" size="sm" variant="neutral" onClick={handleFullscreenToggle}>
                {t("exitFullscreen")}
              </Button>
            </div>
          </div>
        )}

        <div
          className={
            (isFullscreen ? "grid min-h-0 flex-1 gap-4 pt-2 md:gap-6 md:pt-4" : "grid w-full gap-4 pt-4 md:gap-6") +
            (isSplit ? " grid-cols-1 md:grid-cols-2" : " grid-cols-1")
          }
        >
          {isSplit && (
            <div className={paneShellClass}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-heading uppercase tracking-wide">{t("source")}</span>
                <Button type="button" size="xs" variant="neutral" onClick={handleCopy}>
                  {copyState === "copied" ? t("copied") : t("copy")}
                </Button>
              </div>
              <SourceTextarea markdown={markdown} />
            </div>
          )}
          <div className={paneShellClass}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-heading uppercase tracking-wide">{t("preview")}</span>
              {!isSplit && (
                <Button type="button" size="xs" variant="neutral" onClick={handleCopy}>
                  {copyState === "copied" ? t("copied") : t("copy")}
                </Button>
              )}
            </div>
            <MarkdownHtmlPreview markdown={markdown} />
          </div>
        </div>
      </div>
    </div>
  );
}
