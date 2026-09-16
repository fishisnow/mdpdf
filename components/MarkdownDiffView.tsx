"use client";

import { useCallback, useRef, type RefObject } from "react";
import type { DiffKind, DiffRow } from "@/lib/md-diff";

const kindClass: Record<DiffKind, string> = {
  same: "bg-secondary-background text-foreground",
  del: "bg-red-50 text-red-900",
  add: "bg-emerald-50 text-emerald-900",
  gap: "bg-background text-foreground/30",
};

type Props = {
  rows: DiffRow[];
};

export default function MarkdownDiffView({ rows }: Props) {
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const syncing = useRef(false);

  const sync = useCallback((source: "left" | "right") => {
    if (syncing.current) return;
    const from = source === "left" ? leftRef.current : rightRef.current;
    const to = source === "left" ? rightRef.current : leftRef.current;
    if (!from || !to) return;
    syncing.current = true;
    to.scrollTop = from.scrollTop;
    to.scrollLeft = from.scrollLeft;
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  }, []);

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-2 md:divide-x md:divide-gray-200">
      <DiffPane rows={rows} side="left" paneRef={leftRef} onScroll={() => sync("left")} />
      <DiffPane rows={rows} side="right" paneRef={rightRef} onScroll={() => sync("right")} />
    </div>
  );
}

function DiffPane({
  rows,
  side,
  paneRef,
  onScroll,
}: {
  rows: DiffRow[];
  side: "left" | "right";
  paneRef: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
}) {
  return (
    <div ref={paneRef} onScroll={onScroll} className="h-full min-h-0 min-w-0 overflow-auto font-mono text-[13px] leading-6">
      {rows.map((row, index) => {
        const number = side === "left" ? row.leftNumber : row.rightNumber;
        const text = side === "left" ? row.leftText : row.rightText;
        const kind = side === "left" ? row.leftKind : row.rightKind;
        return (
          <div key={`${side}-${index}`} className={`flex min-h-6 ${kindClass[kind]}`}>
            <span className="w-10 shrink-0 select-none border-r border-border/80 px-1.5 text-right text-[11px] text-foreground/50">
              {number ?? ""}
            </span>
            <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap break-all px-2 py-0.5">{text || " "}</pre>
          </div>
        );
      })}
    </div>
  );
}
