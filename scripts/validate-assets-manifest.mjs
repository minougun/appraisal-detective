import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "assets-manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const errors = [];
const warnings = [];
const generationPaths = new Set(["imagegen_builtin", "openai_images_api", "cli_fallback"]);
const allowedPublicStatuses = new Set(["approved_for_beta", "approved_in_game", "approved_for_store"]);

if (manifest.schemaVersion !== 2) errors.push("assets-manifest.json schemaVersion must be 2");
if (!Array.isArray(manifest.assets)) errors.push("assets-manifest.json assets must be an array");

const files = new Set();
for (const asset of manifest.assets ?? []) {
  await validatePublicRecord(asset);
  if (files.has(asset.file)) errors.push(`${asset.file} is duplicated in assets-manifest.json`);
  files.add(asset.file);
}

for (const file of await generatedAssetFiles()) {
  const key = `assets/${file}`;
  if (!files.has(key)) errors.push(`${key} exists but is missing from assets-manifest.json`);
}

if (await exists(path.join(root, "assets", "visual-refresh-baseline-2026-05-08"))) {
  warnings.push("assets/visual-refresh-baseline-2026-05-08 exists locally; it must remain ignored and unpublished.");
}

if (errors.length) {
  console.error("asset_manifest_ok=false");
  for (const error of errors) console.error(`error=${error}`);
  process.exit(1);
}

console.log("asset_manifest_ok=true");
console.log(`asset_manifest_assets=${manifest.assets.length}`);
for (const warning of warnings) console.warn(`warning=${warning}`);

async function validatePublicRecord(asset) {
  const prefix = asset?.file ?? "unknown asset";
  for (const key of [
    "file",
    "kind",
    "caseId",
    "assetType",
    "usage",
    "altText",
    "promptSummary",
    "creditText",
    "regenerationPolicy",
    "sha256",
    "reviewStatus",
    "reviewedAt",
    "reviewer",
    "aiDisclosureCategory",
    "source",
    "generationPath",
    "selectedBy",
    "selectionReason",
    "variantGroupId",
    "variantId",
    "promptHash",
    "model",
    "size",
    "quality",
    "outputFormat",
    "generatedAt",
  ]) {
    if (!nonEmptyString(asset?.[key])) errors.push(`${prefix}.${key} must be a non-empty string`);
  }
  if (Object.hasOwn(asset, "prompt")) errors.push(`${prefix}.prompt must not be present in public manifest`);
  if (Object.hasOwn(asset, "sourceArtifactPath")) {
    errors.push(`${prefix}.sourceArtifactPath must not be present in public manifest`);
  }
  if (/^\/|^[A-Za-z]:\\|\\mnt\\|CODEX_HOME|\$HOME/.test(String(asset?.sourceArtifactRef ?? ""))) {
    errors.push(`${prefix}.sourceArtifactRef must be an opaque ref, not a local path`);
  }
  if (!String(asset?.file ?? "").startsWith("assets/")) errors.push(`${prefix}.file must be under assets/`);
  if (String(asset?.file ?? "").includes("visual-refresh-baseline")) {
    errors.push(`${prefix}.file must not reference visual-refresh-baseline`);
  }
  if (!/^[a-f0-9]{64}$/.test(String(asset?.sha256 ?? ""))) {
    errors.push(`${prefix}.sha256 must be a 64-character lowercase hex digest`);
  }
  if (!/^[a-f0-9]{64}$/.test(String(asset?.promptHash ?? ""))) {
    errors.push(`${prefix}.promptHash must be a 64-character lowercase hex digest`);
  }
  for (const key of ["width", "height", "bytes", "rejectedVariantCount"]) {
    if (!Number.isInteger(asset?.[key]) || asset[key] < 0) errors.push(`${prefix}.${key} must be a non-negative integer`);
  }
  if (!generationPaths.has(asset?.generationPath)) {
    errors.push(`${prefix}.generationPath must be one of ${[...generationPaths].join(", ")}`);
  }
  if (!allowedPublicStatuses.has(asset?.reviewStatus)) {
    errors.push(`${prefix}.reviewStatus is not publishable: ${asset?.reviewStatus}`);
  }
  if (typeof asset?.inGameUseAllowed !== "boolean") errors.push(`${prefix}.inGameUseAllowed must be boolean`);
  if (typeof asset?.storeUseAllowed !== "boolean") errors.push(`${prefix}.storeUseAllowed must be boolean`);
  if (!Array.isArray(asset?.postProcess)) errors.push(`${prefix}.postProcess must be an array`);

  const absolute = path.join(root, asset.file ?? "");
  if (!(await exists(absolute))) {
    errors.push(`${prefix} file does not exist`);
    return;
  }
  const buffer = await readFile(absolute);
  const fileStat = await stat(absolute);
  const dimensions = pngDimensions(buffer);
  const actualSha = createHash("sha256").update(buffer).digest("hex");
  if (actualSha !== asset.sha256) errors.push(`${prefix}.sha256 does not match file`);
  if (dimensions.width !== asset.width) errors.push(`${prefix}.width does not match file`);
  if (dimensions.height !== asset.height) errors.push(`${prefix}.height does not match file`);
  if (fileStat.size !== asset.bytes) errors.push(`${prefix}.bytes does not match file`);
}

async function generatedAssetFiles() {
  const entries = await readdir(path.join(root, "assets"));
  return entries.filter((file) => file.endsWith(".generated.png"));
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function pngDimensions(buffer) {
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error("Only PNG assets are supported.");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
