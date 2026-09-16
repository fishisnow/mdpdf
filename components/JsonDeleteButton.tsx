"use client";

export default function JsonDeleteButton({
  ariaLabel,
  onDelete,
}: {
  ariaLabel: string;
  onDelete: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDelete();
      }}
      className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium leading-none text-foreground/50 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:bg-red-50 focus-visible:text-red-600 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
    >
      Delete
    </button>
  );
}
