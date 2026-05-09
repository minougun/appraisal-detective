import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const endpoint = process.env.OPENAI_IMAGE_ENDPOINT ?? "https://api.openai.com/v1/images/generations";
const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";
const size = process.env.OPENAI_IMAGE_SIZE ?? "1536x1024";
const quality = process.env.OPENAI_IMAGE_QUALITY ?? "medium";
const assetsDir = path.resolve("assets");
const manifestPath = path.resolve("assets-manifest.json");
const provenancePath = path.resolve(".asset-provenance.private.json");
const force = process.env.FORCE_IMAGE_ASSETS === "true";
const refreshReason = process.env.IMAGE_REFRESH_REASON ?? "visual_refresh";
const updateManifestOnly =
  process.env.UPDATE_ASSETS_MANIFEST_ONLY === "true" || process.env.UPDATE_MANIFEST_ONLY === "true";
const refreshAllConfirmed =
  process.env.REFRESH_ALL_IMAGE_ASSETS_CONFIRMED === "true" || process.env.IMAGE_REFRESH_ALL_CONFIRMED === "true";
const selectedAssetFiles = parseAssetFileFilter(
  process.env.OPENAI_IMAGE_ASSET_FILES ?? process.env.IMAGE_ASSET_FILES ?? "",
);
let cachedApiKey;
const generatedFiles = new Set();
const privateProvenance = await readPrivateProvenance();
const privateAssets = new Map((privateProvenance?.assets ?? []).map((asset) => [asset.file, asset]));

const assets = [
  { file: "kawabe-estate.generated.png" },
  { file: "ekimae-commercial.generated.png" },
  { file: "minamiguchi-redevelopment.generated.png" },
  { file: "kohoku-factory.generated.png" },
  { file: "aobadai-leasehold.generated.png" },
  { file: "shirahama-leasedland.generated.png" },
  { file: "asagiri-condo.generated.png" },
  { file: "lakeside-hotel.generated.png" },
  { file: "bay-logistics.generated.png" },
  { file: "singapore-overseas.generated.png" },
  { file: "tanaka-client.generated.png" },
  { file: "saeki-client.generated.png" },
  { file: "kurokawa-client.generated.png" },
  { file: "player-novice-appraiser.generated.png" },
  { file: "mentor-appraiser.generated.png" },
  { file: "ehara-client.generated.png" },
  { file: "kubo-client.generated.png" },
  { file: "segawa-client.generated.png" },
  { file: "tachibana-client.generated.png" },
  { file: "hayami-client.generated.png" },
  { file: "onuki-client.generated.png" },
  { file: "kanzaki-client.generated.png" },
];

await mkdir(assetsDir, { recursive: true });

if (!selectedAssetFiles && !refreshAllConfirmed && !updateManifestOnly) {
  throw new Error(
    [
      "Refusing to refresh every image asset by default.",
      "Set OPENAI_IMAGE_ASSET_FILES to a comma-separated file list for a targeted refresh,",
      "or set UPDATE_ASSETS_MANIFEST_ONLY=true to rewrite ledger metadata without image generation,",
      "or set IMAGE_REFRESH_ALL_CONFIRMED=true with IMAGE_REFRESH_REASON for an intentional full refresh.",
    ].join(" "),
  );
}

const assetsToGenerate = selectedAssetFiles
  ? assets.filter((asset) => selectedAssetFiles.has(asset.file))
  : refreshAllConfirmed
    ? assets
    : [];

if (selectedAssetFiles && assetsToGenerate.length !== selectedAssetFiles.size) {
  const knownFiles = new Set(assets.map((asset) => asset.file));
  const missing = [...selectedAssetFiles].filter((file) => !knownFiles.has(file));
  throw new Error(`Unknown image asset file(s): ${missing.join(", ")}`);
}

