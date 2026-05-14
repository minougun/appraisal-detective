import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const port = 44562;
const server = spawn(process.execPath, ["scripts/serve-production.mjs"], {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});

let browser;

try {
  await waitForServer(`http://127.0.0.1:${port}/`);
  const index = await fetch(`http://127.0.0.1:${port}/`);
  const app = await fetch(`http://127.0.0.1:${port}/app.js`);
  const asset = await fetch(`http://127.0.0.1:${port}/assets/fonts/NotoSansJP-VF.ttf`, { method: "HEAD" });
  const bgm = await fetch(`http://127.0.0.1:${port}/assets/audio/mixkit-echoes-188.mp3`, { method: "HEAD" });
  const voicevox = await fetch(`http://127.0.0.1:${port}/voicevox/version`);
  const voicevoxBlocked = await fetch(`http://127.0.0.1:${port}/voicevox/user_dict`);
  const missing = await fetch(`http://127.0.0.1:${port}/../../AGENTS.md`);
  const malformed = await fetch(`http://127.0.0.1:${port}/%E0%A4%A`);
  const afterMalformed = await fetch(`http://127.0.0.1:${port}/`, { method: "HEAD" });

  assert(index.ok, "index should be served");
  assert(app.ok, "app.js should be served");
  assert(asset.ok, "font should be served");
  assert(bgm.ok, "BGM should be served");
  assert([200, 503].includes(voicevox.status), "VOICEVOX proxy should either reach the local engine or fail closed");
  assert(voicevoxBlocked.status === 404, "VOICEVOX proxy should only expose the allowlisted synthesis endpoints");
  assert(missing.status === 400 || missing.status === 404, "path traversal should not expose files");
  assert(malformed.status === 400, "malformed percent-encoded paths should be rejected");
  assert(afterMalformed.ok, "server should continue serving after malformed path rejection");

  const csp = index.headers.get("content-security-policy") ?? "";
  assert(csp.includes("script-src 'self'"), "CSP should restrict scripts to self");
  assert(csp.includes("style-src 'self'"), "CSP should restrict styles to self");
  assert(csp.includes("media-src 'self' blob:"), "CSP should allow local BGM and synthesized voice blobs");
  assert(
    csp.includes("connect-src 'self' http://127.0.0.1:50021 http://localhost:50021"),
    "CSP should allow the local VOICEVOX Engine",
  );
  assert(!csp.includes("unsafe-inline"), "CSP should not require unsafe-inline");
  assert(index.headers.get("x-content-type-options") === "nosniff", "nosniff should be set");
  assert(index.headers.get("x-frame-options") === "DENY", "frame denial should be set");
  assert(index.headers.get("cache-control") === "no-cache", "HTML should revalidate");
  assert(asset.headers.get("cache-control") === "public, max-age=3600", "assets should use short cache without hashed filenames");
  assert(!asset.headers.get("cache-control")?.includes("immutable"), "assets should not be immutable cached without hashed filenames");
  assert(bgm.headers.get("content-type") === "audio/mpeg", "BGM should be served as audio/mpeg");
  assert(bgm.headers.get("cache-control") === "public, max-age=3600", "BGM should use short cache without hashed filenames");

  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  assert(await page.getByRole("heading", { name: "鑑定DE探偵" }).isVisible(), "title should render under CSP");
  assert(await page.getByText("案件を1つ選び、通常レビューか監査レビューを選ぶ。").isVisible(), "phase objective should render under CSP");
  assert(errors.length === 0, `browser should not report console/page errors: ${errors.join(" | ")}`);

  console.log("production_server_checks=passed");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}

async function waitForServer(url) {
  const timeoutAt = Date.now() + 5000;
  while (Date.now() < timeoutAt) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("Timed out waiting for production-like server");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
