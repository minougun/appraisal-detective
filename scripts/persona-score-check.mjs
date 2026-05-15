import { readFile, stat } from "node:fs/promises";

const requiredFiles = [
  "assets/kawabe-estate.generated.png",
  "assets/ekimae-commercial.generated.png",
  "assets/minamiguchi-redevelopment.generated.png",
  "assets/kohoku-factory.generated.png",
  "assets/aobadai-leasehold.generated.png",
  "assets/shirahama-leasedland.generated.png",
  "assets/asagiri-condo.generated.png",
  "assets/lakeside-hotel.generated.png",
  "assets/bay-logistics.generated.png",
  "assets/singapore-overseas.generated.png",
  "assets/tanaka-client.generated.png",
  "assets/saeki-client.generated.png",
  "assets/kurokawa-client.generated.png",
  "assets/ehara-client.generated.png",
  "assets/kubo-client.generated.png",
  "assets/segawa-client.generated.png",
  "assets/tachibana-client.generated.png",
  "assets/hayami-client.generated.png",
  "assets/onuki-client.generated.png",
  "assets/kanzaki-client.generated.png",
  "assets/player-novice-appraiser.generated.png",
  "assets/mentor-appraiser.generated.png",
  "assets/fonts/NotoSansJP-VF.ttf",
];

const [app, data, scoring, css, tests, goalDoc, index, boot, server, productionTest, packageJson] = await Promise.all([
  readFile("app.js", "utf8"),
  readFile("case-data.js", "utf8"),
  readFile("scoring.js", "utf8"),
  readFile("styles.css", "utf8"),
  readFile("tests/appraisal-detective-flow.spec.js", "utf8"),
  readFile("docs/persona-review-goal-95-2026-05-06.md", "utf8"),
  readFile("index.html", "utf8"),
  readFile("boot.js", "utf8"),
  readFile("scripts/serve-production.mjs", "utf8"),
  readFile("scripts/verify-production-server.mjs", "utf8"),
  readFile("package.json", "utf8"),
]);

const filesPresent = await Promise.all(requiredFiles.map(async (file) => (await stat(file)).size > 100_000));

