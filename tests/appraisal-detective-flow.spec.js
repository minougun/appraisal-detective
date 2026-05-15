const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const { advancePhase, revealStory, startCase } = require("./helpers");

const cases = {
  case001: {
    meta: ["案件 001", "国内住宅地"],
    result: "川辺町住宅地 鑑定評価レビュー",
    image: /川辺町の住宅地外観/,
    hotspots: ["wallCrack", "boundary", "tower", "road", "utility"],
    docs: ["areaMismatch", "specialTransaction", "timeAdjustment"],
    report: ["areaMismatch", "specialTransaction", "riskAdjustment"],
    band: "balanced",
    support: ["areaMismatch", "road"],
    rebuttal: "areaProof",
    rebuttalEvidence: "areaMismatch",
  },
  case002: {
    meta: ["案件 002", "収益物件"],
    result: "駅前商業地 鑑定評価レビュー",
    image: /駅前商業ビル外観/,
    hotspots: ["tenantMix", "vacancySign", "repairBacklog", "roadFlow", "signLease"],
    docs: ["rentRoll", "expenseLeak", "capRateGap"],
    report: ["rentRoll", "capRateGap", "incomeAdjustment"],
    band: "stabilized",
    support: ["rentRoll", "capRateGap"],
    rebuttal: "marketYield",
    rebuttalEvidence: "capRateGap",
  },
  case003: {
    meta: ["案件 003", "再開発予定地"],
    result: "南口再開発予定地 鑑定評価レビュー",
    image: /駅南口の再開発予定地/,
    hotspots: ["tenantRights", "narrowAlley", "zoningMismatch", "floodHistory", "oldWarehouse"],
    docs: ["zoningCheck", "relocationCost", "infrastructureBurden"],
    report: ["zoningCheck", "relocationCost", "bestUseAdjustment"],
    band: "legalDiscount",
    support: ["zoningCheck", "relocationCost"],
    rebuttal: "legalConstraint",
    rebuttalEvidence: "zoningCheck",
  },
  case004: {
    meta: ["案件 004", "担保評価"],
    result: "港北工場跡地 鑑定評価レビュー",
    image: /港北の工場跡地/,
    hotspots: ["mortgageSoilStain", "mortgageTruckGate", "mortgageOldTank", "mortgageNeighborHomes", "mortgageVacantYard"],
    docs: ["mortgageSoilReport", "mortgageLiquidity", "mortgageLoanPressure"],
    report: ["mortgageSoilReport", "mortgageLiquidity", "mortgageAdjustment"],
    band: "balanced",
    support: ["mortgageSoilReport", "mortgageLiquidity"],
    rebuttal: "soilAndLiquidity",
    rebuttalEvidence: "mortgageSoilReport",
  },
  case010: {
    meta: ["案件 010", "海外案件"],
    result: "シンガポール海外案件 鑑定評価レビュー",
    image: /シンガポール海外案件/,
    hotspots: ["overseasSpotA", "overseasSpotB", "overseasSpotC", "overseasSpotD", "overseasSpotE"],
    docs: ["overseasDocA", "overseasDocB", "overseasDocC"],
    report: ["overseasDocA", "overseasDocB", "overseasAdjustment"],
    band: "balanced",
    support: ["overseasDocA", "overseasDocB"],
    rebuttal: "overseasEvidenceReply",
    rebuttalEvidence: "overseasDocA",
  },
};

async function completeCase(page, caseId, mode = "normal") {
  const config = cases[caseId];
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, caseId, mode);
  await expect(page.locator("#case-number-meta")).toHaveText(config.meta[0]);
  await expect(page.locator("#case-type-meta")).toHaveText(config.meta[1]);
  await expect(page.locator("#mode-meta")).toHaveText(mode === "audit" ? "監査レビュー" : "通常レビュー");

  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");
  await expect(page.getByRole("img", { name: config.image })).toBeVisible();

  for (const id of config.hotspots) {
    await page.locator(`[data-hotspot=${id}]`).click();
  }
  await advancePhase(page, "資料照合へ");

  for (const id of config.docs) {
    await page.locator(`[data-doc=${id}]`).click();
  }
  await advancePhase(page, "鑑定判断へ");

  await page.locator("[data-comparable=A]").click();
  await page.locator("[data-adjustment=risk]").click();
  await page.locator(`[data-adjustment-band=${config.band}]`).click();
  for (const id of config.support) {
    await page.locator(`[data-adjustment-support=${id}]`).click();
  }
  await advancePhase(page, "報告・対決へ");

  for (const id of config.report) {
    await page.locator(`#evidence-board [data-evidence=${id}]`).click();
  }
  await page.locator(`[data-rebuttal=${config.rebuttal}]`).click();
  await page.locator(`[data-rebuttal-evidence=${config.rebuttalEvidence}]`).click();
  if (caseId === "case001") {
    await expect(page.locator(".rebuttal-resolution")).toContainText("この額をそのまま妹に見せるのは、正直まだ不安です");
  }
  await page.locator("[data-ethics=neutral]").click();
  await page.getByRole("button", { name: "最終レビューを見る" }).click();

  await expect(page.getByText(config.result)).toBeVisible();
  await expect(page.getByText("総合スコア")).toBeVisible();
  await expect(page.locator(".result-celebration")).toBeVisible();
  await expect(page.locator(".rank-seal")).toBeVisible();
  if (mode === "audit") {
    await expect(page.getByText("監査補正 +15")).toBeVisible();
    await expect(page.getByText("適合: 現地調査 5/5")).toBeVisible();
    await expect(page.getByText("適合: 重要3カード提示")).toBeVisible();
    await expect(page.getByText("適合: 説明可能な裁量")).toBeVisible();
  }
}

async function installVoiceStub(page) {
  await page.addInitScript(() => {
    window.__APPRAISAL_DISABLE_VOICEVOX__ = true;
    const calls = [];
    class FakeSpeechSynthesisUtterance {
      constructor(text) {
        this.text = text;
        this.lang = "";
        this.pitch = 1;
        this.rate = 1;
        this.volume = 1;
        this.voice = null;
        this.onend = null;
        this.onerror = null;
      }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: FakeSpeechSynthesisUtterance,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
      getVoices: () => [
        { name: "Kyoko Japanese Female", lang: "ja-JP" },
        { name: "Otoya Japanese Male", lang: "ja-JP" },
      ],
      speak: (utterance) => {
        calls.push({
          text: utterance.text,
          pitch: utterance.pitch,
          rate: utterance.rate,
          volume: utterance.volume,
          voice: utterance.voice?.name ?? "",
        });
        window.setTimeout(() => utterance.onend?.(), 0);
      },
      cancel: () => calls.push({ cancel: true }),
      resume: () => {},
      },
    });
    Object.defineProperty(window, "__voiceCalls", {
      configurable: true,
      value: calls,
    });
  });
}

async function installVoicevoxStub(page, { includePlayerSpeaker = true } = {}) {
  await page.addInitScript(({ includePlayerSpeaker }) => {
    const calls = [];
    const originalFetch = window.fetch.bind(window);
    const speakers = [
      { name: "九州そら", speaker_uuid: "sora", styles: [{ id: 16, name: "ノーマル" }, { id: 17, name: "セクシー" }] },
      { name: "No.7", speaker_uuid: "no7", styles: [{ id: 29, name: "ノーマル" }, { id: 30, name: "アナウンス" }, { id: 31, name: "読み聞かせ" }] },
      includePlayerSpeaker ? { name: "雀松朱司", speaker_uuid: "akamatsu", styles: [{ id: 52, name: "ノーマル" }] } : null,
      { name: "白上虎太郎", speaker_uuid: "kotaro", styles: [{ id: 12, name: "ノーマル" }, { id: 32, name: "わーい" }] },
      { name: "春日部つむぎ", speaker_uuid: "kasukabe", styles: [{ id: 8, name: "ノーマル" }, { id: 81, name: "ささやき" }] },
      { name: "青山龍星", speaker_uuid: "aoyama", styles: [{ id: 13, name: "ノーマル" }, { id: 130, name: "不機嫌" }, { id: 131, name: "囁き" }] },
      { name: "玄野武宏", speaker_uuid: "kurono", styles: [{ id: 11, name: "ノーマル" }, { id: 111, name: "ツンギレ" }] },
    ].filter(Boolean);
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: (blob) => {
        calls.push({ path: "blob", type: blob.type });
        return `blob:voicevox-${calls.length}`;
      },
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: () => {},
    });
    class FakeAudio {
      constructor(src = "") {
        this.src = src;
        this.volume = 1;
        this.onended = null;
        this.onerror = null;
      }

      play() {
        calls.push({ path: "play", src: this.src, volume: this.volume, at: performance.now() });
        window.setTimeout(() => this.onended?.(), 0);
        return Promise.resolve();
      }

      pause() {
        calls.push({ path: "pause", src: this.src });
      }

      removeAttribute(name) {
        if (name === "src") this.src = "";
      }
    }
    Object.defineProperty(window, "Audio", {
      configurable: true,
      value: FakeAudio,
    });
    window.fetch = (resource, options = {}) => {
      const resourceUrl = resource instanceof URL ? resource.href : typeof resource === "string" ? resource : resource.url;
      const url = new URL(resourceUrl, window.location.href);
      if (url.pathname === "/voicevox/speakers") {
        calls.push({ path: url.pathname });
        return Promise.resolve(jsonResponse(speakers));
      }
      if (url.pathname === "/voicevox/audio_query") {
        calls.push({
          path: url.pathname,
          speaker: url.searchParams.get("speaker"),
          text: url.searchParams.get("text"),
        });
        return Promise.resolve(
          jsonResponse({
            speedScale: 1,
            pitchScale: 0,
            intonationScale: 1,
            volumeScale: 1,
            prePhonemeLength: 0.1,
            postPhonemeLength: 0.1,
            accent_phrases: [],
          }),
        );
      }
      if (url.pathname === "/voicevox/synthesis") {
        calls.push({
          path: url.pathname,
          speaker: url.searchParams.get("speaker"),
          query: JSON.parse(options.body),
        });
        return Promise.resolve(new Response("voicevox wav", { headers: { "Content-Type": "audio/wav" } }));
      }
      return originalFetch(resource, options);
    };
    Object.defineProperty(window, "__voicevoxCalls", {
      configurable: true,
      value: calls,
    });

    function jsonResponse(value) {
      return new Response(JSON.stringify(value), {
        headers: { "Content-Type": "application/json" },
      });
    }
  }, { includePlayerSpeaker });
}

async function resultScore(page) {
  const text = await page.locator(".result-card").getByText(/総合スコア: \d+点/).textContent();
  return Number(text.match(/総合スコア: (\d+)点/)?.[1] ?? 0);
}

for (const caseId of Object.keys(cases)) {
  test(`complete ${caseId} normal review`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await completeCase(page, caseId, "normal");
    expect(errors).toEqual([]);
  });

  test(`complete ${caseId} audit review`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await completeCase(page, caseId, "audit");
    expect(errors).toEqual([]);
  });
}

test("renders intake phase with reduced motion preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "鑑定DE探偵" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "案件選択" })).toBeVisible();
  await revealStory(page);
  await expect(page.getByText("机上の事件ファイルを開く")).toBeVisible();
  await expect(page.locator(".case-file-desk")).toBeVisible();
  await expect(page.locator(".case-file-folder")).toHaveCount(10);
  await expect(page.locator("body")).toHaveClass(/low-stimulus/);
  await expect(page.locator("#stimulus-toggle")).toHaveText("低刺激 ON");
  await expect(page.locator("#stimulus-toggle")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("証拠カード")).toBeVisible();
});

