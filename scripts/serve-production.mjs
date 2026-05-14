import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assetCacheControl,
  htmlCacheControl,
  securityHeaders as productionSecurityHeaders,
} from "./security-headers.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 44561);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".ttf", "font/ttf"],
  [".mp3", "audio/mpeg"],
  [".json", "application/json; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
]);

const voicevoxProxyBase = process.env.VOICEVOX_ENGINE_URL ?? "http://127.0.0.1:50021";
const voicevoxProxyEndpoints = new Map([
  ["GET /version", "version"],
  ["GET /speakers", "speakers"],
  ["GET /presets", "presets"],
  ["POST /audio_query", "audio_query"],
  ["POST /accent_phrases", "accent_phrases"],
  ["POST /synthesis", "synthesis"],
]);

const server = createServer(async (request, response) => {
  if ((request.url ?? "").startsWith("/voicevox/")) {
    await proxyVoicevox(request, response);
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, {
      Allow: "GET, HEAD",
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Method Not Allowed");
    return;
  }

  const filePath = resolvePublicPath(request.url ?? "/");
  if (!filePath) {
    response.writeHead(400, securityHeaders());
    response.end("Bad Request");
    return;
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, {
      ...securityHeaders(),
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    });
    response.end("Not Found");
    return;
  }

  const extension = extname(filePath);
  response.writeHead(200, {
    ...securityHeaders(),
    "Content-Type": contentTypes.get(extension) ?? "application/octet-stream",
    "Cache-Control": cacheControl(filePath),
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Appraisal Detective production-like server: http://${host}:${port}/`);
});

function resolvePublicPath(rawUrl) {
  let pathname;
  try {
    pathname = new URL(rawUrl, "http://local.invalid").pathname;
  } catch {
    return null;
  }

  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const normalized = normalize(decoded === "/" ? "/index.html" : decoded);
  const relativePath = normalized.replace(/^[/\\]+/, "");
  const resolved = resolve(join(root, relativePath));
  if (resolved !== root && !resolved.startsWith(`${root}${sep}`)) return null;
  return resolved;
}

function securityHeaders() {
  return productionSecurityHeaders;
}

async function proxyVoicevox(request, response) {
  const requestUrl = new URL(request.url ?? "/", "http://local.invalid");
  const endpoint = requestUrl.pathname.replace(/^\/voicevox\/?/, "/");
  const routeKey = `${request.method} ${endpoint}`;
  const enginePath = voicevoxProxyEndpoints.get(routeKey);
  if (!enginePath) {
    response.writeHead(404, {
      ...securityHeaders(),
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    });
    response.end("Not Found");
    return;
  }

  try {
    const engineUrl = new URL(enginePath, `${voicevoxProxyBase.replace(/\/$/, "")}/`);
    engineUrl.search = requestUrl.search;
    const body = request.method === "POST" ? await readRequestBody(request) : undefined;
    const engineResponse = await fetch(engineUrl, {
      method: request.method,
      headers: body ? { "Content-Type": request.headers["content-type"] ?? "application/json" } : {},
      body,
    });
    const payload = Buffer.from(await engineResponse.arrayBuffer());
    response.writeHead(engineResponse.status, {
      ...securityHeaders(),
      "Content-Type": engineResponse.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    response.end(payload);
  } catch {
    if (enginePath === "speakers") {
      response.writeHead(200, {
        ...securityHeaders(),
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      response.end("[]");
      return;
    }
    response.writeHead(503, {
      ...securityHeaders(),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ error: "VOICEVOX Engine is not running" }));
  }
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function cacheControl(filePath) {
  const relative = filePath.slice(root.length + 1).replaceAll("\\", "/");
  if (relative.startsWith("assets/")) return assetCacheControl;
  return htmlCacheControl;
}
