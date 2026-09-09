"use client";

import { useMemo, useState } from "react";
import JsonCopyButton from "@/components/JsonCopyButton";
import JsonDeleteButton from "@/components/JsonDeleteButton";
import type { JsonPath } from "@/lib/json-preview";

function typeLabel(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function previewText(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === "object") return `Object(${Object.keys(value as object).length})`;
  return String(value);
}

function isExpandable(value: unknown): boolean {
  return value !== null && typeof value === "object" && (Array.isArray(value) ? value.length > 0 : Object.keys(value as object).length > 0);
}

function JsonTreeNode({
  name,
  value,
  depth,
  expandDepth,
  path,
  onDelete,
}: {
  name?: string | number;
  value: unknown;
  depth: number;
  expandDepth: number;
  path: JsonPath;
  onDelete?: (path: JsonPath) => void;
}) {
  const expandable = isExpandable(value);
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = expandable && (userOpen ?? depth < expandDepth);
  const canDelete = Boolean(onDelete) && path.length > 0;

  const children = useMemo(() => {
    if (!expandable) return [];
    if (Array.isArray(value)) {
      return value.map((item, index) => ({ key: index, value: item }));
    }
    return Object.entries(value as Record<string, unknown>).map(([key, nested]) => ({
      key,
      value: nested,
    }));
  }, [expandable, value]);

  return (
    <div className={depth === 0 ? "" : "ml-3 border-l border-gray-200 pl-3"}>
      <div className="group flex items-start gap-1 rounded-md px-1 py-0.5 hover:bg-gray-50">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-2 text-left font-mono text-[13px]"
          onClick={() => expandable && setUserOpen(!(userOpen ?? depth < expandDepth))}
          disabled={!expandable}
        >
          <span className={`mt-0.5 inline-block w-3 shrink-0 text-gray-400 ${expandable ? "" : "opacity-0"}`} aria-hidden="true">
            {open ? "▾" : "▸"}
          </span>
          {name !== undefined && (
            <span className="shrink-0 text-blue-800">
              {typeof name === "number" ? name : JSON.stringify(name)}
              <span className="text-gray-400">:</span>
            </span>
          )}
          {expandable ? (
            open ? (
              <span className="text-gray-400">
                {Array.isArray(value) ? "[" : "{"} {typeLabel(value)}
              </span>
            ) : (
              <span className="min-w-0 break-all text-gray-600">{previewText(value)}</span>
            )
          ) : (
            <span className="min-w-0 break-all">
              <JsonLeaf value={value} />
            </span>
          )}
        </button>
        {typeof value === "string" && (
          <JsonCopyButton
            value={value}
            ariaLabel={typeof name === "number" ? `Copy item ${name}` : name !== undefined ? `Copy ${String(name)}` : "Copy value"}
          />
        )}
        {canDelete && onDelete && (
          <JsonDeleteButton
            ariaLabel={typeof name === "number" ? `Delete item ${name}` : `Delete ${String(name)}`}
            onDelete={() => onDelete(path)}
          />
        )}
      </div>
      {open && (
        <div className="pb-1">
          {children.map((child) => (
            <JsonTreeNode
              key={String(child.key)}
              name={child.key}
              value={child.value}
              depth={depth + 1}
              expandDepth={expandDepth}
              path={[...path, child.key]}
              onDelete={onDelete}
            />
          ))}
          <div className="pl-6 font-mono text-[13px] text-gray-400">{Array.isArray(value) ? "]" : "}"}</div>
        </div>
      )}
    </div>
  );
}

function JsonLeaf({ value }: { value: unknown }) {
  if (value === null) return <span className="text-violet-700">null</span>;
  if (typeof value === "boolean") return <span className="text-violet-700">{String(value)}</span>;
  if (typeof value === "number") return <span className="text-amber-700">{String(value)}</span>;
  if (typeof value === "string") return <span className="text-emerald-700">{JSON.stringify(value)}</span>;
  return <span className="text-gray-500">{String(value)}</span>;
}

export default function JsonTreeView({
  value,
  expandDepth,
  onDelete,
}: {
  value: unknown;
  expandDepth: number;
  onDelete?: (path: JsonPath) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
      <JsonTreeNode value={value} depth={0} expandDepth={expandDepth} path={[]} onDelete={onDelete} />
    </div>
  );
}
