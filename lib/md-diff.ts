import { parseMarkdownDocument } from "@/lib/markdown-to-html";

export type DiffKind = "same" | "del" | "add" | "gap";

export type DiffRow = {
  leftNumber: number | null;
  rightNumber: number | null;
  leftText: string;
  rightText: string;
  leftKind: DiffKind;
  rightKind: DiffKind;
};

type DiffOp = { type: "eq" | "del" | "ins"; value: string };

export function countLines(text: string): number {
  if (!text) return 1;
  let count = 1;
  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) === 10) count += 1;
  }
  return count;
}

export function listMarkdownCitations(markdown: string) {
  return parseMarkdownDocument(markdown, { numberedCitations: true }).citations;
}

export function countMarkdownCitations(markdown: string): number {
  return listMarkdownCitations(markdown).length;
}

export function diffMarkdownLines(left: string, right: string): DiffRow[] {
  return pairOps(myersDiff(splitLines(left), splitLines(right)));
}

function splitLines(text: string): string[] {
  return text.split("\n");
}

function myersDiff(a: string[], b: string[]): DiffOp[] {
  const n = a.length;
  const m = b.length;
  if (n === 0 && m === 0) return [{ type: "eq", value: "" }];
  const max = n + m;
  const v = new Map<number, number>([[1, 0]]);
  const trace: Map<number, number>[] = [];

  for (let d = 0; d <= max; d += 1) {
    trace.push(new Map(v));
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && (v.get(k - 1) ?? 0) < (v.get(k + 1) ?? 0))) {
        x = v.get(k + 1) ?? 0;
      } else {
        x = (v.get(k - 1) ?? 0) + 1;
      }
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x += 1;
        y += 1;
      }
      v.set(k, x);
      if (x >= n && y >= m) {
        return backtrack(a, b, trace, d);
      }
    }
  }
  return [];
}

function backtrack(a: string[], b: string[], trace: Map<number, number>[], dEnd: number): DiffOp[] {
  const ops: DiffOp[] = [];
  let x = a.length;
  let y = b.length;

  for (let d = dEnd; d >= 0; d -= 1) {
    const v = trace[d];
    const k = x - y;
    let prevK: number;
    if (k === -d || (k !== d && (v.get(k - 1) ?? 0) < (v.get(k + 1) ?? 0))) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }
    const prevX = v.get(prevK) ?? 0;
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      x -= 1;
      y -= 1;
      ops.push({ type: "eq", value: a[x] });
    }

    if (d === 0) break;

    if (x === prevX) {
      y -= 1;
      ops.push({ type: "ins", value: b[y] });
    } else {
      x -= 1;
      ops.push({ type: "del", value: a[x] });
    }
  }

  ops.reverse();
  return ops;
}

function pairOps(ops: DiffOp[]): DiffRow[] {
  const rows: DiffRow[] = [];
  let leftNo = 1;
  let rightNo = 1;
  let index = 0;

  while (index < ops.length) {
    const op = ops[index];
    if (op.type === "eq") {
      rows.push({
        leftNumber: leftNo,
        rightNumber: rightNo,
        leftText: op.value,
        rightText: op.value,
        leftKind: "same",
        rightKind: "same",
      });
      leftNo += 1;
      rightNo += 1;
      index += 1;
      continue;
    }

    const removed: string[] = [];
    const added: string[] = [];
    while (index < ops.length && ops[index].type === "del") {
      removed.push(ops[index].value);
      index += 1;
    }
    while (index < ops.length && ops[index].type === "ins") {
      added.push(ops[index].value);
      index += 1;
    }

    const count = Math.max(removed.length, added.length);
    for (let row = 0; row < count; row += 1) {
      const leftText = removed[row];
      const rightText = added[row];
      rows.push({
        leftNumber: leftText === undefined ? null : leftNo++,
        rightNumber: rightText === undefined ? null : rightNo++,
        leftText: leftText ?? "",
        rightText: rightText ?? "",
        leftKind: leftText === undefined ? "gap" : "del",
        rightKind: rightText === undefined ? "gap" : "add",
      });
    }
  }

  return rows;
}