if (!updateManifestOnly) {
  for (const asset of assetsToGenerate) {
    const outputPath = path.join(assetsDir, asset.file);
    if (!force && (await fileExists(outputPath))) {
      console.log(`skipped ${outputPath}`);
      continue;
    }
    const image = await generateImage(loadAssetPrompt(asset.file));
    await writeFile(outputPath, image);
    generatedFiles.add(asset.file);
    console.log(`generated ${outputPath}`);
  }
}

await writeManifest();

function parseAssetFileFilter(value) {
  const files = value
    .split(",")
    .map((file) => file.trim())
    .filter(Boolean);
  return files.length ? new Set(files) : null;
}

async function fileExists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadApiKey() {
  if (cachedApiKey) return cachedApiKey;
  if (process.env.OPENAI_API_KEY) {
    cachedApiKey = process.env.OPENAI_API_KEY.trim();
    return cachedApiKey;
  }

  const keyFile = process.env.OPENAI_API_KEY_FILE;
  if (keyFile) {
    try {
      const value = (await readFile(keyFile, "utf8")).trim();
      if (value) {
        cachedApiKey = value;
        return cachedApiKey;
      }
    } catch {}
  }

  throw new Error("OPENAI_API_KEY is not set. Set OPENAI_API_KEY_FILE explicitly if you want to read a key from a file.");
}

async function generateImage(prompt) {
  const apiKey = await loadApiKey();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size,
      quality,
      output_format: "png",
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message ?? `HTTP ${response.status}`;
    if (model === "gpt-image-2" && /verified|verify organization|organization/i.test(message)) {
      throw new Error(
        "Image generation failed: gpt-image-2 requires OpenAI Organization verification for this API organization. Complete verification in OpenAI organization settings, then rerun this script. The script will not silently fall back to another model.",
      );
    }
    throw new Error(`Image generation failed: ${message}`);
  }

  const base64 = body?.data?.[0]?.b64_json;
  if (!base64) throw new Error("Image generation response did not include data[0].b64_json.");
  return Buffer.from(base64, "base64");
}

function loadAssetPrompt(file) {
  const fileKey = `assets/${file}`;
  const prompt = privateAssets.get(fileKey)?.prompt;
  if (typeof prompt === "string" && prompt.trim()) return prompt;
  throw new Error(
    `No private prompt found for ${fileKey}. Adopt an imagegen candidate or restore .asset-provenance.private.json before API refresh.`,
  );
}