test("keeps the game title on one line across common viewport widths", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 720 },
    { width: 360, height: 740 },
    { width: 375, height: 812 },
    { width: 414, height: 896 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1366, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });

    const titleMetrics = await page.locator("h1").evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        height: rect.height,
        lineHeight: Number.parseFloat(style.lineHeight),
        scrollWidth: document.documentElement.scrollWidth,
        whiteSpace: style.whiteSpace,
      };
    });

    expect(titleMetrics.whiteSpace).toBe("nowrap");
    expect(titleMetrics.height).toBeLessThanOrEqual(titleMetrics.lineHeight * 1.25);
    expect(titleMetrics.scrollWidth).toBeLessThanOrEqual(viewport.width);
  }
});

test("serves ImageGen-generated field survey images", async ({ request }) => {
  for (const file of [
    "kawabe-estate.generated.png",
    "ekimae-commercial.generated.png",
    "minamiguchi-redevelopment.generated.png",
    "kohoku-factory.generated.png",
    "aobadai-leasehold.generated.png",
    "shirahama-leasedland.generated.png",
    "asagiri-condo.generated.png",
    "lakeside-hotel.generated.png",
    "bay-logistics.generated.png",
    "singapore-overseas.generated.png",
    "tanaka-client.generated.png",
    "saeki-client.generated.png",
    "kurokawa-client.generated.png",
    "ehara-client.generated.png",
    "kubo-client.generated.png",
    "segawa-client.generated.png",
    "tachibana-client.generated.png",
    "hayami-client.generated.png",
    "onuki-client.generated.png",
    "kanzaki-client.generated.png",
    "player-novice-appraiser.generated.png",
    "mentor-appraiser.generated.png",
  ]) {
    const response = await request.get(`http://127.0.0.1:44561/assets/${file}`);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("image/png");
  }
});

test("commercial cases use unique generated case art and client portraits", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  const commercialCases = await page.evaluate(() => {
    const ids = ["case004", "case005", "case006", "case007", "case008", "case009", "case010"];
    return ids.map((id) => {
      const info = window.APPRAISAL_CASE_DATA.caseDefinitions[id];
      return {
        id,
        image: info.image,
        portraitClass: info.client.portraitClass,
      };
    });
  });

  expect(commercialCases).toEqual([
    { id: "case004", image: "./assets/kohoku-factory.generated.png", portraitClass: "portrait-ehara" },
    { id: "case005", image: "./assets/aobadai-leasehold.generated.png", portraitClass: "portrait-kubo" },
    { id: "case006", image: "./assets/shirahama-leasedland.generated.png", portraitClass: "portrait-segawa" },
    { id: "case007", image: "./assets/asagiri-condo.generated.png", portraitClass: "portrait-tachibana" },
    { id: "case008", image: "./assets/lakeside-hotel.generated.png", portraitClass: "portrait-hayami" },
    { id: "case009", image: "./assets/bay-logistics.generated.png", portraitClass: "portrait-onuki" },
    { id: "case010", image: "./assets/singapore-overseas.generated.png", portraitClass: "portrait-kanzaki" },
  ]);

  await revealStory(page);
  for (const item of commercialCases) {
    await expect(page.locator(`[data-case-file='${item.id}'] .file-photo img`)).toHaveAttribute("src", item.image);
  }
});

test("generated image manifest tracks every local generated asset without secrets", async ({ request }) => {
  const response = await request.get("http://127.0.0.1:44561/assets-manifest.json");
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest.schemaVersion).toBe(2);
  expect(manifest.assets).toHaveLength(22);
  expect(manifest.notes.join(" ")).toContain("No API keys or secrets");
  expect(JSON.stringify(manifest)).not.toMatch(/sk-|OPENAI_API_KEY|\\.openai-api-key/i);
  expect(JSON.stringify(manifest)).not.toMatch(/sourceArtifactPath|\"prompt\"/);
  expect(manifest.assets).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        file: "assets/kohoku-factory.generated.png",
        kind: "field-survey-background",
        caseId: "case004",
        assetType: "field-image",
        usage: "in-game field survey",
        creditText: "Image generated with OpenAI image model.",
        aiDisclosureCategory: "pre_generated_ai",
        reviewStatus: "approved_for_beta",
        inGameUseAllowed: true,
        storeUseAllowed: true,
        model: "gpt-image-1.5",
      }),
      expect.objectContaining({
        file: "assets/kanzaki-client.generated.png",
        kind: "character-portrait",
        caseId: "case010",
        assetType: "client-portrait",
        usage: "visual novel client portrait",
        altText: expect.stringContaining("神崎エマ"),
        aiDisclosureCategory: "pre_generated_ai",
        reviewStatus: "approved_for_beta",
        inGameUseAllowed: true,
        storeUseAllowed: true,
        model: "gpt-image-1.5",
      }),
    ]),
  );
  for (const asset of manifest.assets) {
    expect(asset).toEqual(
      expect.objectContaining({
        file: expect.stringMatching(/^assets\/.+\.generated\.png$/),
        caseId: expect.any(String),
        assetType: expect.any(String),
        usage: expect.any(String),
        altText: expect.any(String),
        promptSummary: expect.any(String),
        creditText: expect.any(String),
        regenerationPolicy: expect.any(String),
        generationPath: expect.any(String),
        promptHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        selectedBy: expect.any(String),
        selectionReason: expect.any(String),
        sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        width: expect.any(Number),
        height: expect.any(Number),
        bytes: expect.any(Number),
        refreshReason: expect.any(String),
        reviewStatus: expect.any(String),
        reviewedAt: expect.any(String),
        reviewer: expect.any(String),
        inGameUseAllowed: expect.any(Boolean),
        storeUseAllowed: expect.any(Boolean),
        aiDisclosureCategory: "pre_generated_ai",
      }),
    );
    expect(asset).toHaveProperty("previousModel");
    expect(asset.previousModel === null || typeof asset.previousModel === "string").toBeTruthy();
    expect(asset).toHaveProperty("previousSha256");
    expect(asset.previousSha256 === null || /^[a-f0-9]{64}$/.test(asset.previousSha256)).toBeTruthy();
    expect(asset.width).toBeGreaterThan(0);
    expect(asset.height).toBeGreaterThan(0);
    expect(asset.bytes).toBeGreaterThan(0);
  }
});

test("image refresh script protects partial gpt-image-2 refresh metadata", async () => {
  const script = await fs.promises.readFile("scripts/refresh-image-assets.mjs", "utf8");
  expect(script).toContain('OPENAI_IMAGE_MODEL ?? "gpt-image-2"');
  expect(script).toContain('OPENAI_IMAGE_QUALITY ?? "medium"');
  expect(script).toContain("OPENAI_IMAGE_ASSET_FILES");
  expect(script).toContain("Refusing to refresh every image asset by default.");
  expect(script).toContain("previousModel");
  expect(script).toContain("previousSha256");
  expect(script).toContain("refreshReason");
  expect(script).toContain("promptHash");
  expect(script).toContain("generationPath");
  expect(script).toContain("ab_review_pending");
  expect(script).toContain("The script will not silently fall back to another model.");
});

test("imagegen adoption and manifest validation scripts exist", async () => {
  const adoptScript = await fs.promises.readFile("scripts/adopt-image-asset.mjs", "utf8");
  const validateScript = await fs.promises.readFile("scripts/validate-assets-manifest.mjs", "utf8");
  expect(adoptScript).toContain("imagegen_builtin");
  expect(adoptScript).toContain(".asset-provenance.private.json");
  expect(adoptScript).toContain("sourceArtifactPath");
  expect(validateScript).toContain("prompt must not be present in public manifest");
  expect(validateScript).toContain("asset_manifest_ok=true");
});

test("serves self-hosted Japanese UI font", async ({ request }) => {
  const response = await request.get("http://127.0.0.1:44561/assets/fonts/NotoSansJP-VF.ttf");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toMatch(/font|octet-stream/);
});

test("serves local BGM tracks", async ({ request }) => {
  for (const file of [
    "mixkit-echoes-188.mp3",
    "mixkit-tapis-615.mp3",
    "mixkit-piano-horror-671.mp3",
  ]) {
    const response = await request.get(`http://127.0.0.1:44561/assets/audio/${file}`);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toMatch(/audio|mpeg|octet-stream/);
  }
});

test("intake phase shows client and mentor portraits", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await revealStory(page);
  await startCase(page, "case003", "normal");

  await expect(page.locator(".novel-scene")).toHaveCount(0);
  await expect(page.locator(".phase-game-intake")).toBeVisible();
  await expect(page.locator(".detective-prompt")).toContainText("受ける前の線引き");
  await page.locator("[data-intake=professional]").click();
  await page.getByText("依頼メモを見る").click();
  await expect(page.locator(".speech.client .speaker-portrait")).toBeVisible();
  await expect(page.locator(".speech.mentor .speaker-portrait")).toBeVisible();
  await expect(page.getByText("黒川航")).toBeVisible();
  await expect(page.getByText("最有効使用は願望ではない")).toBeVisible();
});

test("novel scene advances the story before each phase action", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });

  await expect(page.locator(".novel-scene .novel-box")).toContainText("どの根拠が使えるか見る");
  await expect(page.locator("[data-novel-next]")).toHaveText("次へ");
  await expect(page.locator(".novel-character.player")).toBeVisible();
  await expect(page.locator(".novel-character.player .novel-character-label")).toHaveText("新人鑑定士");
  await expect(page.locator(".novel-character.client")).toHaveCount(0);
  await page.locator("[data-novel-next]").click();
  await expect(page.locator(".novel-scene .novel-box")).toContainText("どの案件も、数字の裏に人の都合がある");
  await expect(page.locator("[data-novel-next]")).toHaveText("事件ファイルを開く");
  await page.locator("[data-novel-next]").click();
  await expect(page.locator(".case-file-desk")).toBeVisible();
  await expect(page.locator(".case-file-folder")).toHaveCount(10);
  await expect(page.getByText("開発法・最有効使用")).toBeVisible();
  await expect(page.getByText("事件ファイル選択")).toHaveCount(0);

  await page.locator("[data-start-case=case001][data-mode=normal]").click();
  await expect(page.locator(".novel-scene .novel-box")).toContainText("川辺町住宅地の依頼ファイル");
  await expect(page.locator(".novel-character.player")).toBeVisible();
  await expect(page.locator(".novel-character.client")).toBeVisible();
  await expect(page.locator(".novel-character.mentor")).toBeVisible();
  await expect(page.locator(".phase-game-intake")).not.toBeVisible();
  await page.locator("[data-novel-next]").click();
  await expect(page.locator(".novel-scene .novel-box")).toContainText("相続で妹を説得したい兄");
  await page.locator("[data-novel-next]").click();
  await expect(page.locator(".novel-scene .novel-box")).toContainText("評価額に入れる根拠は分ける");
  await expect(page.locator(".novel-character.player")).toHaveClass(/active/);
  await page.locator("[data-novel-skip]").click();
  await expect(page.locator("[data-novel-next]")).toHaveText("受任判断へ");
  await page.locator("[data-novel-next]").click();
  await expect(page.locator(".phase-game-intake")).toBeVisible();
  await expect(page.locator(".phase-game-header")).toContainText("受任面談");
});

test("mobile novel scene keeps dialogue below character portraits", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });

  for (const selector of [".novel-cast", ".novel-box"]) {
    await expect(page.locator(selector).first()).toBeVisible();
  }
  await expect(page.locator(".phase-head")).toBeHidden();

  const backdrop = await page.locator(".novel-backdrop").first().boundingBox();
  let cast = await page.locator(".novel-cast").first().boundingBox();
  let dialogue = await page.locator(".novel-box").first().boundingBox();
  expect(dialogue.y).toBeGreaterThanOrEqual(backdrop.y + backdrop.height - 2);
  expect(dialogue.y).toBeGreaterThanOrEqual(cast.y + cast.height - 2);

  await revealStory(page);
  await page.locator("[data-start-case=case001][data-mode=normal]").click();
  await expect(page.locator(".novel-character.client")).toBeVisible();

  cast = await page.locator(".novel-cast").first().boundingBox();
  dialogue = await page.locator(".novel-box").first().boundingBox();
  const caseBackdrop = await page.locator(".novel-backdrop").first().boundingBox();
  expect(dialogue.y).toBeGreaterThanOrEqual(caseBackdrop.y + caseBackdrop.height - 2);
  expect(dialogue.y).toBeGreaterThanOrEqual(cast.y + cast.height - 2);
});

