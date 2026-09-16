"use client";

import { useTranslations } from "next-intl";

export type ResultViewMode = "split" | "preview";

interface Props {
  value: ResultViewMode;
  onChange: (mode: ResultViewMode) => void;
}

export default function ViewModeToggle({ value, onChange }: Props) {
  const t = useTranslations("viewMode");
  const options: { id: ResultViewMode; label: string }[] = [
    { id: "split", label: t("split") },
    { id: "preview", label: t("preview") },
  ];

  return (
    <div
      className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5"
      role="group"
      aria-label={t("label")}
    >
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
              (active
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900")
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
