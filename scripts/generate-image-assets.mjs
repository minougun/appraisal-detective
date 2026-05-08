import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const endpoint = process.env.OPENAI_IMAGE_ENDPOINT ?? "https://api.openai.com/v1/images/generations";
const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";
const size = process.env.OPENAI_IMAGE_SIZE ?? "1536x1024";
const quality = process.env.OPENAI_IMAGE_QUALITY ?? "low";
const assetsDir = path.resolve("assets");
const manifestPath = path.resolve("assets-manifest.json");
const force = process.env.FORCE_IMAGE_ASSETS === "true";
const refreshReason = process.env.IMAGE_REFRESH_REASON ?? "visual_refresh";
const selectedAssetFiles = parseAssetFileFilter(
  process.env.OPENAI_IMAGE_ASSET_FILES ?? process.env.IMAGE_ASSET_FILES ?? "",
);
let cachedApiKey;
const generatedFiles = new Set();

const sharedStyle = [
  "Japanese detective game scene background for a real-estate appraisal game.",
  "Moody appraisal office dossier aesthetic, realistic painterly illustration, muted warm evening light.",
  "No readable text, no labels, no people in the foreground.",
  "Clear visual clue composition for hidden-object gameplay, landscape 3:2 framing.",
].join(" ");

const assets = [
  {
    file: "kawabe-estate.generated.png",
    prompt: `${sharedStyle} A modest old residential house in a Japanese suburb, narrow front road, subtle exterior wall cracks, ambiguous side boundary fence, utility fixtures, and a distant power transmission tower behind the lot.`,
  },
  {
    file: "ekimae-commercial.generated.png",
    prompt: `${sharedStyle} A small station-front commercial building in Japan at dusk, mixed tenants on lower floors, one vacant upper-floor unit, worn facade and air-conditioner equipment, pedestrian flow near a train station, rooftop sign structure.`,
  },
  {
    file: "minamiguchi-redevelopment.generated.png",
    prompt: `${sharedStyle} A south-exit redevelopment candidate site in Japan, aging warehouses and small tenant shops, narrow back alley, visible flood-prone lowland atmosphere, zoning-height pressure implied by nearby mid-rise buildings and construction survey markings without readable text.`,
  },
  {
    file: "kohoku-factory.generated.png",
    prompt: `${sharedStyle} An old factory site in a Japanese industrial district, cracked asphalt yard, shuttered loading bay, possible oil stains, small chemical storage shed, neighboring homes close by, narrow truck access road, no readable signage.`,
  },
  {
    file: "aobadai-leasehold.generated.png",
    prompt: `${sharedStyle} An aging Japanese leasehold house in a quiet residential area, old extension wing, private road entrance, neighboring landlord house implied, uncertain boundary fence, repaired mailbox and overgrown garden clues, no readable signage.`,
  },
  {
    file: "shirahama-leasedland.generated.png",
    prompt: `${sharedStyle} A leased-land residential street in Japan, old tenant house on land owned by another party, boundary wall irregularity, long-standing sale board shape without readable text, narrow private lane, subdued evening light.`,
  },
  {
    file: "asagiri-condo.generated.png",
    prompt: `${sharedStyle} A Japanese high-rise condominium entrance and facade, visible exterior tile wear, mechanical parking bay, management notice board shape without readable text, distant new construction that may affect views, urban dusk mood.`,
  },
  {
    file: "lakeside-hotel.generated.png",
    prompt: `${sharedStyle} A lakeside resort hotel in Japan, guest room wing facing water, older boiler annex and staff dormitory visible, banquet hall windows, beautiful view contrasted with deferred maintenance, moody evening atmosphere.`,
  },
  {
    file: "bay-logistics.generated.png",
    prompt: `${sharedStyle} A large waterfront logistics warehouse in Japan, loading docks with some restricted bays, high-bay structure, flood hazard equipment, rooftop solar panels, truck yard, industrial twilight, no readable signs.`,
  },
  {
    file: "singapore-overseas.generated.png",
    prompt: `${sharedStyle} A Singapore commercial redevelopment property scene, tropical urban street, modern mixed-use building with older leasehold elements, flood control infrastructure, construction nearby, international appraisal dossier mood, no readable text.`,
  },
  {
    file: "tanaka-client.generated.png",
    prompt: "Portrait crop for a Japanese detective visual novel UI, middle-aged man client in a modest shirt, anxious inheritance dispute expression, warm office light, painterly realistic style, no text, transparent-looking simple dark background.",
  },
  {
    file: "saeki-client.generated.png",
    prompt: "Portrait crop for a Japanese detective visual novel UI, sharp real-estate company manager in business attire, polite but pressuring expression, station-front commercial property mood, painterly realistic style, no text, simple dark background.",
  },
  {
    file: "kurokawa-client.generated.png",
    prompt: "Portrait crop for a Japanese detective visual novel UI, ambitious redevelopment developer in a dark jacket, confident and slightly coercive expression, city redevelopment mood, painterly realistic style, no text, simple dark background.",
  },
  {
    file: "player-novice-appraiser.generated.png",
    prompt: "Portrait crop for a Japanese detective visual novel UI, novice real-estate appraiser protagonist in a neat modest suit, early-career professional, attentive and slightly tense expression, holding a thin appraisal file, warm appraisal office light, painterly realistic style matching the senior mentor portrait, no text, simple dark background.",
  },
  {
    file: "mentor-appraiser.generated.png",
    prompt: "Portrait crop for a Japanese detective visual novel UI, senior real-estate appraiser mentor, calm strict expression, glasses, appraisal office atmosphere, painterly realistic style, no text, simple dark background.",
  },
  {
    file: "ehara-client.generated.png",
    prompt: "Portrait crop for a Japanese detective visual novel UI, Japanese manufacturing company president in his 40s, tense but forceful, work jacket over shirt, worried about bank financing, painterly realistic style, no text, simple dark background.",
  },
  {
    file: "kubo-client.generated.png",
    prompt: "Portrait crop for a Japanese detective visual novel UI, Japanese woman heir in her 30s, cautious and conflicted, modest business casual clothes, leasehold house dispute mood, painterly realistic style, no text, simple dark background.",
  },
  {
    file: "segawa-client.generated.png",
    prompt: "Portrait crop for a Japanese detective visual novel UI, Japanese landowner man in his late 50s, guarded expression, traditional but neat jacket, leased-land negotiation tension, painterly realistic style, no text, simple dark background.",
  },
  {
    file: "tachibana-client.generated.png",
    prompt: "Portrait crop for a Japanese detective visual novel UI, Japanese condominium owner man in his 40s, polished sales-minded expression with hidden concern, urban apartment sale mood, painterly realistic style, no text, simple dark background.",
  },
  {
    file: "hayami-client.generated.png",
    prompt: "Portrait crop for a Japanese detective visual novel UI, Japanese hotel operating company executive woman in her 40s, composed but urgent, resort business attire, lakeside hotel sale pressure, painterly realistic style, no text, simple dark background.",
  },
  {
    file: "onuki-client.generated.png",
    prompt: "Portrait crop for a Japanese detective visual novel UI, Japanese logistics company real estate manager woman in her 30s, sharp practical expression, warehouse sale and tenant-risk mood, painterly realistic style, no text, simple dark background.",
  },
  {
    file: "kanzaki-client.generated.png",
    prompt: "Portrait crop for a Japanese detective visual novel UI, Japanese international fund manager woman in her 30s, confident bilingual business style, overseas property review tension, painterly realistic style, no text, simple dark background.",
  },
];