test("novel scene can skip to the last message", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await revealStory(page);
  await page.locator("[data-start-case=case003][data-mode=normal]").click();

  await expect(page.locator(".novel-scene .novel-box")).toContainText("南口再開発予定地の依頼ファイル");
  await page.locator("[data-novel-skip]").click();
  await expect(page.locator(".novel-scene .novel-box")).toContainText("立退料と開発負担を支える根拠にする");
  await expect(page.locator("[data-novel-skip]")).toBeDisabled();
});

test("case files expose easy normal hard progression", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await revealStory(page);

  await expect(page.locator('[data-case-file="case001"] .file-difficulty')).toHaveText("イージー");
  await expect(page.locator('[data-case-file="case001"] .file-guide')).toContainText("専門用語");
  await expect(page.locator('[data-case-file="case002"] .file-difficulty')).toHaveText("ノーマル");
  await expect(page.locator('[data-case-file="case002"] .file-guide')).toContainText("純収益");
  await expect(page.locator('[data-case-file="case003"] .file-difficulty')).toHaveText("ハード");
});

test("first run case desk keeps the opening goal narrow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await revealStory(page);

  await expect(page.locator("body")).toHaveClass(/first-run-mode/);
  await expect(page.locator("#phase-objective")).toHaveText("初回は案件001で、3枚の根拠を集める。依頼者の希望に、根拠で線を引く。");
  await expect(page.locator("#mode-meta")).toBeHidden();
  await expect(page.locator("#timer-meta")).toBeHidden();
  await expect(page.locator(".score-card")).toBeHidden();
  await expect(page.locator(".case-file-desk")).toHaveClass(/first-run/);
  await expect(page.locator(".case-library-strip")).toContainText("初回おすすめ 案件001");
  await expect(page.locator(".case-library-strip")).toContainText("3枚の根拠で希望に線を引く");
  await expect(page.locator(".first-run-device-note")).toBeVisible();
  await expect(page.locator(".first-run-device-note")).toContainText("スマホでも導入は遊べます");
  await expect(page.locator(".first-run-device-note")).toContainText("本格的な資料照合は、PCのほうが見やすいです");
  await expect(page.locator('[data-case-file="case001"] .file-first-run')).toHaveText("初回おすすめ");
  await expect(page.locator('[data-case-file="case001"] .file-start-label')).toHaveText("ここから開始");
  await expect(page.locator('[data-case-file="case001"] .file-description')).toContainText("「高く見せたい」希望に、3枚の根拠で線を引く");
  await expect(page.getByText("通常最高")).toHaveCount(0);
});

test("intake starts with a contradiction pick before the appraisal decision", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal", { resolveIntakeIntro: false });

  await expect(page.locator(".detective-prompt")).toContainText("価格に入れてはいけないものを選べ");
  await expect(page.locator(".brief-grid")).toHaveCount(0);
  await expect(page.locator(".detective-prompt")).toContainText("低い額だと困る、という依頼者の希望");
  await expect(page.locator(".detective-prompt")).toContainText("妹に見せる、という利用目的");
  await expect(page.locator(".detective-prompt")).toContainText("相続協議に使う、という依頼目的");
  await page.getByRole("button", { name: "低い額だと困る、という依頼者の希望" }).click();
  await expect(page.locator("#mentor-log")).toContainText("田中さんの困りごとで価格は動かさない");
  await expect(page.locator(".detective-prompt")).toContainText("次に開く資料は？");
  await page.getByRole("button", { name: "取引事例の日付" }).click();
  await expect(page.locator("#mentor-log")).toContainText("これが価格時点だ");
  await expect(page.locator(".detective-prompt")).toContainText("返すカードを選べ");
  await expect(page.locator(".detective-prompt")).toContainText("事例の日付が評価時点とずれている");
  await page.getByRole("button", { name: "取引事例の日付" }).click();
  await expect(page.locator("#mentor-log")).toContainText("資料に戻した、それでいい");
  await expect(page.getByText("時点の違う価格は混ぜられません")).toBeVisible();
  await expect(page.getByText("日付が違うだけでも、そこまで見ますか")).toBeVisible();
  await expect(page.locator(".brief-grid")).toHaveCount(0);
  await expect(page.locator(".detective-prompt")).toContainText("受ける前の線引き");
  await page.locator("[data-intake=professional]").click();
  await expect(page.locator(".brief-grid")).toBeVisible();
  await expect(page.locator(".brief-grid")).toContainText("今回の線引き");
  await expect(page.locator(".brief-grid")).toContainText("依頼メモを見る");
  await expect(page.locator(".brief-grid")).toContainText("引っかかり");
  await expect(page.locator(".brief-grid")).not.toContainText("鑑定評価上の初期論点");
  await expect(page.locator("#next-phase")).toBeEnabled();
});

test("early guidance is moved into optional mentor advice", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await expect(page.locator(".tutorial-card")).toHaveCount(0);
  await page.getByRole("button", { name: "先輩の一言" }).click();
  await expect(page.locator("#mentor-log")).toHaveText("田中さんの希望額は、まだ材料じゃない。先に事例の日付をそろえよう。");

  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case002", "normal");
  await expect(page.locator(".tutorial-card")).toHaveCount(0);
  await page.getByRole("button", { name: "先輩の一言" }).click();
  await expect(page.locator("#mentor-log")).toHaveText("利回りの希望は後だ。先に収入と費用の内訳を見よう。");

  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case003", "normal");
  await expect(page.locator(".tutorial-card")).toHaveCount(0);
  await page.getByRole("button", { name: "先輩の一言" }).click();
  await expect(page.locator("#mentor-log")).toHaveText("最大容積案はまだ置いておく。先に道路とのつながりだ。");
});

test("mentor advice follows early phase progression", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");
  await expect(page.locator(".tutorial-card")).toHaveCount(0);
  await page.getByRole("button", { name: "先輩の一言" }).click();
  await expect(page.locator("#mentor-log")).toHaveText("見た目の傷で止まらない。価格に効く条件差を見よう。");

  await page.locator("[data-hotspot=wallCrack]").click();
  await page.locator("[data-hotspot=boundary]").click();
  await page.locator("[data-hotspot=tower]").click();
  await advancePhase(page, "資料照合へ");
  await expect(page.locator(".tutorial-card")).toHaveCount(0);
  await page.getByRole("button", { name: "先輩の一言" }).click();
  await expect(page.locator("#mentor-log")).toHaveText("説明は材料の一つだ。数字と資料が食い違う場所を見よう。");
});

test("case file selection centers the chosen file before opening", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await revealStory(page);

  await page.locator("[data-start-case=case002][data-mode=normal]").click();
  const desk = page.locator(".case-file-desk");
  await expect(desk).toHaveClass(/case-selecting/);
  await expect(desk).toHaveAttribute("data-selected-case", "case002");
  await expect(desk).toHaveAttribute("data-selected-mode", "normal");
  await expect(page.locator('[data-case-file="case002"]')).toHaveClass(/case-file-selected/);
  await expect(page.locator(".case-file-dismissed")).toHaveCount(9);
  await expect(page.locator('[data-case-file="case002"] .case-file-folder')).toBeDisabled();
  await page.waitForTimeout(780);
  const centerDelta = await page.evaluate(() => {
    const deskRect = document.querySelector(".case-file-desk").getBoundingClientRect();
    const selectedRect = document.querySelector('[data-case-file="case002"]').getBoundingClientRect();
    return Math.abs(deskRect.left + deskRect.width / 2 - (selectedRect.left + selectedRect.width / 2));
  });
  expect(centerDelta).toBeLessThanOrEqual(8);

  await expect(page.locator(".novel-scene .novel-box")).toContainText("駅前商業地の依頼ファイル");
});

test("case file selection holds the centered file before changing scenes", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await revealStory(page);

  await page.locator("[data-start-case=case001][data-mode=normal]").click();
  const desk = page.locator(".case-file-desk");
  await expect(desk).toHaveClass(/case-selecting/);
  await expect(page.locator('[data-case-file="case001"]')).toHaveClass(/case-file-selected/);

  await page.waitForTimeout(900);
  await expect(desk).toHaveClass(/case-selecting/);
  await expect(page.locator(".novel-scene")).toHaveCount(0);

  await expect(page.locator(".novel-scene .novel-box")).toContainText("川辺町住宅地の依頼ファイル");
});

test("low stimulus keeps case file selection animation while suppressing effects", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await revealStory(page);
  await page.locator("#stimulus-toggle").click();
  await expect(page.locator("#stimulus-toggle")).toHaveText("低刺激 ON");

  await page.locator("[data-start-case=case001][data-mode=normal]").click();
  const desk = page.locator(".case-file-desk");
  const selectedFile = page.locator('[data-case-file="case001"]');

  await expect(desk).toHaveClass(/case-selecting/);
  await expect(selectedFile).toHaveClass(/case-file-selected/);
  await expect(page.locator(".case-file-dismissed")).toHaveCount(9);
  await expect(page.locator(".novel-scene")).toHaveCount(0);

  const transform = await selectedFile.evaluate((node) => getComputedStyle(node).transform);
  expect(transform).not.toBe("none");
  await page.waitForTimeout(900);
  await expect(desk).toHaveClass(/case-selecting/);
  await expect(page.locator(".novel-scene")).toHaveCount(0);

  await expect(page.locator(".novel-scene .novel-box")).toContainText("川辺町住宅地の依頼ファイル");
});

test("audit stamp selection keeps the chosen file and audit mark emphasized", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await revealStory(page);

  await page.locator("[data-start-case=case003][data-mode=audit]").click();
  const desk = page.locator(".case-file-desk");
  await expect(desk).toHaveClass(/case-selecting/);
  await expect(desk).toHaveAttribute("data-selected-case", "case003");
  await expect(desk).toHaveAttribute("data-selected-mode", "audit");
  await expect(page.locator('[data-case-file="case003"]')).toHaveClass(/case-file-selected/);

  await expect(page.locator("#mode-meta")).toHaveText("監査レビュー");
});

test("audit review exposes failed checks when the player cuts corners", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "audit");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  for (const id of ["wallCrack", "boundary", "tower"]) {
    await page.locator(`[data-hotspot=${id}]`).click();
  }
  await advancePhase(page, "資料照合へ");

  for (const id of ["areaMismatch", "specialTransaction", "timeAdjustment"]) {
    await page.locator(`[data-doc=${id}]`).click();
  }
  await advancePhase(page, "鑑定判断へ");

  await page.locator("[data-comparable=A]").click();
  await page.locator("[data-adjustment=risk]").click();
  await page.locator("[data-adjustment-band=balanced]").click();
  await page.locator("[data-adjustment-support=areaMismatch]").click();
  await page.locator("[data-adjustment-support=boundary]").click();
  await advancePhase(page, "報告・対決へ");

  for (const id of ["pricePoint", "subjectProperty", "areaMismatch"]) {
    await page.locator(`#evidence-board [data-evidence=${id}]`).click();
  }
  await page.locator("[data-rebuttal=areaProof]").click();
  await page.locator("[data-rebuttal-evidence=areaMismatch]").click();
  await page.locator("[data-ethics=yield]").click();
  await page.getByRole("button", { name: "最終レビューを見る" }).click();

  await expect(page.getByText("監査補正 -12")).toBeVisible();
  await expect(page.getByText("指摘: 現地調査 5/5")).toBeVisible();
  await expect(page.getByText("指摘: 重要3カード提示")).toBeVisible();
  await expect(page.getByText("指摘: 説明可能な裁量")).toBeVisible();
});

