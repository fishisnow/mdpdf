import DOMPurify from "dompurify";

let hooksAdded = false;

function ensureLinkHooks() {
  if (hooksAdded) return;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      const href = node.getAttribute("href");
      if (href?.startsWith("http")) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    }
  });
  hooksAdded = true;
}

export function sanitizeMarkdownHtml(html: string): string {
  ensureLinkHooks();
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
