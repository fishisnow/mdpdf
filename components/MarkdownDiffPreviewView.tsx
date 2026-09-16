"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import MarkdownOutline from "@/components/MarkdownOutline";
import { extractMarkdownHeadings } from "@/lib/markdown-headings";

const PREVIEW_CLASS =
  "markdown-preview-lines h-auto min-h-0 min-w-0 flex-1 !overflow-visible rounded-none border-0 bg-secondary-background !py-3 !pr-3 !pl-11 sm:!py-4 sm:!pr-4 sm:!pl-12 !shadow-none";

function PreviewLoading() {
  const tCommon = useTranslations("common");
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-foreground/70">
      {tCommon("loadingPreview")}
    </div>
  );
}

const MarkdownHtmlPreview = dynamic(() => import("@/components/MarkdownHtmlPreview"), {
  ssr: false,
  loading: PreviewLoading,
});

type Props = {
  leftMarkdown: string;
  rightMarkdown: string;
  numberedCitations?: boolean;
};

export default function MarkdownDiffPreviewView({ leftMarkdown, rightMarkdown, numberedCitations = false }: Props) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-2 md:divide-x md:divide-gray-200">
      <PreviewPane markdown={leftMarkdown} numberedCitations={numberedCitations} />
      <PreviewPane markdown={rightMarkdown} numberedCitations={numberedCitations} />
    </div>
  );
}

function PreviewPane({
  markdown,
  numberedCitations,
}: {
  markdown: string;
  numberedCitations: boolean;
}) {
  const paneRef = useRef<HTMLDivElement | null>(null);
  const headings = useMemo(() => extractMarkdownHeadings(markdown), [markdown]);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  const handleSelectHeading = useCallback(
    (id: string) => {
      setActiveHeadingId(id);
      const root = paneRef.current;
      if (!root) return;
      const heading = root.querySelector(`#${CSS.escape(id)}`);
      if (!(heading instanceof HTMLElement)) return;
      const nextTop = root.scrollTop + heading.getBoundingClientRect().top - root.getBoundingClientRect().top;
      root.scrollTo({ top: Math.max(nextTop, 0) });
    },
    [paneRef],
  );

  useEffect(() => {
    const root = paneRef.current;
    if (!root) return;
    const updateActive = () => {
      const next = headingNearTop(root);
      if (next) setActiveHeadingId(next);
    };
    root.addEventListener("scroll", updateActive, { passive: true });
    updateActive();
    return () => root.removeEventListener("scroll", updateActive);
  }, [markdown, paneRef]);

  return (
    <div className="flex h-full min-h-0 min-w-0">
      <MarkdownOutline
        compact
        headings={headings}
        activeId={activeHeadingId}
        open={outlineOpen}
        onOpenChange={setOutlineOpen}
        onSelect={handleSelectHeading}
      />
      <div ref={paneRef} className="min-h-0 min-w-0 flex-1 overflow-auto">
        <MarkdownHtmlPreview markdown={markdown} className={PREVIEW_CLASS} numberedCitations={numberedCitations} sourceLines />
      </div>
    </div>
  );
}

function headingNearTop(root: HTMLElement): string | null {
  const headings = root.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]");
  const top = root.getBoundingClientRect().top;
  let current: string | null = null;
  headings.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.getBoundingClientRect().top - top <= 28) current = node.id;
  });
  if (current) return current;
  const first = headings[0];
  return first instanceof HTMLElement ? first.id : null;
}