test("normal result exposes next-run checklist", async ({ page }) => {
  await completeCase(page, "case002", "normal");

  await expect(page.getByText("適合: 現地調査")).toBeVisible();
  await expect(page.getByText("適合: 重要カード")).toBeVisible();
  await expect(page.getByText("適合: 説明可能な裁量")).toBeVisible();
  await expect(page.getByText("時間補正")).toBeVisible();
  await expect(page.getByText("判断補正")).toBeVisible();
  await expect(page.getByText("経過時間")).toBeVisible();
  await expect(page.getByText("報告構成: 事実→分析→結論")).toBeVisible();
  await expect(page.getByText("代替証拠評価")).toBeVisible();
  await expect(page.getByText("現在の三枚")).toBeVisible();
  await expect(page.getByText("監査リスク")).toBeVisible();
  await expect(page.getByText("次周メモ")).toBeVisible();
  await expect(page.getByText("別解ルート候補")).toBeVisible();
  await expect(page.getByText("スコア研究軸")).toBeVisible();
});

test("credits panel explains pre-generated AI assets and runtime AI absence", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await revealStory(page);

  await page.getByRole("button", { name: "クレジット" }).click();
  await expect(page.locator(".product-panel")).toContainText("OpenAI画像生成モデル");
  await expect(page.locator(".product-panel")).toContainText("事前生成アセット");
  await expect(page.locator(".product-panel")).toContainText("実行中AI生成");
  await expect(page.locator(".product-panel")).toContainText("なし");
  await expect(page.locator(".product-panel")).toContainText("assets-manifest.json");
});

test("records and achievements expose replay goals for commercial retention", async ({ page }) => {
  await completeCase(page, "case003", "normal");
  await page.getByRole("button", { name: "案件選択へ" }).click();
  await revealStory(page);

  await page.getByRole("button", { name: "記録", exact: true }).click();
  await expect(page.locator(".product-panel")).toContainText("次周目標");
  await expect(page.locator(".product-panel")).toContainText("未確認の市場シナリオ");
  await expect(page.locator(".product-panel")).toContainText("市場シナリオ 1/3踏破");
  await page.getByRole("button", { name: "閉じる" }).click();

  await page.getByRole("button", { name: "実績" }).click();
  await expect(page.locator(".product-panel")).toContainText("Sランク論証");
  await expect(page.locator(".product-panel")).toContainText("HBU審査官");
});

test("bad judgment path scores meaningfully lower than a neutral evidence path", async ({ page }) => {
  await completeCase(page, "case001", "normal");
  const goodScore = await resultScore(page);

  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=pressure]").click();
  await advancePhase(page, "現地調査へ");
  await page.locator("[data-decoy=gardenLantern]").click();
  for (const id of ["wallCrack", "boundary", "tower"]) {
    await page.locator(`[data-hotspot=${id}]`).click();
  }
  await advancePhase(page, "資料照合へ");
  await page.locator("[data-mechanic-input=areaTsubo]").fill("60");
  await page.locator("[data-mechanic-check]").click();
  await page.locator("[data-mechanic=clientArea]").click();
  await page.locator("[data-doc=areaMismatch]").click();
  await page.locator("[data-doc-decoy=renovationQuote]").click();
  await page.locator("[data-doc=specialTransaction]").click();
  await advancePhase(page, "鑑定判断へ");
  await page.locator("[data-comparable=B]").click();
  await page.locator("[data-adjustment=soft]").click();
  await page.locator("[data-adjustment-band=minor]").click();
  await page.locator("[data-adjustment-support=wallCrack]").click();
  await page.locator("[data-adjustment-support=boundary]").click();
  await advancePhase(page, "報告・対決へ");
  for (const id of ["wallCrack", "boundary", "areaMismatch"]) {
    await page.locator(`#evidence-board [data-evidence=${id}]`).click();
  }
  await page.locator("[data-rebuttal=familySympathy]").click();
  await page.locator("[data-rebuttal-evidence=areaMismatch]").click();
  await page.locator("[data-ethics=yield]").click();
  await page.getByRole("button", { name: "最終レビューを見る" }).click();

  const badScore = await resultScore(page);
  expect(goodScore - badScore).toBeGreaterThanOrEqual(15);
});

test("case data is loaded from the separated data script", async ({ request, page }) => {
  const response = await request.get("http://127.0.0.1:44561/case-data.js");
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toContain("window.APPRAISAL_CASE_DATA");

  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await expect(page.locator("script[src='./case-data.js']")).toHaveCount(1);
  await revealStory(page);
  await expect(page.getByRole("button", { name: /通常レビューで開始/ }).first()).toBeVisible();
});

test("case schema validates all commercial case definitions", async ({ page, request }) => {
  const manifestResponse = await request.get("http://127.0.0.1:44561/assets-manifest.json");
  const manifest = await manifestResponse.json();
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  const result = await page.evaluate((assetManifest) =>
    window.APPRAISAL_CASE_SCHEMA.validateCaseData(window.APPRAISAL_CASE_DATA, assetManifest),
    manifest,
  );

  expect(result).toMatchObject({
    ok: true,
    caseCount: 10,
    errors: [],
  });
});

test("case schema separates production strictness from security fixtures", async ({ page, request }) => {
  const manifestResponse = await request.get("http://127.0.0.1:44561/assets-manifest.json");
  const manifest = await manifestResponse.json();
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  const result = await page.evaluate((assetManifest) => {
    const clone = structuredClone(window.APPRAISAL_CASE_DATA);
    clone.caseDefinitions.case001.image = "javascript:alert(3)";
    return {
      production: window.APPRAISAL_CASE_SCHEMA.validateCaseData(clone, assetManifest, { mode: "production" }),
      fixture: window.APPRAISAL_CASE_SCHEMA.validateCaseData(clone, assetManifest, { mode: "security-fixture" }),
    };
  }, manifest);

  expect(result.production.ok).toBe(false);
  expect(result.production.errors.join("\n")).toContain("case001.image must reference a local assets/ file in production mode");
  expect(result.fixture.ok).toBe(true);
});

test("hbu renderer escapes matrix and audit criteria text", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  const result = await page.evaluate(() => {
    const renderer = window.APPRAISAL_HBU_RENDERER;
    const html = [
      renderer.hbuMatrixMarkup({
        title: `<img src=x onerror=alert(1)>最有効使用`,
        lead: `<script>alert(2)</script>lead`,
        rows: [
          [`<svg onload=alert(3)>法的可能性`, `detail <img src=x onerror=alert(4)>`],
          [`物理的可能性`, `detail`],
          [`市場性`, `detail`],
          [`収益性・経済合理性`, `detail`],
        ],
        conclusion: `<span onclick=alert(5)>結論</span>`,
      }),
      renderer.auditCriteriaMarkup(
        {
          focus: `<img src=x onerror=alert(6)>focus`,
          risk: `<script>alert(7)</script>risk`,
          comment: `<svg onload=alert(8)>comment`,
          requiredEvidence: [`<img src=x onerror=alert(9)>`],
        },
        [],
        { "<img src=x onerror=alert(9)>": `<span onclick=alert(10)>根拠</span>` },
      ),
    ].join("\n");
    const container = document.createElement("div");
    container.innerHTML = html;
    return {
      html,
      activeNodes: container.querySelectorAll("script,img,svg,[onclick],[onerror],[onload]").length,
    };
  });

  expect(result.activeNodes).toBe(0);
  expect(result.html).not.toContain("<script");
  expect(result.html).not.toContain("<img");
  expect(result.html).not.toContain("<svg");
  expect(result.html).toContain("&lt;img");
  expect(result.html).toContain("&lt;script");
});

test("expanded commercial cases use hand-written HBU and audit criteria", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  const result = await page.evaluate(() =>
    Object.fromEntries(
      Object.entries(window.APPRAISAL_CASE_DATA.caseDefinitions)
        .filter(([id]) => /^case00[4-9]$|^case010$/.test(id))
        .map(([id, info]) => [
          id,
          {
            title: info.hbuMatrix.title,
            conclusion: info.hbuMatrix.conclusion,
            focus: info.auditCriteria.focus,
            risk: info.auditCriteria.risk,
          },
        ]),
    ),
  );

  expect(result.case004.conclusion).toContain("正常価格と換金性リスクを分離");
  expect(result.case005.focus).toContain("譲渡承諾・地代・増改築制限");
  expect(result.case006.title).toContain("底地");
  expect(result.case007.risk).toContain("眺望プレミアム");
  expect(result.case008.focus).toContain("年間安定NOI");
  expect(result.case009.risk).toContain("主力テナント退去");
  expect(result.case010.focus).toContain("IVS前提・為替時点・借地残存期間");
});

test("early commercial sample cases expose highest and best use reasoning", async ({ page }) => {
  for (const [caseId, expected] of [
    ["case001", "標準的住宅地としての継続利用"],
    ["case002", "店舗・事務所複合ビルとしての継続運用"],
    ["case003", "中層共同住宅＋低層店舗"],
  ]) {
    await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
    await startCase(page, caseId, "normal");
    await page.locator("[data-intake=professional]").click();
    await advancePhase(page, "現地調査へ");
    for (const id of cases[caseId].hotspots.slice(0, 3)) {
      await page.locator(`[data-hotspot=${id}]`).click();
    }
    await advancePhase(page, "資料照合へ");
    for (const id of cases[caseId].docs.slice(0, 2)) {
      await page.locator(`[data-doc=${id}]`).click();
    }
    await advancePhase(page, "鑑定判断へ");

    await expect(page.locator(".hbu-matrix")).toContainText("最有効使用");
    await expect(page.locator(".hbu-matrix")).toContainText("法的可能性");
    await expect(page.locator(".hbu-matrix")).toContainText(expected);
  }
});

test("case003 final review connects highest and best use to audit criteria", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case003", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");
  for (const id of cases.case003.hotspots) {
    await page.locator(`[data-hotspot=${id}]`).click();
  }
  await advancePhase(page, "資料照合へ");
  for (const id of cases.case003.docs) {
    await page.locator(`[data-doc=${id}]`).click();
  }
  await advancePhase(page, "鑑定判断へ");
  await page.locator("[data-comparable=A]").click();
  await page.locator("[data-adjustment=risk]").click();
  await page.locator("[data-adjustment-band=legalDiscount]").click();
  await page.locator("[data-adjustment-support=zoningCheck]").click();
  await page.locator("[data-adjustment-support=relocationCost]").click();
  await advancePhase(page, "報告・対決へ");
  for (const id of ["zoningCheck", "relocationCost", "bestUseAdjustment"]) {
    await page.locator(`#evidence-board [data-evidence=${id}]`).click();
  }
  await page.locator("[data-rebuttal=legalConstraint]").click();
  await page.locator("[data-rebuttal-evidence=zoningCheck]").click();
  await page.locator("[data-ethics=neutral]").click();
  await page.getByRole("button", { name: "最終レビューを見る" }).click();

  await expect(page.locator(".audit-criteria-card")).toContainText("最有効使用マトリクス");
  await expect(page.locator(".audit-criteria-card")).toContainText("最大容積案");
  await expect(page.locator(".audit-criteria-card")).toContainText("提示済 公法上の規制 / 高度地区・斜線制限を確認");
  await expect(page.locator(".audit-criteria-card")).toContainText("提示済 権利調整 / 立退料と交渉期間を控除");
  await expect(page.locator(".audit-criteria-card")).toContainText("提示済 最有効使用 / 中層共同住宅＋低層店舗が妥当");
});

