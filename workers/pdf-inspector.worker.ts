/// <reference lib="webworker" />

import init, { processPdf, version } from "@firecrawl/pdf-inspector-wasm";
import type { InspectorWorkerRequest, InspectorWorkerResponse } from "@/lib/pdf-inspector-protocol";

const WASM_PATH = "/pdf_inspector_wasm_bg.wasm";

let engineReady: Promise<string> | null = null;

function wasmUrl(): string {
  return new URL(WASM_PATH, self.location.origin).toString();
}

async function ensureEngine(): Promise<string> {
  if (!engineReady) {
    engineReady = (async () => {
      const response = await fetch(wasmUrl(), { cache: "force-cache" });
      if (!response.ok) {
        throw new Error(`Failed to load pdf-inspector WASM (${response.status})`);
      }

      const bytes = await response.arrayBuffer();
      await init({ module_or_path: bytes });
      return version();
    })().catch((error: unknown) => {
      engineReady = null;
      throw error;
    });
  }

  return engineReady;
}

function serializeError(error: unknown, id?: number): Extract<InspectorWorkerResponse, { type: "error" }> {
  if (error instanceof Error) {
    const parts = [error.name, error.message, error.stack].filter(Boolean);
    return {
      type: "error",
      id,
      error: error.message || error.name || "Conversion failed",
      details: parts.join("\n\n"),
    };
  }

  const details = typeof error === "string" ? error : String(error);
  return {
    type: "error",
    id,
    error: details || "Conversion failed",
    details,
  };
}

function post(message: InspectorWorkerResponse): void {
  self.postMessage(message);
}

self.onmessage = async (event: MessageEvent<InspectorWorkerRequest>) => {
  const message = event.data;

  if (message.type === "init") {
    try {
      const engineVersion = await ensureEngine();
      post({ type: "ready", engineVersion });
    } catch (error) {
      post(serializeError(error));
    }
    return;
  }

  if (message.type !== "convert") {
    return;
  }

  try {
    post({ type: "progress", id: message.id, progress: { stage: "initializing" } });
    const engineVersion = await ensureEngine();
    post({ type: "progress", id: message.id, progress: { stage: "parsing" } });

    const result = processPdf(new Uint8Array(message.data), {
      includePageMarkers: true,
      profile: "fidelity",
    });

    post({ type: "success", id: message.id, result, engineVersion });
  } catch (error) {
    console.error("[pdf-inspector-worker] conversion failed", error);
    post(serializeError(error, message.id));
  }
};

export {};
