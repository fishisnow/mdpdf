import type { LayoutComplexity, PdfProcessResult, PdfType } from "@firecrawl/pdf-inspector-wasm";
import type {
  InspectorWorkerProgress,
  InspectorWorkerRequest,
  InspectorWorkerResponse,
} from "@/lib/pdf-inspector-protocol";

export type InspectorConversionStage = InspectorWorkerProgress["stage"] | "loading";

export interface InspectorConversionProgress {
  stage: InspectorConversionStage;
}

export interface InspectorConversionResult {
  markdown: string;
  pdfType: PdfType;
  pageCount: number;
  processingTimeMs: number;
  elapsedMs: number;
  confidence: number;
  pagesNeedingOcr: number[];
  ocrReasonsByPage: PdfProcessResult["ocrReasonsByPage"];
  title?: string;
  layout: LayoutComplexity;
  hasEncodingIssues: boolean;
  engineVersion: string;
}

let worker: Worker | null = null;
let nextRequestId = 1;
let preloadPromise: Promise<void> | null = null;

function isWorkerMessage(value: unknown): value is InspectorWorkerResponse {
  return typeof value === "object" && value !== null && "type" in value;
}

function createWorker(): Worker {
  return new Worker(new URL("../workers/pdf-inspector.worker.ts", import.meta.url));
}

function getWorker(): Worker {
  if (typeof window === "undefined") {
    throw new Error("pdf-inspector runs in the browser.");
  }

  if (!worker) {
    worker = createWorker();
  }

  return worker;
}

function resetWorker(): void {
  worker?.terminate();
  worker = null;
  preloadPromise = null;
}

export function preloadPdfInspectorEngine(): Promise<void> {
  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = new Promise<void>((resolve, reject) => {
    const activeWorker = getWorker();

    const cleanup = () => {
      activeWorker.removeEventListener("message", onMessage);
      activeWorker.removeEventListener("error", onError);
    };

    const onMessage = (event: MessageEvent<InspectorWorkerResponse>) => {
      const message = event.data;
      if (!isWorkerMessage(message)) {
        return;
      }

      if (message.type === "ready") {
        cleanup();
        resolve();
      }

      if (message.type === "error" && message.id === undefined) {
        cleanup();
        resetWorker();
        reject(new Error(message.error));
      }
    };

    const onError = (event: ErrorEvent) => {
      cleanup();
      resetWorker();
      reject(new Error(event.message || "Failed to initialize pdf-inspector"));
    };

    activeWorker.addEventListener("message", onMessage);
    activeWorker.addEventListener("error", onError);
    activeWorker.postMessage({ type: "init" } satisfies InspectorWorkerRequest);
  }).catch((error: unknown) => {
    preloadPromise = null;
    throw error;
  });

  return preloadPromise;
}

function emptyMarkdownError(result: PdfProcessResult): Error {
  if (result.pdfType === "Scanned" || result.pdfType === "ImageBased") {
    return new Error(
      `No selectable text was found in this PDF. It is classified as ${result.pdfType} and may require OCR.`,
    );
  }

  return new Error("No selectable text was found in this PDF. It may be scanned, image-based, or empty.");
}

export async function convertPdfToMarkdownWithInspector(
  data: Uint8Array,
  onProgress?: (progress: InspectorConversionProgress) => void,
): Promise<InspectorConversionResult> {
  if (data.byteLength === 0) {
    throw new Error("The uploaded PDF is empty.");
  }

  onProgress?.({ stage: "loading" });

  const startedAt = performance.now();
  const activeWorker = getWorker();
  const requestId = nextRequestId++;
  const copy = Uint8Array.from(data);
  const buffer = copy.buffer;

  return new Promise<InspectorConversionResult>((resolve, reject) => {
    const cleanup = () => {
      activeWorker.removeEventListener("message", onMessage);
      activeWorker.removeEventListener("error", onError);
    };

    const fail = (error: Error) => {
      cleanup();
      reject(error);
    };

    const onMessage = (event: MessageEvent<InspectorWorkerResponse>) => {
      const message = event.data;
      if (!isWorkerMessage(message)) {
        return;
      }

      if (message.type === "progress" && message.id === requestId) {
        onProgress?.(message.progress);
        return;
      }

      if (message.type === "success" && message.id === requestId) {
        cleanup();

        const markdown = message.result.markdown?.trim() ?? "";
        if (!markdown) {
          fail(emptyMarkdownError(message.result));
          return;
        }

        resolve({
          markdown: message.result.markdown ?? markdown,
          pdfType: message.result.pdfType,
          pageCount: message.result.pageCount,
          processingTimeMs: message.result.processingTimeMs,
          elapsedMs: Math.max(0, Math.round(performance.now() - startedAt)),
          confidence: message.result.confidence,
          pagesNeedingOcr: message.result.pagesNeedingOcr,
          ocrReasonsByPage: message.result.ocrReasonsByPage,
          title: message.result.title,
          layout: message.result.layout,
          hasEncodingIssues: message.result.hasEncodingIssues,
          engineVersion: message.engineVersion,
        });
        return;
      }

      if (message.type === "error" && (message.id === requestId || message.id === undefined)) {
        fail(new Error(message.error));
      }
    };

    const onError = (event: ErrorEvent) => {
      resetWorker();
      fail(new Error(event.message || "The pdf-inspector worker crashed."));
    };

    activeWorker.addEventListener("message", onMessage);
    activeWorker.addEventListener("error", onError);
    onProgress?.({ stage: "initializing" });
    activeWorker.postMessage({ type: "convert", id: requestId, data: buffer } satisfies InspectorWorkerRequest, [
      buffer,
    ]);
  });
}