await mkdir(assetsDir, { recursive: true });

const assetsToGenerate = selectedAssetFiles
  ? assets.filter((asset) => selectedAssetFiles.has(asset.file))
  : assets;

if (selectedAssetFiles && assetsToGenerate.length !== selectedAssetFiles.size) {
  const knownFiles = new Set(assets.map((asset) => asset.file));
  const missing = [...selectedAssetFiles].filter((file) => !knownFiles.has(file));
  throw new Error(`Unknown image asset file(s): ${missing.join(", ")}`);
}

for (const asset of assetsToGenerate) {
  const outputPath = path.join(assetsDir, asset.file);
  if (!force && (await fileExists(outputPath))) {
    console.log(`skipped ${outputPath}`);
    continue;
  }
  const image = await generateImage(asset.prompt);
  await writeFile(outputPath, image);
  generatedFiles.add(asset.file);
  console.log(`generated ${outputPath}`);
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

  const keyFile = process.env.OPENAI_API_KEY_FILE ?? "/mnt/c/Users/minou/.openai-api-key";
  try {
    const value = (await readFile(keyFile, "utf8")).trim();
    if (value) {
      cachedApiKey = value;
      return cachedApiKey;
    }
  } catch {}

  throw new Error("OPENAI_API_KEY is not set and no readable OPENAI_API_KEY_FILE was found.");
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

async function writeManifest() {
  const previousManifest = await readPreviousManifest();
  const previousAssets = new Map((previousManifest?.assets ?? []).map((asset) => [asset.file, asset]));

  const records = await Promise.all(
    assets.map(async (asset) => {
      const outputPath = path.join(assetsDir, asset.file);
      const fileKey = `assets/${asset.file}`;
      const previousAsset = previousAssets.get(fileKey);
      const wasGenerated = generatedFiles.has(asset.file);
      const fileStat = await stat(outputPath);
      const fileBuffer = await readFile(outputPath);
      const dimensions = pngDimensions(fileBuffer);
      return {
        file: fileKey,
        kind: assetKind(asset.file),
        ...assetCommercialMetadata(asset.file, asset.prompt),
        sha256: createHash("sha256").update(fileBuffer).digest("hex"),
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
        model: wasGenerated ? model : (previousAsset?.model ?? model),
        size: wasGenerated ? size : (previousAsset?.size ?? size),
        quality: wasGenerated ? quality : (previousAsset?.quality ?? quality),
        outputFormat: "png",
        generatedAt: fileStat.mtime.toISOString(),
        prompt: asset.prompt,
      };
    }),
  );

  const manifest = {
    schemaVersion: 1,
    purpose: "Commercial-review asset ledger for Appraisal Detective generated images.",
    generatedBy: "scripts/generate-image-assets.mjs",
    generatedAt: new Date().toISOString(),
    notes: [
      "No API keys or secrets are stored in this manifest.",
      "Prompts avoid readable text inside generated images.",
      "Confirm current provider terms and final credit wording before public distribution.",
    ],
    assets: records,
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`wrote ${manifestPath}`);
}

async function readPreviousManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
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

function assetCommercialMetadata(file, prompt) {
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
    prompt.slice(0, 160),
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
    modelRationale:
      "Use the current default GPT Image model for newly generated or refreshed assets; preserve older asset model metadata until each file is intentionally refreshed.",
  };
}
