(() => {
  function clamp(value) {
    return Math.max(0, Math.min(100, value));
  }

  function signed(value) {
    return `${value >= 0 ? "+" : ""}${value}`;
  }

  function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${String(rest).padStart(2, "0")}`;
  }

  function targetSeconds({ caseId, challengeMode }) {
    const targets = {
      case001: 480,
      case002: 600,
      case003: 720,
      case004: 620,
      case005: 680,
      case006: 700,
      case007: 620,
      case008: 760,
      case009: 760,
      case010: 820,
    };
    const target = targets[caseId] ?? 660;
    return target + (challengeMode ? 180 : 0);
  }

  function evaluateTimeAdjustment({ elapsed, caseId, challengeMode }) {
    const limit = targetSeconds({ caseId, challengeMode });
    if (elapsed <= limit) return { delta: 4, label: `目標${formatDuration(limit)}以内` };
    if (elapsed <= Math.round(limit * 1.5)) return { delta: 0, label: "標準時間内" };
    return { delta: -5, label: "時間超過" };
  }

  function evaluateChallenge({ challengeMode, requiredReport, hotspots, evidenceIds, ethicsChoice, caseId, reportIds }) {
    if (!challengeMode) return { delta: 0, checks: [] };
    const checks = [
      {
        label: "現地調査 5/5",
        passed: hotspots.every((spot) => evidenceIds.includes(spot.id)),
        detail: "全ホットスポットを拾い、見落としなしで報告へ進めたか。",
      },
      {
        label: "重要3カード提示",
        passed: requiredReport.every((id) => reportIds.includes(id)),
        detail:
          caseId === "case003"
            ? "公法上の規制、権利調整、最有効使用を報告根拠として並べたか。"
            : caseId === "case002"
            ? "レントロール、還元利回り、収益価格の査定を報告根拠として並べたか。"
            : "対象確定、事情補正、試算価格の調整を報告根拠として並べたか。",
      },
      {
        label: "中立性維持",
        passed: ethicsChoice === "neutral",
        detail:
          caseId === "case003"
            ? "依頼者の最大容積案から最有効使用の判定を切り離したか。"
            : caseId === "case002"
            ? "依頼者の利回り希望から収益価格を切り離したか。"
            : "依頼者の希望額から鑑定評価額を切り離したか。",
      },
    ];
    const delta = checks.reduce((total, check) => total + (check.passed ? 5 : -4), 0);
    return { delta, checks };
  }

  function evaluateScoreVariance({
    awards,
    mechanic,
    mechanicChoiceId,
    mechanicInputPassed,
    adjustmentBand,
    adjustmentSupport = [],
    rebuttalOption,
    rebuttalEvidence,
    rebuttalSupported,
    marketScenario,
    reportIds,
    reportStructure,
  }) {
    const mistakeCount = Array.from(awards).filter(
      (key) =>
        key.startsWith("decoy-") ||
        key.startsWith("doc-decoy-") ||
        key.startsWith("comparable-") ||
        key === "adjustment-soft" ||
        key === "ethics-yield" ||
        key === "intake-pressure",
    ).length;
    const mechanicChoice = mechanic.choices.find((choice) => choice.id === mechanicChoiceId);
    const mechanicDelta = mechanicChoice ? (mechanicChoice.correct ? 3 : -4) : 0;
    const inputDelta = mechanic.input ? (mechanicInputPassed === true ? 3 : mechanicInputPassed === false ? -3 : 0) : 0;
    const structure = evaluateReportStructure(reportIds, reportStructure);
    const adjustmentDelta = adjustmentBand ? (adjustmentBand.correct ? 3 : -3) : 0;
    const support = evaluateAdjustmentSupport(adjustmentBand, adjustmentSupport, marketScenario);
    const scenarioReport = evaluateMarketScenarioReport(reportIds, marketScenario);
    const rebuttalDelta = rebuttalOption ? (rebuttalOption.correct && rebuttalSupported ? 4 : -4) : 0;
    const mistakeDelta = -Math.min(10, mistakeCount * 2);
    const delta =
      mechanicDelta +
      inputDelta +
      structure.delta +
      adjustmentDelta +
      support.delta +
      scenarioReport.delta +
      rebuttalDelta +
      mistakeDelta;
    const mechanicLabel = mechanicChoice
      ? mechanicChoice.correct
        ? `${mechanic.term}の固有チェック適合`
        : `${mechanic.term}の固有チェックに指摘`
      : `${mechanic.term}は未実施`;
    const inputLabel =
      mechanicInputPassed === true
        ? `${mechanic.term}の数値検算適合`
        : mechanicInputPassed === false
        ? `${mechanic.term}の数値検算に指摘`
        : mechanic.input
        ? `${mechanic.term}の数値検算は未実施`
        : "";
    const adjustmentLabel = adjustmentBand
      ? adjustmentBand.correct
        ? "調整幅の選択適合"
        : "調整幅の選択に指摘"
      : "調整幅は未選択";
    const supportLabel = support.label;
    const scenarioReportLabel = scenarioReport.label;
    const rebuttalLabel = rebuttalOption
      ? rebuttalOption.correct && rebuttalSupported
        ? `再反論の根拠適合（${rebuttalEvidence}）`
        : "再反論の根拠に指摘"
      : "再反論は未実施";
    const mistakeLabel = mistakeCount > 0 ? `弱い根拠選択 ${mistakeCount}件` : "弱い根拠選択なし";
    return {
      delta,
      label: [
        mechanicLabel,
        inputLabel,
        structure.label,
        adjustmentLabel,
        supportLabel,
        scenarioReportLabel,
        rebuttalLabel,
        mistakeLabel,
      ]
        .filter(Boolean)
        .join("。") + "。",
    };
  }

  function evaluateAdjustmentSupport(adjustmentBand, adjustmentSupport, marketScenario) {
    if (!adjustmentBand) return { delta: 0, label: "" };
    const required = adjustmentBand.supportEvidence ?? [];
    const requiredHits = required.filter((id) => adjustmentSupport.includes(id)).length;
    const scenarioHits = (marketScenario?.supportEvidence ?? []).filter((id) => adjustmentSupport.includes(id)).length;
    if (requiredHits >= Math.min(2, required.length) && scenarioHits >= Math.min(1, marketScenario?.supportEvidence?.length ?? 0)) {
      return { delta: 5, label: "調整根拠: 価格形成要因と市場条件が接続" };
    }
    if (requiredHits >= 1) return { delta: 1, label: "調整根拠: 一部接続、補強余地あり" };
    return { delta: -4, label: "調整根拠: 調整幅を支えるカードが弱い" };
  }

  function evaluateMarketScenarioReport(reportIds, marketScenario) {
    const required = marketScenario?.supportEvidence ?? [];
    if (!required.length) return { delta: 0, label: "" };
    const hits = required.filter((id) => reportIds.includes(id)).length;
    if (hits >= Math.min(2, required.length)) {
      return { delta: 4, label: "市場シナリオ報告: 重点根拠を三枚に反映" };
    }
    if (hits >= 1) {
      return { delta: 1, label: "市場シナリオ報告: 一部反映" };
    }
    return { delta: -4, label: "市場シナリオ報告: 今回条件への説明不足" };
  }

  function evaluateReportStructure(reportIds, reportStructure = {}) {
    const stages = reportIds.map((id) => reportStage(id, reportStructure));
    const exact = stages[0] === "fact" && stages[1] === "analysis" && stages[2] === "conclusion";
    if (exact) return { delta: 4, label: "報告構成: 事実→分析→結論" };
    const hasAll = ["fact", "analysis", "conclusion"].every((stage) => stages.includes(stage));
    if (hasAll) return { delta: 1, label: "報告構成: 要素は揃うが順序に改善余地" };
    return { delta: -2, label: "報告構成: 事実・分析・結論の接続が弱い" };
  }

  function reportStage(id, structure) {
    if (structure.fact?.includes(id)) return "fact";
    if (structure.analysis?.includes(id)) return "analysis";
    if (structure.conclusion?.includes(id)) return "conclusion";
    return "other";
  }

  window.APPRAISAL_SCORING = {
    clamp,
    signed,
    formatDuration,
    targetSeconds,
    evaluateTimeAdjustment,
    evaluateChallenge,
    evaluateScoreVariance,
    evaluateReportStructure,
  };
})();
