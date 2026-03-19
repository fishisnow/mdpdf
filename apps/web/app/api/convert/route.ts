import { NextRequest } from "next/server";
import { convertPdfToMarkdown } from "@/lib/pdf-to-md";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return new Response("File must be a PDF", { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const markdown = await convertPdfToMarkdown(buffer);

    return new Response(markdown, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("Conversion error:", err);
    return new Response("Conversion failed", { status: 500 });
  }
}