test("case data text is escaped when rendered through game templates", async ({ page }) => {
  const dataPath = path.join(__dirname, "..", "case-data.js");
  const source = fs
    .readFileSync(dataPath, "utf8")
    .replace('name: "田中修一"', 'name: "<img src=x onerror=alert(1)>田中修一"')
    .replace('shortTitle: "川辺町住宅地"', 'shortTitle: "<script>alert(2)</script>川辺町住宅地"')
    .replace('title: "まず覚えること"', 'title: "<img src=x onerror=alert(4)>まず覚えること"')
    .replace(
      'body: "鑑定士は依頼者の事情を聞いたうえで、説明できる価格の幅を判断する。最初に価格時点、対象不動産、価格の種類を固定する。"',
      'body: "<script>alert(5)</script>鑑定士は依頼者の事情を聞いたうえで、説明できる価格の幅を判断する。"',
    )
    .replace(
      '"価格時点: いつの価格か"',
      '"<img src=x onerror=alert(6)>価格時点: いつの価格か"',
    )
    .replace(
      'next: "この面談では「正常価格として受任」を選ぶのが基本。"',
      'next: "<svg onload=alert(7)>この面談では正常価格として受任を選ぶ。"',
    );
  const dialogs = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  await page.route("**/case-data.js", (route) =>
    route.fulfill({
      contentType: "text/javascript; charset=utf-8",
      body: source,
    }),
  );

  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await revealStory(page);

  await expect(page.getByText("<img src=x onerror=alert(1)>田中修一", { exact: false })).toBeVisible();
  await startCase(page, "case001", "normal");
  await expect(page.locator(".tutorial-card")).toHaveCount(0);
  await page.getByRole("button", { name: "先輩の一言" }).click();
  await expect(page.locator("#mentor-log")).toContainText("事例の日付をそろえよう");
  await expect(page.locator("#mentor-log")).not.toContainText("<script>alert(5)</script>");
  await expect(page.locator("#mentor-log img")).toHaveCount(0);
  await expect(page.locator("#mentor-log script")).toHaveCount(0);
  await expect(page.locator("#mentor-log svg")).toHaveCount(0);
  expect(dialogs).toEqual([]);
});

test("pressure line sanitizer only allows the pressure-word span", async ({ page }) => {
  const appPath = path.join(__dirname, "..", "app.js");
  const source = fs
    .readFileSync(appPath, "utf8")
    .replace(
      '父の遺した家を兄妹で分けたいんです。あと、できれば<span class=\\"pressure-word\\">高めに</span>見ていただけると助かります。',
      '<img src=x onerror=alert(8)>父の遺した家です。<span onclick=\\"alert(9)\\" class=\\"pressure-word\\">危険</span><span class=\\"pressure-word\\">高めに</span>',
    );
  const dialogs = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  await page.route("**/app.js*", (route) =>
    route.fulfill({
      contentType: "text/javascript; charset=utf-8",
      body: source,
    }),
  );

  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await expect(page.locator(".detective-prompt")).toContainText("受ける前の線引き");
  await page.locator("[data-intake=professional]").click();
  await page.getByText("依頼メモを見る").click();

  await expect(page.getByText("<img src=x onerror=alert(8)>父の遺した家です。", { exact: false })).toBeVisible();
  await expect(page.getByText("<span onclick=\"alert(9)\" class=\"pressure-word\">危険", { exact: false })).toBeVisible();
  await expect(page.locator(".speech.client img")).toHaveCount(0);
  await expect(page.locator(".speech.client [onclick]")).toHaveCount(0);
  await expect(page.locator(".speech.client .pressure-word", { hasText: "高めに" })).toHaveCount(1);
  expect(dialogs).toEqual([]);
});

test("scoring module is loaded before the app script", async ({ request, page }) => {
  const response = await request.get("http://127.0.0.1:44561/scoring.js");
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toContain("window.APPRAISAL_SCORING");

  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await expect(page.locator("script[src='./scoring.js']")).toHaveCount(1);
  expect(await page.evaluate(() => Boolean(window.APPRAISAL_SCORING?.evaluateScoreVariance))).toBe(true);
});

test("missing case data script shows a recoverable error", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.route("**/case-data.js", (route) => route.abort());

  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "読込エラー" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "案件データを読み込めませんでした" })).toBeVisible();
  await expect(page.locator("#sr-alert")).toContainText("案件データを読み込めませんでした");
  expect(errors).toEqual([]);
});

test("missing scoring module shows a recoverable error", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.route("**/scoring.js", (route) => route.abort());

  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "読込エラー" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "スコア計算モジュールを読み込めませんでした" })).toBeVisible();
  await expect(page.locator("#sr-alert")).toContainText("スコア計算モジュールを読み込めませんでした");
  expect(errors).toEqual([]);
});

test("case-specific document mechanics change the document phase", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case002", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  for (const id of ["tenantMix", "vacancySign", "repairBacklog"]) {
    await page.locator(`[data-hotspot=${id}]`).click();
  }
  await advancePhase(page, "資料照合へ");

  await expect(page.locator(".mechanic-card .term-chip", { hasText: "DCR確認" })).toBeVisible();
  await page.locator("[data-mechanic=stabilizedNoi]").click();
  await expect(page.locator("[data-mechanic=stabilizedNoi]")).toHaveClass(/selected/);
  await expect(page.locator("#mentor-log")).toContainText("安定純収益");
});

test("play timer is visible during a case", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await expect(page.locator("#timer-meta")).toHaveText("経過 --");

  await startCase(page, "case001", "normal");
  await expect(page.locator("#timer-meta")).toContainText("経過 0:");
  await expect(page.locator("#timer-meta")).toContainText("目標 8:00");
});

test("field hotspots meet 44px target and gameplay cast stays in the game screen", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  const box = await page.locator("[data-hotspot=wallCrack]").boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await page.locator("[data-hotspot=wallCrack]").hover();
  await expect(page.locator("[data-hotspot=wallCrack] .hotspot-evidence-preview")).toBeVisible();
  await expect(page.locator("[data-hotspot=wallCrack] .hotspot-evidence-preview")).toContainText("外壁劣化");
  await expect(page.locator("[data-hotspot=wallCrack] .hotspot-evidence-preview")).toContainText("個別的要因");
  await page.locator("[data-hotspot=boundary]").focus();
  await expect(page.locator("[data-hotspot=boundary] .hotspot-evidence-preview")).toBeVisible();
  await expect(page.locator("[data-hotspot=boundary]")).toHaveAttribute("aria-label", /証拠カード/);
  await expect(page.locator(".gameplay-cast")).toBeVisible();
  await expect(page.locator(".gameplay-cast")).toContainText("新人鑑定士");
  await expect(page.locator(".gameplay-cast")).toContainText("先輩鑑定士");
  await expect(page.locator(".gameplay-cast")).toContainText("田中修一");
});

test("mobile interactive controls keep at least 44px touch targets", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");

  const intakeTargets = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".action-button, .ghost-button, .option-button, .product-menu-button"))
      .filter((node) => node instanceof HTMLElement && node.offsetParent !== null)
      .map((node) => ({ className: node.className, height: node.getBoundingClientRect().height })),
  );
  expect(intakeTargets.length).toBeGreaterThan(0);
  for (const target of intakeTargets) {
    expect(target.height).toBeGreaterThanOrEqual(44);
  }

  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");
  const hotspot = await page.locator("[data-hotspot=wallCrack]").boundingBox();
  expect(hotspot.width).toBeGreaterThanOrEqual(44);
  expect(hotspot.height).toBeGreaterThanOrEqual(44);
});

test("client gameplay reactions are case-specific and not shared filler", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  const lines = await page.evaluate(() => {
    const definitions = window.APPRAISAL_CASE_DATA.caseDefinitions;
    return Object.fromEntries(
      Object.entries(definitions).map(([id, info]) => [id, info.client?.gameplayLines?.report ?? ""]),
    );
  });

  expect(lines.case001).toContain("兄妹");
  expect(lines.case002).toContain("借換");
  expect(lines.case003).toContain("最大容積");
  expect(lines.case004).toContain("担保リスク");
  expect(lines.case006).toContain("底地");
  expect(lines.case008).toContain("FF&E");
  expect(lines.case010).toContain("日本語");
  expect(new Set(Object.values(lines).filter(Boolean)).size).toBeGreaterThanOrEqual(8);
  expect(Object.values(lines)).not.toContain("もう少し言い方で調整できませんか。");
});

test("later commercial cases replace compact template copy with case-specific phase text", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  const copy = await page.evaluate(() => {
    const definitions = window.APPRAISAL_CASE_DATA.caseDefinitions;
    return Object.fromEntries(
      ["case006", "case007", "case008", "case009", "case010"].map((caseId) => {
        const info = definitions[caseId];
        return [
          caseId,
          {
            intake: info.intake.body,
            firstSpot: window.APPRAISAL_CASE_DATA.evidenceCatalog[window.APPRAISAL_CASE_DATA.caseHotspots[caseId][0].id].detail,
            firstDoc: window.APPRAISAL_CASE_DATA.caseDocumentIssues[caseId][0].detail,
            report: info.reportPressure.client,
            scenario: info.marketScenarios[0].title,
          },
        ];
      }),
    );
  });

  expect(copy.case006.intake).toContain("借地人との買取交渉");
  expect(copy.case007.firstSpot).toContain("修繕費");
  expect(copy.case008.firstDoc).toContain("ADR上昇と稼働率低下");
  expect(copy.case009.report).toContain("退去リスク");
  expect(copy.case010.scenario).toContain("為替感応度");

  for (const item of Object.values(copy)) {
    expect(item.intake).not.toContain("依頼者の利害が強く出る評価依頼");
    expect(item.firstSpot).not.toContain("価格判断に影響する。");
    expect(item.firstDoc).not.toContain("依頼者説明だけではなく");
    expect(item.report).not.toContain("表現だけでも調整できませんか");
  }
});

test("scenario demand fallback varies and frames professional discretion", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  const lines = await page.evaluate(() => {
    const engine = window.APPRAISAL_SCENARIO_ENGINE;
    const scenario = { title: "市場条件テスト", appraisalHint: "根拠を厚くする" };
    return [0, 1, 2].map((scenarioIndex) =>
      engine.scenarioClientDemand(scenario, "fallback", {
        scenarioIndex,
        caseInfo: { shortTitle: "テスト案件" },
      }),
    );
  });

  expect(new Set(lines).size).toBe(3);
  expect(lines.join(" ")).toContain("根拠");
  expect(lines.join(" ")).toContain("裁量");
  expect(lines.join(" ")).not.toContain("表現だけでも少し調整できませんか");
});

test("evidence route scoring supports replay research and strict audit penalties", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  const routes = await page.evaluate(() => {
    const scoring = window.APPRAISAL_SCORING;
    const reportStructure = {
      fact: ["rentRoll"],
      analysis: ["capRateGap"],
      conclusion: ["incomeAdjustment"],
    };
    const marketScenario = { supportEvidence: ["rentRoll", "capRateGap"] };
    return {
      optimal: scoring.evaluateEvidenceRoute({
        reportIds: ["rentRoll", "capRateGap", "incomeAdjustment"],
        requiredReport: ["rentRoll", "capRateGap", "incomeAdjustment"],
        highValueCards: ["rentRoll", "capRateGap", "incomeAdjustment"],
        marketScenario,
        reportStructure,
        challengeMode: true,
      }),
      thin: scoring.evaluateEvidenceRoute({
        reportIds: ["rentRoll", "tenantMix", "vacancySign"],
        requiredReport: ["rentRoll", "capRateGap", "incomeAdjustment"],
        highValueCards: ["rentRoll", "capRateGap", "incomeAdjustment"],
        marketScenario,
        reportStructure,
        challengeMode: true,
      }),
      variance: scoring.evaluateScoreVariance({
        awards: [],
        mechanic: { term: "DCR確認", choices: [], input: null },
        adjustmentBand: null,
        marketScenario,
        reportIds: ["rentRoll", "tenantMix", "vacancySign"],
        reportStructure,
        requiredReport: ["rentRoll", "capRateGap", "incomeAdjustment"],
        highValueCards: ["rentRoll", "capRateGap", "incomeAdjustment"],
        challengeMode: true,
      }),
    };
  });

  expect(routes.optimal.level).toBe("optimal");
  expect(routes.optimal.delta).toBeGreaterThan(routes.thin.delta);
  expect(routes.thin.label).toContain("監査リスク");
  expect(routes.variance.label).toContain("別解評価");
});

