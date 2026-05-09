import { assetCacheControl, headerEntries, htmlCacheControl } from "./security-headers.mjs";

const target = normalizeUrl(process.argv[2] ?? process.env.PUBLIC_URL);
if (!target) {
  throw new Error("Usage: node scripts/verify-public-headers.mjs https://example.com/");
}

main().catch((error) => {
  console.error(`public_header_checks=failed url=${target.href}`);
  console.error(error.message);
  process.exitCode = 1;
});

async function main() {
  const index = await fetch(target);
  assert(index.ok, `index should return 2xx: ${index.status}`);
  for (const [name, value] of headerEntries()) {
    assertHeader(index.headers, name, value, "index");
  }
  assertHeader(index.headers, "Cache-Control", htmlCacheControl, "index", { allowExtraDirectives: true });

  const app = await fetch(new URL("app.js", target));
  assert(app.ok, `app.js should return 2xx: ${app.status}`);
  for (const [name, value] of headerEntries()) {
    assertHeader(app.headers, name, value, "app.js");
  }

  const asset = await fetch(new URL("assets/fonts/NotoSansJP-VF.ttf", target), { method: "HEAD" });
  assert(asset.ok, `font asset should return 2xx: ${asset.status}`);
  assertHeader(asset.headers, "Cache-Control", assetCacheControl, "asset", { allowExtraDirectives: true });
  assertHeader(asset.headers, "X-Content-Type-Options", "nosniff", "asset");

  const html = await index.text();
  assert(html.includes("20260509-ui-review-fix"), "public HTML should include latest UI cache-bust marker");
  console.log(`public_header_checks=passed url=${target.href}`);
}

function normalizeUrl(raw) {
  if (!raw) return null;
  const url = new URL(raw);
  if (!url.pathname.endsWith("/")) url.pathname = `${url.pathname}/`;
  return url;
}

function assertHeader(headers, name, expected, label, options = {}) {
  const actual = headers.get(name);
  if (options.allowExtraDirectives) {
    assert(actual === expected || actual?.includes(expected), `${label} should include ${name}: ${expected}; got ${actual}`);
    return;
  }
  assert(actual === expected, `${label} should set ${name}: ${expected}; got ${actual}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
