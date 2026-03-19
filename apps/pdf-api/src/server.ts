import { convertMarkdownToPdf } from "./md-to-pdf.js";

export interface Env {
  CORS_ALLOWED_ORIGINS?: string;
}

function parseAllowedOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function createJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers,
    },
  });
}

function getCorsHeaders(request: Request, env: Env): HeadersInit {
  const allowedOrigins = parseAllowedOrigins(env.CORS_ALLOWED_ORIGINS);
  const origin = request.headers.get("origin");
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? "";

  if (!allowOrigin) {
    return {};
  }

  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const corsHeaders = getCorsHeaders(request, env);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method === "GET" && url.pathname === "/health") {
    return createJsonResponse({ ok: true, service: "pdf-api" }, { headers: corsHeaders });
  }

  if (request.method === "POST" && url.pathname === "/api/md-to-pdf") {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return createJsonResponse({ error: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
    }

    const markdown =
      typeof body === "object" && body !== null && "markdown" in body
        ? (body as { markdown?: unknown }).markdown
        : undefined;

    if (typeof markdown !== "string" || !markdown.trim()) {
      return createJsonResponse({ error: "markdown is required" }, { status: 400, headers: corsHeaders });
    }

    try {
      const pdf = await convertMarkdownToPdf(markdown);
      const pdfBytes = pdf.slice();
      return new Response(pdfBytes, {
        status: 200,
        headers: {
          ...corsHeaders,
          "content-type": "application/pdf",
          "content-disposition": 'inline; filename="document.pdf"',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to convert markdown";
      return createJsonResponse({ error: message }, { status: 500, headers: corsHeaders });
    }
  }

  return createJsonResponse({ error: "Not found" }, { status: 404, headers: corsHeaders });
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};