test("phase transition displays a chapter cut-in before the next scene settles", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=professional]").click();
  await page.getByRole("button", { name: "現地調査へ" }).click();

  await expect(page.locator(".phase-cut-in")).toBeVisible();
  await expect(page.locator(".phase-cut-in")).toContainText("現地調査");
});

test("market scenario changes the case briefing between replays", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "appraisal-detective-records-v1",
      JSON.stringify({
        case001: { completions: 0 },
        case002: { completions: 0 },
        case003: { completions: 1 },
      }),
    );
  });
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case003", "normal");
  await expect(page.locator(".detective-prompt")).toContainText("受ける前の線引き");
  await page.locator("[data-intake=professional]").click();
  await page.getByText("依頼メモを見る").click();

  const marketBrief = page.locator(".brief-grid");
  await expect(marketBrief.getByText("今回の市場条件")).toBeVisible();
  await expect(marketBrief.getByText("高度地区運用が厳格化")).toBeVisible();
  await expect(marketBrief.getByText("用途地域マップと道路後退を支える根拠にする")).toBeVisible();
});

test("third market scenario appears on the third run of the same case", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "appraisal-detective-records-v1",
      JSON.stringify({
        case001: { completions: 0 },
        case002: { completions: 0 },
        case003: { completions: 2 },
      }),
    );
  });
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case003", "normal");
  await expect(page.locator(".detective-prompt")).toContainText("受ける前の線引き");
  await page.locator("[data-intake=professional]").click();
  await page.getByText("依頼メモを見る").click();

  const marketBrief = page.locator(".brief-grid");
  await expect(marketBrief.getByText("浸水対策費が事業収支を圧迫")).toBeVisible();
  await expect(marketBrief.getByText("浸水履歴とインフラ負担を支える根拠にする")).toBeVisible();
});

test("document review uses an overlay desk metaphor before moving to appraisal", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  for (const id of ["wallCrack", "boundary", "tower"]) {
    await page.locator(`[data-hotspot=${id}]`).click();
  }
  await advancePhase(page, "資料照合へ");

  await expect(page.locator(".document-overlay-desk")).toBeVisible();
  await expect(page.locator(".document-overlay-desk")).toContainText("照合デスク");
  await expect(page.locator(".document-overlay-desk")).toContainText("未照合");

  await page.locator("[data-doc=areaMismatch]").evaluate((source) => {
    const dataTransfer = new DataTransfer();
    source.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer }));
    document
      .querySelector("[data-doc-dropzone]")
      ?.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
  });
  await expect(page.locator(".document-overlay-desk")).toContainText("監査スタンプ");
  await expect(page.locator(".document-overlay-desk")).toContainText("対象不動産の確定");
});

test("appraisal phase shows an explainable discretion range before report", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  for (const id of ["wallCrack", "boundary", "tower"]) {
    await page.locator(`[data-hotspot=${id}]`).click();
  }
  await advancePhase(page, "資料照合へ");
  await page.locator("[data-doc=areaMismatch]").click();
  await page.locator("[data-doc=specialTransaction]").click();
  await advancePhase(page, "鑑定判断へ");

  await expect(page.locator(".discretion-meter")).toBeVisible();
  await expect(page.locator(".discretion-meter")).toContainText("説明可能な裁量レンジ");
  await expect(page.locator(".discretion-meter")).toContainText("未選択");

  await page.locator("[data-adjustment-band=balanced]").click();
  await expect(page.locator(".discretion-meter")).toContainText("説明可能レンジ内");
  await expect(page.locator(".discretion-meter")).toContainText("根拠");
  await expect(page.locator(".discretion-meter")).toContainText("今回条件");
});

test("final review exposes market scenario mastery for replay study", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "appraisal-detective-records-v1",
      JSON.stringify({
        case003: { completions: 2 },
      }),
    );
  });

  await completeCase(page, "case003", "normal");

  await expect(page.locator(".scenario-result-panel")).toBeVisible();
  await expect(page.locator(".scenario-result-panel")).toContainText("市場シナリオ 3/3");
  await expect(page.locator(".scenario-result-panel")).toContainText("浸水対策費が事業収支を圧迫");
  await expect(page.locator(".scenario-result-panel")).toContainText("重点証拠達成率");
  await expect(page.locator(".scenario-result-panel")).toContainText("seed 案件 003-normal-S3-R3");
  await expect(page.locator(".alternative-route-panel")).toBeVisible();
  await expect(page.locator(".alternative-route-panel")).toContainText("代替証拠評価");
  await expect(page.locator(".alternative-route-panel")).toContainText(/最適構成|許容構成|監査リスクあり/);
  await expect(page.locator(".alternative-route-panel")).toContainText("現在の三枚");
  await expect(page.locator(".alternative-route-panel")).toContainText("別解候補");
  await expect(page.locator(".alternative-route-panel")).toContainText("監査リスク");
  await expect(page.locator(".replay-brief")).toContainText("今回シナリオ");

  await page.getByRole("button", { name: "案件選択へ" }).click();
  await revealStory(page);
  await page.getByRole("button", { name: "記録", exact: true }).click();
  await expect(page.locator(".product-panel")).toContainText("市場シナリオ 1/3踏破");
  await expect(page.locator(".product-panel")).toContainText("seed 案件 003-normal-S3-R3");
});

test("numeric document mechanic rewards a correct area conversion", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  for (const id of ["wallCrack", "boundary", "tower"]) {
    await page.locator(`[data-hotspot=${id}]`).click();
  }
  await advancePhase(page, "資料照合へ");

  await expect(page.getByText("登記地積を坪へ概算入力")).toBeVisible();
  await page.locator("[data-mechanic-input=areaTsubo]").fill("55.0");
  await page.locator("[data-mechanic-check]").click();

  await expect(page.locator(".mechanic-result.success")).toContainText("181.81平方メートルは約55.0坪");
  await expect(page.locator("#mentor-log")).toContainText("面積不一致");
});

test("numeric document mechanic teaches when NOI is overestimated", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case002", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  for (const id of ["tenantMix", "vacancySign", "repairBacklog"]) {
    await page.locator(`[data-hotspot=${id}]`).click();
  }
  await advancePhase(page, "資料照合へ");

  await page.locator("[data-mechanic-input=stabilizedNoiInput]").fill("1620");
  await page.locator("[data-mechanic-check]").click();

  await expect(page.locator(".learning-card").getByText("DCR確認")).toBeVisible();
  await expect(page.locator(".mechanic-result.warning")).toContainText("満室NOI 1,620万円");
});

test("case003 visual zoning mechanic accepts a realistic floor limit", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case003", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  for (const id of ["tenantRights", "narrowAlley", "zoningMismatch"]) {
    await page.locator(`[data-hotspot=${id}]`).click();
  }
  await advancePhase(page, "資料照合へ");

  await expect(page.locator(".zoning-visual")).toContainText("依頼者案 14F");
  await expect(page.locator(".zoning-visual")).toContainText("実現目安 10F");
  await page.locator("[data-mechanic-input=legalFloorInput]").fill("10");
  await page.locator("[data-mechanic-check]").click();

  await expect(page.locator(".mechanic-result.success")).toContainText("10階前後");
  await expect(page.locator("#mentor-log")).toContainText("最大容積案");
});

test("dummy document returns a learning card without adding evidence", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case003", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  for (const id of ["tenantRights", "narrowAlley", "zoningMismatch"]) {
    await page.locator(`[data-hotspot=${id}]`).click();
  }
  await advancePhase(page, "資料照合へ");
  await expect(page.locator("#evidence-count")).toHaveText("5枚");

  await page.locator("[data-doc-decoy=pressRelease]").click();
  await expect(page.locator(".learning-card").getByText("資料の関連性")).toBeVisible();
  await expect(page.locator("#evidence-count")).toHaveText("5枚");
});

test("wrong appraisal choices return a learning card", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case002", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  for (const id of ["tenantMix", "vacancySign", "repairBacklog"]) {
    await page.locator(`[data-hotspot=${id}]`).click();
  }
  await advancePhase(page, "資料照合へ");

  for (const id of ["rentRoll", "expenseLeak"]) {
    await page.locator(`[data-doc=${id}]`).click();
  }
  await advancePhase(page, "鑑定判断へ");

  await page.locator("[data-comparable=C]").click();
  await expect(page.locator(".learning-card").getByText("学びカード")).toBeVisible();
  await expect(page.locator(".learning-card").getByText("査定方式の選択")).toBeVisible();
});

test("adjustment band and support evidence are required before report", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  for (const id of ["wallCrack", "boundary", "tower"]) {
    await page.locator(`[data-hotspot=${id}]`).click();
  }
  await advancePhase(page, "資料照合へ");
  for (const id of ["areaMismatch", "specialTransaction"]) {
    await page.locator(`[data-doc=${id}]`).click();
  }
  await advancePhase(page, "鑑定判断へ");

  await page.locator("[data-comparable=A]").click();
  await page.locator("[data-adjustment=risk]").click();
  await expect(page.getByRole("button", { name: "報告・対決へ" })).toBeDisabled();
  await page.locator("[data-adjustment-band=balanced]").click();
  await expect(page.getByRole("button", { name: "報告・対決へ" })).toBeDisabled();
  await expect(page.locator(".support-picker")).toContainText("調整幅を支える");
  await page.locator("[data-adjustment-support=areaMismatch]").click();
  await page.locator("[data-adjustment-support=boundary]").click();
  await expect(page.getByRole("button", { name: "報告・対決へ" })).toBeEnabled();
});

test("field survey includes decoy hotspots that teach factor selection", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  await page.locator("[data-decoy=gardenLantern]").click();
  await expect(page.locator(".learning-card").getByText("学びカード")).toBeVisible();
  await expect(page.locator(".learning-card").getByText("評価根拠の選別")).toBeVisible();
  const learningText = await page.locator(".learning-card").textContent();
  expect(learningText.match(/価格形成要因/g) ?? []).toHaveLength(1);
  await expect(page.locator("#mentor-log")).not.toContainText("価格形成要因");
  await expect(page.locator("#evidence-count")).toHaveText("2枚");
  await expect(page.getByText("あと3か所発見")).toBeVisible();
});

test("report confrontation shows client rebuttals to selected evidence", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case002", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  for (const id of ["tenantMix", "vacancySign", "repairBacklog"]) {
    await page.locator(`[data-hotspot=${id}]`).click();
  }
  await advancePhase(page, "資料照合へ");

  for (const id of ["rentRoll", "expenseLeak", "capRateGap"]) {
    await page.locator(`[data-doc=${id}]`).click();
  }
  await advancePhase(page, "鑑定判断へ");
  await page.locator("[data-comparable=A]").click();
  await page.locator("[data-adjustment=risk]").click();
  await page.locator("[data-adjustment-band=stabilized]").click();
  await page.locator("[data-adjustment-support=rentRoll]").click();
  await page.locator("[data-adjustment-support=capRateGap]").click();
  await advancePhase(page, "報告・対決へ");

  await page.locator("#evidence-board [data-evidence=capRateGap]").click();
  await expect(page.getByText("駅前物件なのに5%台の利回りで見るんですか")).toBeVisible();
});

