"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export default function UploadZone({ onUpload, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const t = useTranslations("upload");

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== "application/pdf") {
        alert(t("invalidType"));
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(t("tooLarge"));
        return;
      }

      onUpload(file);
    },
    [onUpload, t],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <label
      className={cn(
        "flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-base border-2 border-dashed border-border bg-secondary-background transition-all",
        dragging && "bg-main shadow-shadow",
        !dragging && "hover:bg-background",
        disabled && "cursor-not-allowed opacity-50",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <Upload className="mb-3 size-10" />
      <p className="text-sm">
        <span className="font-heading">{t("click")}</span> {t("orDrop")}
      </p>
      <p className="mt-1 text-xs text-foreground/60">{t("hint")}</p>
      <input
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        disabled={disabled}
      />
    </label>
  );
}
