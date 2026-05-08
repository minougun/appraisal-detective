(() => {
  function activeMarketScenario(state, caseInfo) {
    return state.marketScenario ?? caseInfo.marketScenarios?.[0] ?? null;
  }

  function scenarioClientDemand(scenario, fallbackLine, context = {}) {
    if (!scenario) return fallbackLine;
    if (scenario.clientDemand) return scenario.clientDemand;
    const caseTitle = context.caseInfo?.shortTitle ?? "今回の案件";
    const index = Number.isFinite(context.scenarioIndex) ? context.scenarioIndex : 0;
    const variants = [
      `${scenario.title}なら、${caseTitle}でも根拠の範囲で上側に説明できる余地はありますよね。`,
      `${scenario.title}を前提に、評価書の表現でこちらの事情が伝わる組み立てにできませんか。`,
      `先生の裁量で、${scenario.title}の市場条件を一番有利に説明できる余地を見てください。`,
    ];
    return variants[Math.abs(index) % variants.length];
  }

  function marketScenarioStatus({
    scenario,
    scenarioList = [],
    caseInfo,
    challengeMode,
    record,
    resultSaved,
    selectedReport,
    evidence,
  }) {
    const supportEvidence = scenario?.supportEvidence ?? [];
    const reportIds = Array.from(selectedReport);
    const evidenceHits = supportEvidence.filter((id) => evidence.includes(id));
    const reportHits = supportEvidence.filter((id) => reportIds.includes(id));
    const scenarioIndex = scenario ? scenarioList.findIndex((item) => item.id === scenario.id) : -1;
    const nextCompletion = record.completions + (resultSaved ? 0 : 1);
    const seed =
      scenario && scenarioIndex >= 0
        ? `${caseInfo.number}-${challengeMode ? "audit" : "normal"}-S${scenarioIndex + 1}-R${Math.max(1, nextCompletion)}`
        : "";
    const mastery = supportEvidence.length ? reportHits.length / supportEvidence.length : 0;
    return {
      scenario,
      scenarioIndex,
      scenarioCount: scenarioList.length,
      supportEvidence,
      evidenceHits,
      reportHits,
      total: supportEvidence.length,
      seed,
      mastery,
    };
  }

  window.APPRAISAL_SCENARIO_ENGINE = Object.freeze({
    activeMarketScenario,
    scenarioClientDemand,
    marketScenarioStatus,
  });
})();
