import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 10;

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

    return new Response(
      "PDF to Markdown conversion now runs in the browser by default. Please use the web UI to convert this file locally.",
      {
        status: 410,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  } catch (error) {
    console.error("Compatibility convert route error:", error);
    return new Response("This compatibility endpoint is no longer available.", { status: 500 });
  }
}
