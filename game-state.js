(() => {
  const STORAGE_KEY = "appraisal-detective-records-v1";

  function normalizeRecord(record = {}) {
    return {
      bestNormal: record.bestNormal ?? null,
      bestAudit: record.bestAudit ?? null,
      completions: record.completions ?? 0,
      lastRank: record.lastRank ?? null,
      lastPlayed: record.lastPlayed ?? null,
      scenarioRuns: record.scenarioRuns ?? {},
      bestScenarioMastery: record.bestScenarioMastery ?? 0,
      lastScenario: record.lastScenario ?? null,
      lastScenarioTitle: record.lastScenarioTitle ?? null,
      lastScenarioSeed: record.lastScenarioSeed ?? null,
      lastScenarioMastery: record.lastScenarioMastery ?? null,
      titles: Array.isArray(record.titles) ? record.titles : [],
    };
  }

  function loadRecords(caseDefinitions) {
    const ids = Object.keys(caseDefinitions);
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      const legacyCase001 = parsed.bestNormal !== undefined || parsed.bestAudit !== undefined ? parsed : parsed.case001;
      return ids.reduce((records, caseId) => {
        records[caseId] = normalizeRecord(caseId === "case001" ? legacyCase001 : parsed[caseId]);
        return records;
      }, {});
    } catch {
      return ids.reduce((records, caseId) => {
        records[caseId] = normalizeRecord();
        return records;
      }, {});
    }
  }

  function createInitialState(caseDefinitions) {
    return {
      phase: -1,
      caseId: "case001",
      challengeMode: false,
      resultSaved: false,
      records: loadRecords(caseDefinitions),
      evidence: [],
      selectedDocs: new Set(),
      selectedDecoyDocs: new Set(),
      selectedReport: new Set(),
      primedPressure: false,
      termBurst: null,
      startedAt: null,
      mechanicInputValue: "",
      mechanicInputPassed: null,
      intakeChoice: null,
      mechanicChoice: null,
      comparableChoice: null,
      adjustmentChoice: null,
      adjustmentBand: null,
      adjustmentSupport: new Set(),
      rebuttalChoice: null,
      rebuttalEvidence: null,
      rebuttalSupported: null,
      ethicsChoice: null,
      marketScenario: null,
      storyIndex: 0,
      storyRevealed: false,
      productPanel: null,
      awards: new Set(),
      score: {
        investigation: 0,
        reasoning: 0,
        appraisal: 0,
        ethics: 0,
      },
    };
  }

  function resetCaseProgress(state) {
    state.phase = 0;
    state.storyIndex = 0;
    state.storyRevealed = false;
    state.resultSaved = false;
    state.evidence = [];
    state.selectedDocs = new Set();
    state.selectedDecoyDocs = new Set();
    state.selectedReport = new Set();
    state.primedPressure = false;
    state.termBurst = null;
    state.startedAt = Date.now();
    state.mechanicInputValue = "";
    state.mechanicInputPassed = null;
    state.intakeChoice = null;
    state.mechanicChoice = null;
    state.comparableChoice = null;
    state.adjustmentChoice = null;
    state.adjustmentBand = null;
    state.adjustmentSupport = new Set();
    state.rebuttalChoice = null;
    state.rebuttalEvidence = null;
    state.rebuttalSupported = null;
    state.ethicsChoice = null;
    state.awards = new Set();
    state.score = {
      investigation: 0,
      reasoning: 0,
      appraisal: 0,
      ethics: 0,
    };
  }

  window.APPRAISAL_STATE = {
    STORAGE_KEY,
    normalizeRecord,
    createInitialState,
    resetCaseProgress,
  };
})();
