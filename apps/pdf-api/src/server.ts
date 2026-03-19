import { createServer } from "node:http";
import { Readable } from "node:stream";
import { convertMarkdownToPdf } from "./md-to-pdf.js";

const DEFAULT_PORT = 8788;

function createJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers,
    },
  });
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/health") {
    return createJsonResponse({ ok: true, service: "pdf-api" });
  }

  if (request.method === "POST" && url.pathname === "/api/md-to-pdf") {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return createJsonResponse({ error: "Invalid JSON body" }, { status: 400 });
    }

    const markdown =
      typeof body === "object" && body !== null && "markdown" in body
        ? (body as { markdown?: unknown }).markdown
        : undefined;

    if (typeof markdown !== "string" || !markdown.trim()) {
      return createJsonResponse({ error: "markdown is required" }, { status: 400 });
    }

    try {
      const pdf = await convertMarkdownToPdf(markdown);
      return new Response(new Uint8Array(pdf), {
        status: 200,
        headers: {
          "content-type": "application/pdf",
          "content-disposition": 'inline; filename="document.pdf"',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to convert markdown";
      return createJsonResponse({ error: message }, { status: 500 });
    }
  }

  return createJsonResponse({ error: "Not found" }, { status: 404 });
}

const port = Number(process.env.PORT ?? DEFAULT_PORT);

const nodeServer = createServer(async (req, res) => {
  const requestUrl = `http://${req.headers.host ?? `localhost:${port}`}${req.url ?? "/"}`;
  const request = new Request(requestUrl, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body:
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : (Readable.toWeb(req) as BodyInit),
  });

  const response = await handleRequest(request);
  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));

  if (!response.body) {
    res.end();
    return;
  }

  const arrayBuffer = await response.arrayBuffer();
  res.end(Buffer.from(arrayBuffer));
});

nodeServer.listen(port, () => {
  console.log(`pdf-api listening on http://localhost:${port}`);
});
