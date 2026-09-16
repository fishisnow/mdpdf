export type JsonParseSuccess = { ok: true; value: unknown };
export type JsonParseFailure = {
  ok: false;
  message: string;
  position?: number;
  line?: number;
  column?: number;
};
export type JsonParseResult = JsonParseSuccess | JsonParseFailure;
export type JsonPath = Array<string | number>;

const NODE_CAP = 2000;
const HIGHLIGHT_CHAR_CAP = 150_000;

export function parseJsonInput(text: string): JsonParseResult {
  if (!text.trim()) {
    return { ok: false, message: "Paste JSON on the left to preview." };
  }

  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Invalid JSON.";
    const positionMatch = raw.match(/position\s+(\d+)/i);
    const position = positionMatch ? Number(positionMatch[1]) : undefined;
    if (position === undefined || Number.isNaN(position)) {
      return { ok: false, message: raw };
    }
    const { line, column } = locationFromPosition(text, position);
    return {
      ok: false,
      message: `Invalid JSON at line ${line}, column ${column}. ${raw}`,
      position,
      line,
      column,
    };
  }
}

export function formatJson(value: unknown, space = 2): string {
  return JSON.stringify(value, null, space);
}

export function minifyJson(value: unknown): string {
  return JSON.stringify(value);
}

/** Unwrap a JSON-encoded / backslash-escaped JSON string. Returns null if nothing to unescape. */
export function unescapeJsonText(text: string): string | null {
  const original = text.trim();
  if (!original) return null;

  let current = original;
  let changed = false;

  for (let step = 0; step < 8; step += 1) {
    try {
      const parsed = JSON.parse(current) as unknown;
      if (typeof parsed === "string") {
        current = parsed;
        changed = true;
        continue;
      }
      return changed ? prettyUnescapedJson(parsed) : null;
    } catch {
      const decoded = decodeEscapedJsonText(current);
      if (decoded === null || decoded === current) break;
      current = decoded;
      changed = true;
    }
  }

  if (!changed) return null;
  try {
    return prettyUnescapedJson(JSON.parse(current) as unknown);
  } catch {
    return current;
  }
}

function decodeEscapedJsonText(text: string): string | null {
  try {
    const decoded = JSON.parse(`"${text}"`) as unknown;
    return typeof decoded === "string" ? decoded : null;
  } catch {
    return null;
  }
}

function prettyUnescapedJson(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  return JSON.stringify(value, null, 2);
}

export function stringifyJsonLikeSource(value: unknown, source: string): string {
  return source.includes("\n") ? formatJson(value) : minifyJson(value);
}

export function deleteJsonPath(root: unknown, path: JsonPath): unknown {
  if (path.length === 0) return root;
  const clone: unknown = JSON.parse(JSON.stringify(root));
  let parent: unknown = clone;

  for (let index = 0; index < path.length - 1; index += 1) {
    parent = readJsonChild(parent, path[index]);
    if (parent === undefined) return clone;
  }

  const last = path[path.length - 1];
  if (Array.isArray(parent) && typeof last === "number" && last >= 0 && last < parent.length) {
    parent.splice(last, 1);
    return clone;
  }
  if (isPlainObject(parent) && typeof last === "string" && Object.prototype.hasOwnProperty.call(parent, last)) {
    delete parent[last];
  }
  return clone;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readJsonChild(parent: unknown, key: string | number): unknown {
  if (Array.isArray(parent) && typeof key === "number") return parent[key];
  if (isPlainObject(parent) && typeof key === "string") return parent[key];
  return undefined;
}

export function countJsonNodes(value: unknown, cap = NODE_CAP): number {
  let count = 1;
  if (Array.isArray(value)) {
    for (const item of value) {
      count += countJsonNodes(item, cap);
      if (count > cap) return count;
    }
    return count;
  }
  if (value !== null && typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      count += countJsonNodes(nested, cap);
      if (count > cap) return count;
    }
  }
  return count;
}

export function canRenderJsonTree(value: unknown): boolean {
  return countJsonNodes(value) <= NODE_CAP;
}

export function canHighlightJson(formatted: string): boolean {
  return formatted.length <= HIGHLIGHT_CHAR_CAP;
}

function locationFromPosition(text: string, position: number): { line: number; column: number } {
  const safe = Math.max(0, Math.min(position, text.length));
  const slice = text.slice(0, safe);
  const lines = slice.split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}
