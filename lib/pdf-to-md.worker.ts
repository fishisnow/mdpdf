import { convertPdfToMarkdown, type ConversionProgress } from "@/lib/pdf-to-md";

type WorkerRequest = {
  type: "convert";
  data: ArrayBuffer;
};

type WorkerResponse =
  | { type: "progress"; progress: ConversionProgress }
  | { type: "success"; markdown: string }
  | {
      type: "error";
      error: string;
      details?: string;
    };

function serializeWorkerError(error: unknown): Extract<WorkerResponse, { type: "error" }> {
  if (error instanceof Error) {
    const parts = [error.name, error.message, error.stack].filter(Boolean);
    return {
      type: "error",
      error: error.message || error.name || "Conversion failed",
      details: parts.join("\n\n"),
    };
  }

  const details = typeof error === "string" ? error : String(error);
  return {
    type: "error",
    error: details || "Conversion failed",
    details,
  };
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type !== "convert") {
    return;
  }

  try {
    const bytes = new Uint8Array(event.data.data);
    const markdown = await convertPdfToMarkdown(bytes, (progress) => {
      self.postMessage({ type: "progress", progress } satisfies WorkerResponse);
    });

    self.postMessage({ type: "success", markdown } satisfies WorkerResponse);
  } catch (error) {
    const serialized = serializeWorkerError(error);
    console.error("[pdf-worker] conversion failed", serialized);
    self.postMessage(serialized satisfies WorkerResponse);
  }
};

export {};
