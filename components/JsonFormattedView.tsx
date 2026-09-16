"use client";

import { memo } from "react";
import JsonCopyButton from "@/components/JsonCopyButton";
import JsonDeleteButton from "@/components/JsonDeleteButton";
import type { JsonPath } from "@/lib/json-preview";

function quote(value: string): string {
  return JSON.stringify(value);
}

function JsonPrimitive({ value }: { value: unknown }) {
  if (value === null) {
    return <span className="text-violet-700">null</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-violet-700">{String(value)}</span>;
  }
  if (typeof value === "number") {
    return <span className="text-amber-700">{Number.isFinite(value) ? String(value) : "null"}</span>;
  }
  if (typeof value === "string") {
    return <span className="text-emerald-700">{quote(value)}</span>;
  }
  return <span className="text-foreground/60">null</span>;
}

function JsonNode({
  value,
  indent,
  path,
  onDelete,
}: {
  value: unknown;
  indent: number;
  path: JsonPath;
  onDelete?: (path: JsonPath) => void;
}) {
  const pad = " ".repeat(indent);
  const next = indent + 2;

  if (value === null || typeof value !== "object") {
    return <JsonPrimitive value={value} />;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return (
      <>
        {"[\n"}
        {value.map((item, index) => (
          <div key={index} className="group flex items-start gap-1">
            {onDelete ? (
              <JsonDeleteButton ariaLabel={`Delete item ${index}`} onDelete={() => onDelete([...path, index])} />
            ) : null}
            <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
              {pad}
              {"  "}
              <JsonNode value={item} indent={next} path={[...path, index]} onDelete={onDelete} />
              {index < value.length - 1 ? "," : ""}
              {"\n"}
            </span>
            {typeof item === "string" ? (
              <JsonCopyButton value={item} ariaLabel={`Copy item ${index}`} />
            ) : null}
          </div>
        ))}
        {pad}
        {"]"}
      </>
    );
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return "{}";

  return (
    <>
      {"{\n"}
      {entries.map(([key, nested], index) => (
        <div key={key} className="group flex items-start gap-1">
          {onDelete ? (
            <JsonDeleteButton ariaLabel={`Delete ${key}`} onDelete={() => onDelete([...path, key])} />
          ) : null}
          <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
            {pad}
            {"  "}
            <span className="text-blue-800">{quote(key)}</span>
            {": "}
            <JsonNode value={nested} indent={next} path={[...path, key]} onDelete={onDelete} />
            {index < entries.length - 1 ? "," : ""}
            {"\n"}
          </span>
          {typeof nested === "string" ? (
            <JsonCopyButton value={nested} ariaLabel={`Copy ${key}`} />
          ) : null}
        </div>
      ))}
      {pad}
      {"}"}
    </>
  );
}

function JsonFormattedView({
  value,
  onDelete,
}: {
  value: unknown;
  formatted?: string;
  onDelete?: (path: JsonPath) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-secondary-background p-3 font-mono text-[13px] leading-6 text-foreground sm:p-4">
      <JsonNode value={value} indent={0} path={[]} onDelete={onDelete} />
    </div>
  );
}

export default memo(JsonFormattedView);