async function writeManifest() {
  const previousManifest = await readPreviousManifest();
  const previousAssets = new Map((previousManifest?.assets ?? []).map((asset) => [asset.file, asset]));
  const privateRecords = [];

  const records = await Promise.all(
    assets.map(async (asset) => {
      const outputPath = path.join(assetsDir, asset.file);
      const fileKey = `assets/${asset.file}`;
      const previousAsset = previousAssets.get(fileKey);
      const wasGenerated = generatedFiles.has(asset.file);
      const fileStat = await stat(outputPath);
      const fileBuffer = await readFile(outputPath);
      const dimensions = pngDimensions(fileBuffer);
      const metadata = assetCommercialMetadata(asset.file);
      const sha256 = createHash("sha256").update(fileBuffer).digest("hex");
      const privateRecord = privateAssets.get(fileKey);
      const privatePrompt = privateRecord?.prompt ?? previousAsset?.prompt ?? "";
      const promptHashValue = privatePrompt ? promptHash(privatePrompt) : previousAsset?.promptHash;
      privateRecords.push({
        file: fileKey,
        prompt: privatePrompt,
        promptHash: promptHashValue ?? null,
        sourceArtifactPath: privateRecord?.sourceArtifactPath ?? null,
        sourceArtifactRef: previousAsset?.sourceArtifactRef ?? null,
        generationPath: wasGenerated ? "openai_images_api" : (previousAsset?.generationPath ?? "openai_images_api"),
        selectedBy: previousAsset?.selectedBy ?? "internal-commercial-readiness-pass",
        selectionReason: previousAsset?.selectionReason ?? "approved existing in-game asset",
        rejectedVariants: privateRecord?.rejectedVariants ?? [],
        providerRequestId: privateRecord?.providerRequestId ?? null,
        costNote: privateRecord?.costNote ?? null,
        reviewNotes: privateRecord?.reviewNotes ?? [],
      });
      return {
        file: fileKey,
        kind: assetKind(asset.file),
        ...metadata,
        sha256,
        width: dimensions.width,
        height: dimensions.height,
        bytes: fileStat.size,
        previousModel: wasGenerated ? (previousAsset?.model ?? null) : (previousAsset?.previousModel ?? null),
        previousSha256: wasGenerated ? (previousAsset?.sha256 ?? null) : (previousAsset?.previousSha256 ?? null),
        refreshReason: wasGenerated ? refreshReason : (previousAsset?.refreshReason ?? "not_refreshed"),
        reviewStatus: wasGenerated ? "ab_review_pending" : (previousAsset?.reviewStatus ?? "approved_for_beta"),
        reviewedAt: wasGenerated
          ? new Date().toISOString().slice(0, 10)
          : (previousAsset?.reviewedAt ?? new Date().toISOString().slice(0, 10)),
        reviewer: wasGenerated
          ? "gpt-image-2-visual-refresh-pass"
          : (previousAsset?.reviewer ?? "internal-commercial-readiness-pass"),
        inGameUseAllowed: wasGenerated ? false : (previousAsset?.inGameUseAllowed ?? true),
        storeUseAllowed: wasGenerated ? false : (previousAsset?.storeUseAllowed ?? true),
        aiDisclosureCategory: "pre_generated_ai",
        source: previousAsset?.source ?? "OpenAI Images API",
        generationPath: wasGenerated ? "openai_images_api" : (previousAsset?.generationPath ?? "openai_images_api"),
        sourceArtifactRef: previousAsset?.sourceArtifactRef ?? null,
        copiedToAssetsAt: previousAsset?.copiedToAssetsAt ?? previousAsset?.generatedAt ?? fileStat.mtime.toISOString(),
        selectedBy: previousAsset?.selectedBy ?? "internal-commercial-readiness-pass",
        selectionReason: previousAsset?.selectionReason ?? "approved existing in-game asset",
        variantGroupId: previousAsset?.variantGroupId ?? `${asset.file.replace(/\.generated\.png$/, "")}-current`,
        variantId: previousAsset?.variantId ?? "current",
        parentAssetFile: previousAsset?.parentAssetFile ?? null,
        rejectedVariantCount: previousAsset?.rejectedVariantCount ?? 0,
        promptHash: promptHashValue ?? previousAsset?.promptHash,
        model: wasGenerated ? model : (previousAsset?.model ?? model),
        modelSnapshot: wasGenerated ? (process.env.OPENAI_IMAGE_MODEL_SNAPSHOT ?? model) : (previousAsset?.modelSnapshot ?? null),
        size: wasGenerated ? size : (previousAsset?.size ?? size),
        quality: wasGenerated ? quality : (previousAsset?.quality ?? quality),
        outputFormat: "png",
        postProcess: previousAsset?.postProcess ?? [],
        generatedAt: fileStat.mtime.toISOString(),
      };
    }),
  );

  const manifest = {
    schemaVersion: 2,
    purpose: "Commercial-review asset ledger for Appraisal Detective generated images.",
    generatedBy: "scripts/refresh-image-assets.mjs",
    generatedAt: new Date().toISOString(),
    notes: [
      "No API keys or secrets are stored in this manifest.",
      "Full prompts and local source paths are kept out of this public manifest.",
      "New creative image work starts from the app server imagegen workflow; this script is for targeted API refreshes and ledger maintenance.",
      "Confirm current provider terms and final credit wording before public distribution.",
    ],
    assets: records,
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`wrote ${manifestPath}`);
  await writePrivateProvenance(privateRecords);
}