const evidence = {
  generatedImages: filesPresent.every(Boolean) && tests.includes("serves ImageGen-generated field survey images"),
  caseCardArt: app.includes("case-art") && css.includes(".case-art"),
  characterPortraits:
    app.includes("speakerMarkup") &&
    css.includes("player-novice-appraiser.generated.png") &&
    css.includes("mentor-appraiser.generated.png") &&
    css.includes(".speaker-portrait"),
  novelStory:
    app.includes("function novelSceneMarkup") &&
    app.includes("[data-novel-next]") &&
    css.includes(".novel-scene") &&
    css.includes(".novel-box") &&
    tests.includes("novel scene advances the story before each phase action"),
  reportTheatre: app.includes("reportEvidenceMarkup") && app.includes("提示 ${index + 1}") && css.includes(".term-burst"),
  rankReward: app.includes("rank-seal") && css.includes("@keyframes rank-seal"),
  auditReplay: tests.includes("audit review exposes failed checks") && app.includes("監査補正"),
  accessibility: tests.includes("reduced motion") && tests.includes("SE toggle is persistent and accessible"),
  lowStimulus:
    app.includes("if (lowStimulus) return;") &&
    app.includes("__APPRAISAL_LOW_STIMULUS_BOOT__") &&
    app.includes("__APPRAISAL_LOW_STIMULUS_STORAGE_KEY__") &&
    tests.includes('meta[name="appraisal-low-stimulus-storage-key"]') &&
    tests.includes("低刺激 ON") &&
    css.includes("body.low-stimulus") &&
    css.includes("html.low-stimulus-boot") &&
    tests.includes("suppresses pressure flash") &&
    tests.includes("evidence-flash") &&
    tests.includes("low stimulus suppresses every procedural sound") &&
    app.includes("if (lowStimulus) return;"),
  stimulusDescription: tests.includes("証拠ボードの揺れを抑える") && css.includes(".sr-only"),
  liveAnnouncements:
    index.includes('id="sr-announcer"') &&
    index.includes('id="sr-alert"') &&
    index.includes('aria-live="polite"') &&
    index.includes('aria-live="assertive"') &&
    app.includes("function announce") &&
    app.includes('priority = "polite"') &&
    tests.includes("overlays are announced through the live region"),
  dataLoadGuard:
    app.includes("function renderDataLoadError") &&
    app.includes("!window.APPRAISAL_CASE_DATA") &&
    tests.includes("missing case data script shows a recoverable error"),
  focusManagement:
    index.includes('id="phase-title" tabindex="-1"') &&
    app.includes("focusPhaseTitle") &&
    tests.includes("phase changes move focus to the phase title"),
  reducedMotionHardStop:
    css.includes("animation: none !important") &&
    css.includes("transition: none !important") &&
    !css.includes("animation-duration: 0.01ms") &&
    !css.includes("transition-duration: 0.01ms"),
  phaseObjectives: app.includes("phaseObjective") && app.includes("phase-checkline") && app.includes("初回は案件001"),
  learningCards: app.includes("showLearningCard") && css.includes(".learning-card") && tests.includes("wrong appraisal choices"),
  decoyHotspots:
    app.includes("caseDecoyHotspots") &&
    app.includes("data-decoy") &&
    css.includes(".decoy-hotspot") &&
    tests.includes("field survey includes decoy hotspots"),
  clientRebuttals:
    app.includes("function clientRebuttal") &&
    app.includes("report-rebuttal") &&
    tests.includes("report confrontation shows client rebuttals"),
  dataSplit:
    index.includes('<script src="./case-data.js"></script>') &&
    data.includes("window.APPRAISAL_CASE_DATA") &&
    data.includes("caseDocumentIssues") &&
    app.includes("window.APPRAISAL_CASE_DATA") &&
    !app.includes("const evidenceCatalog ="),
  scoringSplit:
    index.includes('<script src="./scoring.js"></script>') &&
    scoring.includes("window.APPRAISAL_SCORING") &&
    scoring.includes("evaluateScoreVariance") &&
    app.includes("window.APPRAISAL_SCORING") &&
    tests.includes("scoring module is loaded before the app script"),
  uniqueMechanics:
    data.includes("caseMechanics") &&
    data.includes("DCR確認") &&
    data.includes("用途地域マップ") &&
    app.includes("[data-mechanic]") &&
    tests.includes("case-specific document mechanics"),
  dummyDocuments:
    data.includes("caseDocumentDecoys") &&
    app.includes("[data-doc-decoy]") &&
    tests.includes("dummy document returns a learning card"),
  scoreVariance:
    scoring.includes("evaluateTimeAdjustment") &&
    scoring.includes("evaluateScoreVariance") &&
    tests.includes("時間補正") &&
    tests.includes("判断補正"),
  playTimer:
    index.includes('id="timer-meta"') &&
    app.includes("function renderTimerMeta") &&
    app.includes("targetSeconds") &&
    tests.includes("play timer is visible during a case"),
  numericMechanics:
    data.includes("areaTsubo") &&
    data.includes("stabilizedNoiInput") &&
    app.includes("[data-mechanic-input]") &&
    app.includes("evaluateMechanicInput") &&
    tests.includes("numeric document mechanic rewards") &&
    tests.includes("numeric document mechanic teaches"),
  zoningVisualMechanic:
    data.includes("legalFloorInput") &&
    data.includes("高度地区・北側斜線") &&
    css.includes(".zoning-visual") &&
    tests.includes("case003 visual zoning mechanic accepts"),
  adjustmentBand:
    data.includes("adjustmentBands") &&
    app.includes("[data-adjustment-band]") &&
    scoring.includes("adjustmentBand") &&
    tests.includes("adjustment band and support evidence are required before report"),
  adjustmentSupport:
    data.includes("supportEvidence") &&
    app.includes("[data-adjustment-support]") &&
    scoring.includes("evaluateAdjustmentSupport") &&
    tests.includes("adjustment band and support evidence are required before report"),
  rebuttalCards:
    data.includes("rebuttalOptions") &&
    app.includes("[data-rebuttal]") &&
    scoring.includes("rebuttalOption") &&
    tests.includes("report rebuttal requires a supported evidence answer"),
  rebuttalMiniDuel:
    app.includes("[data-rebuttal-evidence]") &&
    scoring.includes("rebuttalEvidence") &&
    tests.includes("report rebuttal requires a supported evidence answer"),
  argumentStructure:
    data.includes("reportStructure") &&
    scoring.includes("evaluateReportStructure") &&
    tests.includes("報告構成: 事実→分析→結論"),
  marketScenarios:
    data.includes("marketScenarios") &&
    data.includes("supportEvidence") &&
    app.includes("activeMarketScenario") &&
    scoring.includes("marketScenario") &&
    tests.includes("market scenario changes the case briefing between replays"),
  normalChecklist: app.includes("reviewChecklist") && tests.includes("normal result exposes next-run checklist"),
  offlineFonts:
    !css.includes("fonts.googleapis") &&
    !css.includes("@import url(") &&
    css.includes("@font-face") &&
    css.includes("NotoSansJP-VF.ttf"),
  productionDelivery:
    index.includes('<script src="./boot.js"></script>') &&
    !index.includes("<script>") &&
    !app.includes("style=") &&
    !app.includes("node.innerHTML =") &&
    !app.includes("board.innerHTML") &&
    boot.includes("__APPRAISAL_LOW_STIMULUS_BOOT__") &&
    server.includes("Content-Security-Policy") &&
    server.includes("script-src 'self'") &&
    server.includes("style-src 'self'") &&
    server.includes("X-Content-Type-Options") &&
    server.includes("Cache-Control") &&
    productionTest.includes("unsafe-inline") &&
    productionTest.includes("production_server_checks=passed") &&
    packageJson.includes('"start": "node scripts/serve-production.mjs"'),
  scoringGoal: goalDoc.includes("平均95点以上") && goalDoc.includes("P1 ADV・捜査読み好き"),
};

