"use client";

import { useEffect, useRef, useState } from "react";

export default function JsonCopyButton({
  value,
  ariaLabel,
}: {
  value: string;
  ariaLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
          timeoutRef.current = window.setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="shrink-0 rounded-base border-2 border-transparent px-1.5 py-0.5 text-[11px] font-heading leading-none text-foreground/50 transition-colors hover:border-border hover:bg-main hover:text-main-foreground md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