test("report rebuttal requires a supported evidence answer", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case003", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  for (const id of ["tenantRights", "narrowAlley", "zoningMismatch"]) {
    await page.locator(`[data-hotspot=${id}]`).click();
  }
  await advancePhase(page, "資料照合へ");
  for (const id of ["zoningCheck", "relocationCost"]) {
    await page.locator(`[data-doc=${id}]`).click();
  }
  await advancePhase(page, "鑑定判断へ");
  await page.locator("[data-comparable=A]").click();
  await page.locator("[data-adjustment=risk]").click();
  await page.locator("[data-adjustment-band=legalDiscount]").click();
  await page.locator("[data-adjustment-support=zoningCheck]").click();
  await page.locator("[data-adjustment-support=relocationCost]").click();
  await advancePhase(page, "報告・対決へ");

  for (const id of ["zoningCheck", "relocationCost", "bestUseAdjustment"]) {
    await page.locator(`#evidence-board [data-evidence=${id}]`).click();
  }
  await expect(page.locator(".rebuttal-answer")).toContainText("高度地区・斜線制限で再反論");
  await page.locator("[data-rebuttal=legalConstraint]").click();
  await expect(page.locator("[data-rebuttal=legalConstraint]")).toHaveClass(/selected/);
  await expect(page.locator("#mentor-log")).toContainText("次に");
  await page.locator("[data-ethics=neutral]").click();
  await expect(page.getByRole("button", { name: "最終レビューを見る" })).toHaveClass(/needs-steps/);
  await page.getByRole("button", { name: "最終レビューを見る" }).click();
  await expect(page.locator("#mentor-log")).toContainText("反論根拠カードを選ぶ");
  await page.locator("[data-rebuttal-evidence=zoningCheck]").click();
  await expect(page.locator("#mentor-log")).toContainText("つながった");
  await expect(page.locator('[data-testid="rebuttal-proof-highlight"]')).toContainText("押し返した根拠");
  await expect(page.locator('[data-testid="rebuttal-proof-highlight"]')).toContainText("高度地区・斜線制限を確認");
  await expect(page.locator('[data-testid="rebuttal-proof-highlight"]')).toContainText("法令上実現可能な建物ボリューム");
  await expect(page.locator('[data-testid="rebuttal-beat"]')).toContainText("黒川航が、計画図ではなく道路条件の資料を見る");
  await expect(page.locator(".rebuttal-resolution")).toContainText("地権者にどう伝えるかはまだ重い");
  await expect(page.getByRole("button", { name: "最終レビューを見る" })).not.toHaveClass(/needs-steps/);
});

test("low stimulus toggle persists and suppresses pressure flash", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await expect(page.locator('meta[name="appraisal-low-stimulus-storage-key"]')).toHaveAttribute(
    "content",
    "appraisal-detective-low-stimulus",
  );
  const toggle = page.locator("#stimulus-toggle");
  await expect(toggle).toHaveText("低刺激 OFF");
  await expect(toggle).toHaveAttribute("aria-label", /すべての効果音/);
  await toggle.click();
  await expect(toggle).toHaveText("低刺激 ON");
  await expect(page.locator("body")).toHaveClass(/low-stimulus/);

  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=pressure]").click();
  await expect(page.locator("body")).not.toHaveClass(/pressure-flash/);
  await advancePhase(page, "現地調査へ");
  await page.locator("[data-hotspot=wallCrack]").click();
  await expect(page.locator("body")).not.toHaveClass(/evidence-flash/);

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#stimulus-toggle")).toHaveText("低刺激 ON");
  await expect(page.locator("body")).toHaveClass(/low-stimulus/);
});

test("low stimulus suppresses every procedural sound", async ({ page }) => {
  await page.addInitScript(() => {
    window.__oscillatorStarts = 0;
    class FakeAudioContext {
      constructor() {
        this.state = "running";
        this.currentTime = 0;
        this.destination = {};
      }

      resume() {}

      createOscillator() {
        return {
          type: "sine",
          frequency: { setValueAtTime() {} },
          connect() {},
          start() {
            window.__oscillatorStarts += 1;
          },
          stop() {},
        };
      }

      createGain() {
        return {
          gain: {
            setValueAtTime() {},
            exponentialRampToValueAtTime() {},
          },
          connect() {},
        };
      }
    }

    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
  });

  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await page.locator("#stimulus-toggle").click();
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=pressure]").click();
  await advancePhase(page, "現地調査へ");
  await page.locator("[data-hotspot=wallCrack]").click();
  await page.waitForTimeout(120);

  await expect.poll(() => page.evaluate(() => window.__oscillatorStarts)).toBe(0);
});

test("low stimulus keeps report card selection animation without board pulse", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await page.locator("#stimulus-toggle").click();
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  for (const id of ["wallCrack", "boundary", "tower"]) {
    await page.locator(`[data-hotspot=${id}]`).click();
  }
  await advancePhase(page, "資料照合へ");

  for (const id of ["areaMismatch", "specialTransaction", "timeAdjustment"]) {
    await page.locator(`[data-doc=${id}]`).click();
  }
  await advancePhase(page, "鑑定判断へ");

  await page.locator("[data-comparable=A]").click();
  await page.locator("[data-adjustment=risk]").click();
  await page.locator("[data-adjustment-band=balanced]").click();
  await page.locator("[data-adjustment-support=areaMismatch]").click();
  await page.locator("[data-adjustment-support=boundary]").click();
  await advancePhase(page, "報告・対決へ");

  const sidePanelTransform = await page.locator(".side-panel").evaluate((node) => window.getComputedStyle(node).transform);
  await page.locator("#evidence-board [data-evidence=areaMismatch]").click();
  const slam = page.locator(".evidence-slam").filter({ hasText: "証拠提示" });
  await expect(slam).toBeVisible();
  await expect(slam).toHaveCSS("animation-name", "evidence-slam");
  await expect(page.locator("body")).not.toHaveClass(/evidence-flash/);
  await expect(page.locator(".side-panel")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".side-panel")).toHaveCSS("transform", sidePanelTransform);
});

test("overlays are announced through the live region", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");
  await page.locator("[data-hotspot=wallCrack]").click();

  await expect(page.locator("#sr-announcer")).toContainText("証拠取得");
  await expect(page.locator("#sr-announcer")).toContainText("外壁劣化");
  await expect(page.locator("#sr-announcer")).toHaveAttribute("aria-live", "polite");
});

test("evidence and learning overlays use compact popup timing", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  await page.locator("[data-hotspot=wallCrack]").click();
  await expect(page.locator(".evidence-pop").getByText("外壁劣化")).toBeVisible();
  await page.waitForTimeout(450);
  await expect(page.locator(".evidence-pop").getByText("外壁劣化")).toBeVisible();
  await expect(page.locator(".evidence-pop")).toHaveCount(0, { timeout: 1200 });

  await page.locator("[data-decoy=gardenLantern]").click();
  await expect(page.locator(".learning-card").getByText("評価根拠の選別")).toBeVisible();
  await page.waitForTimeout(650);
  await expect(page.locator(".learning-card").getByText("評価根拠の選別")).toBeVisible();
  await expect(page.locator(".learning-card")).toHaveCount(0, { timeout: 1200 });
});

test("card popup animation fades in gradually instead of snapping on", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  await page.locator("[data-hotspot=wallCrack]").click();
  const evidencePop = page.locator(".evidence-pop").filter({ hasText: "外壁劣化" });
  await expect(evidencePop.getByText("外壁劣化")).toBeVisible();
  await page.waitForTimeout(90);
  const earlyOpacity = await evidencePop.evaluate((node) => Number(window.getComputedStyle(node).opacity));
  expect(earlyOpacity).toBeGreaterThan(0);
  expect(earlyOpacity).toBeLessThan(0.9);
  await page.waitForTimeout(520);
  const settledOpacity = await evidencePop.evaluate((node) => Number(window.getComputedStyle(node).opacity));
  expect(settledOpacity).toBeGreaterThan(0.9);
});

test("pressure and mentor feedback complete without scaling the evidence board", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");

  await page.locator("[data-intake=pressure]").click();
  await expect(page.locator("body")).toHaveClass(/pressure-flash/);
  await expect(page.locator("#mentor-log")).toHaveClass(/updated/);
  await page.waitForTimeout(650);
  await expect(page.locator("body")).toHaveClass(/pressure-flash/);
  await expect(page.locator("#mentor-log")).toHaveClass(/updated/);
  await page.waitForTimeout(700);
  await expect(page.locator("body")).not.toHaveClass(/pressure-flash/);
  await expect(page.locator("#mentor-log")).not.toHaveClass(/updated/);

  await advancePhase(page, "現地調査へ");
  const sidePanelTransform = await page.locator(".side-panel").evaluate((node) => window.getComputedStyle(node).transform);
  await page.locator("[data-hotspot=wallCrack]").click();
  await expect(page.locator("body")).toHaveClass(/evidence-flash/);
  await expect(page.locator(".side-panel")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".side-panel")).toHaveCSS("transform", sidePanelTransform);
  await page.waitForTimeout(650);
  await expect(page.locator("body")).toHaveClass(/evidence-flash/);
  await expect(page.locator(".side-panel")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".side-panel")).toHaveCSS("transform", sidePanelTransform);
  await page.waitForTimeout(700);
  await expect(page.locator("body")).not.toHaveClass(/evidence-flash/);
});

test("reduced motion keeps overlay content readable without fast removal", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");

  await page.locator("[data-hotspot=wallCrack]").click();
  await page.waitForTimeout(300);
  await expect(page.locator(".evidence-pop").getByText("外壁劣化")).toBeVisible();
});

test("learning cards use the assertive alert region", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=professional]").click();
  await advancePhase(page, "現地調査へ");
  await page.locator("[data-decoy=gardenLantern]").click();

  await expect(page.locator("#sr-alert")).toHaveAttribute("aria-live", "assertive");
  await expect(page.locator("#sr-alert")).toContainText("学びカード");
  await expect(page.locator("#sr-alert")).toContainText("評価根拠の選別");
});

test("phase changes focus the title before the story gate reveals controls", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await startCase(page, "case001", "normal");
  await page.locator("[data-intake=professional]").click();
  await page.getByRole("button", { name: "現地調査へ" }).click();

  await expect(page.locator("#phase-title")).toBeFocused();
  await revealStory(page);
  await expect(page.locator("[data-hotspot=wallCrack]")).toBeFocused();
});

test("SE toggle is persistent and accessible", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  const toggle = page.locator("#audio-toggle");
  await expect(toggle).toHaveText("SE ON");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await toggle.click();
  await expect(toggle).toHaveText("SE OFF");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#audio-toggle")).toHaveText("SE OFF");
  await expect(page.locator("#audio-toggle")).toHaveAttribute("aria-pressed", "false");
});

test("BGM toggle persists and low stimulus suppresses playback state", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  const toggle = page.locator("#bgm-toggle");
  await expect(toggle).toHaveText("BGM 待機中");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await toggle.click();
  await expect(toggle).toHaveText("BGM 停止中");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#bgm-toggle")).toHaveText("BGM 停止中");
  await expect(page.locator("#bgm-toggle")).toHaveAttribute("aria-pressed", "false");

  await page.locator("#bgm-toggle").click();
  await page.locator("#stimulus-toggle").click();
  await expect(page.locator("#bgm-toggle")).toHaveText("BGM 低刺激で停止");
  await expect(page.locator("#bgm-toggle")).toHaveAttribute("aria-label", "BGMはオンですが、低刺激モードにより停止中です");
});

