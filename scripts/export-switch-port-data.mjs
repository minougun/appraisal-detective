import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const outputDir = path.join(root, "dist", "switch-port");
const outputFile = path.join(outputDir, "appraisal-detective-switch-data.json");

const context = {
  window: {},
  console,
};
context.globalThis = context;

for (const file of ["case-data.js", "commercial-case-pack.js", "case-schema.js"]) {
  const source = await readFile(path.join(root, file), "utf8");
  vm.runInNewContext(source, context, { filename: file });
}

const manifest = JSON.parse(await readFile(path.join(root, "assets-manifest.json"), "utf8"));
const data = context.window.APPRAISAL_CASE_DATA;
const schema = context.window.APPRAISAL_CASE_SCHEMA;
const schemaResult = schema.validateCaseData(data, manifest, { mode: "production" });
if (!schemaResult.ok) {
  throw new Error(`case schema failed: ${schemaResult.errors.join("; ")}`);
}

const cases = Object.entries(data.caseDefinitions).map(([id, info]) => ({
  id,
  number: info.number,
  title: info.title,
  shortTitle: info.shortTitle,
  type: info.type,
  difficulty: info.difficulty,
  issue: info.auditCriteria?.focus,
  image: info.assetRefs?.fieldImage,
  imageAlt: info.imageAlt,
  client: {
    name: info.client?.name,
    tension: info.client?.tension,
    portrait: info.assetRefs?.clientPortrait,
  },
  evidenceIds: info.evidenceIds,
  requiredReport: info.requiredReport,
  reportStructure: info.reportStructure,
  hbuMatrix: info.hbuMatrix,
  auditCriteria: info.auditCriteria,
  adjustmentBands: info.adjustmentBands,
  rebuttalOptions: info.rebuttalOptions,
  marketScenarios: info.marketScenarios,
  hotspots: data.caseHotspots[id] ?? [],
  decoyHotspots: data.caseDecoyHotspots[id] ?? [],
  documentPanels: data.caseDocumentPanels[id] ?? [],
  documentIssues: data.caseDocumentIssues[id] ?? [],
  documentDecoys: data.caseDocumentDecoys[id] ?? [],
  mechanic: data.caseMechanics[id] ?? null,
}));

const evidence = Object.entries(data.evidenceCatalog).map(([id, item]) => ({ id, ...item }));

const portData = {
  schemaVersion: 1,
  title: "鑑定DE探偵",
  subtitle: "Appraisal Detective",
  targetPlatform: "Nintendo Switch licensed Unity port",
  generatedAt: new Date().toISOString(),
  source: {
    localPath: root,
    publicUrl: "https://minougun.github.io/appraisal-detective/",
  },
  legalGate: {
    nintendoDeveloperPortal: "https://developer.nintendo.com/",
    register: "https://developer.nintendo.com/register",
    unityNintendoSwitch: "https://unity.com/solutions/nintendo-switch",
    note:
      "This export is not a Nintendo SDK package. A real Switch build requires Nintendo approval, platform support add-on, platform hardware testing, and platform submission.",
  },
  controls: {
    confirm: ["A", "Enter", "Space"],
    cancel: ["B", "Escape"],
    evidenceBoard: ["X"],
    hint: ["Y", "F1"],
    lowStimulus: ["Minus"],
    settings: ["Plus"],
    moveFocus: ["D-pad", "Left Stick", "Arrow Keys"],
  },
  saveData: {
    slotKey: "appraisal-detective-records-v1",
    recordFields: [
      "bestNormal",
      "bestAudit",
      "completions",
      "lastRank",
      "lastPlayed",
      "scenarioRuns",
      "bestScenarioMastery",
      "lastScenario",
      "lastScenarioTitle",
      "lastScenarioSeed",
      "lastScenarioMastery",
      "titles",
    ],
  },
  evidence,
  cases,
  assets: manifest.assets.map((asset) => ({
    file: asset.file,
    caseId: asset.caseId,
    assetType: asset.assetType,
    usage: asset.usage,
    sha256: asset.sha256,
    width: asset.width,
    height: asset.height,
    bytes: asset.bytes,
    altText: asset.altText,
    creditText: asset.creditText,
    aiDisclosureCategory: asset.aiDisclosureCategory,
    storeUseAllowed: asset.storeUseAllowed,
  })),
};

await mkdir(outputDir, { recursive: true });
await writeFile(outputFile, `${JSON.stringify(portData, null, 2)}\n`);
console.log(`switch_port_export=${path.relative(root, outputFile)}`);
console.log(`switch_port_cases=${cases.length}`);
console.log(`switch_port_assets=${portData.assets.length}`);
