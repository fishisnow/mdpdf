import { NextRequest } from "next/server";
import { convertMarkdownToPdf } from "@/lib/md-to-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MARKDOWN_LENGTH = 1_000_000;
const SAFE_FILENAME_REGEX = /[^a-zA-Z0-9._-]/g;

function sanitizeFilename(input: string): string {
  const withoutExtension = input.replace(/\.md$/i, "").trim();
  const safeName = withoutExtension.replace(SAFE_FILENAME_REGEX, "_");
  return safeName || "document";
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      return new Response("Invalid request body", { status: 400 });
    }

    const { markdown, filename } = body as { markdown?: unknown; filename?: unknown };
    if (typeof markdown !== "string" || !markdown.trim()) {
      return new Response("No markdown provided", { status: 400 });
    }

    if (markdown.length > MAX_MARKDOWN_LENGTH) {
      return new Response("Markdown content is too large", { status: 413 });
    }

    const pdfBuffer = await convertMarkdownToPdf(markdown);
    const outputFilename = sanitizeFilename(
      typeof filename === "string" ? filename : "document",
    );

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${outputFilename}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Conversion error:", err);
    return new Response("Conversion failed", { status: 500 });
  }
}