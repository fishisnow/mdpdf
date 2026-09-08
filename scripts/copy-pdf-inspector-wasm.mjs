import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = dirname(require.resolve("@firecrawl/pdf-inspector-wasm/package.json"));
const source = join(packageRoot, "pdf_inspector_wasm_bg.wasm");
const publicDir = join(projectRoot, "public");
const destination = join(publicDir, "pdf_inspector_wasm_bg.wasm");

if (!existsSync(source)) {
  throw new Error(`Missing pdf-inspector WASM at ${source}`);
}

mkdirSync(publicDir, { recursive: true });
copyFileSync(source, destination);
console.log(`Copied pdf-inspector WASM to ${destination}`);