test("VOICE toggle persists and reads dialogue with character voice profiles", async ({ page }) => {
  await installVoiceStub(page);
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await expect(page.locator("#voice-toggle")).toHaveText("VOICE 待機中");

  await page.getByRole("heading", { name: "鑑定DE探偵" }).click();
  await expect.poll(() => page.evaluate(() => window.__voiceCalls.filter((call) => call.text).length)).toBeGreaterThan(0);
  const firstLine = await page.evaluate(() => window.__voiceCalls.find((call) => call.text));
  expect(firstLine.text).toContain("依頼ファイルを開く");
  expect(firstLine.pitch).toBeGreaterThan(1);
  expect(firstLine.rate).toBeGreaterThan(1.1);
  expect(firstLine.rate).toBeLessThanOrEqual(1.18);
  expect(firstLine.voice).toContain("Otoya");
  await expect(page.locator("#voice-toggle")).toContainText(/VOICE (代替音声|有効)/);

  await page.locator("[data-novel-next]").click();
  await expect.poll(() =>
    page.evaluate(() => window.__voiceCalls.some((call) => call.text?.includes("数字の裏には、人の都合"))),
  ).toBe(true);
  const mentorLine = await page.evaluate(() =>
    window.__voiceCalls.find((call) => call.text?.includes("数字の裏には、人の都合")),
  );
  expect(mentorLine.text).toContain("数字の裏には、人の都合");
  expect(mentorLine.pitch).toBeLessThan(0.95);
  expect(mentorLine.voice).toContain("Otoya");
  await expect.poll(() =>
    page.evaluate(() => window.__voiceCalls.some((call) => call.text?.includes("希望ではなく根拠に戻ろう"))),
  ).toBe(true);
  const mentorParts = await page.evaluate(() => window.__voiceCalls.filter((call) => call.text?.includes("希望ではなく根拠に戻ろう")));
  expect(mentorParts.length).toBeGreaterThan(0);
  expect(mentorParts[0].rate).toBeLessThanOrEqual(1);

  await page.locator("#voice-toggle").click();
  await expect(page.locator("#voice-toggle")).toHaveText("VOICE 停止中");
  await expect(page.locator("#voice-toggle")).toHaveAttribute("aria-pressed", "false");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#voice-toggle")).toHaveText("VOICE 停止中");
  await expect(page.locator("#voice-toggle")).toHaveAttribute("aria-pressed", "false");
});

test("VOICE prefers local VOICEVOX Engine audio through the production proxy", async ({ page }) => {
  await installVoicevoxStub(page);
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });

  const clickAt = await page.evaluate(() => performance.now());
  await page.getByRole("heading", { name: "鑑定DE探偵" }).click();
  await expect.poll(() => page.evaluate(() => window.__voicevoxCalls.some((call) => call.path === "/voicevox/synthesis"))).toBe(true);
  await expect.poll(() =>
    page.evaluate(() =>
      window.__voicevoxCalls.some((call) => call.path === "/voicevox/audio_query" && call.text?.includes("依頼ファイルを開く")),
    ),
  ).toBe(true);
  const playerQuery = await page.evaluate(() =>
    window.__voicevoxCalls.find((call) => call.path === "/voicevox/audio_query" && call.text?.includes("依頼ファイルを開く")),
  );
  expect(playerQuery.speaker).toBe("52");
  await expect.poll(() =>
    page.evaluate(() => Boolean(window.__voicevoxCalls.find((call) => call.path === "/voicevox/synthesis" && call.speaker === "52"))),
  ).toBe(true);
  const playerSynthesis = await page.evaluate(() =>
    window.__voicevoxCalls.find((call) => call.path === "/voicevox/synthesis" && call.speaker === "52"),
  );
  expect(playerSynthesis.query.speedScale).toBeGreaterThan(1.1);
  expect(playerSynthesis.query.speedScale).toBeLessThanOrEqual(1.18);
  expect(playerSynthesis.query.pitchScale).toBeGreaterThan(0);
  expect(playerSynthesis.query.intonationScale).toBeGreaterThan(1);
  expect(playerSynthesis.query.intonationScale).toBeLessThan(1.25);
  await expect(page.locator("#voice-toggle")).toContainText(/VOICE VOICEVOX/);
  await expect.poll(() => page.evaluate(() => window.__voicevoxCalls.find((call) => call.path === "play" && call.src?.startsWith("blob:voicevox-"))?.at)).toBeGreaterThan(0);
  const firstPlayAt = await page.evaluate(() => window.__voicevoxCalls.find((call) => call.path === "play" && call.src?.startsWith("blob:voicevox-")).at);
  expect(firstPlayAt - clickAt).toBeGreaterThan(350);
  expect(firstPlayAt - clickAt).toBeLessThan(1000);
  const playerDebug = await page.evaluate(() =>
    window.APPRAISAL_AUDIO.voiceDebugLog.find((entry) => entry.backend === "voicevox" && entry.castId === "player"),
  );
  expect(playerDebug.speakerName).toBe("雀松朱司");
  expect(playerDebug.styleName).toBe("ノーマル");
  expect(playerDebug.styleName).not.toMatch(/ささやき|ヒソヒソ|囁き|内緒話/);
  const narratorPlan = await page.evaluate(() =>
    window.APPRAISAL_AUDIO.buildUtterancePlan({
      kind: "narrator",
      text: "第一章 / 依頼ファイル",
    }),
  );
  expect(narratorPlan.fallbackProfile.pitch).toBeLessThan(playerDebug.profile.pitch);
  expect(narratorPlan.fallbackProfile.rate).toBeCloseTo(1.25, 2);
  const longNarratorPlan = await page.evaluate(() =>
    window.APPRAISAL_AUDIO.buildUtterancePlan({
      kind: "narrator",
      text: "相続協議の依頼。田中は、低い評価額を避けたがっている。比較できる資料で線引きをして、希望額と評価根拠を分ける。",
    }),
  );
  expect(longNarratorPlan.fallbackProfile.rate).toBeCloseTo(1.25, 2);
  const narratorStyle = await page.evaluate(async () =>
    window.APPRAISAL_AUDIO.resolveVoicevoxStyle({ castId: "narrator", emotion: "scene_set" }),
  );
  expect(narratorStyle.speakerName).toBe("九州そら");
  expect(narratorStyle.name).toBe("ノーマル");
  expect(narratorStyle.speakerName).not.toBe(playerDebug.speakerName);
  await page.evaluate(() =>
    window.APPRAISAL_AUDIO.speakLines([{ kind: "narrator", text: "第一章 / 依頼ファイル" }], {
      key: "test-narrator-speed",
    }),
  );
  await expect.poll(() =>
    page.evaluate(() =>
      Boolean(
        window.APPRAISAL_AUDIO.voiceDebugLog.find(
          (entry) => entry.backend === "voicevox" && entry.castId === "narrator" && entry.phraseText.includes("第一章"),
        ),
      ),
    ),
  ).toBe(true);
  const narratorDebug = await page.evaluate(() =>
    window.APPRAISAL_AUDIO.voiceDebugLog.find(
      (entry) => entry.backend === "voicevox" && entry.castId === "narrator" && entry.phraseText.includes("第一章"),
    ),
  );
  expect(narratorDebug.profile.rate).toBeCloseTo(1.25, 2);
  const narratorSynthesis = await page.evaluate(() =>
    window.__voicevoxCalls.find((call) => call.path === "/voicevox/synthesis" && call.speaker === "16" && call.query?.speedScale === 1.25),
  );
  expect(narratorSynthesis.query.speedScale).toBeCloseTo(1.25, 2);
  const tanakaPlan = await page.evaluate(() =>
    window.APPRAISAL_AUDIO.buildUtterancePlan({
      kind: "client",
      portraitClass: "portrait-tanaka",
      text: "本当にその評価額になるんですか。",
    }),
  );
  expect(tanakaPlan.castId).toBe("elderlyClient");
  expect(tanakaPlan.fallbackProfile.pitch).toBeGreaterThan(0.85);
  expect(tanakaPlan.fallbackProfile.rate).toBeLessThanOrEqual(1);
  const tanakaStyle = await page.evaluate(async () => {
    const plan = window.APPRAISAL_AUDIO.buildUtterancePlan({
      kind: "client",
      portraitClass: "portrait-tanaka",
      text: "本当にその評価額になるんですか。",
    });
    return window.APPRAISAL_AUDIO.resolveVoicevoxStyle({ castId: plan.castId, emotion: plan.emotion });
  });
  expect(tanakaStyle.speakerName).toBe("玄野武宏");
  expect(tanakaStyle.name).toBe("ノーマル");

  await page.locator("[data-novel-next]").click();
  await expect.poll(() =>
    page.evaluate(() =>
      window.__voicevoxCalls.some(
        (call) => call.path === "/voicevox/audio_query" && call.speaker === "13" && call.text?.includes("数字の裏には、人の都合"),
      ),
    ),
  ).toBe(true);
  await expect.poll(() =>
    page.evaluate(() =>
      Boolean(
        window.APPRAISAL_AUDIO.voiceDebugLog.find(
          (entry) => entry.backend === "voicevox" && entry.castId === "mentor" && entry.phraseText.includes("根拠"),
        ),
      ),
    ),
  ).toBe(true);
  const mentorDebug = await page.evaluate(() =>
    window.APPRAISAL_AUDIO.voiceDebugLog.find((entry) => entry.backend === "voicevox" && entry.castId === "mentor" && entry.phraseText.includes("根拠")),
  );
  expect(mentorDebug.speakerName).toBe("青山龍星");
  expect(mentorDebug.styleName).toBe("ノーマル");
  expect(mentorDebug.styleName).not.toMatch(/ささやき|ヒソヒソ|囁き|内緒話|不機嫌|ツンギレ|おこ|熱血/);
  expect(mentorDebug.emotion).toBe("stern_correction");
  expect(mentorDebug.phraseCount).toBeLessThanOrEqual(2);
  expect(mentorDebug.spokenText).toContain("数字の裏には");
  expect(mentorDebug.profile.rate).toBeLessThanOrEqual(1);
  const sternPlan = await page.evaluate(() =>
    window.APPRAISAL_AUDIO.buildUtterancePlan({
      kind: "mentor",
      text: "数字の裏に人の都合がある。だが、鑑定評価は同情ではなく根拠で切り分けろ。",
    }),
  );
  expect(sternPlan.phraseCount).toBe(2);
  expect(sternPlan.spokenText).toContain("……だが");
  expect(sternPlan.spokenText).toContain("根拠で分ける");
  expect(sternPlan.spokenText).toContain("希望では分けない");
  expect(sternPlan.spokenText).not.toContain("切り分けろ");
});

test("VOICE does not fall back to the light player VOICEVOX speaker when Akamatsu is missing", async ({ page }) => {
  await installVoicevoxStub(page, { includePlayerSpeaker: false });
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });

  await page.getByRole("heading", { name: "鑑定DE探偵" }).click();
  await expect.poll(() => page.evaluate(() => window.__voicevoxCalls.some((call) => call.path === "/voicevox/speakers"))).toBe(true);
  await expect.poll(() => page.evaluate(() => window.APPRAISAL_AUDIO.voiceStatusLabel())).toBe("代替音声");
  const voicevoxQueries = await page.evaluate(() => window.__voicevoxCalls.filter((call) => call.path === "/voicevox/audio_query"));
  expect(voicevoxQueries.some((call) => call.text?.includes("依頼ファイルを開く"))).toBe(false);
  expect(voicevoxQueries.some((call) => call.speaker === "12")).toBe(false);
});

test("settings panel uses the same readable status vocabulary as the top bar", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await revealStory(page);

  await page.getByRole("button", { name: "設定" }).click();
  await expect(page.locator(".product-panel")).toContainText("BGM");
  await expect(page.locator(".product-panel")).toContainText("現在 再生中");
  await expect(page.locator(".product-panel")).toContainText("現在 有効");
  await expect(page.locator(".product-panel")).toContainText("現在 無効");

  await page.getByRole("button", { name: "閉じる" }).click();
  await page.locator("#stimulus-toggle").click();
  await page.getByRole("button", { name: "設定" }).click();
  await expect(page.locator(".product-panel")).toContainText("現在 低刺激で停止");
  await expect(page.locator(".product-panel")).toContainText("現在 有効");
});
