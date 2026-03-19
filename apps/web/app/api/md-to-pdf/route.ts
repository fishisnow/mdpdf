export const runtime = "edge";

export async function POST() {
  return new Response(
    "md-to-pdf conversion now runs in the browser. Please use the /md-to-pdf page UI.",
    {
      status: 410,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}