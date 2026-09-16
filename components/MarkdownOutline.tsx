"use client";

import { useTranslations } from "next-intl";
import type { MarkdownHeading } from "@/lib/markdown-headings";

type Props = {
  headings: MarkdownHeading[];
  activeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
};

export default function MarkdownOutline({ headings, activeId, open, onOpenChange, onSelect }: Props) {
  const t = useTranslations("mdViewer");
  const tCommon = useTranslations("common");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        aria-expanded={false}
        aria-label={tCommon("expand") + " " + t("contents")}
        className="flex h-full w-9 shrink-0 flex-col items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-3 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <ChevronIcon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-medium tracking-wide [writing-mode:vertical-rl]">{t("contents")}</span>
      </button>
    );
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{t("contents")}</span>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-expanded={true}
          aria-label={tCommon("collapse") + " " + t("contents")}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
        >
          <ChevronIcon className="h-3.5 w-3.5 rotate-180" />
        </button>
      </div>
      <nav className="min-h-0 flex-1 overflow-auto py-1.5" aria-label={t("contents")}>
        {headings.length === 0 ? (
          <p className="px-3 py-2 text-xs text-gray-400">{t("noHeadings")}</p>
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
                  "block w-full truncate rounded-none py-1.5 pr-3 text-left text-sm transition-colors " +
                  (active ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900")
                }
                style={{ paddingLeft: `${0.5 + (heading.level - 1) * 0.7}rem` }}
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
