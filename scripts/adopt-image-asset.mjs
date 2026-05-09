import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const src = requiredArg(args, "src");
const dest = requiredArg(args, "dest");
const prompt = await loadPrompt(args);
const sourceArtifactRef = args["source-artifact-ref"] ?? `imagegen:${new Date().toISOString()}:${path.basename(dest)}`;

if (!dest.startsWith("assets/")) {
  throw new Error("--dest must be a repository-relative path under assets/.");
}

const root = process.cwd();
const srcPath = path.resolve(src);
const destPath = path.resolve(dest);
const manifestPath = path.join(root, "assets-manifest.json");
const provenancePath = path.join(root, ".asset-provenance.private.json");

await mkdir(path.dirname(destPath), { recursive: true });
await copyFile(srcPath, destPath);

const fileBuffer = await readFile(destPath);
const fileStat = await stat(destPath);
const dimensions = pngDimensions(fileBuffer);
const sha256 = createHash("sha256").update(fileBuffer).digest("hex");
const now = new Date().toISOString();
const manifest = await readJson(manifestPath, {
  schemaVersion: 2,
  purpose: "Commercial-review asset ledger for Appraisal Detective generated images.",
  generatedBy: "scripts/adopt-image-asset.mjs",
  generatedAt: now,
  notes: [
    "No API keys or secrets are stored in this manifest.",
    "Full prompts and local source paths are kept out of this public manifest.",
  ],
  assets: [],
});

manifest.schemaVersion = Math.max(Number(manifest.schemaVersion ?? 0), 2);
manifest.generatedAt = now;
manifest.generatedBy = "scripts/adopt-image-asset.mjs";
manifest.assets = manifest.assets ?? [];

const publicRecord = {
  file: dest,
  kind: args.kind ?? assetKind(dest),
  caseId: requiredArg(args, "case-id"),
  assetType: requiredArg(args, "asset-type"),
  usage: requiredArg(args, "usage"),
  altText: requiredArg(args, "alt-text"),
  promptSummary: requiredArg(args, "prompt-summary"),
  creditText: args["credit-text"] ?? "Image generated with app server imagegen workflow.",
  regenerationPolicy:
    args["regeneration-policy"] ??
    "Regenerate only when visual quality, rights requirements, or a planned visual refresh requires it.",
  sha256,
  width: dimensions.width,
  height: dimensions.height,
  bytes: fileStat.size,
  previousModel: args["previous-model"] ?? null,
  previousSha256: args["previous-sha256"] ?? null,
  refreshReason: args["refresh-reason"] ?? "imagegen_adoption",
  reviewStatus: args["review-status"] ?? "approved_for_beta",
  reviewedAt: args["reviewed-at"] ?? now.slice(0, 10),
  reviewer: args.reviewer ?? "imagegen-adoption-pass",
  inGameUseAllowed: booleanArg(args, "in-game-use-allowed", true),
  storeUseAllowed: booleanArg(args, "store-use-allowed", false),
  aiDisclosureCategory: args["ai-disclosure-category"] ?? "pre_generated_ai",
  source: args.source ?? "app server imagegen workflow",
  generationPath: args["generation-path"] ?? "imagegen_builtin",
  sourceArtifactRef,
  copiedToAssetsAt: now,
  selectedBy: args["selected-by"] ?? "human-reviewer",
  selectionReason: args["selection-reason"] ?? "selected from imagegen candidate set",
  variantGroupId: args["variant-group-id"] ?? `${path.basename(dest, path.extname(dest))}-imagegen`,
  variantId: args["variant-id"] ?? "selected",
  parentAssetFile: args["parent-asset-file"] ?? null,
  rejectedVariantCount: Number.parseInt(args["rejected-variant-count"] ?? "0", 10),
  promptHash: prompt ? hash(prompt) : null,
  model: args.model ?? "imagegen",
  modelSnapshot: args["model-snapshot"] ?? null,
  size: args.size ?? `${dimensions.width}x${dimensions.height}`,
  quality: args.quality ?? "selected_candidate",
  outputFormat: "png",
  postProcess: parseList(args["post-process"]),
  generatedAt: args["generated-at"] ?? now,
};

upsertByFile(manifest.assets, publicRecord);
sortByFile(manifest.assets);
await writeJson(manifestPath, manifest);

const provenance = await readJson(provenancePath, {
  schemaVersion: 1,
  purpose: "Private non-public provenance for generated image assets. Do not publish or commit this file.",
  generatedBy: "scripts/adopt-image-asset.mjs",
  generatedAt: now,
  assets: [],
});

provenance.generatedAt = now;
provenance.generatedBy = "scripts/adopt-image-asset.mjs";
provenance.assets = provenance.assets ?? [];
upsertByFile(provenance.assets, {
  file: dest,
  prompt,
  promptHash: prompt ? hash(prompt) : null,
  sourceArtifactPath: srcPath,
  sourceArtifactRef,
  generationPath: publicRecord.generationPath,
  selectedBy: publicRecord.selectedBy,
  selectionReason: publicRecord.selectionReason,
  rejectedVariants: [],
  providerRequestId: args["provider-request-id"] ?? null,
  costNote: args["cost-note"] ?? null,
  reviewNotes: parseList(args["review-notes"]),
});
sortByFile(provenance.assets);
await writeJson(provenancePath, provenance);

console.log(`adopted ${srcPath} -> ${dest}`);
console.log(`sha256=${sha256}`);

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function requiredArg(values, key) {
  const value = values[key];
  if (typeof value !== "string" || value.trim() === "") throw new Error(`Missing required --${key}.`);
  return value;
}

async function loadPrompt(values) {
  if (values.prompt) return values.prompt;
  if (values["prompt-file"]) return readFile(path.resolve(values["prompt-file"]), "utf8");
  return "";
}

function booleanArg(values, key, fallback) {
  if (values[key] === undefined) return fallback;
  return ["1", "true", "yes"].includes(String(values[key]).toLowerCase());
}

function parseList(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function upsertByFile(collection, record) {
  const index = collection.findIndex((item) => item.file === record.file);
  if (index >= 0) collection[index] = { ...collection[index], ...record };
  else collection.push(record);
}

function sortByFile(collection) {
  collection.sort((a, b) => a.file.localeCompare(b.file));
}

function assetKind(file) {
  if (file.includes("client") || file.includes("appraiser")) return "character-portrait";
  return "field-survey-background";
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

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}
