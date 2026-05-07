(() => {
  function activeMarketScenario(state, caseInfo) {
    return state.marketScenario ?? caseInfo.marketScenarios?.[0] ?? null;
  }

  function scenarioClientDemand(scenario, fallbackLine) {
    if (!scenario) return fallbackLine;
    if (scenario.clientDemand) return scenario.clientDemand;
    return `${scenario.title}の話は分かります。ただ、今回の依頼目的に沿うよう、表現だけでも少し調整できませんか。`;
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
