"use client";

import { useTranslations } from "next-intl";
import type { MarkdownHeading } from "@/lib/markdown-headings";

type Props = {
  headings: MarkdownHeading[];
  activeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  compact?: boolean;
};

export default function MarkdownOutline({ headings, activeId, open, onOpenChange, onSelect, compact = false }: Props) {
  const t = useTranslations("mdViewer");
  const tCommon = useTranslations("common");
  const itemClass = compact
    ? "block w-full truncate rounded-none py-1 pr-2 text-left text-[11px] leading-4 transition-colors "
    : "block w-full truncate rounded-none py-1.5 pr-3 text-left text-sm transition-colors ";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        aria-expanded={false}
        aria-label={tCommon("expand") + " " + t("contents")}
        className={
          compact
            ? "flex h-full w-6 shrink-0 flex-col items-center gap-1.5 border-r border-border bg-background py-2 text-foreground/60 transition-colors hover:bg-gray-100 hover:text-foreground"
            : "flex h-full w-9 shrink-0 flex-col items-center gap-2 rounded-lg border border-border bg-background py-3 text-foreground/70 transition-colors hover:bg-gray-100 hover:text-foreground"
        }
      >
        <ChevronIcon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span className={compact ? "text-[10px] font-medium tracking-wide [writing-mode:vertical-rl]" : "text-[11px] font-medium tracking-wide [writing-mode:vertical-rl]"}>
          {t("contents")}
        </span>
      </button>
    );
  }

  return (
    <aside
      className={
        compact
          ? "flex w-32 shrink-0 flex-col overflow-hidden border-r border-border bg-background"
          : "flex w-56 shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-background"
      }
    >
      <div className={"flex shrink-0 items-center justify-between gap-1 border-b border-border " + (compact ? "px-2 py-1.5" : "px-3 py-2")}>
        <span className={"font-medium uppercase tracking-wide text-foreground/60 " + (compact ? "text-[10px]" : "text-xs")}>{t("contents")}</span>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-expanded={true}
          aria-label={tCommon("collapse") + " " + t("contents")}
          className="rounded p-0.5 text-foreground/50 transition-colors hover:bg-gray-200 hover:text-foreground/80"
        >
          <ChevronIcon className={compact ? "h-3 w-3 rotate-180" : "h-3.5 w-3.5 rotate-180"} />
        </button>
      </div>
      <nav className={"min-h-0 flex-1 overflow-auto " + (compact ? "py-1" : "py-1.5")} aria-label={t("contents")}>
        {headings.length === 0 ? (
          <p className={"text-foreground/50 " + (compact ? "px-2 py-1.5 text-[11px]" : "px-3 py-2 text-xs")}>{t("noHeadings")}</p>
        ) : (
          headings.map((heading) => {
            const active = heading.id === activeId;
            return (
              <button
                key={heading.id}
                type="button"
                onClick={() => onSelect(heading.id)}
                aria-current={active ? "true" : undefined}
                className={
                  itemClass + (active ? "bg-main font-heading" : "text-foreground/80 hover:bg-background hover:text-foreground")
                }
                style={{ paddingLeft: `${(compact ? 0.4 : 0.5) + (heading.level - 1) * (compact ? 0.4 : 0.7)}rem` }}
                title={heading.text}
              >
                {heading.text}
              </button>
            );
          })
        )}
      </nav>
    </aside>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}
