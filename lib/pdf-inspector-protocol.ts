import type { PdfProcessResult } from "@firecrawl/pdf-inspector-wasm";

export type InspectorWorkerStage = "loading" | "initializing" | "parsing" | "rendering";

export interface InspectorWorkerProgress {
  stage: InspectorWorkerStage;
}

export type InspectorWorkerRequest =
  | { type: "init" }
  | { type: "convert"; id: number; data: ArrayBuffer };

export type InspectorWorkerResponse =
  | { type: "ready"; engineVersion: string }
  | { type: "progress"; id: number; progress: InspectorWorkerProgress }
  | { type: "success"; id: number; result: PdfProcessResult; engineVersion: string }
  | { type: "error"; id?: number; error: string; details?: string };