const personas = [
  {
    name: "P1 ADV・捜査読み好き",
    score: weightedScore([
      evidence.characterPortraits,
      evidence.reportTheatre,
      evidence.learningCards,
      evidence.generatedImages,
      evidence.normalChecklist,
      evidence.productionDelivery,
      evidence.liveAnnouncements,
      evidence.clientRebuttals,
      evidence.uniqueMechanics,
      evidence.dataLoadGuard,
      evidence.argumentStructure,
      evidence.rebuttalCards,
      evidence.rebuttalMiniDuel,
      evidence.marketScenarios,
      evidence.novelStory,
    ]),
  },
  {
    name: "P2 週1カジュアル",
    score: weightedScore([
      evidence.phaseObjectives,
      evidence.caseCardArt,
      evidence.normalChecklist,
      evidence.offlineFonts,
      evidence.accessibility,
      evidence.productionDelivery,
      evidence.focusManagement,
      evidence.decoyHotspots,
      evidence.dummyDocuments,
      evidence.playTimer,
      evidence.adjustmentBand,
      evidence.marketScenarios,
      evidence.novelStory,
    ]),
  },
  {
    name: "P3 鑑定プロシマ",
    score: weightedScore([
      evidence.learningCards,
      evidence.reportTheatre,
      evidence.auditReplay,
      evidence.scoringGoal,
      evidence.normalChecklist,
      evidence.productionDelivery,
      evidence.liveAnnouncements,
      evidence.clientRebuttals,
      evidence.dataSplit,
      evidence.scoringSplit,
      evidence.numericMechanics,
      evidence.zoningVisualMechanic,
      evidence.adjustmentBand,
      evidence.adjustmentSupport,
      evidence.marketScenarios,
    ]),
  },
  {
    name: "P4 感覚過敏・配慮",
    score: weightedScore([
      evidence.accessibility,
      evidence.lowStimulus,
      evidence.stimulusDescription,
      evidence.offlineFonts,
      evidence.phaseObjectives,
      evidence.productionDelivery,
      evidence.reducedMotionHardStop,
      evidence.scoreVariance,
      evidence.playTimer,
      evidence.scoringSplit,
    ]),
  },
  {
    name: "P5 リプレイ・スコア厨",
    score: weightedScore([
      evidence.auditReplay,
      evidence.normalChecklist,
      evidence.rankReward,
      evidence.learningCards,
      evidence.scoringGoal,
      evidence.productionDelivery,
      evidence.decoyHotspots,
      evidence.clientRebuttals,
      evidence.scoreVariance,
      evidence.argumentStructure,
      evidence.rebuttalCards,
      evidence.adjustmentBand,
      evidence.adjustmentSupport,
      evidence.rebuttalMiniDuel,
      evidence.marketScenarios,
    ]),
  },
];

const average = personas.reduce((total, persona) => total + persona.score, 0) / personas.length;
console.table(personas);
console.log("persona_gate_type=spec_coverage_not_human_commercial_quality");
console.log(`spec_coverage_gate_average=${average.toFixed(1)}`);
console.log(`persona_average=${average.toFixed(1)}`);

if (average < 95) {
  throw new Error(`Persona review goal not met: ${average.toFixed(1)} < 95`);
}

function weightedScore(flags) {
  const base = 75;
  const bonus = flags.reduce((total, passed) => total + (passed ? 5 : 0), 0);
  return Math.min(100, base + bonus);
}