async function readPreviousManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    return null;
  }
}

async function readPrivateProvenance() {
  try {
    return JSON.parse(await readFile(provenancePath, "utf8"));
  } catch {
    return null;
  }
}

function assetKind(file) {
  if (file.includes("client") || file.includes("appraiser")) return "character-portrait";
  return "field-survey-background";
}

function pngDimensions(buffer) {
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error("Only PNG assets are supported by the commercial manifest generator.");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function writePrivateProvenance(privateAssets) {
  if (process.env.WRITE_ASSET_PROVENANCE === "false") return;
  const provenance = {
    schemaVersion: 1,
    purpose:
      "Private non-public provenance for generated image assets. Do not publish or commit this file.",
    generatedBy: "scripts/refresh-image-assets.mjs",
    generatedAt: new Date().toISOString(),
    assets: privateAssets.sort((a, b) => a.file.localeCompare(b.file)),
  };
  await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);
  console.log(`wrote ${provenancePath}`);
}

function promptHash(prompt) {
  return createHash("sha256").update(prompt).digest("hex");
}

function assetCommercialMetadata(file) {
  const commercial = {
    "kawabe-estate.generated.png": ["case001", "field-image", "in-game field survey", "川辺町の住宅地外観。古い住宅、狭い道路、境界、鉄塔が見える。", "川辺町住宅地の現地調査用背景。狭い道路、境界、鉄塔、外壁劣化を含む。"],
    "ekimae-commercial.generated.png": ["case002", "field-image", "in-game field survey", "駅前商業ビル外観。店舗、空室掲示、看板、修繕箇所、人通りが見える。", "駅前商業地の現地調査用背景。空室、修繕遅れ、看板、歩行者動線を含む。"],
    "minamiguchi-redevelopment.generated.png": ["case003", "field-image", "in-game field survey", "駅南口の再開発予定地。古い倉庫、入居店舗、狭い路地、浸水表示、規制線が見える。", "南口再開発予定地の現地調査用背景。倉庫、路地、浸水リスク、開発規制を含む。"],
    "kohoku-factory.generated.png": ["case004", "field-image", "in-game field survey", "港北の工場跡地。古い舗装、搬入口、薬品倉庫、隣接住宅、道路幅員が見える。", "港北工場跡地の現地調査用背景。土壌汚染、搬入口、地下埋設物を示唆する。"],
    "aobadai-leasehold.generated.png": ["case005", "field-image", "in-game field survey", "青葉台の借地権付建物。古い住宅、地主宅、境界、増築部、私道が見える。", "青葉台借地権付建物の現地調査用背景。増改築、私道、地主関係を示唆する。"],
    "shirahama-leasedland.generated.png": ["case006", "field-image", "in-game field survey", "白浜通りの底地。借地人建物、境界塀、私道、長期売却掲示が見える。", "白浜通り底地の現地調査用背景。借地人建物、境界、流動性リスクを含む。"],
    "asagiri-condo.generated.png": ["case007", "field-image", "in-game field survey", "朝霧タワー区分所有の外観。外壁、機械式駐車場、管理掲示、周辺新築が見える。", "朝霧タワー区分所有の現地調査用背景。管理状態、修繕、眺望リスクを含む。"],
    "lakeside-hotel.generated.png": ["case008", "field-image", "in-game field survey", "湖畔リゾートホテル。客室棟、湖畔眺望、古い設備棟、宴会場が見える。", "湖畔リゾートホテルの現地調査用背景。眺望と設備更新リスクを対比する。"],
    "bay-logistics.generated.png": ["case009", "field-image", "in-game field survey", "湾岸物流倉庫。接車バース、高天井倉庫、浸水対策設備、トラックヤードが見える。", "湾岸物流倉庫の現地調査用背景。接車、BCP、テナント集中リスクを含む。"],
    "singapore-overseas.generated.png": ["case010", "field-image", "in-game field survey", "シンガポール海外案件の商業不動産。都市街路、再開発、借地要素、洪水対策が見える。", "シンガポール海外案件の現地調査用背景。借地期間、現地規制、為替説明を想定する。"],
    "tanaka-client.generated.png": ["case001", "client-portrait", "visual novel client portrait", "依頼者の田中修一。相続協議に不安を抱える中年男性。", "相続案件の依頼者ポートレート。弱い圧力と不安を表現する。"],
    "saeki-client.generated.png": ["case002", "client-portrait", "visual novel client portrait", "依頼者の佐伯亮。融資資料を意識する不動産会社担当者。", "収益物件案件の依頼者ポートレート。丁寧だが圧をかける表情。"],
    "kurokawa-client.generated.png": ["case003", "client-portrait", "visual novel client portrait", "依頼者の黒川航。最大容積案を推したい開発会社代表。", "再開発案件の依頼者ポートレート。自信と強い誘導を表現する。"],
    "player-novice-appraiser.generated.png": ["global", "player-portrait", "visual novel protagonist portrait", "主人公の新人不動産鑑定士。緊張しながら鑑定ファイルを持つ若手専門職。", "主人公である新人不動産鑑定士のポートレート。"],
    "mentor-appraiser.generated.png": ["global", "mentor-portrait", "visual novel mentor portrait", "先輩鑑定士。厳しく落ち着いた表情のベテラン専門職。", "先輩鑑定士のポートレート。冷静なレビュー役として表示する。"],
    "ehara-client.generated.png": ["case004", "client-portrait", "visual novel client portrait", "依頼者の江原亮。追加融資を急ぐ製造会社社長。", "担保評価案件の依頼者ポートレート。資金繰りへの焦りを表現する。"],
    "kubo-client.generated.png": ["case005", "client-portrait", "visual novel client portrait", "依頼者の久保麻衣。借地権付建物を売却したい相続人。", "借地権案件の依頼者ポートレート。地主関係への葛藤を表現する。"],
    "segawa-client.generated.png": ["case006", "client-portrait", "visual novel client portrait", "依頼者の瀬川俊介。底地売却を進めたい地主。", "底地評価案件の依頼者ポートレート。交渉難を隠す緊張感を表現する。"],
    "tachibana-client.generated.png": ["case007", "client-portrait", "visual novel client portrait", "依頼者の立花仁。区分所有マンションを高く売りたい所有者。", "区分所有案件の依頼者ポートレート。売却意欲と隠れた懸念を表現する。"],
    "hayami-client.generated.png": ["case008", "client-portrait", "visual novel client portrait", "依頼者の早見怜。ホテル売却を急ぐ運営会社役員。", "ホテル評価案件の依頼者ポートレート。繁忙期実績を強調する圧を表現する。"],
    "onuki-client.generated.png": ["case009", "client-portrait", "visual novel client portrait", "依頼者の大貫咲。物流倉庫売却を進める不動産担当者。", "物流倉庫案件の依頼者ポートレート。実務的で鋭い態度を表現する。"],
    "kanzaki-client.generated.png": ["case010", "client-portrait", "visual novel client portrait", "依頼者の神崎エマ。海外不動産レビューを依頼するファンド担当者。", "海外案件の依頼者ポートレート。国際投資案件の緊張を表現する。"],
  };
  const [caseId, assetType, usage, altText, promptSummary] = commercial[file] ?? [
    "unassigned",
    assetKind(file),
    assetKind(file),
    `鑑定DE探偵の生成画像アセット: ${file}`,
    `鑑定DE探偵の生成画像アセット: ${file}`,
  ];
  return {
    caseId,
    assetType,
    usage,
    altText,
    promptSummary,
    creditText: "Image generated with OpenAI image model.",
    regenerationPolicy:
      "Regenerate with the current default GPT Image model when visual quality, rights requirements, or a planned visual refresh requires it.",
  };
}
