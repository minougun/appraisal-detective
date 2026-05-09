import { readFileSync } from "node:fs";
import { assetCacheControl, headerEntries, htmlCacheControl } from "./security-headers.mjs";

const root = new URL("..", import.meta.url);
const headersText = readFileSync(new URL("_headers", root), "utf8");
const netlifyText = readFileSync(new URL("netlify.toml", root), "utf8");
const vercel = JSON.parse(readFileSync(new URL("vercel.json", root), "utf8"));
const indexText = readFileSync(new URL("index.html", root), "utf8");

for (const [name, value] of headerEntries()) {
  assert(headersText.includes(`${name}: ${value}`), `_headers should include ${name}`);
  assert(netlifyText.includes(`${name} = ${JSON.stringify(value)}`), `netlify.toml should include ${name}`);
  assert(vercelHeaders("/(.*)").get(name) === value, `vercel.json should include ${name}`);
}

assert(headersText.includes(`Cache-Control: ${htmlCacheControl}`), "_headers should mark HTML as no-cache");
assert(headersText.includes(`Cache-Control: ${assetCacheControl}`), "_headers should short-cache assets");
assert(netlifyText.includes(`Cache-Control = ${JSON.stringify(htmlCacheControl)}`), "netlify.toml should mark HTML as no-cache");
assert(netlifyText.includes(`Cache-Control = ${JSON.stringify(assetCacheControl)}`), "netlify.toml should short-cache assets");
assert(vercelHeaders("/(.*)").get("Cache-Control") === htmlCacheControl, "vercel.json should mark HTML as no-cache");
assert(vercelHeaders("/assets/(.*)").get("Cache-Control") === assetCacheControl, "vercel.json should short-cache assets");

const metaCsp = indexText.match(/http-equiv="Content-Security-Policy"[\s\S]*?content="([^"]+)"/)?.[1] ?? "";
for (const directive of [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "media-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
]) {
  assert(metaCsp.includes(directive), `meta CSP should include ${directive}`);
}

assert(!metaCsp.includes("unsafe-inline"), "meta CSP should not include unsafe-inline");
console.log("deploy_config_checks=passed");

function vercelHeaders(source) {
  const entry = vercel.headers.find((item) => item.source === source);
  assert(entry, `vercel.json should include source ${source}`);
  return new Map(entry.headers.map((item) => [item.key, item.value]));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
