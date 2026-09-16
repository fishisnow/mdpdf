"use client";

import { useTranslations } from "next-intl";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type ResultViewMode = "split" | "preview";

interface Props {
  value: ResultViewMode;
  onChange: (mode: ResultViewMode) => void;
}

export default function ViewModeToggle({ value, onChange }: Props) {
  const t = useTranslations("viewMode");

  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        const mode = next[0];
        if (mode === "split" || mode === "preview") onChange(mode);
      }}
      spacing={0}
      size="sm"
      aria-label={t("label")}
    >
      <ToggleGroupItem value="split">{t("split")}</ToggleGroupItem>
      <ToggleGroupItem value="preview">{t("preview")}</ToggleGroupItem>
    </ToggleGroup>
  );
}
