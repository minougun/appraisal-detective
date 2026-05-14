const {
  renderDataLoadError,
  htmlText,
  htmlAttr,
  classToken,
  localAssetPath,
  caseImagePath,
  pressureLineHtml,
} = window.APPRAISAL_UTILS ?? {};

if (!window.APPRAISAL_CASE_DATA) {
  renderDataLoadError("案件データ", "case-data.js");
} else if (!window.APPRAISAL_SCORING) {
  renderDataLoadError("スコア計算モジュール", "scoring.js");
} else {
const {
  evidenceCatalog,
  caseHotspots,
  caseDecoyHotspots,
  caseDocumentPanels,
  caseDocumentIssues,
  caseDocumentDecoys,
  caseMechanics,
  caseDefinitions,
} = window.APPRAISAL_CASE_DATA;
const scoring = window.APPRAISAL_SCORING;
const { clamp, signed, formatDuration } = scoring;
const hbuRenderer = window.APPRAISAL_HBU_RENDERER ?? {};
if (!hbuRenderer.hbuMatrixMarkup || !hbuRenderer.auditCriteriaMarkup) {
  throw new Error("APPRAISAL_HBU_RENDERER is not loaded.");
}
const evidenceRenderer = window.APPRAISAL_EVIDENCE_RENDERER ?? {};
if (
  !evidenceRenderer.evidenceCategory ||
  !evidenceRenderer.evidenceBoardOrder ||
  !evidenceRenderer.evidenceButton ||
  !evidenceRenderer.reportEvidenceMarkup
) {
  throw new Error("APPRAISAL_EVIDENCE_RENDERER is not loaded.");
}
const gameplayCast = window.APPRAISAL_GAMEPLAY_CAST ?? {};
if (!gameplayCast.gameplayCastReactions || !gameplayCast.gameplayCastMarkup) {
  throw new Error("APPRAISAL_GAMEPLAY_CAST is not loaded.");
}
const scenarioEngine = window.APPRAISAL_SCENARIO_ENGINE ?? {};
if (!scenarioEngine.activeMarketScenario || !scenarioEngine.scenarioClientDemand || !scenarioEngine.marketScenarioStatus) {
  throw new Error("APPRAISAL_SCENARIO_ENGINE is not loaded.");
}
const schemaResult = window.APPRAISAL_CASE_SCHEMA?.validateCaseData?.(window.APPRAISAL_CASE_DATA);
if (schemaResult && !schemaResult.ok) {
  console.error("Case schema errors", schemaResult.errors);
  renderDataLoadError("案件スキーマ", "case-data.js");
  throw new Error(`Case schema validation failed: ${schemaResult.errors.join("; ")}`);
}
const { STORAGE_KEY, normalizeRecord, createInitialState, resetCaseProgress } = window.APPRAISAL_STATE;
const audio = window.APPRAISAL_AUDIO;
const {
  renderBgmToggle,
  renderAudioToggle,
  renderVoiceToggle,
  renderStimulusToggle,
  bgmStatusLabel,
  seStatusLabel,
  voiceStatusLabel,
  stimulusStatusLabel,
  updateBgmPlayback,
  primeBgmPlayback,
  primeVoicePlayback,
  speakLines,
  prewarmVoiceLines,
  cancelVoice,
  playClick,
  playEvidence,
  playPressure,
  playResult,
  playCaseSelect,
  toggleBgm,
  toggleAudio,
  toggleVoice,
  setBgmSceneOverride,
} = audio;
const state = createInitialState(caseDefinitions);

const phaseMeta = [
  ["第一章 / 依頼ファイル", "依頼受付"],
  ["第二章 / 現地調査", "現地調査"],
  ["第三章 / 資料照合", "資料照合"],
  ["第四章 / 鑑定判断", "鑑定判断"],
  ["最終章 / 報告対決", "報告・対決"],
];

const view = document.querySelector("#phase-view");
const mentorLog = document.querySelector("#mentor-log");
const audioToggle = document.querySelector("#audio-toggle");
const bgmToggle = document.querySelector("#bgm-toggle");
const voiceToggle = document.querySelector("#voice-toggle");
const stimulusToggle = document.querySelector("#stimulus-toggle");
const srAnnouncer = document.querySelector("#sr-announcer");
const srAlert = document.querySelector("#sr-alert");
const motionReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
const OVERLAY_TIMEOUTS = {
  evidence: 1040,
  evidenceSlam: 900,
  learning: 1400,
  termBurst: 1900,
  scoreTick: 1600,
};
const FEEDBACK_TIMEOUTS = {
  pressure: 1200,
  evidenceBoard: 1200,
  mentor: 1200,
};
const CASE_SELECT_TRANSITION_MS = 760;
const CASE_SELECT_HOLD_MS = 600;
let lowStimulus = audio.initialLowStimulus;
let pressureFeedbackTimer;
let evidenceFeedbackTimer;
let mentorFeedbackTimer;
let phaseCutInTimer;
let mentorVoicePendingUntil = 0;

window.APPRAISAL_RUNTIME = {
  getPhase: () => state.phase,
  isLowStimulus: () => lowStimulus,
};

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
}

function currentRecord() {
  state.records[state.caseId] ??= normalizeRecord();
  return state.records[state.caseId];
}

function currentCase() {
  return caseDefinitions[state.caseId] ?? caseDefinitions.case001;
}

function caseIds() {
  return Object.keys(caseDefinitions);
}

function activeHotspots() {
  return caseHotspots[state.caseId] ?? caseHotspots.case001;
}

function activeDecoyHotspots() {
  return caseDecoyHotspots[state.caseId] ?? caseDecoyHotspots.case001;
}

function activeDocumentPanels() {
  return caseDocumentPanels[state.caseId] ?? caseDocumentPanels.case001;
}

function activeDocumentIssues() {
  return caseDocumentIssues[state.caseId] ?? caseDocumentIssues.case001;
}

function activeDocumentDecoys() {
  return caseDocumentDecoys[state.caseId] ?? caseDocumentDecoys.case001;
}

function activeMechanic() {
  return caseMechanics[state.caseId] ?? caseMechanics.case001;
}

function activeAdjustmentBands() {
  return currentCase().adjustmentBands ?? caseDefinitions.case001.adjustmentBands ?? [];
}

function activeRebuttalOptions() {
  return currentCase().rebuttalOptions ?? caseDefinitions.case001.rebuttalOptions ?? [];
}

function selectedAdjustmentBand() {
  return activeAdjustmentBands().find((band) => band.id === state.adjustmentBand) ?? null;
}

function selectedRebuttalOption() {
  return activeRebuttalOptions().find((option) => option.id === state.rebuttalChoice) ?? null;
}

function activeMarketScenario() {
  return scenarioEngine.activeMarketScenario(state, currentCase());
}

function currentCaseEvidenceEntries() {
  return currentCase().evidenceIds.map((id) => [id, evidenceCatalog[id]]).filter(([, item]) => item);
}

function speakerMarkup(kind, speaker, line, { pressure = false } = {}) {
  const isClient = kind === "client";
  const isPlayer = kind === "player";
  const name = isClient ? `依頼者: ${speaker.name}` : isPlayer ? speaker.name ?? "新人鑑定士" : "先輩鑑定士";
  const initial = isClient ? speaker.initial : isPlayer ? speaker.initial ?? "新" : "先";
  const portraitClass = isClient ? speaker.portraitClass : isPlayer ? "portrait-player" : "portrait-mentor";
  const safeKind = classToken(kind);
  return `
    <div class="speech ${safeKind} ${pressure ? "pressure" : ""} has-portrait">
      <span class="speaker-portrait ${classToken(portraitClass, "portrait-mentor")}" aria-hidden="true">${htmlText(initial)}</span>
      <strong>${htmlText(name)}</strong>「${pressureLineHtml(line)}」
    </div>
  `;
}

function voiceLine(kind, speaker, text, options = {}) {
  return {
    kind,
    name:
      kind === "client"
        ? speaker?.name
        : kind === "player"
        ? speaker?.name ?? "新人鑑定士"
        : kind === "narrator"
        ? speaker?.name ?? "語り"
        : "先輩鑑定士",
    portraitClass: kind === "client" ? speaker?.portraitClass : "",
    lineId: options.lineId ?? `${kind}:${speaker?.portraitClass ?? "fixed"}:${String(text).slice(0, 24)}`,
    emotion: options.emotion,
    text,
  };
}

function speakMentorLine(message) {
  mentorVoicePendingUntil = Date.now() + 400;
  speakLines([voiceLine("mentor", {}, message)], { key: `mentor:${message}` });
}

function bindImageFallbacks(root = view) {
  root.querySelectorAll("img[data-fallback-src]").forEach((image) => {
    image.addEventListener(
      "error",
      () => {
        const fallbackSrc = localAssetPath(image.dataset.fallbackSrc, "");
        if (fallbackSrc) {
          image.src = fallbackSrc;
        }
        image.removeAttribute("data-fallback-src");
      },
      { once: true },
    );
  });
}

function addScore(scores = {}) {
  const changedKeys = [];
  Object.entries(scores).forEach(([key, value]) => {
    if (value !== 0) changedKeys.push(key);
    state.score[key] = clamp(state.score[key] + value);
    if (value !== 0) showScoreTick(key, value);
  });
  renderScore(changedKeys);
}

function award(key, scores = {}) {
  if (state.awards.has(key)) return;
  state.awards.add(key);
  addScore(scores);
}

function addEvidence(id, note) {
  if (!state.evidence.includes(id)) {
    state.evidence.push(id);
    addScore(evidenceCatalog[id].scores);
    mentor(note ?? `「${evidenceCatalog[id].term}」として記録した。あとで根拠に使える。`);
    playEvidence();
    popEvidence(id);
    flashEvidence();
    renderEvidenceBoard();
    return true;
  }
  mentor("その根拠はすでに証拠カード化されている。別の違和感を探そう。");
  return false;
}

function mentor(message) {
  mentorLog.textContent = message;
  speakMentorLine(message);
  mentorLog.classList.remove("updated");
  void mentorLog.offsetWidth;
  mentorLog.classList.add("updated");
  window.clearTimeout(mentorFeedbackTimer);
  mentorFeedbackTimer = window.setTimeout(() => mentorLog.classList.remove("updated"), FEEDBACK_TIMEOUTS.mentor);
}

function flashEvidence() {
  if (lowStimulus) return;
  document.body.classList.remove("evidence-flash");
  void document.body.offsetWidth;
  document.body.classList.add("evidence-flash");
  window.clearTimeout(evidenceFeedbackTimer);
  evidenceFeedbackTimer = window.setTimeout(() => document.body.classList.remove("evidence-flash"), FEEDBACK_TIMEOUTS.evidenceBoard);
}

function flashPressure() {
  window.clearTimeout(pressureFeedbackTimer);
  if (lowStimulus) {
    mentorLog.classList.add("pressure-muted");
    pressureFeedbackTimer = window.setTimeout(
      () => mentorLog.classList.remove("pressure-muted"),
      FEEDBACK_TIMEOUTS.pressure,
    );
    return;
  }
  playPressure();
  document.body.classList.remove("pressure-flash");
  void document.body.offsetWidth;
  document.body.classList.add("pressure-flash");
  pressureFeedbackTimer = window.setTimeout(
    () => document.body.classList.remove("pressure-flash"),
    FEEDBACK_TIMEOUTS.pressure,
  );
}

function announce(message, priority = "polite") {
  const region = priority === "assertive" ? srAlert : srAnnouncer;
  if (!region) return;
  region.textContent = "";
  window.setTimeout(() => {
    region.textContent = message;
  }, 0);
}

function overlayMarkup(className, parts, timeout = 900, announcement = "", priority = "polite") {
  document.querySelectorAll(".evidence-pop, .evidence-slam, .learning-card, .term-burst").forEach((node) => {
    node.remove();
  });
  const node = document.createElement("div");
  node.className = className;
  parts.forEach(({ tag, text }) => {
    const child = document.createElement(tag);
    child.textContent = text;
    node.append(child);
  });
  document.body.append(node);
  announce(announcement || parts.map((part) => part.text).join("。"), priority);
  window.setTimeout(() => node.remove(), timeout);
  return node;
}

function popEvidence(id) {
  const item = evidenceCatalog[id];
  const category = evidenceCategory(id);
  overlayMarkup(
    `evidence-pop evidence-${category}`,
    [
      { tag: "em", text: item.term },
      { tag: "b", text: "証拠取得" },
      { tag: "strong", text: item.title },
      { tag: "span", text: item.detail },
    ],
    OVERLAY_TIMEOUTS.evidence,
    `証拠取得。${item.term}。${item.title}。${item.detail}`,
  );
}

function slamEvidence(id) {
  const item = evidenceCatalog[id];
  const category = evidenceCategory(id);
  playEvidence();
  overlayMarkup(
    `evidence-slam evidence-${category}`,
    [
      { tag: "b", text: "証拠提示" },
      { tag: "em", text: item.term },
      { tag: "strong", text: item.title },
      { tag: "span", text: item.detail },
    ],
    OVERLAY_TIMEOUTS.evidenceSlam,
    `証拠提示。${item.term}。${item.title}。${item.detail}`,
  );
}

function showScoreTick(key, value) {
  const label = {
    investigation: "調査",
    reasoning: "推理",
    appraisal: "鑑定判断",
    ethics: "倫理",
  }[key];
  const sign = value > 0 ? "+" : "";
  const cell = document.querySelector(`#score-${key}`)?.closest("div");
  if (!cell || !label) return;
  const tick = document.createElement("span");
  tick.className = `score-tick score-tick-${key}`;
  tick.textContent = `${label} ${sign}${value}`;
  cell.append(tick);
  window.setTimeout(() => tick.remove(), OVERLAY_TIMEOUTS.scoreTick);
}

function renderScore(changedKeys = []) {
  const scoreIds = {
    investigation: "#score-investigation",
    reasoning: "#score-reasoning",
    appraisal: "#score-appraisal",
    ethics: "#score-ethics",
  };
  Object.entries(scoreIds).forEach(([key, selector]) => {
    const value = document.querySelector(selector);
    value.textContent = state.score[key];
    const cell = value.closest("div");
    if (changedKeys.includes(key)) {
      cell.classList.remove("score-bump");
      void cell.offsetWidth;
      cell.classList.add("score-bump");
    }
  });
}

function renderEvidenceBoard({ selectable = false } = {}) {
  const board = document.querySelector("#evidence-board");
  const count = document.querySelector("#evidence-count");
  count.textContent = `${state.evidence.length}枚`;
  board.replaceChildren();

  if (state.evidence.length === 0) {
    board.className = "evidence-board empty";
    ["証拠 01", "証拠 02", "証拠 03"].forEach((label) => {
      const slot = document.createElement("div");
      slot.className = "empty-slot";
      slot.textContent = label;
      board.append(slot);
    });
    const help = document.createElement("p");
    help.textContent = "物件や資料から根拠を発見すると、専門用語カードとしてここに蓄積される。";
    board.append(help);
    return;
  }

  board.className = "evidence-board";
  const priorityIds = activeMarketScenario()?.supportEvidence ?? [];
  evidenceRenderer.evidenceBoardOrder(state.evidence, { selectable, priorityIds }).forEach((id) => {
    board.append(evidenceButton(id, selectable, state.selectedReport.has(id)));
  });

  if (selectable) {
    board.querySelectorAll("[data-evidence]").forEach((button) => {
      button.addEventListener("click", () => toggleReportEvidence(button.dataset.evidence));
    });
  }
}

function evidenceButton(id, selectable, selected) {
  const item = evidenceCatalog[id];
  const disabled = selectable && !selected && state.selectedReport.size >= 3;
  const category = evidenceCategory(id);
  const scenarioPriority = (activeMarketScenario()?.supportEvidence ?? []).includes(id);
  return evidenceRenderer.evidenceButton({
    id,
    item,
    category,
    selectable,
    selected,
    disabled,
    scenarioPriority,
  });
}

function reportEvidenceMarkup(id, index) {
  const item = evidenceCatalog[id];
  return evidenceRenderer.reportEvidenceMarkup({ id, item, category: evidenceCategory(id), index });
}

function evidenceCategory(id) {
  return evidenceRenderer.evidenceCategory(evidenceCatalog, id);
}

function toggleReportEvidence(id) {
  if (state.selectedReport.has(id)) {
    state.selectedReport.delete(id);
    if (state.rebuttalEvidence === id) state.rebuttalEvidence = null;
  } else if (state.selectedReport.size < 3) {
    state.selectedReport.add(id);
    state.termBurst = evidenceCatalog[id].term;
    slamEvidence(id);
    window.setTimeout(() => {
      if (state.termBurst === evidenceCatalog[id].term) {
        state.termBurst = null;
        renderPhase();
      }
    }, OVERLAY_TIMEOUTS.termBurst);
  }
  state.rebuttalChoice = null;
  state.rebuttalEvidence = null;
  state.rebuttalSupported = null;
  renderEvidenceBoard({ selectable: true });
  renderPhase();
}

function setPhase(nextPhase) {
  state.phase = nextPhase;
  state.storyIndex = 0;
  state.storyRevealed = false;
  showPhaseCutIn(nextPhase);
  renderPhase();
  renderEvidenceBoard({ selectable: nextPhase === 4 });
  announce(`フェーズ変更。${phaseMeta[nextPhase]?.[1] ?? "案件選択"}`, "assertive");
  focusPhaseTitle();
}

function focusPhaseTitle() {
  document.querySelector("#phase-title")?.focus({ preventScroll: true });
}

function renderShell() {
  const [kicker, title] = state.phase < 0 ? ["事件ファイル", "案件選択"] : phaseMeta[state.phase];
  const caseInfo = currentCase();
  document.querySelector("#phase-kicker").textContent = kicker;
  document.querySelector("#phase-title").textContent = title;
  document.querySelector("#phase-objective").textContent = phaseObjective();
  document.querySelector("#case-number-meta").textContent = state.phase < 0 ? "事件ファイル" : caseInfo.number;
  document.querySelector("#case-type-meta").textContent = state.phase < 0 ? "案件選択" : caseInfo.type;
  document.querySelector("#mode-meta").textContent = state.challengeMode ? "監査レビュー" : "通常レビュー";
  renderTimerMeta();
  document.body.classList.toggle("challenge-mode", state.challengeMode);
  document.body.classList.toggle("low-stimulus", lowStimulus);
  document.body.classList.toggle("operation-mode", state.phase >= 0);
  renderBgmToggle();
  renderAudioToggle();
  renderVoiceToggle();
  renderStimulusToggle();
  document.querySelectorAll(".phase-progress span").forEach((step) => {
    step.classList.toggle("active", state.phase >= 0 && Number(step.dataset.step) <= state.phase);
  });
}

function renderTimerMeta() {
  const timer = document.querySelector("#timer-meta");
  if (!timer) return;
  if (state.phase < 0 || !state.startedAt) {
    timer.textContent = "経過 --";
    timer.classList.remove("timer-warning");
    timer.removeAttribute("aria-label");
    return;
  }
  const elapsed = elapsedSeconds();
  const target = targetSeconds();
  const remaining = Math.max(0, target - elapsed);
  timer.textContent = `経過 ${formatDuration(elapsed)} / 目標 ${formatDuration(target)}`;
  timer.classList.toggle("timer-warning", elapsed > target);
  timer.setAttribute(
    "aria-label",
    elapsed > target
      ? `経過時間 ${formatDuration(elapsed)}。目標時間を超過しています。`
      : `経過時間 ${formatDuration(elapsed)}。残り目安 ${formatDuration(remaining)}。`,
  );
}

function phaseObjective() {
  if (state.phase < 0) return "案件を1つ選び、通常レビューか監査レビューを選ぶ。";
  const guidePrefix =
    currentCase().difficulty?.label === "イージー"
      ? "ガイドを読み、"
      : currentCase().difficulty?.label === "ノーマル"
      ? "補助メモを確認し、"
      : "";
  if (state.phase === 0) return `${guidePrefix}受任方針を1つ選ぶと現地調査へ進める。`;
  if (state.phase === 1) return `${guidePrefix}写真から違和感を3か所以上発見すると資料照合へ進める。監査は5/5が目標。`;
  if (state.phase === 2) return `${guidePrefix}資料の矛盾を2件以上照合すると鑑定判断へ進める。`;
  if (state.phase === 3) return "査定方式、リスク反映、調整幅、調整根拠2枚を選び、価格判断を固める。";
  return "証拠3枚、再反論、反論根拠カード、最後の裁量判断を選ぶ。";
}

function tutorialMarkup() {
  return "";
}

function mentorAdviceButtonMarkup() {
  if (state.phase < 0) return "";
  return `
    <button class="ghost-button mentor-advice-button" type="button" data-mentor-advice aria-label="先輩の一言">
      <span>先輩の一言</span>
      <small aria-hidden="true">次に見る点だけ聞く</small>
    </button>
  `;
}

function mentorAdviceMessage() {
  const phaseAdvice = {
    case001: {
      0: "田中さんの希望額は、まだ材料じゃない。先に事例の日付をそろえよう。",
      1: "見た目の傷で止まらない。価格に効く条件差を見よう。",
      2: "説明は材料の一つだ。数字と資料が食い違う場所を見よう。",
    },
    case002: {
      0: "利回りの希望は後だ。先に収入と費用の内訳を見よう。",
      1: "満室の印象だけでは弱い。空室と修繕のリスクまで見よう。",
      2: "説明は材料の一つだ。数字と資料が食い違う場所を見よう。",
    },
    case003: {
      0: "最大容積案はまだ置いておく。先に道路とのつながりだ。",
      1: "開発案の前に、現地で計画が止まる理由を見よう。",
      2: "説明は材料の一つだ。数字と資料が食い違う場所を見よう。",
    },
  };
  const caseAdvice = phaseAdvice[state.caseId]?.[state.phase];
  if (caseAdvice) return caseAdvice;
  if (state.phase === 3) {
    return "数字を動かす前に、支える根拠を二枚そろえよう。";
  }
  if (state.phase === 4) {
    return "言い返すより、根拠カードで返そう。";
  }
  return "事情は聞く。価格根拠とは分けておこう。";
}

function bindMentorAdviceButton() {
  view.querySelector("[data-mentor-advice]")?.addEventListener("click", () => {
    mentor(mentorAdviceMessage());
  });
}

function intakeRiskCheck() {
  const checks = {
    case001: {
      line: "妹に見せる額としては、低い額だと困るんです。",
      question: "価格に入れてはいけないものを選べ。",
      options: [
        {
          id: "price_induction",
          label: "低い額だと困る、という依頼者の希望",
          correct: true,
          feedback: "ここだ。目的は聞いていい。だが、田中さんの困りごとで価格は動かさない。",
        },
        {
          id: "purpose_danger",
          label: "妹に見せる、という利用目的",
          correct: false,
          feedback: "そこは確認していい情報だ。危ないのは、価格を動かそうとしている希望のほうだ。",
        },
        {
          id: "family_ok",
          label: "相続協議に使う、という依頼目的",
          correct: false,
          feedback: "相続協議の目的はメモする。田中さんの困りごとでは価格を動かさない。",
        },
      ],
    },
    case002: {
      line: "銀行に出すだけです。還元利回りは低めに見ていただけると助かります。",
      question: "危ない言葉を選べ。",
      options: [
        {
          id: "yield_induction",
          label: "低めに",
          correct: true,
          feedback: "ここだ。利回りを下げると、同じ収益でも価格は高く見える。希望からは決めない。先に収益の中身を見る。",
        },
        {
          id: "loan_purpose_danger",
          label: "還元利回り",
          correct: false,
          feedback: "利回りは見る。危ないのは、そこに依頼者の希望を混ぜる言葉だ。",
        },
        {
          id: "full_occupancy_ok",
          label: "銀行に出すだけ",
          correct: false,
          feedback: "提出先は確認する。ただ、それだけで利回りは動かせない。",
        },
      ],
    },
    case003: {
      line: "市も前向きです。最大容積のマンション用地として見てください。",
      question: "危ない前提を選べ。",
      options: [
        {
          id: "hbu_induction",
          label: "最大容積まで使える前提",
          correct: true,
          feedback: "ここだ。最大容積は検討する。ただ、使えるかを確認する前に結論へ置かない。",
        },
        {
          id: "redevelopment_purpose_danger",
          label: "マンション用地として検討すること",
          correct: false,
          feedback: "マンション用地の仮説は捨てなくていい。使える条件を見てからだ。",
        },
        {
          id: "developer_ok",
          label: "市が前向きという感触",
          correct: false,
          feedback: "行政の感触はメモでいい。評価は、使える条件で組む。",
        },
      ],
    },
  };
  return checks[state.caseId] ?? checks.case001;
}

function intakeRiskMarkup() {
  const check = intakeRiskCheck();
  return `
    <article class="brief-card urgent detective-prompt">
      <span class="term-chip">最初の違和感</span>
      <p class="client-quote">「${htmlText(check.line)}」</p>
      <h3>${htmlText(check.question)}</h3>
      <div class="option-grid compact-options">
        ${check.options
          .map(
            (option) => `
              <button class="option-button ${state.intakeRiskChoice === option.id ? "selected" : ""}" type="button" data-intake-risk="${htmlAttr(option.id)}">
                <strong>${htmlText(option.label)}</strong>
              </button>
            `,
          )
          .join("")}
      </div>
    </article>
  `;
}

function bindIntakeRiskCheck() {
  const check = intakeRiskCheck();
  view.querySelectorAll("[data-intake-risk]").forEach((button) => {
    button.addEventListener("click", () => {
      state.intakeRiskChoice = button.dataset.intakeRisk;
      const selected = check.options.find((option) => option.id === state.intakeRiskChoice);
      renderPhase();
      mentor(selected?.feedback ?? "違和感を一つに絞ろう。依頼者の希望と評価根拠を分ける。");
      focusRevealedPhaseContent();
    });
  });
}

function intakeNextCheck() {
  const checks = {
    case001: {
      question: "次に開く資料は？",
      options: [
        { id: "transaction_dates", label: "取引事例の日付", correct: true, feedback: "その資料だ。価格を比べるには、まず日付をそろえる。これが価格時点だ。" },
        { id: "tanaka_target", label: "田中の希望額メモ", correct: false, feedback: "希望額は後だ。先に市場で比べられる資料を開こう。" },
        { id: "sister_consent", label: "妹への説明メモ", correct: false, feedback: "説明メモは目的だ。価格を支える根拠ではない。" },
      ],
    },
    case002: {
      question: "次に開く資料は？",
      options: [
        { id: "income_expense", label: "収入と費用の内訳", correct: true, feedback: "その資料だ。先にNOIを見る。利回りを下げる前に、収益の中身を固めよう。" },
        { id: "loan_amount", label: "希望融資額", correct: false, feedback: "融資額は目的だ。収益価格の根拠にはしない。" },
        { id: "owner_yield", label: "依頼者が出した利回り表", correct: false, feedback: "提示利回りは未信頼情報だ。収益の中身から検証しよう。" },
      ],
    },
    case003: {
      question: "次に確認する現地条件は？",
      options: [
        { id: "road_connection", label: "前面道路とのつながり", correct: true, feedback: "そこからだ。計画が成り立つかは、接道で決まる。" },
        { id: "maximum_volume", label: "最大容積を使った事業計画", correct: false, feedback: "事業計画は後だ。まず合法性と物理的可能性を潰そう。" },
        { id: "city_mood", label: "市の前向きな反応", correct: false, feedback: "空気では評価できない。規制と権利関係を見よう。" },
      ],
    },
  };
  return checks[state.caseId] ?? checks.case001;
}

function intakeNextMarkup() {
  const check = intakeNextCheck();
  return `
    <article class="brief-card urgent detective-prompt">
      <span class="term-chip">次の根拠</span>
      <h3>${htmlText(check.question)}</h3>
      <div class="option-grid compact-options">
        ${check.options
          .map(
            (option) => `
              <button class="option-button ${state.intakeNextCheckChoice === option.id ? "selected" : ""}" type="button" data-intake-next="${htmlAttr(option.id)}">
                <strong>${htmlText(option.label)}</strong>
              </button>
            `,
          )
          .join("")}
      </div>
    </article>
  `;
}

function bindIntakeNextCheck() {
  const check = intakeNextCheck();
  view.querySelectorAll("[data-intake-next]").forEach((button) => {
    button.addEventListener("click", () => {
      state.intakeNextCheckChoice = button.dataset.intakeNext;
      const selected = check.options.find((option) => option.id === state.intakeNextCheckChoice);
      renderPhase();
      mentor(selected?.feedback ?? "次に見る根拠を一つに絞ろう。");
      focusRevealedPhaseContent();
    });
  });
}

function intakeRebuttalCheck() {
  const checks = {
    case001: {
      line: "妹に説明するだけです。そこまで厳密に見る必要がありますか？",
      question: "返すカードを選べ。",
      options: [
        {
          id: "price_point_reply",
          label: "取引事例の日付",
          detail: "事例の日付が評価時点とずれている",
          correct: true,
          playerLine: "説明に使うからこそ、時点の違う価格は混ぜられません。",
          feedback: "田中さんの希望には戻らなかった。資料に戻した、それでいい。",
          reaction: "……日付が違うだけでも、そこまで見ますか。分かりました、そのまま並べるのはまずいんですね。",
        },
        { id: "hope_memo_reply", label: "田中の希望額メモ", detail: "田中「できれば高めに」", correct: false, feedback: "希望額のメモでは返せない。比較できる日付と事例に戻ろう。" },
        { id: "sister_memo_reply", label: "妹への説明メモ", detail: "用途: 相続協議の説明資料", correct: false, feedback: "説明メモは目的だ。価格を比べる資料としては弱い。" },
      ],
    },
    case002: {
      line: "銀行に出すだけです。利回りを少し低めに見るくらい、問題ないですよね？",
      question: "返すカードを選べ。",
      options: [
        {
          id: "noi_reply",
          label: "収入と費用の内訳",
          detail: "費用控除後の収益をまだ確認していない",
          correct: true,
          playerLine: "収入と費用を見ないまま、利回りだけは動かせません。",
          feedback: "だから、希望から決めない。先に収益の中身だ。",
          reaction: "利回りを少し動かすだけで、そこまで価格に出るんですね。……では、収入と費用を見ないままでは難しいと。",
        },
        { id: "loan_amount_reply", label: "希望融資額", detail: "借換に必要な金額", correct: false, feedback: "融資額では返せない。収益の中身を示そう。" },
        { id: "owner_yield_reply", label: "依頼者が出した利回り表", detail: "依頼者側の希望利回り", correct: false, feedback: "提示利回りは未信頼情報だ。収入と費用の内訳で返そう。" },
      ],
    },
    case003: {
      line: "市も前向きです。接道まで細かく見なくても、最大容積で検討できますよね？",
      question: "返すカードを選べ。",
      options: [
        {
          id: "road_reply",
          label: "前面道路とのつながり",
          detail: "計画が成立する接道か未確認",
          correct: true,
          playerLine: "接道を見ないと、最大容積の計画を前提にはできません。",
          feedback: "期待の話に乗らなかったな。条件の話に戻せた。",
          reaction: "市が前向きでも足りないんですか。……接道で、そこまで変わるんですね。",
        },
        { id: "max_plan_reply", label: "最大容積を使った事業計画", detail: "依頼者案。成立条件は未確認", correct: false, feedback: "計画から逆算しない。接道と規制で返そう。" },
        { id: "city_mood_reply", label: "市の前向きな反応", detail: "担当者感触。法的条件ではない", correct: false, feedback: "行政の感触だけでは返せない。使える条件を確認しよう。" },
      ],
    },
  };
  return checks[state.caseId] ?? checks.case001;
}

function intakeRebuttalMarkup() {
  const check = intakeRebuttalCheck();
  return `
    <article class="brief-card urgent detective-prompt">
      <span class="term-chip">依頼者の反論</span>
      <p class="client-quote">「${htmlText(check.line)}」</p>
      <h3>${htmlText(check.question)}</h3>
      <div class="option-grid compact-options">
        ${check.options
          .map(
            (option) => `
              <button class="option-button ${state.intakeRebuttalChoice === option.id ? "selected" : ""}" type="button" data-intake-rebuttal="${htmlAttr(option.id)}">
                <strong>${htmlText(option.label)}</strong>
                ${option.detail ? `<span>${htmlText(option.detail)}</span>` : ""}
              </button>
            `,
          )
          .join("")}
      </div>
    </article>
  `;
}

function intakeRebuttalOutcomeMarkup() {
  const check = intakeRebuttalCheck();
  const selected = check.options.find((option) => option.id === state.intakeRebuttalChoice);
  if (!selected?.correct || !selected.reaction) return "";
  return `
    <article class="brief-card urgent">
      <span class="term-chip">反論の手応え</span>
      <div class="dialogue">
        ${selected.playerLine ? speakerMarkup("player", { name: "新人鑑定士", initial: "新" }, selected.playerLine) : ""}
        ${speakerMarkup("client", currentCase().client, selected.reaction, { pressure: false })}
      </div>
    </article>
  `;
}

function bindIntakeRebuttalCheck() {
  const check = intakeRebuttalCheck();
  view.querySelectorAll("[data-intake-rebuttal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.intakeRebuttalChoice = button.dataset.intakeRebuttal;
      const selected = check.options.find((option) => option.id === state.intakeRebuttalChoice);
      renderPhase();
      mentor(selected?.feedback ?? "反論には希望ではなく、比較できる根拠で返そう。");
      focusRevealedPhaseContent();
    });
  });
}

function renderPhase() {
  setBgmSceneOverride(null);
  renderShell();

  if (state.phase === -1) renderCaseSelect();
  if (state.phase === 0) renderIntake();
  if (state.phase === 1) renderFieldSurvey();
  if (state.phase === 2) renderDocuments();
  if (state.phase === 3) renderAppraisal();
  if (state.phase === 4) renderReport();
  wrapPhaseGameDesk();
  applyStoryGate();
  bindNovelScene();
  bindMentorAdviceButton();
  updateBgmPlayback();
  speakVisibleConversation();
}

function wrapPhaseGameDesk(variant) {
  if (state.phase < 0) return;
  const children = Array.from(view.children).filter(
    (node) => !node.matches(".novel-scene, .term-burst, .phase-game-desk"),
  );
  if (children.length === 0) return;

  const key = variant ?? phaseGameKey();
  const desk = document.createElement("div");
  desk.className = `phase-game-desk phase-game-${key}`;
  desk.setAttribute("aria-label", phaseGameLabel(key));

  const header = document.createElement("div");
  header.className = "phase-game-header";
  header.innerHTML = `
    <span>${htmlText(phaseGameChapter(key))}</span>
    <strong>${htmlText(phaseGameLabel(key))}</strong>
    <small>${htmlText(key === "review" ? "今回の判断、証拠構成、次周の改善点を確認する。" : phaseObjective())}</small>
  `;
  desk.append(header);
  const cast = gameplayCastMarkup(key);
  if (cast) desk.insertAdjacentHTML("beforeend", cast);
  children.forEach((node) => desk.append(node));
  view.append(desk);
}

function showPhaseCutIn(nextPhase) {
  if (lowStimulus || motionReduced.matches || nextPhase < 0) return;
  document.querySelectorAll(".phase-cut-in").forEach((node) => node.remove());
  window.clearTimeout(phaseCutInTimer);
  document.body.classList.add("phase-cut-active");
  const [chapter, title] = phaseMeta[nextPhase] ?? ["章", "次の工程"];
  const node = document.createElement("div");
  node.className = "phase-cut-in";
  node.setAttribute("aria-hidden", "true");

  const plate = document.createElement("div");
  plate.className = "phase-cut-in-plate";
  const small = document.createElement("span");
  small.textContent = chapter;
  const strong = document.createElement("strong");
  strong.textContent = title;
  const line = document.createElement("i");
  plate.append(small, strong, line);
  node.append(plate);
  document.body.append(node);
  const cleanup = () => {
    node.remove();
    document.body.classList.remove("phase-cut-active");
  };
  node.addEventListener("animationend", cleanup, { once: true });
  phaseCutInTimer = window.setTimeout(cleanup, 1500);
}

function gameplayCastMarkup(key) {
  const reactions = gameplayCast.gameplayCastReactions(key, {
    client: currentCase().client,
    caseInfo: currentCase(),
    scenario: activeMarketScenario(),
    found: activeHotspots().filter((spot) => state.evidence.includes(spot.id)).length,
    selectedDocs: state.selectedDocs.size,
    supportCount: state.adjustmentSupport.size,
    reportCount: state.selectedReport.size,
  });
  return gameplayCast.gameplayCastMarkup(key, reactions);
}

function gameplayCastVoiceLines(key) {
  return gameplayCast.gameplayCastReactions(key, {
    client: currentCase().client,
    caseInfo: currentCase(),
    scenario: activeMarketScenario(),
    found: activeHotspots().filter((spot) => state.evidence.includes(spot.id)).length,
    selectedDocs: state.selectedDocs.size,
    supportCount: state.adjustmentSupport.size,
    reportCount: state.selectedReport.size,
  }).map((reaction) => voiceLine(reaction.kind, reaction.speaker, reaction.line));
}

function phaseGameKey() {
  return ["intake", "field", "documents", "appraisal", "report"][state.phase] ?? "review";
}

function phaseGameChapter(key) {
  return (
    {
      intake: "第一章",
      field: "第二章",
      documents: "第三章",
      appraisal: "第四章",
      report: "最終章",
      review: "レビュー",
    }[key] ?? "章"
  );
}

function phaseGameLabel(key) {
  return (
    {
      intake: "受任面談",
      field: "現地調査",
      documents: "資料照合",
      appraisal: "鑑定判断",
      report: "報告対決",
      review: "最終レビュー",
    }[key] ?? "ゲーム画面"
  );
}

function applyStoryGate() {
  const pending = phaseStoryLines().length > 0 && !state.storyRevealed;
  document.body.classList.toggle("story-pending-mode", pending);
  view.classList.toggle("story-pending", pending);
  view.querySelector(".novel-scene")?.classList.toggle("story-complete", state.storyRevealed);

  const setNodePending = (node, isPending) => {
    node.hidden = isPending;
    if (isPending) node.setAttribute("aria-hidden", "true");
    else node.removeAttribute("aria-hidden");
    if ("inert" in node) node.inert = isPending;
  };

  view.querySelectorAll(":scope > *").forEach((node) => {
    if (node.matches(".novel-scene")) return;
    const nestedNovel = node.querySelector(":scope > .novel-scene");
    if (nestedNovel) {
      node.classList.toggle("story-host-pending", pending);
      setNodePending(node, false);
      node.querySelectorAll(":scope > *:not(.novel-scene)").forEach((child) => setNodePending(child, pending));
      return;
    }
    setNodePending(node, pending);
  });
}

function novelActionLabel() {
  if (state.phase < 0) return "事件ファイルを開く";
  if (state.phase === 0) return "受任判断へ";
  if (state.phase === 1) return "現地調査へ";
  if (state.phase === 2) return "資料照合へ";
  if (state.phase === 3) return "鑑定判断へ";
  return "報告対決へ";
}

function announceNovelLine() {
  const lines = phaseStoryLines();
  if (lines.length === 0) return;
  const index = Math.min(state.storyIndex, lines.length - 1);
  const line = lines[index];
  announce(`ストーリー ${index + 1}/${lines.length}。${line.name}。${line.line}`);
}

function speakVisibleConversation() {
  const storyLines = phaseStoryLines();
  if (storyLines.length > 0 && !state.storyRevealed) {
    const index = Math.min(state.storyIndex, storyLines.length - 1);
    const line = storyLines[index];
    const currentLine = storyVoiceLine(index);
    speakLines([currentLine], {
      key: `story:${state.caseId}:${state.phase}:${index}:${line.speaker}:${line.line}`,
    });
    const nextLine = storyVoiceLine(index + 1);
    if (nextLine) prewarmVoiceLines([nextLine]);
    return;
  }
  if (Date.now() < mentorVoicePendingUntil) return;

  const dialogueLines = visibleDialogueVoiceLines();
  if (dialogueLines.length > 0) {
    speakLines(dialogueLines, { key: `dialogue:${state.caseId}:${state.phase}:${dialogueVoiceKey(dialogueLines)}` });
    return;
  }

  if (state.phase > 0 && state.phase < 5) {
    const castLines = gameplayCastVoiceLines(phaseGameKey());
    if (castLines.length > 0) {
      speakLines(castLines, { key: `cast:${state.caseId}:${state.phase}:${dialogueVoiceKey(castLines)}` });
    }
  }
}

function storyVoiceLine(index) {
  const storyLines = phaseStoryLines();
  const line = storyLines[index];
  if (!line) return null;
  const kind = line.speaker === "narrator" ? "narrator" : line.speaker;
  const speaker = kind === "client" ? currentCase().client : { name: line.name };
  return voiceLine(kind, speaker, line.line, { lineId: `story:${state.caseId}:${state.phase}:${index}:${line.speaker}` });
}

function visibleDialogueVoiceLines() {
  return Array.from(view.querySelectorAll(".dialogue .speech"))
    .filter((node) => !node.closest("[hidden], [aria-hidden='true']"))
    .map((node) => {
      const kind = node.classList.contains("client") ? "client" : node.classList.contains("player") ? "player" : "mentor";
      return voiceLine(kind, kind === "client" ? currentCase().client : {}, speechTextFromNode(node), {
        emotion: node.classList.contains("pressure") ? "anxious_pressure" : undefined,
      });
    });
}

function speechTextFromNode(node) {
  const clone = node.cloneNode(true);
  clone.querySelector("strong")?.remove();
  clone.querySelector(".speaker-portrait")?.remove();
  return clone.textContent.replace(/[「」]/g, "").replace(/\s+/g, " ").trim();
}

function dialogueVoiceKey(lines) {
  return lines.map((line) => `${line.kind}:${line.name}:${line.text}`).join("|");
}

function focusRevealedPhaseContent() {
  const target =
    view.querySelector(":scope > :not(.novel-scene):not([hidden]) button:not(:disabled)") ??
    view.querySelector(":scope > :not(.novel-scene):not([hidden]) input, :scope > :not(.novel-scene):not([hidden]) [tabindex]");
  target?.focus({ preventScroll: true });
  const content = view.querySelector(":scope > :not(.novel-scene):not([hidden])");
  content?.scrollIntoView({ block: "start", behavior: motionReduced.matches || lowStimulus ? "auto" : "smooth" });
}

function phaseStoryLines() {
  if (state.phase < 0) {
    return [
      { speaker: "player", name: "新人鑑定士", line: "依頼ファイルを開く。まず、どの根拠が使えるか見る。" },
      { speaker: "mentor", name: "先輩鑑定士", line: "どの案件も、数字の裏に人の都合がある。迷ったら、希望ではなく根拠に戻ろう。" },
    ];
  }
  const caseInfo = currentCase();
  const client = caseInfo.client;
  const scenario = activeMarketScenario();
  const record = currentRecord();
  const repeatLine =
    record.completions > 0
      ? {
          speaker: "mentor",
          name: "先輩鑑定士",
          line: state.challengeMode
            ? `前回ランクは${record.lastRank ?? "未記録"}。監査では、前回見落とした根拠まで拾い直そう。`
            : `前回ランクは${record.lastRank ?? "未記録"}。同じ案件でも、提示する三枚を変えれば論証は変わる。`,
        }
      : null;
  const commonPressure = {
    case001: "そこだ。希望は聞く。価格には混ぜるな。",
    case002: "利回りを少しだけ低く。その一言が、収益価格を歪ませる。",
    case003: "最大容積で見てほしい。その一言が、最有効使用を飛ばさせる。",
  };
  const linesByPhase = {
    0: [
      { speaker: "narrator", name: "第一章", line: `${caseInfo.shortTitle}の依頼ファイルを開いた。` },
      { speaker: "client", name: client.name, line: client.tension },
      { speaker: "player", name: "新人鑑定士", line: "事情は聞く。でも、評価額に入れる根拠は分ける。" },
      { speaker: "mentor", name: "先輩鑑定士", line: commonPressure[state.caseId] ?? "依頼者の言葉は、根拠と希望に分けて聞こう。" },
      repeatLine,
      scenario
        ? { speaker: "narrator", name: "市場メモ", line: `${scenario.title}。${scenario.appraisalHint}` }
        : { speaker: "narrator", name: "市場メモ", line: "価格時点の市場条件を確認する。" },
    ],
    1: [
      { speaker: "narrator", name: "第二章", line: "現地に着いた。写真の中に、評価額を動かす違和感が隠れている。" },
      { speaker: "mentor", name: "先輩鑑定士", line: "きれいかどうかじゃない。価格形成要因として説明できる傷を見よう。" },
      { speaker: "player", name: "新人鑑定士", line: "見た目の印象ではなく、減価やリスクとして説明できる箇所を拾います。" },
      { speaker: "client", name: client.name, line: "そこまで細かく見なくても、だいたい分かりますよね。" },
    ],
    2: [
      { speaker: "narrator", name: "第三章", line: "登記、契約、都市計画、収益資料。紙は静かだが、矛盾は声を出す。" },
      { speaker: "mentor", name: "先輩鑑定士", line: "資料は集めるだけでは足りない。今回の価格形成要因になるものだけ残そう。" },
      { speaker: "player", name: "新人鑑定士", line: "依頼者説明、登記、取引事例を並べて、価格に効く矛盾だけを残します。" },
      { speaker: "client", name: client.name, line: "こちらに都合のいい資料から見てもらえれば十分です。" },
    ],
    3: [
      { speaker: "narrator", name: "第四章", line: "証拠は揃った。ここからは、価格にどう反映するかを決める時間だ。" },
      { speaker: "mentor", name: "先輩鑑定士", line: "調整幅は勘ではない。証拠カード二枚で、減価と市場条件を支えよう。" },
      { speaker: "player", name: "新人鑑定士", line: "比準、収益、開発可能性を見比べて、どの根拠で調整するか決めます。" },
      scenario
        ? { speaker: "narrator", name: "市場条件", line: `${scenario.title}。この周回では、${scenario.appraisalHint}` }
        : { speaker: "narrator", name: "市場条件", line: "価格時点の条件と調整根拠を接続する。" },
    ],
    4: [
      { speaker: "narrator", name: "最終章", line: "報告の場。依頼者と先輩の視線が、選んだ三枚の根拠カードに集まる。" },
      { speaker: "client", name: client.name, line: "その根拠で、本当にその評価額になるんですか。" },
      { speaker: "player", name: "新人鑑定士", line: "はい。提示する三枚で、事実、分析、結論の順に説明します。" },
      repeatLine,
      { speaker: "mentor", name: "先輩鑑定士", line: "反論には、言葉ではなく根拠で返そう。最後は説明可能な裁量の範囲に収める。" },
    ],
  };
  return (linesByPhase[state.phase] ?? []).filter(Boolean);
}

function novelSceneMarkup() {
  const lines = phaseStoryLines();
  if (lines.length === 0) return "";
  const index = Math.min(state.storyIndex, lines.length - 1);
  const line = lines[index];
  const caseInfo = currentCase();
  const client = caseInfo.client;
  const clientActive = line.speaker === "client";
  const playerActive = line.speaker === "player";
  const mentorActive = line.speaker === "mentor";
  const narratorActive = line.speaker === "narrator";
  const introScene = state.phase < 0;
  const isLastLine = index + 1 >= lines.length;
  const actionLabel = novelActionLabel();
  return `
    <section class="novel-scene novel-phase-${classToken(state.phase)}" aria-label="ストーリーシーン">
      <img class="novel-backdrop" src="${htmlAttr(caseImagePath(caseInfo.image, caseInfo.fallbackImage))}" data-fallback-src="${htmlAttr(caseImagePath(caseInfo.fallbackImage))}" alt="" aria-hidden="true" />
      <div class="novel-vignette" aria-hidden="true"></div>
      <div class="novel-cast" aria-hidden="true">
        <span class="novel-character player portrait-player ${playerActive ? "active" : ""}">
          <span class="novel-character-label">新人鑑定士</span>
        </span>
        ${
          introScene
            ? ""
            : `<span class="novel-character client ${classToken(client.portraitClass, "portrait-client")} ${clientActive ? "active" : ""}">
                <span class="novel-character-label">依頼者</span>
              </span>`
        }
        <span class="novel-character mentor portrait-mentor ${mentorActive ? "active" : ""}">
          <span class="novel-character-label">先輩鑑定士</span>
        </span>
      </div>
      <div class="novel-box ${classToken(narratorActive ? "narrator" : line.speaker)}">
        <div class="novel-name">${htmlText(line.name)}</div>
        <p id="novel-line" aria-live="polite" aria-atomic="true">${htmlText(line.line)}</p>
        <div class="novel-controls">
          <span>${index + 1} / ${lines.length}</span>
          <div class="novel-control-buttons">
            <button
              class="ghost-button novel-skip"
              type="button"
              data-novel-skip
              aria-controls="novel-line"
              aria-label="最後の台詞へスキップ。全${htmlAttr(lines.length)}件"
              ${isLastLine ? "disabled" : ""}
            >スキップ</button>
            <button
              class="ghost-button novel-next"
              type="button"
              data-novel-next
              aria-controls="${isLastLine ? "phase-view" : "novel-line"}"
              aria-label="${
                isLastLine
                  ? `${htmlAttr(actionLabel)}。ストーリーを閉じて操作画面を表示`
                  : `次へ。現在${htmlAttr(index + 1)}件目、全${htmlAttr(lines.length)}件`
              }"
            >
              ${htmlText(isLastLine ? actionLabel : "次へ")}
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function activeNovelSceneMarkup() {
  return state.storyRevealed ? "" : novelSceneMarkup();
}

function bindNovelScene() {
  bindImageFallbacks(view);
  view.querySelector("[data-novel-next]")?.addEventListener("click", () => {
    const lines = phaseStoryLines();
    if (state.storyIndex < lines.length - 1) {
      state.storyIndex += 1;
      renderPhase();
      announceNovelLine();
    } else {
      state.storyRevealed = true;
      renderPhase();
      announce(`${novelActionLabel()}。操作画面を表示しました。`);
      mentor("俺は横で見る。まず一枚、使える根拠を選ぼう。");
      focusRevealedPhaseContent();
    }
  });
  view.querySelector("[data-novel-skip]")?.addEventListener("click", () => {
    const lines = phaseStoryLines();
    if (lines.length <= 1 || state.storyIndex >= lines.length - 1) return;
    state.storyIndex = lines.length - 1;
    renderPhase();
    announceNovelLine();
    mentor("会話をスキップした。最後の台詞だけ確認して判断へ進める。");
  });
}

function renderCaseSelect() {
  renderEvidenceBoard();
  const entries = caseIds().map((id, index) => {
    state.records[id] ??= normalizeRecord();
    return { id, index, info: caseDefinitions[id], record: state.records[id] };
  });
  const rotations = ["left", "center", "right"];
  const totalCompletions = entries.reduce((total, entry) => total + entry.record.completions, 0);
  const highestNormal = entries
    .map((entry) => entry.record.bestNormal)
    .filter((value) => value !== null && value !== undefined);
  const highestAudit = entries
    .map((entry) => entry.record.bestAudit)
    .filter((value) => value !== null && value !== undefined);
  const introPending = !state.storyRevealed;
  view.innerHTML = `
    <section class="title-screen ${introPending ? "title-screen-intro" : "title-screen-desk"}">
      ${
        introPending
          ? novelSceneMarkup()
          : `
            <div class="case-file-desk" aria-label="机上の事件ファイル">
              <div class="desk-lamp" aria-hidden="true"></div>
              <div class="desk-case-header">
                <span class="case-desk-stamp">鑑定事務所 / 事件簿</span>
                <h3>机上の事件ファイルを開く</h3>
                <p>ファイルを選ぶと受任面談へ入る。赤い監査札は、二周目以降の厳格レビューだ。</p>
                <div class="case-library-strip" aria-label="製品記録">
                  <span>事件ファイル ${htmlText(entries.length)}件</span>
                  <span>完了 ${htmlText(totalCompletions)}回</span>
                  <span>通常最高 ${htmlText(highestNormal.length ? Math.max(...highestNormal) : "未記録")}</span>
                  <span>監査最高 ${htmlText(highestAudit.length ? Math.max(...highestAudit) : "未記録")}</span>
                </div>
                <div class="product-menu" aria-label="製品メニュー">
                  <button class="product-menu-button" data-product-panel="settings">設定</button>
                  <button class="product-menu-button" data-product-panel="achievements">実績</button>
                  <button class="product-menu-button" data-product-panel="records">記録</button>
                  <button class="product-menu-button" data-product-panel="credits">クレジット</button>
                </div>
              </div>
              <div class="case-file-row">
                ${entries
                  .map((entry) =>
                    caseFileMarkup({
                      id: entry.id,
                      number: entry.info.number?.replace("案件 ", "") ?? String(entry.index + 1).padStart(3, "0"),
                      badge: entry.info.badge ?? `${entry.info.difficulty?.label ?? "通常"} / ${entry.info.type}`,
                      title: entry.info.shortTitle,
                      subtitle: entry.info.subtitle ?? entry.info.title?.split(" / ")[1] ?? entry.info.type,
                      description: entry.info.description ?? entry.info.difficulty?.summary ?? "事件ファイルを開き、根拠を選別する。",
                      record: entry.record,
                      rotation: rotations[entry.index % rotations.length],
                    }),
                  )
                  .join("")}
              </div>
              <button class="desk-clear-button" id="clear-records">記録を消す</button>
              ${state.productPanel ? productPanelMarkup(state.productPanel, entries, totalCompletions) : ""}
            </div>
          `
      }
    </section>
  `;
  bindImageFallbacks();
  mentor(
    totalCompletions > 0
      ? "記録は案件ごとに保存される。最有効使用は全案件の前提だが、類型ごとに見るべき根拠と説明の順序が変わる。"
      : "案件を選ぼう。最有効使用は全ての鑑定評価の前提だ。再開発予定地では特に、どの用途・規模で開発するのが最有効使用かが価格判断の中心になる。",
  );
  view.querySelectorAll("[data-start-case]").forEach((button) => {
    button.addEventListener("click", () => animateCaseSelection(button));
  });
  view.querySelector("#clear-records")?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state.records = loadRecords();
    renderCaseSelect();
  });
  view.querySelectorAll("[data-product-panel]").forEach((button) => {
    button.addEventListener("click", () => {
      state.productPanel = button.dataset.productPanel;
      renderCaseSelect();
    });
  });
  view.querySelector("[data-close-product-panel]")?.addEventListener("click", () => {
    state.productPanel = null;
    renderCaseSelect();
  });
}

function productPanelMarkup(panel, entries, totalCompletions) {
  return `
    <section class="product-panel" role="dialog" aria-modal="true" aria-label="${htmlAttr(productPanelTitle(panel))}">
      <div class="product-panel-paper">
        <div class="section-line">
          <h3>${htmlText(productPanelTitle(panel))}</h3>
          <button class="ghost-button product-close" data-close-product-panel>閉じる</button>
        </div>
        ${productPanelContent(panel, entries, totalCompletions)}
      </div>
    </section>
  `;
}

function productPanelTitle(panel) {
  return {
    settings: "設定",
    achievements: "実績",
    records: "クリア記録一覧",
    credits: "クレジット",
  }[panel] ?? "製品情報";
}

function productPanelContent(panel, entries, totalCompletions) {
  if (panel === "settings") {
    return `
      <div class="product-list">
        <div><strong>BGM</strong><span>現在 ${htmlText(bgmStatusLabel())}</span></div>
        <div><strong>効果音</strong><span>現在 ${htmlText(seStatusLabel())}</span></div>
        <div><strong>会話音声</strong><span>現在 ${htmlText(voiceStatusLabel())}</span></div>
        <div><strong>低刺激</strong><span>現在 ${htmlText(stimulusStatusLabel())}</span></div>
        <p>上部バーのボタンで、BGM、SE、VOICE、低刺激をいつでも切り替えられる。</p>
      </div>
    `;
  }
  if (panel === "achievements") {
    const completed = entries.filter((entry) => entry.record.completions > 0).length;
    const audited = entries.filter((entry) => entry.record.bestAudit !== null).length;
    const expert = entries.some((entry) => entry.id === "case010" && entry.record.completions > 0);
    const bestScore = Math.max(
      0,
      ...entries.flatMap((entry) => [entry.record.bestNormal ?? 0, entry.record.bestAudit ?? 0]),
    );
    const hbuSample = entries.some(
      (entry) => entry.id === "case003" && Math.max(entry.record.bestNormal ?? 0, entry.record.bestAudit ?? 0) >= 90,
    );
    const scenarioMaster = entries.some((entry) => entry.record.bestScenarioMastery >= 1);
    const explanationTitle = entries.some((entry) => entry.record.titles.includes("説明責任A+"));
    const strictAuditReady = entries.some((entry) => entry.record.bestAudit >= 90 && entry.record.bestScenarioMastery >= 1);
    return `
      <div class="achievement-grid">
        ${achievementMarkup("初回鑑定", totalCompletions > 0, "いずれかの事件ファイルを完了する")}
        ${achievementMarkup("全類型巡回", completed >= entries.length, "全事件ファイルを一度ずつ完了する")}
        ${achievementMarkup("監査鑑定士", audited >= 3, "監査レビューを3件完了する")}
        ${achievementMarkup("海外案件解放", expert, "海外案件を完了する")}
        ${achievementMarkup("Sランク論証", bestScore >= 90, "いずれかの案件で90点以上を取る")}
        ${achievementMarkup("HBU審査官", hbuSample, "案件003で90点以上を取り、最有効使用を説明する")}
        ${achievementMarkup("市場重点コンプリート", scenarioMaster, "いずれかの市場シナリオで重点証拠を全提示する")}
        ${achievementMarkup("説明責任A+", explanationTitle, "別解候補を残しつつ90点以上で完了する")}
        ${achievementMarkup("監査厳格化候補", strictAuditReady, "監査90点以上かつ市場重点100%を達成する")}
      </div>
    `;
  }
  if (panel === "records") {
    return `
      <div class="record-ledger">
        ${entries
          .map(
            (entry) => `
              <div>
                <strong>${htmlText(entry.info.number)} ${htmlText(entry.info.shortTitle)}</strong>
                <span>通常 ${htmlText(entry.record.bestNormal ?? "未完了")} / 監査 ${htmlText(entry.record.bestAudit ?? "未完了")} / ${htmlText(entry.record.completions)}回 / ${htmlText(entry.record.lastRank ?? "-")}</span>
                <span>${htmlText(scenarioRecordLine(entry.info, entry.record))}</span>
                ${entry.record.titles.length ? `<span>称号 ${htmlText(entry.record.titles.join(" / "))}</span>` : ""}
                <small>${htmlText(caseReplayGoal(entry.info, entry.record))}</small>
              </div>
            `,
          )
          .join("")}
      </div>
    `;
  }
  return `
    <div class="product-list">
      <div><strong>企画・実装</strong><span>Appraisal Detective prototype team</span></div>
      <div><strong>鑑定評価監修メモ</strong><span>不動産鑑定評価基準の用語・評価プロセスをゲーム向けに再構成</span></div>
      <div><strong>画像</strong><span>一部の現地調査背景と依頼者ポートレートは、開発中にOpenAI画像生成モデルで作成した事前生成アセットです。</span></div>
      <div><strong>実行中AI生成</strong><span>なし。ゲームプレイ中にプレイヤー入力から画像、音声、会話、文章を生成しません。</span></div>
      <div><strong>音源</strong><span>ローカル同梱BGM素材。詳細は docs/third-party-audio-notices.md に記録。</span></div>
      <div><strong>会話音声</strong><span>ブラウザまたはOSの日本語音声合成を使用。外部送信と実行中生成素材の保存は行わない。</span></div>
      <div><strong>素材台帳</strong><span>生成画像は assets-manifest.json で caseId、用途、altText、sha256、AI開示区分を管理。</span></div>
      <p>これは教育用ゲームであり、実際の鑑定評価書・価格意見ではない。</p>
    </div>
  `;
}

function achievementMarkup(title, unlocked, condition) {
  return `
    <div class="achievement-card ${unlocked ? "unlocked" : "locked"}">
      <strong>${htmlText(title)}</strong>
      <span>${htmlText(unlocked ? "解放済み" : condition)}</span>
    </div>
  `;
}

function caseReplayGoal(info, record = normalizeRecord()) {
  if (record.completions === 0) {
    return `${info.difficulty?.label ?? "通常"}: ${info.type ?? "鑑定評価"}の初回レビューを完了する。`;
  }
  const scenarioCount = info.marketScenarios?.length ?? 0;
  const scenarioSeen = Object.keys(record.scenarioRuns ?? {}).length;
  if (scenarioCount > 1 && scenarioSeen < scenarioCount) {
    return `次周目標: 未確認の市場シナリオを開く（${scenarioSeen}/${scenarioCount}踏破）。`;
  }
  if ((record.bestScenarioMastery ?? 0) < 1 && scenarioCount > 0) {
    return "次周目標: 今回シナリオの重点証拠を報告3枚に全反映する。";
  }
  if ((record.bestAudit ?? 0) < 85) {
    return info.replayGoal ?? "次周目標: 監査レビューで重要根拠3枚と説明可能な裁量を同時に満たす。";
  }
  if ((record.bestNormal ?? 0) < 90 && (record.bestAudit ?? 0) < 90) {
    return "次周目標: 同じ結論を別の3枚で支え、90点以上の論証を作る。";
  }
  return "達成済み: 次は市場シナリオを変え、別解ルートで同等ランクを狙う。";
}

function scenarioRecordLine(info, record = normalizeRecord()) {
  const scenarioCount = info.marketScenarios?.length ?? 0;
  if (scenarioCount === 0) return "市場シナリオなし";
  const scenarioSeen = Object.keys(record.scenarioRuns ?? {}).length;
  const mastery = Math.round((record.bestScenarioMastery ?? 0) * 100);
  const last = record.lastScenarioTitle ? ` / 前回 ${record.lastScenarioTitle}` : "";
  const seed = record.lastScenarioSeed ? ` / seed ${record.lastScenarioSeed}` : "";
  return `市場シナリオ ${scenarioSeen}/${scenarioCount}踏破 / 重点最高 ${mastery}%${last}${seed}`;
}

function caseFileMarkup({ id, number, badge, title, subtitle, description, record, rotation }) {
  const info = caseDefinitions[id];
  const difficulty = info.difficulty;
  return `
    <article class="case-file case-file-${classToken(rotation)}" data-case-file="${htmlAttr(id)}">
      <button class="case-file-folder" data-start-case="${htmlAttr(id)}" data-mode="normal" aria-label="${htmlAttr(`${title} ${subtitle}を通常レビューで開始`)}">
        <span class="file-tab">案件 ${htmlText(number)}</span>
        <span class="file-badge">${htmlText(badge)}</span>
        <span class="file-difficulty difficulty-${classToken(difficulty?.code?.toLowerCase(), "normal")}">${htmlText(difficulty?.label ?? "通常")}</span>
        <figure class="file-photo">
          <img src="${htmlAttr(caseImagePath(info.image, info.fallbackImage))}" data-fallback-src="${htmlAttr(caseImagePath(info.fallbackImage))}" alt="${htmlAttr(info.imageAlt)}" />
        </figure>
        <span class="file-title">${htmlText(title)}</span>
        <span class="file-subtitle">${htmlText(subtitle)}</span>
        <span class="file-client">${htmlText(info.client.name)}: ${htmlText(info.client.tension)}</span>
        <span class="file-description">${htmlText(description)}</span>
        <span class="file-guide">${htmlText(difficulty?.summary ?? "")}</span>
        <span class="file-records">
          <span>通常 ${htmlText(record.bestNormal ?? "未完了")}</span>
          <span>監査 ${htmlText(record.bestAudit ?? "未完了")}</span>
          <span>${htmlText(record.completions)}回</span>
        </span>
        <span class="file-start-label">通常レビューを開始</span>
      </button>
      <button class="case-audit-stamp" data-start-case="${htmlAttr(id)}" data-mode="audit" aria-label="${htmlAttr(`${title}を監査レビューで開始`)}">監査</button>
    </article>
  `;
}

function animateCaseSelection(button) {
  const desk = view.querySelector(".case-file-desk");
  const selectedCaseId = button.dataset.startCase;
  const challengeMode = button.dataset.mode === "audit";
  if (!desk || desk.classList.contains("case-selecting")) {
    return;
  }
  desk.classList.add("case-selecting");
  desk.dataset.selectedCase = selectedCaseId;
  desk.dataset.selectedMode = challengeMode ? "audit" : "normal";
  desk.querySelectorAll("[data-start-case]").forEach((caseButton) => {
    caseButton.disabled = true;
  });
  let selectedFile;
  desk.querySelectorAll("[data-case-file]").forEach((file) => {
    const selected = file.dataset.caseFile === selectedCaseId;
    file.classList.toggle("case-file-selected", selected);
    file.classList.toggle("case-file-dismissed", !selected);
    if (selected) selectedFile = file;
  });
  if (selectedFile) {
    const deskRect = desk.getBoundingClientRect();
    const selectedRect = selectedFile.getBoundingClientRect();
    const deskCenter = deskRect.left + deskRect.width / 2;
    const fileCenter = selectedRect.left + selectedRect.width / 2;
    selectedFile.style.setProperty("--case-select-x", `${Math.round(deskCenter - fileCenter)}px`);
  }
  announce(`事件ファイルを選択。${caseDefinitions[selectedCaseId]?.shortTitle ?? "案件"}を開きます。`);
  if (motionReduced.matches) {
    resetCase({ caseId: selectedCaseId, challengeMode });
    return;
  }
  if (!lowStimulus) {
    playCaseSelect();
  }
  let completed = false;
  const openSelectedCase = () => {
    if (completed) return;
    completed = true;
    selectedFile?.removeEventListener("transitionend", onTransitionEnd);
    window.setTimeout(() => resetCase({ caseId: selectedCaseId, challengeMode }), CASE_SELECT_HOLD_MS);
  };
  const onTransitionEnd = (event) => {
    if (event.target === selectedFile && event.propertyName === "transform") {
      openSelectedCase();
    }
  };
  selectedFile?.addEventListener("transitionend", onTransitionEnd);
  window.setTimeout(openSelectedCase, CASE_SELECT_TRANSITION_MS + 120);
}

function renderIntake() {
  renderEvidenceBoard();
  if (!state.primedPressure) {
    state.primedPressure = true;
    window.setTimeout(flashPressure, 280);
  }
  const isIncomeCase = state.caseId === "case002";
  const isRedevelopmentCase = state.caseId === "case003";
  const client = currentCase().client;
  const scenario = activeMarketScenario();
  const intake = currentCase().intake ?? (isRedevelopmentCase
    ? {
        chip: "依頼目的",
        title: "再開発予定地の開発素地価格把握",
        body: "駅南口の老朽倉庫街を、共同住宅と店舗の複合開発用地として評価する依頼。依頼者は黒川開発。既存テナントと近隣住民の反発が残っている。",
        clientLine:
          "市も前向きですし、立退きは後で何とかします。できれば最大容積の<span class=\"pressure-word\">マンション用地</span>として見てください。",
        mentorLine: "最有効使用は願望ではない。合法性、物理的可能性、市場性、収益性を順に確認しよう。",
        issues: [
          "価格の種類: 正常価格として扱えるか",
          "価格時点: 2026-05-05",
          "対象不動産: 複数筆、既存建物、借家人、道路後退",
          "依頼者圧力: 最大容積前提への誘導",
        ],
        professionalTitle: "正常価格として受任し、開発前提を未確定事項として扱う",
        professionalDetail: "再開発期待を価格時点の実現可能性に落とし、最有効使用を後から判定する。",
        pressureTitle: "依頼者の最大容積案を前提に進める",
        pressureDetail: "開発利益は大きく見えるが、公法規制と権利調整を飛ばす危険がある。",
      }
    : isIncomeCase
    ? {
        chip: "依頼目的",
        title: "融資審査のための収益価格把握",
        body: "駅前商業ビルの借換融資を前に、収益物件としての鑑定評価を依頼された。依頼者は森下不動産の佐伯。銀行提出用の評価額を気にしている。",
        clientLine:
          "銀行が見るので、できれば還元利回りは<span class=\"pressure-word\">低めに</span>見ていただけると助かります。",
        mentorLine: "まず価格時点と対象不動産を固定しよう。総収益、必要諸経費、還元利回りは希望額から切り離す。",
        issues: [
          "価格の種類: 正常価格として扱えるか",
          "価格時点: 2026-05-05",
          "対象不動産: 店舗・事務所・共用部と契約対象面積",
          "依頼者圧力: 低利回り誘導の可能性",
        ],
        professionalTitle: "正常価格として受任し、価格時点と対象不動産を固定する",
        professionalDetail: "融資希望額ではなく、収益資料と市場利回りから収益価格を検討する。",
        pressureTitle: "依頼者提示の利回りを参考にして進める",
        pressureDetail: "銀行評価には近づくが、還元利回りの説明可能な範囲を外れる。",
      }
    : {
        chip: "依頼目的",
        title: "相続に伴う時価把握",
        body: "田中家の実家を兄妹で分けるため、住宅地の鑑定評価を依頼された。依頼者は兄の田中修一。妹は実家を残したいと言っている。",
        clientLine:
          "父の遺した家を兄妹で分けたいんです。あと、できれば<span class=\"pressure-word\">高めに</span>見ていただけると助かります。",
        mentorLine: "まずは価格時点、価格の種類、対象不動産の確定だ。希望額から逆算しない。",
        issues: [
          "価格の種類: 正常価格として扱えるか",
          "価格時点: 2026-05-05",
          "対象不動産: 土地建物の範囲と面積",
          "依頼者圧力: 高め誘導の可能性",
        ],
        professionalTitle: "正常価格として受任し、価格時点と対象不動産を固定する",
        professionalDetail: "鑑定士として説明可能な裁量を守り、調査前に前提条件を明確にする。",
        pressureTitle: "依頼者の希望額を参考にして進める",
        pressureDetail: "依頼者満足は高いが、鑑定評価額の説明可能な範囲を外れる。",
      });
  if (!state.intakeRiskChoice) {
    view.innerHTML = `
      ${activeNovelSceneMarkup()}
      ${intakeRiskMarkup()}
    `;
    bindIntakeRiskCheck();
    return;
  }
  if (!state.intakeNextCheckChoice) {
    view.innerHTML = `
      ${activeNovelSceneMarkup()}
      ${intakeNextMarkup()}
    `;
    bindIntakeNextCheck();
    return;
  }
  if (!state.intakeRebuttalChoice) {
    view.innerHTML = `
      ${activeNovelSceneMarkup()}
      ${intakeRebuttalMarkup()}
    `;
    bindIntakeRebuttalCheck();
    return;
  }
  const intakeSummaryMarkup = state.intakeChoice
    ? `
      <div class="brief-grid">
        <article class="brief-card">
          <span class="term-chip">今回の線引き</span>
          <h3>${state.intakeChoice === "professional" ? htmlText(intake.professionalTitle) : htmlText(intake.pressureTitle)}</h3>
          <p>${state.intakeChoice === "professional" ? htmlText(intake.professionalDetail) : htmlText(intake.pressureDetail)}</p>
          <details class="brief-details">
            <summary>依頼メモを見る</summary>
            <div class="dialogue">
              ${speakerMarkup("client", client, intake.clientLine, { pressure: true })}
              ${speakerMarkup("mentor", {}, intake.mentorLine)}
            </div>
            <h4>依頼目的</h4>
            <p>${htmlText(intake.body)}</p>
            <h4>引っかかり</h4>
            <ul class="doc-list">
              ${intake.issues.map((issue) => `<li>${htmlText(issue)}</li>`).join("")}
              ${
                scenario
                  ? `<li>今回の市場条件: ${htmlText(scenario.title)} — ${htmlText(scenario.detail)} 調整時は${htmlText(scenario.appraisalHint)}</li>`
                  : ""
              }
              ${state.challengeMode ? "<li>監査レビュー: 全現地論点、重要3カード、中立判断を確認</li>" : ""}
            </ul>
          </details>
        </article>
      </div>
    `
    : `
      <article class="brief-card urgent detective-prompt">
        <span class="term-chip">受ける前の線引き</span>
        <p>${htmlText(intake.title)}</p>
        <h3>この依頼をどう受ける？</h3>
      </article>
    `;

  view.innerHTML = `
    ${activeNovelSceneMarkup()}
    ${tutorialMarkup()}
    ${state.intakeChoice ? "" : intakeRebuttalOutcomeMarkup()}
    ${intakeSummaryMarkup}
    <div class="option-grid phase-actions">
      <button class="option-button ${state.intakeChoice === "professional" ? "selected" : ""}" data-intake="professional">
        <strong>${htmlText(intake.professionalTitle)}</strong>
        <span>${htmlText(intake.professionalDetail)}</span>
      </button>
      <button class="option-button ${state.intakeChoice === "pressure" ? "selected" : ""}" data-intake="pressure">
        <strong>${htmlText(intake.pressureTitle)}</strong>
        <span>${htmlText(intake.pressureDetail)}</span>
      </button>
    </div>
    <div class="phase-actions">
      <button class="action-button" id="next-phase" ${state.intakeChoice ? "" : "disabled"}>現地調査へ</button>
      ${mentorAdviceButtonMarkup()}
    </div>
  `;

  view.querySelectorAll("[data-intake]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.intakeChoice === button.dataset.intake) return;
      state.intakeChoice = button.dataset.intake;
      if (state.intakeChoice === "professional") {
        addEvidence(
          currentCase().intakeEvidence?.pricePoint ??
            (isRedevelopmentCase ? "redevelopmentPricePoint" : isIncomeCase ? "incomePricePoint" : "pricePoint"),
          currentCase().intakeEvidence?.priceMessage ??
            (isRedevelopmentCase
            ? "開発素地価格の価格時点を固定した。再開発期待は、実現可能な前提に落とし込む。"
            : isIncomeCase
            ? "収益価格の価格時点を固定した。依頼者の融資希望額とは切り離して判断しよう。"
            : "価格時点を固定した。依頼者の希望額とは切り離して判断しよう。"),
        );
        addEvidence(
          currentCase().intakeEvidence?.subject ??
            (isRedevelopmentCase ? "redevelopmentSubject" : isIncomeCase ? "incomeSubject" : "subjectProperty"),
          currentCase().intakeEvidence?.subjectMessage ??
            (isRedevelopmentCase
            ? "複数筆、既存建物、借家人、前面道路を対象確定の初期論点に置いた。"
            : isIncomeCase
            ? "収益物件として対象範囲と契約面積を初期論点に置いた。"
            : "対象不動産の確定を初期論点に置いた。"),
        );
        award("intake-professional", { ethics: 8 });
      } else {
        award("intake-pressure", { ethics: -8 });
        flashPressure();
        mentor(
          isRedevelopmentCase
            ? "最大容積案は未信頼情報だ。公法上の規制と権利調整より先に開発利益へ寄せると危険だ。"
            : isIncomeCase
            ? "依頼者提示の利回りは未信頼情報だ。純収益と市場利回りより先に収益価格を寄せると危険だ。"
            : "依頼者の希望額は未信頼情報だ。調査根拠より先に価格を寄せると危険だ。",
        );
      }
      renderIntake();
    });
  });
  view.querySelector("#next-phase")?.addEventListener("click", () => setPhase(1));
}

function hotspotEvidencePreviewMarkup(id) {
  const item = evidenceCatalog[id];
  if (!item) return "";
  return `
    <span class="hotspot-evidence-preview evidence-${classToken(evidenceCategory(id), "investigation")}" aria-hidden="true">
      <em>${htmlText(item.term)}</em>
      <strong>${htmlText(item.title)}</strong>
      <small>${htmlText(item.detail)}</small>
    </span>
  `;
}

function renderFieldSurvey() {
  renderEvidenceBoard();
  const caseInfo = currentCase();
  const spots = activeHotspots();
  const decoys = activeDecoyHotspots();
  const foundCount = spots.filter((spot) => state.evidence.includes(spot.id)).length;
  view.innerHTML = `
    ${activeNovelSceneMarkup()}
    ${tutorialMarkup()}
    <div class="scene-shell">
      <img src="${htmlAttr(caseImagePath(caseInfo.image, caseInfo.fallbackImage))}" alt="${htmlAttr(caseInfo.imageAlt)}" data-fallback-src="${htmlAttr(caseImagePath(caseInfo.fallbackImage))}" />
      ${spots
        .map(
          (spot) => `
          <button
            class="hotspot hotspot-${classToken(spot.id)} ${state.evidence.includes(spot.id) ? "found" : ""}"
            data-hotspot="${htmlAttr(spot.id)}"
            aria-label="${htmlAttr(`${spot.label}。証拠カード: ${evidenceCatalog[spot.id].term}、${evidenceCatalog[spot.id].title}`)}"
            title="${htmlAttr(`${evidenceCatalog[spot.id].term}: ${evidenceCatalog[spot.id].title}`)}"
          ><span class="hotspot-label">${htmlText(spot.label)}</span>${hotspotEvidencePreviewMarkup(spot.id)}</button>
        `,
        )
        .join("")}
      ${decoys
        .map(
          (spot) => `
          <button
            class="hotspot decoy-hotspot hotspot-${classToken(spot.id)}"
            data-decoy="${htmlAttr(spot.id)}"
            aria-label="${htmlAttr(`${spot.title}。鑑定評価の根拠になるか確認する`)}"
            title="${htmlAttr(spot.title)}"
          ><span>${htmlText(spot.label)}</span></button>
        `,
        )
        .join("")}
    </div>
    <div class="scene-instructions">
      <span>写真内の違和感を調べ、専門用語カードに変換する。</span>
      <span class="scene-counter">発見済み ${foundCount} / ${spots.length}</span>
    </div>
    <div class="phase-checkline">終了条件: ${htmlText(foundCount >= 3 ? "資料照合へ進める" : `あと${3 - foundCount}か所発見`)} / 監査目標: ${htmlText(foundCount)} / ${htmlText(spots.length)}</div>
    <div class="phase-actions">
      <button class="action-button" id="next-phase" ${foundCount >= 3 ? "" : "disabled"}>資料照合へ</button>
      ${mentorAdviceButtonMarkup()}
    </div>
  `;

  view.querySelectorAll("[data-hotspot]").forEach((button) => {
    button.addEventListener("click", () => {
      addEvidence(button.dataset.hotspot);
      renderFieldSurvey();
    });
  });
  view.querySelectorAll("[data-decoy]").forEach((button) => {
    button.addEventListener("click", () => {
      const decoy = activeDecoyHotspots().find((spot) => spot.id === button.dataset.decoy);
      if (!decoy) return;
      award(`decoy-${decoy.id}`, { reasoning: -2 });
      showLearningCard("評価根拠の選別", decoy.lesson);
      mentor("そこは気になるが、鑑定評価額を説明する根拠としては弱い。学びカードで理由を確認しよう。");
    });
  });
  view.querySelector("#next-phase")?.addEventListener("click", () => setPhase(2));
}

function renderDocuments() {
  renderEvidenceBoard();
  const panels = activeDocumentPanels();
  const issues = activeDocumentIssues();
  const decoys = activeDocumentDecoys();
  const mechanic = activeMechanic();

  view.innerHTML = `
    ${activeNovelSceneMarkup()}
    ${tutorialMarkup()}
    <div class="document-grid">
      ${panels
        .map(
          (panel) => `
            <article class="document-card">
              <h3>${htmlText(panel.title)}</h3>
              <ul class="doc-list">
                ${panel.items.map((item) => `<li>${htmlText(item)}</li>`).join("")}
              </ul>
            </article>
          `,
        )
        .join("")}
    </div>
    ${documentOverlayDeskMarkup(issues)}
    <article class="document-card mechanic-card">
      <span class="term-chip">${htmlText(mechanic.term)}</span>
      <h3>${htmlText(mechanic.title)}</h3>
      <p>${htmlText(mechanic.prompt)}</p>
      ${mechanic.input ? mechanicInputMarkup(mechanic) : ""}
      <div class="option-grid phase-actions">
        ${mechanic.choices
          .map(
            (choice) => `
              <button
                class="doc-button mechanic-button ${state.mechanicChoice === choice.id ? "selected" : ""}"
                data-mechanic="${htmlAttr(choice.id)}"
              >
                <strong>${htmlText(choice.label)}</strong>
                <span>${htmlText(choice.detail)}</span>
              </button>
            `,
          )
          .join("")}
      </div>
    </article>
    <div class="option-grid phase-actions">
      ${issues
        .map(
          (issue) => `
          <button class="doc-button ${state.selectedDocs.has(issue.id) ? "selected" : ""}" data-doc="${htmlAttr(issue.id)}" draggable="true">
            <strong>${htmlText(issue.title)}</strong>
            <span>${htmlText(issue.detail)}</span>
          </button>
        `,
        )
        .join("")}
      ${decoys
        .map(
          (decoy) => `
          <button class="doc-button decoy-doc ${state.selectedDecoyDocs.has(decoy.id) ? "selected" : ""}" data-doc-decoy="${htmlAttr(decoy.id)}" draggable="true">
            <strong>${htmlText(decoy.title)}</strong>
            <span>${htmlText(decoy.detail)}</span>
          </button>
        `,
        )
        .join("")}
    </div>
    <div class="phase-checkline">終了条件: ${htmlText(state.selectedDocs.size >= 2 ? "鑑定判断へ進める" : `あと${2 - state.selectedDocs.size}件照合`)}</div>
    <div class="phase-actions">
      <button class="action-button" id="next-phase" ${state.selectedDocs.size >= 2 ? "" : "disabled"}>鑑定判断へ</button>
      ${mentorAdviceButtonMarkup()}
    </div>
  `;

  view.querySelectorAll("[data-doc]").forEach((button) => {
    button.addEventListener("click", () => selectDocumentIssue(button.dataset.doc));
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", `doc:${button.dataset.doc}`);
    });
  });
  view.querySelectorAll("[data-doc-decoy]").forEach((button) => {
    button.addEventListener("click", () => selectDocumentDecoy(button.dataset.docDecoy));
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", `decoy:${button.dataset.docDecoy}`);
    });
  });
  const dropZone = view.querySelector("[data-doc-dropzone]");
  dropZone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("drag-over");
  });
  dropZone?.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });
  dropZone?.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("drag-over");
    const [kind, id] = (event.dataTransfer?.getData("text/plain") ?? "").split(":");
    if (kind === "doc") selectDocumentIssue(id);
    if (kind === "decoy") selectDocumentDecoy(id);
  });
  view.querySelectorAll("[data-mechanic]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = activeMechanic().choices.find((item) => item.id === button.dataset.mechanic);
      if (!choice || state.mechanicChoice === choice.id) return;
      state.mechanicChoice = choice.id;
      award(`mechanic-${choice.id}`, choice.scores);
      if (choice.correct) {
        mentor(choice.mentor);
      } else {
        showLearningCard(activeMechanic().term, choice.lesson);
        mentor(choice.lesson);
      }
      renderDocuments();
    });
  });
  const mechanicInput = view.querySelector("[data-mechanic-input]");
  mechanicInput?.addEventListener("input", () => {
    state.mechanicInputValue = mechanicInput.value;
  });
  view.querySelector("[data-mechanic-check]")?.addEventListener("click", () => {
    evaluateMechanicInput();
    renderDocuments();
  });
  view.querySelector("#next-phase")?.addEventListener("click", () => setPhase(3));
}

function selectDocumentIssue(id) {
  if (!id || state.selectedDocs.has(id)) return;
  state.selectedDocs.add(id);
  addEvidence(id);
  renderDocuments();
}

function selectDocumentDecoy(id) {
  const decoy = activeDocumentDecoys().find((item) => item.id === id);
  if (!decoy || state.selectedDecoyDocs.has(decoy.id)) return;
  state.selectedDecoyDocs.add(decoy.id);
  award(`doc-decoy-${decoy.id}`, { reasoning: -3 });
  showLearningCard("資料の関連性", decoy.lesson);
  mentor(`資料として読めるが、今回の価格形成要因としては弱い。${decoy.lesson}`);
  renderDocuments();
}

function documentOverlayDeskMarkup(issues) {
  const selected = issues.filter((issue) => state.selectedDocs.has(issue.id));
  const nextIssue = issues.find((issue) => !state.selectedDocs.has(issue.id));
  const mechanic = activeMechanic();
  const mechanicStatus =
    state.mechanicInputPassed === true
      ? "検算済み"
      : state.mechanicChoice
      ? "固有チェック済み"
      : "未検算";
  return `
    <section class="document-overlay-desk" aria-label="資料照合デスク" data-doc-dropzone tabindex="0">
      <div class="overlay-desk-header">
        <span class="term-chip">照合デスク</span>
        <strong>資料を重ねて、価格に効くズレだけを残す</strong>
        <small>資料カードはクリック、またはここへドラッグして照合。</small>
      </div>
      <div class="overlay-desk-stack">
        ${
          selected.length
            ? selected
                .map(
                  (issue, index) => {
                    const evidenceTerm = evidenceCatalog[issue.id]?.term ?? "照合済み";
                    return `
                    <article class="overlay-doc-stamp overlay-doc-${index + 1}">
                      <i>監査スタンプ</i>
                      <em>${htmlText(evidenceTerm)}</em>
                      <strong>${htmlText(issue.title)}</strong>
                      <span>${htmlText(issue.detail)}</span>
                    </article>
                  `;
                  },
                )
                .join("")
            : `
              <article class="overlay-doc-placeholder">
                <i>未照合</i>
                <strong>${htmlText(nextIssue?.title ?? "価格形成要因")}</strong>
                <span>下の資料カードを選ぶと、ここに重なり、証拠カード化される。</span>
              </article>
            `
        }
      </div>
      <div class="overlay-desk-meter">
        <span>照合 ${htmlText(selected.length)}/2</span>
        <span>${htmlText(mechanic.term)}: ${htmlText(mechanicStatus)}</span>
        <span>${htmlText(selected.length >= 2 ? "鑑定判断へ進める" : `あと${2 - selected.length}件`)}</span>
      </div>
    </section>
  `;
}

function mechanicInputMarkup(mechanic) {
  const input = mechanic.input;
  const status =
    state.mechanicInputPassed === true
      ? `<p class="mechanic-result success">検算済み: ${htmlText(input.success)}</p>`
      : state.mechanicInputPassed === false
      ? `<p class="mechanic-result warning">再検算: ${htmlText(input.lesson)}</p>`
      : `<p class="mechanic-result">式: ${htmlText(input.formula)}</p>`;
  return `
    <div class="mechanic-input-panel">
      ${input.visual ? mechanicVisualMarkup(input.visual) : ""}
      <label for="mechanic-input-${htmlAttr(input.id)}">${htmlText(input.label)}</label>
      <div class="mechanic-input-row">
        <input
          id="mechanic-input-${htmlAttr(input.id)}"
          data-mechanic-input="${htmlAttr(input.id)}"
          inputmode="decimal"
          type="number"
          step="0.1"
          placeholder="${htmlAttr(input.placeholder)}"
          value="${htmlAttr(mechanicInputDisplayValue())}"
          aria-describedby="mechanic-input-help-${htmlAttr(input.id)}"
        />
        <span>${htmlText(input.suffix)}</span>
        <button class="ghost-button" type="button" data-mechanic-check>検算する</button>
      </div>
      <div id="mechanic-input-help-${htmlAttr(input.id)}">${status}</div>
    </div>
  `;
}

function mechanicVisualMarkup(visual) {
  return `
    <div class="zoning-visual" aria-label="${htmlAttr(visual.note)}">
      <div class="zoning-frame">
        <span class="zoning-tower planned">${htmlText(visual.planned)}</span>
        <span class="zoning-limit">${htmlText(visual.limit)}</span>
        <span class="zoning-tower feasible">${htmlText(visual.feasible)}</span>
      </div>
      <p>${htmlText(visual.note)}</p>
    </div>
  `;
}

function mechanicInputDisplayValue() {
  return String(state.mechanicInputValue).replace(/[^\d.-]/g, "").slice(0, 16);
}

function evaluateMechanicInput() {
  const mechanic = activeMechanic();
  const input = mechanic.input;
  if (!input) return;
  const value = Number(state.mechanicInputValue);
  const passed = Number.isFinite(value) && value >= input.min && value <= input.max;
  state.mechanicInputPassed = passed;
  if (passed) {
    award(`mechanic-input-${state.caseId}-pass`, input.scores);
    mentor(input.success);
    announce(`${mechanic.term}の検算に適合。${input.success}`);
  } else {
    award(`mechanic-input-${state.caseId}-fail`, input.penalty);
    showLearningCard(mechanic.term, input.lesson);
    mentor(input.lesson);
  }
}

function renderAppraisal() {
  renderEvidenceBoard();
  const isIncomeCase = state.caseId === "case002";
  const isRedevelopmentCase = state.caseId === "case003";
  const adjustmentBands = activeAdjustmentBands();
  const appraisalCopy = currentCase().appraisalCopy ?? {};
  const methodEvidenceId =
    currentCase().appraisalEvidence?.method ??
    (isRedevelopmentCase ? "developmentMethod" : isIncomeCase ? "directCap" : "comparableA");
  const adjustmentEvidenceId =
    currentCase().appraisalEvidence?.adjustment ??
    (isRedevelopmentCase ? "bestUseAdjustment" : isIncomeCase ? "incomeAdjustment" : "riskAdjustment");
  view.innerHTML = `
    ${activeNovelSceneMarkup()}
    ${tutorialMarkup()}
    ${hbuRenderer.hbuMatrixMarkup?.(currentCase().hbuMatrix) ?? ""}
    <div class="brief-grid">
      <article class="brief-card">
        <span class="term-chip">${htmlText(appraisalCopy.methodTerm ?? (isRedevelopmentCase ? "開発法" : isIncomeCase ? "収益還元法" : "取引事例比較法"))}</span>
        <h3>${htmlText(appraisalCopy.methodTitle ?? (isRedevelopmentCase ? "開発素地価格の査定方法を選択" : isIncomeCase ? "収益価格の査定方法を選択" : "主たる取引事例を選択"))}</h3>
        <p>${htmlText(appraisalCopy.methodBody ?? (isRedevelopmentCase ? "数値計算は自動化される。プレイヤーは、開発後販売総額と控除費用をどう現実化するかを判断する。" : isIncomeCase ? "数値計算は自動化される。プレイヤーは、純収益と還元利回りをどう市場化するかを判断する。" : "数値計算は自動化される。プレイヤーは、どの事例を市場価格の根拠として信頼するかを判断する。"))}</p>
        <div class="phase-actions">
          ${
            appraisalCopy.methodChoices
              ? appraisalCopy.methodChoices
                  .map((choice) => choiceButton("comparable", choice.id, choice.label, choice.detail))
                  .join("")
              :
            isRedevelopmentCase
              ? `
                ${choiceButton("comparable", "A", "開発法を主採用", "開発後販売総額から建築費、販売費、利潤、期間リスクを控除する。")}
                ${choiceButton("comparable", "B", "現況倉庫利用を前提", "現況は把握しやすいが、駅南口の市場性を過小評価する。")}
                ${choiceButton("comparable", "C", "最大容積消化で逆算", "開発利益は大きいが、公法規制と権利調整を無視しやすい。")}
              `
              : isIncomeCase
              ? `
                ${choiceButton("comparable", "A", "直接還元法を主採用", "安定純収益を標準化し、市場利回りで還元する。")}
                ${choiceButton("comparable", "B", "取引事例比較法を主採用", "土地建物一体の商業ビルでは、収益資料を補助に回す判断になる。")}
                ${choiceButton("comparable", "C", "依頼者提示利回りで逆算", "融資希望額には近づくが、市場リスクの説明が弱い。")}
              `
              : `
                ${choiceButton("comparable", "A", "事例Aを主採用", "同一町内・標準的住宅地・6か月前。比較可能性が高い。")}
                ${choiceButton("comparable", "B", "事例Bを主採用", "近いが親族間売買で、事情補正が重い。")}
                ${choiceButton("comparable", "C", "事例Cを主採用", "資料は多いが、駅近かつ18か月前で補正が多い。")}
              `
          }
        </div>
      </article>
      <article class="brief-card">
        <span class="term-chip">${htmlText(appraisalCopy.adjustmentTerm ?? (isRedevelopmentCase ? "最有効使用" : isIncomeCase ? "収益価格の査定" : "試算価格の調整"))}</span>
        <h3>${htmlText(appraisalCopy.adjustmentTitle ?? (isRedevelopmentCase ? "実現可能性の扱い" : isIncomeCase ? "収益リスクの扱い" : "減価要因の扱い"))}</h3>
        <p>${htmlText(appraisalCopy.adjustmentBody ?? (isRedevelopmentCase ? "現地調査と資料照合で得たカードを、合法性、物理的可能性、市場性、収益性の判断理由として採用する。" : isIncomeCase ? "現地調査と資料照合で得たカードを、純収益と還元利回りの調整理由として採用する。" : "現地調査と資料照合で得たカードを、比準価格の調整理由として採用する。"))}</p>
        <div class="phase-actions">
          ${
            appraisalCopy.adjustmentChoices
              ? appraisalCopy.adjustmentChoices
                  .map((choice) => choiceButton("adjustment", choice.id, choice.label, choice.detail))
                  .join("")
              :
            isRedevelopmentCase
              ? `
                ${choiceButton("adjustment", "risk", "公法規制・立退き・浸水リスクを反映", "発見済みの実現可能性リスクを最有効使用と開発法へ反映する。")}
                ${choiceButton("adjustment", "soft", "再開発計画をそのまま採用", "依頼者との関係は保ちやすいが、実現可能性の説明責任が弱くなる。")}
              `
              : isIncomeCase
              ? `
                ${choiceButton("adjustment", "risk", "空室・修繕・利回りリスクを反映", "発見済みの収益リスクを純収益と還元利回りへ反映する。")}
                ${choiceButton("adjustment", "soft", "満室想定に近い収益で扱う", "依頼者との関係は保ちやすいが、説明責任が弱くなる。")}
              `
              : `
                ${choiceButton("adjustment", "risk", "接道・越境・嫌悪施設を反映", "発見済みの個別的要因と地域要因を減価として扱う。")}
                ${choiceButton("adjustment", "soft", "軽微な問題として扱う", "依頼者との関係は保ちやすいが、説明責任が弱くなる。")}
              `
          }
        </div>
      </article>
      <article class="brief-card">
        <span class="term-chip">調整幅</span>
        <h3>根拠カードから減価幅を決める</h3>
        <p>発見した事実を、価格レンジ内のどの程度の調整として扱うかを選ぶ。強すぎても弱すぎても説明責任を失う。</p>
        ${activeMarketScenario() ? `<div class="notice">市場条件: ${activeMarketScenario().title} / ${activeMarketScenario().appraisalHint}</div>` : ""}
        <div class="phase-actions">
          ${adjustmentBands
            .map((band) => choiceButton("adjustment-band", band.id, band.label, band.detail))
            .join("")}
        </div>
        ${discretionRangeMarkup(adjustmentBands)}
        ${state.adjustmentBand ? adjustmentSupportMarkup() : ""}
      </article>
    </div>
    <div class="phase-checkline">終了条件: 査定方式 ${state.comparableChoice ? "済" : "未"} / リスク反映 ${state.adjustmentChoice ? "済" : "未"} / 調整幅 ${state.adjustmentBand ? "済" : "未"} / 調整根拠 ${state.adjustmentSupport.size}/2</div>
    <div class="phase-actions">
      <button class="action-button" id="next-phase" ${state.comparableChoice && state.adjustmentChoice && state.adjustmentBand && state.adjustmentSupport.size >= 2 ? "" : "disabled"}>報告・対決へ</button>
      ${mentorAdviceButtonMarkup()}
    </div>
  `;

  view.querySelectorAll("[data-comparable]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.comparableChoice === button.dataset.comparable) return;
      state.comparableChoice = button.dataset.comparable;
      if (state.comparableChoice === "A") {
        addEvidence(
          methodEvidenceId,
          currentCase().appraisalEvidence?.methodMessage ??
            (isRedevelopmentCase
            ? "開発法を主採用した。販売総額だけでなく、控除費用と期間リスクの説明が必要だ。"
            : isIncomeCase
            ? "直接還元法を主採用した。純収益と市場利回りの説明が必要だ。"
            : "事例Aを主たる取引事例として採用した。比較可能性が高い。"),
        );
      } else {
        award(`comparable-${state.comparableChoice}`, { appraisal: -5 });
        showLearningCard(
          "査定方式の選択",
          isRedevelopmentCase
            ? "開発予定地で最大容積案や現況だけを主軸にすると、合法性・市場性・期間リスクの説明が薄くなる。"
            : isIncomeCase
            ? "収益物件で依頼者利回りや売買事例だけに寄せると、純収益と市場利回りの説明が弱くなる。"
            : "取引事例は近さだけでなく、事情補正・時点修正・個別的要因比較まで含めて選ぶ。",
        );
        mentor(
          isRedevelopmentCase
            ? "再開発予定地で実現可能性を脇に置くなら、その理由を強く説明できる必要がある。"
            : isIncomeCase
            ? "収益物件で収益資料を脇に置くなら、その理由を強く説明できる必要がある。"
            : "補正が多い事例を主採用するなら、その理由を強く説明できる必要がある。",
        );
      }
      renderAppraisal();
    });
  });
  view.querySelectorAll("[data-adjustment]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.adjustmentChoice === button.dataset.adjustment) return;
      state.adjustmentChoice = button.dataset.adjustment;
      if (state.adjustmentChoice === "risk") {
        addEvidence(
          adjustmentEvidenceId,
          currentCase().appraisalEvidence?.adjustmentMessage ??
            (isRedevelopmentCase
            ? "公法規制、立退き、道路後退、浸水リスクを最有効使用の判定に反映した。"
            : isIncomeCase
            ? "空室、修繕、利回りリスクを収益価格の査定に反映した。"
            : "現地調査で得たリスクを試算価格の調整に反映した。"),
        );
      } else {
        award("adjustment-soft", { appraisal: -6, ethics: -2 });
        showLearningCard(
          isRedevelopmentCase ? "最有効使用の判定" : isIncomeCase ? "収益リスクの反映" : "試算価格の調整",
          isRedevelopmentCase
            ? "最有効使用は依頼者の計画図ではなく、法令上・物理上・市場上・収益上の実現可能性で絞る。"
            : isIncomeCase
            ? "収益価格では、空室・修繕・利回りを控除または反映しないと純収益を過大に見る。"
            : "発見済みの接道・越境・嫌悪施設を軽視すると、比準価格と現地調査の整合性が崩れる。",
        );
        mentor(
          isRedevelopmentCase
            ? "依頼者に配慮しすぎると、発見した公法規制・権利調整・災害リスクとの整合性が崩れる。"
            : isIncomeCase
            ? "依頼者に配慮しすぎると、発見した空室・修繕・利回りリスクとの整合性が崩れる。"
            : "依頼者に配慮しすぎると、発見した減価要因との整合性が崩れる。",
        );
      }
      renderAppraisal();
    });
  });
  view.querySelectorAll("[data-adjustment-band]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.adjustmentBand === button.dataset.adjustmentBand) return;
      state.adjustmentBand = button.dataset.adjustmentBand;
      state.adjustmentSupport = new Set();
      const band = activeAdjustmentBands().find((item) => item.id === state.adjustmentBand);
      if (!band) return;
      award(`adjustment-band-${band.id}`, band.scores);
      if (band.correct) {
        mentor(band.mentor);
      } else {
        showLearningCard("試算価格の調整幅", band.lesson);
        mentor(band.lesson);
      }
      renderAppraisal();
    });
  });
  view.querySelectorAll("[data-adjustment-support]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.adjustmentSupport;
      if (state.adjustmentSupport.has(id)) {
        state.adjustmentSupport.delete(id);
      } else if (state.adjustmentSupport.size < 2) {
        state.adjustmentSupport.add(id);
      }
      renderAppraisal();
    });
  });
  view.querySelector("#next-phase")?.addEventListener("click", () => {
    setPhase(4);
    mentor("報告では証拠カードを3枚だけ使う。全部ではなく、論証として強い根拠を選ぼう。");
  });
}

function discretionRangeMarkup(adjustmentBands = activeAdjustmentBands()) {
  const selected = selectedAdjustmentBand();
  const scenario = activeMarketScenario();
  const chosenIndex = selected
    ? Math.max(0, adjustmentBands.findIndex((band) => band.id === selected.id))
    : -1;
  const markerPosition = chosenIndex >= 0 && adjustmentBands.length > 1
    ? Math.round((chosenIndex / (adjustmentBands.length - 1)) * 100)
    : 50;
  const markerClass = chosenIndex < 0 ? "unset" : `pos-${Math.min(4, chosenIndex)}`;
  const selectedSupport = selected?.supportEvidence ?? [];
  const supportLabels = selectedSupport
    .slice(0, 4)
    .map((id) => evidenceCatalog[id]?.term ?? id);
  const scenarioLabels = (scenario?.supportEvidence ?? [])
    .slice(0, 3)
    .map((id) => evidenceCatalog[id]?.term ?? id);
  const selectedLabel = selected
    ? `${selected.label} / ${selected.correct ? "説明可能レンジ内" : "監査で説明補強が必要"}`
    : "未選択 / まず調整幅を選ぶ";
  const warning = selected
    ? selected.correct
      ? "この幅は、取得済み資料と市場条件で説明できる裁量範囲です。依頼者要望へ配慮しても、根拠が先に立ちます。"
      : "この幅を採るなら、根拠不足や希望額逆算に見えないよう追加説明が必要です。"
    : "裁量は自由な値付けではありません。下限・上限の間で、根拠カードと市場条件に支えられる位置を選びます。";

  return `
    <section class="discretion-meter" aria-label="説明可能な裁量レンジ">
      <div class="discretion-meter-head">
        <span class="term-chip">説明可能な裁量レンジ</span>
        <strong>${htmlText(selectedLabel)}</strong>
      </div>
      <div class="discretion-track" role="img" aria-label="下限寄りから上限寄りまでの調整幅。現在位置 ${htmlAttr(String(markerPosition))}%">
        <span>下限寄り</span>
        <i class="discretion-marker-${htmlAttr(markerClass)}"></i>
        <span>上限寄り</span>
      </div>
      <div class="discretion-range-options">
        ${adjustmentBands
          .map(
            (band) => `
              <span class="${selected?.id === band.id ? "current" : ""}">
                ${htmlText(band.label)}
              </span>
            `,
          )
          .join("")}
      </div>
      <p>${htmlText(warning)}</p>
      <dl>
        <div>
          <dt>支える根拠</dt>
          <dd>${htmlText(supportLabels.length ? supportLabels.join(" / ") : "調整幅を選ぶと表示")}</dd>
        </div>
        <div>
          <dt>今回条件</dt>
          <dd>${htmlText(scenario ? `${scenario.title}: ${scenarioLabels.join(" / ")}` : "標準条件")}</dd>
        </div>
      </dl>
    </section>
  `;
}

function adjustmentSupportMarkup() {
  const band = selectedAdjustmentBand();
  const available = state.evidence
    .filter((id) => evidenceCatalog[id])
    .slice()
    .sort((a, b) => evidenceCategory(b).localeCompare(evidenceCategory(a)));
  return `
    <div class="support-picker">
      <span class="term-chip">限定条件・根拠</span>
      <h3>${htmlText(band?.supportPrompt ?? "調整幅を支える根拠を2枚選ぶ")}</h3>
      <p>調整幅を支える証拠を選ぶ。数字だけではなく、どの価格形成要因に支えられるかで説明する。</p>
      <div class="support-grid">
        ${available
          .map((id) => {
            const selected = state.adjustmentSupport.has(id);
            return `
              <button class="support-card evidence-${classToken(evidenceCategory(id), "appraisal")} ${selected ? "selected" : ""}" data-adjustment-support="${htmlAttr(id)}" ${!selected && state.adjustmentSupport.size >= 2 ? "disabled" : ""}>
                <em>${htmlText(evidenceCatalog[id].term)}</em>
                <strong>${htmlText(evidenceCatalog[id].title)}</strong>
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function choiceButton(group, value, title, detail) {
  const selected =
    (group === "comparable" && state.comparableChoice === value) ||
    (group === "adjustment" && state.adjustmentChoice === value) ||
    (group === "adjustment-band" && state.adjustmentBand === value);
  return `
    <button class="option-button ${selected ? "selected" : ""}" data-${classToken(group)}="${htmlAttr(value)}">
      <strong>${htmlText(title)}</strong>
      <span>${htmlText(detail)}</span>
    </button>
  `;
}

function reportMissingSteps() {
  const missing = [];
  if (state.selectedReport.size < 3) missing.push(`証拠カードをあと${3 - state.selectedReport.size}枚選ぶ`);
  if (!state.rebuttalChoice) missing.push("再反論を選ぶ");
  if (state.rebuttalChoice && !state.rebuttalEvidence) missing.push("反論根拠カードを選ぶ");
  if (!state.ethicsChoice) missing.push("裁量判断を選ぶ");
  return missing;
}

function canFinishReport() {
  return reportMissingSteps().length === 0;
}

function guideReportMissingStep() {
  const missing = reportMissingSteps();
  if (missing.length === 0) return true;
  const message = `まだ最終レビューには進めない。不足: ${missing.join("、")}。`;
  mentor(message);
  announce(message);
  const selector = state.selectedReport.size < 3
    ? "#evidence-board"
    : !state.rebuttalChoice
    ? "[data-rebuttal]"
    : !state.rebuttalEvidence
    ? "[data-rebuttal-evidence]"
    : "[data-ethics]";
  const target = document.querySelector(selector);
  target?.scrollIntoView?.({ block: "center", behavior: motionReduced.matches || lowStimulus ? "auto" : "smooth" });
  target?.focus?.({ preventScroll: true });
  return false;
}

function renderReport() {
  renderEvidenceBoard({ selectable: true });
  const isIncomeCase = state.caseId === "case002";
  const isRedevelopmentCase = state.caseId === "case003";
  const selectedCount = state.selectedReport.size;
  const canFinish = canFinishReport();
  const missingSteps = reportMissingSteps();
  const client = currentCase().client;
  const baseClientPressure = currentCase().reportPressure?.client ?? (isRedevelopmentCase
    ? "住民説明は後回しでいいので、14階案を前提にしてください。ここで低く出ると地権者がまとまりません。"
    : isIncomeCase
    ? "銀行評価を通すため、還元利回りは4%台で見せたいんです。ここだけ少し丸められませんか。"
    : "妹にはこの家の価値を高く見せたいんです。根拠の範囲で、上側に説明できる余地はありませんか。");
  const mentorPressure = currentCase().reportPressure?.mentor ?? (isRedevelopmentCase
    ? "計画を聞くのは実務だ。ただし最有効使用は、法規制、権利調整、市場性で説明できる範囲に収める。"
    : isIncomeCase
    ? "借換目的は評価目的として聞く。ただし収益価格は、純収益と利回りで説明できる範囲に収める。"
    : "依頼者の事情は評価目的を理解する材料だ。最後は説明可能な裁量として君の判断を示そう。");
  const reportIds = Array.from(state.selectedReport);
  const rebuttal = clientRebuttal(reportIds);
  const scenario = activeMarketScenario();
  const scenarioIndex = (currentCase().marketScenarios ?? []).findIndex((item) => item.id === scenario?.id);
  const clientPressure = scenarioEngine.scenarioClientDemand(scenario, baseClientPressure, {
    caseInfo: currentCase(),
    scenarioIndex,
  });

  view.innerHTML = `
    ${state.termBurst ? `<div class="term-burst">${htmlText(state.termBurst)}</div>` : ""}
    ${activeNovelSceneMarkup()}
    ${tutorialMarkup()}
    <div class="brief-grid">
      <article class="brief-card">
        <span class="term-chip">鑑定評価書</span>
        <h3>根拠カードを3枚選んで説明</h3>
        <p>先輩鑑定士と依頼者の前で、鑑定評価額の説明責任を果たす。右の証拠ボードから3枚を選択する。</p>
        <div class="notice">証拠提示: ${htmlText(selectedCount)} / 3枚</div>
        ${
          scenario
            ? `<div class="market-scenario-brief"><strong>${htmlText(scenario.title)}</strong><span>今回の重点根拠: ${(scenario.supportEvidence ?? [])
                .map((id) => htmlText(evidenceCatalog[id]?.term ?? id))
                .join(" / ")}</span></div>`
            : ""
        }
        <div class="phase-checkline">終了条件: 証拠3枚 + 再反論 + 反論根拠 + 裁量判断 / 現在 ${htmlText(selectedCount)}/3 ${state.rebuttalChoice ? "再反論済み" : "再反論未選択"} ${state.rebuttalEvidence ? "根拠済み" : "根拠未選択"} ${state.ethicsChoice ? "判断済み" : "裁量未選択"}</div>
        <div class="selected-evidence report-stack">
          ${reportIds
            .map((id, index) => reportEvidenceMarkup(id, index))
            .join("") || "<p>まだ報告根拠が選ばれていません。</p>"}
        </div>
        ${
          rebuttal
            ? `<div class="dialogue report-rebuttal">${speakerMarkup("client", client, rebuttal, { pressure: true })}</div>`
            : ""
        }
        ${selectedCount === 3 ? rebuttalOptionsMarkup(reportIds) : ""}
      </article>
      <article class="brief-card urgent">
        <span class="term-chip">説明可能な裁量</span>
        <h3>依頼者要望への応答</h3>
        <div class="dialogue">
          ${speakerMarkup("client", client, clientPressure, { pressure: true })}
          ${speakerMarkup("mentor", {}, mentorPressure)}
        </div>
        <div class="phase-actions">
          <button class="option-button ${state.ethicsChoice === "neutral" ? "selected" : ""}" data-ethics="neutral">
            <strong>根拠の範囲で、依頼目的に沿う説明可能な評価にする</strong>
            <span>鑑定士の裁量はある。価格形成要因で支えられる範囲内で、依頼者要望への説明を組む。</span>
          </button>
          <button class="option-button ${state.ethicsChoice === "yield" ? "selected" : ""}" data-ethics="yield">
            <strong>根拠を超えて希望額へ合わせる</strong>
            <span>短期的には揉めにくいが、説明可能な裁量を超えると評価書の信頼性を失う。</span>
          </button>
        </div>
      </article>
    </div>
    <div class="phase-actions">
      <button class="action-button ${canFinish ? "" : "needs-steps"}" id="finish-case" ${canFinish ? "" : `aria-describedby="report-missing-steps"`}>最終レビューを見る</button>
      <button class="ghost-button" id="restart-case">最初から再調査</button>
      ${mentorAdviceButtonMarkup()}
    </div>
    ${canFinish ? "" : `<div class="phase-checkline report-missing-steps" id="report-missing-steps">未完了: ${htmlText(missingSteps.join(" / "))}</div>`}
  `;

  view.querySelectorAll("[data-ethics]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.ethicsChoice === button.dataset.ethics) return;
      state.ethicsChoice = button.dataset.ethics;
      if (state.ethicsChoice === "neutral") {
        award("ethics-neutral", { ethics: 18, appraisal: 4 });
        mentor(
          isRedevelopmentCase
            ? "説明可能な裁量に収めた。開発期待は聞き、最有効使用は実現可能性で説明する。"
            : isIncomeCase
            ? "説明可能な裁量に収めた。融資目的は理解し、純収益と還元利回りで上限を説明する。"
            : "説明可能な裁量に収めた。依頼者の事情を聞いたうえで、根拠で支えられる価格レンジを示せている。",
        );
      } else {
        award("ethics-yield", { ethics: -18, appraisal: -4 });
        showLearningCard(
          "説明可能な裁量",
          isRedevelopmentCase
            ? "開発会社の最大容積案を根拠化せず採ると、正常価格ではなく利害調整用の価格に近づく。"
            : isIncomeCase
            ? "融資希望額に合わせて利回りを置くと、収益価格が市場賃料・必要諸経費・還元利回りから切り離される。"
            : "相続交渉の都合だけで価格を置くと、鑑定評価額が依頼者の交渉カードになってしまう。",
        );
        flashPressure();
        mentor(
          isRedevelopmentCase
            ? "根拠を超えて最大容積案に寄せる判断は、職業倫理と最有効使用判定の信頼性を損なう。"
            : isIncomeCase
            ? "根拠を超えて依頼者の利回りに寄せる判断は、職業倫理と収益価格の信頼性を損なう。"
            : "根拠を超えて依頼者の希望に寄せる判断は、職業倫理と評価書の信頼性を損なう。",
        );
      }
      renderReport();
    });
  });
  view.querySelectorAll("[data-rebuttal]").forEach((button) => {
    button.addEventListener("click", () => {
      const option = activeRebuttalOptions().find((item) => item.id === button.dataset.rebuttal);
      if (!option) return;
      state.rebuttalChoice = option.id;
      state.rebuttalEvidence = null;
      state.rebuttalSupported = false;
      if (option.correct) {
        award(`rebuttal-${option.id}`, { reasoning: 3, ethics: 2 });
        mentor("再反論の方針は妥当だ。次に、提示済み証拠のどれで支えるかを選ぼう。");
        announce(`再反論。${option.label}`);
      } else {
        award(`rebuttal-${option.id}`, { reasoning: -3 });
        const lesson = option.lesson ?? "依頼者の都合ではなく、提示済み証拠から再反論を組み立てる。";
        showLearningCard("再反論", lesson);
        mentor(lesson);
      }
      renderReport();
    });
  });
  view.querySelectorAll("[data-rebuttal-evidence]").forEach((button) => {
    button.addEventListener("click", () => {
      const option = selectedRebuttalOption();
      state.rebuttalEvidence = button.dataset.rebuttalEvidence;
      state.rebuttalSupported = Boolean(option?.correct && option.requiredEvidence === state.rebuttalEvidence);
      if (state.rebuttalSupported) {
        award(`rebuttal-evidence-${state.rebuttalEvidence}`, { reasoning: 4, appraisal: 2 });
        mentor("再反論と根拠カードがつながった。依頼者の言葉ではなく、評価書の論証に戻せた。");
      } else {
        award(`rebuttal-evidence-${state.rebuttalEvidence}-weak`, { reasoning: -2 });
        showLearningCard("再反論の根拠", "反論方針が正しくても、支えるカードがずれると報告書では弱い。相手の反論に直接刺さる根拠を選ぶ。");
        mentor("そのカードでは反論への接続が弱い。再反論は、相手が争っている一点に直接返す根拠で支える。");
      }
      renderReport();
    });
  });
  view.querySelector("#finish-case")?.addEventListener("click", () => {
    if (!guideReportMissingStep()) return;
    renderResult();
  });
  view.querySelector("#restart-case").addEventListener("click", resetCase);
}

function rebuttalOptionsMarkup(reportIds) {
  const options = activeRebuttalOptions();
  const selectedOption = selectedRebuttalOption();
  return `
    <div class="rebuttal-answer">
      <span class="term-chip">再反論</span>
      <h3>依頼者の反論に、提示済み証拠で返す</h3>
      <div class="phase-actions">
        ${options
          .map((option) => {
            const supported = !option.requiredEvidence || reportIds.includes(option.requiredEvidence);
            return `
              <button class="option-button ${state.rebuttalChoice === option.id ? "selected" : ""} ${supported ? "" : "unsupported"}" data-rebuttal="${htmlAttr(option.id)}">
                <strong>${htmlText(option.label)}</strong>
                <span>${htmlText(option.detail)}${supported ? "" : " / 注意: 必要な証拠カードが提示されていない"}</span>
              </button>
            `;
          })
          .join("")}
      </div>
      ${
        selectedOption
          ? `
            <div class="support-picker rebuttal-support">
              <span class="term-chip">反論根拠</span>
              <h3>どのカードで再反論を支えるか</h3>
              <div class="support-grid">
                ${reportIds
                  .map(
                    (id) => `
                      <button class="support-card evidence-${classToken(evidenceCategory(id), "appraisal")} ${state.rebuttalEvidence === id ? "selected" : ""}" data-rebuttal-evidence="${htmlAttr(id)}">
                        <em>${htmlText(evidenceCatalog[id].term)}</em>
                        <strong>${htmlText(evidenceCatalog[id].title)}</strong>
                      </button>
                    `,
                  )
                  .join("")}
              </div>
            </div>
            ${state.rebuttalEvidence ? rebuttalResolutionMarkup(selectedOption, state.rebuttalEvidence) : ""}
          `
          : ""
      }
    </div>
  `;
}

function rebuttalResolutionMarkup(option, evidenceId) {
  const evidence = evidenceCatalog[evidenceId];
  const client = currentCase().client;
  const supported = Boolean(option?.correct && state.rebuttalSupported);
  const clientLine = supported
    ? "そこまで根拠を並べられると、こちらの希望だけでは押せませんね。"
    : "その説明だと、こちらの反論にまだ直接答えていないように聞こえます。";
  const playerLine = supported
    ? `${evidence?.term ?? "根拠"}として「${evidence?.title ?? "提示済み証拠"}」を置きます。評価額は希望額ではなく、この前提から説明します。`
    : `提示したカードの接続が弱いです。反論された一点に直接刺さる根拠へ組み直します。`;
  const mentorLine = supported
    ? "二往復目まで根拠で返せた。最後は説明可能な裁量の範囲で、評価書の結論として閉じよう。"
    : "反論の往復で崩れるなら、報告根拠の選び方に戻ろう。強い三枚を組み直すんだ。";
  return `
    <div class="dialogue rebuttal-resolution" aria-label="報告対決 二往復目">
      ${speakerMarkup("client", client, clientLine, { pressure: !supported })}
      ${speakerMarkup("player", { name: "新人鑑定士", initial: "新" }, playerLine)}
      ${speakerMarkup("mentor", {}, mentorLine)}
    </div>
  `;
}

function clientRebuttal(selectedIds) {
  if (selectedIds.length === 0) return "";
  const custom = currentCase().clientRebuttals;
  if (custom) {
    const matched = custom.rules?.find((rule) => selectedIds.includes(rule.evidence));
    return matched?.line ?? custom.defaultLine ?? "その根拠だけで、本当に評価額まで説明できますか。";
  }
  if (state.caseId === "case003") {
    if (selectedIds.includes("zoningCheck")) return "容積率400%と聞いています。高度地区で削られると言い切れるんですか。";
    if (selectedIds.includes("relocationCost")) return "テナントとは話がついています。立退料をそんなに重く見る必要がありますか。";
    return "それは現況の話ですよね。再開発後の価値をもっと見てください。";
  }
  if (state.caseId === "case002") {
    if (selectedIds.includes("capRateGap")) return "駅前物件なのに5%台の利回りで見るんですか。銀行に弱く見えませんか。";
    if (selectedIds.includes("rentRoll")) return "空室は一時的です。満室想定で見てもらえませんか。";
    return "融資資料としてはもう少し強い表現にできませんか。";
  }
  if (selectedIds.includes("areaMismatch")) return "坪数の違いは測り方の問題ではありませんか。妹には高く説明したいんです。";
  if (selectedIds.includes("specialTransaction")) return "近所の取引なら、親族間でも参考になるんじゃないですか。";
  return "その減価要因は、本当に価格に入れるほど大きいんですか。";
}

function renderResult() {
  renderEvidenceBoard();
  playResult();
  const caseInfo = currentCase();
  const reportIds = Array.from(state.selectedReport);
  const highValueCards = caseHighValueCards();
  const professionalTerms = new Set(reportIds.map((id) => evidenceCatalog[id].term));
  const reportStrength = reportIds.filter((id) => highValueCards.includes(id)).length * 6;
  const expertise = clamp(40 + professionalTerms.size * 10 + reportStrength);
  const baseTotal = Math.round(
    (state.score.investigation + state.score.reasoning + state.score.appraisal + state.score.ethics + expertise) / 5,
  );
  const challenge = scoring.evaluateChallenge({
    challengeMode: state.challengeMode,
    requiredReport: currentCase().requiredReport,
    hotspots: activeHotspots(),
    evidenceIds: state.evidence,
    ethicsChoice: state.ethicsChoice,
    caseId: state.caseId,
    reportIds,
  });
  const elapsed = elapsedSeconds();
  const timeAdjustment = scoring.evaluateTimeAdjustment({
    elapsed,
    caseId: state.caseId,
    challengeMode: state.challengeMode,
  });
  const variance = scoring.evaluateScoreVariance({
    awards: state.awards,
    mechanic: activeMechanic(),
    mechanicChoiceId: state.mechanicChoice,
    mechanicInputPassed: state.mechanicInputPassed,
    adjustmentBand: selectedAdjustmentBand(),
    adjustmentSupport: Array.from(state.adjustmentSupport),
    rebuttalOption: selectedRebuttalOption(),
    rebuttalEvidence: state.rebuttalEvidence,
    rebuttalSupported: state.rebuttalSupported,
    marketScenario: activeMarketScenario(),
    reportIds,
    reportStructure: currentCase().reportStructure,
    requiredReport: currentCase().requiredReport,
    highValueCards,
    challengeMode: state.challengeMode,
  });
  const total = clamp(baseTotal + challenge.delta + timeAdjustment.delta + variance.delta);
  const finalGrade = grade(total);
  const auditEvidenceLabels = Object.fromEntries(
    (caseInfo.auditCriteria?.requiredEvidence ?? []).map((id) => [
      id,
      `${evidenceCatalog[id]?.term ?? "根拠"} / ${evidenceCatalog[id]?.title ?? id}`,
    ]),
  );
  const scenarioStatus = marketScenarioStatus();
  const replayTitles = replayTitleBadges({ total, expertise, elapsed, scenarioStatus });
  saveResult(total, scenarioStatus, replayTitles);

  view.innerHTML = `
    <article class="result-card">
      <span class="term-chip">最終レビュー</span>
      <h3>${htmlText(caseInfo.shortTitle)} 鑑定評価レビュー</h3>
      <section class="result-celebration result-${classToken(finalGrade.toLowerCase())}" aria-label="最終評価 ${htmlAttr(finalGrade)}ランク">
        <div class="rank-seal rank-${classToken(finalGrade.toLowerCase())}" aria-label="総合ランク ${htmlAttr(finalGrade)}">
          <span>${htmlText(finalGrade)}</span>
          <small>${state.challengeMode ? "監査レビュー" : "通常レビュー"}</small>
        </div>
        <div class="result-celebration-copy">
          <span>${htmlText(finalGrade === "S" ? "正常価格 監査適合" : finalGrade === "A" ? "鑑定レビュー 完了" : "要再検討")}</span>
          <strong>${htmlText(total)}点 / ${htmlText(finalGrade)}ランク</strong>
          <p>${htmlText(resultCelebrationText(finalGrade, total))}</p>
        </div>
      </section>
      <div class="grade-row">
        ${gradeCell("調査", state.score.investigation)}
        ${gradeCell("推理", state.score.reasoning)}
        ${gradeCell("鑑定判断", state.score.appraisal)}
        ${gradeCell("倫理", state.score.ethics)}
        ${gradeCell("専門性", expertise)}
      </div>
      <p>
        <strong>総合スコア: ${htmlText(total)}点</strong>
        ${state.challengeMode ? ` <span class="audit-delta">監査補正 ${htmlText(signed(challenge.delta))}</span>` : ""}
        <span class="audit-delta">時間補正 ${htmlText(signed(timeAdjustment.delta))}</span>
        <span class="audit-delta">判断補正 ${htmlText(signed(variance.delta))}</span>
      </p>
      <p class="score-breakdown">経過時間 ${htmlText(formatDuration(elapsed))} / ${htmlText(timeAdjustment.label)}。${htmlText(variance.label)}</p>
      ${marketScenarioResultMarkup(scenarioStatus)}
      ${alternativeEvidenceReviewMarkup(scenarioStatus, variance.evidenceRoute)}
      ${replayTitleMarkup(replayTitles)}
      <p>${htmlText(reviewText(total, expertise))}</p>
      <section class="result-mentor-line">
        <span class="term-chip">先輩の一言</span>
        <p>${htmlText(resultMentorLine(total, reportIds))}</p>
      </section>
      ${hbuRenderer.auditCriteriaMarkup?.(caseInfo.auditCriteria, reportIds, auditEvidenceLabels) ?? ""}
      ${reviewChecklist(reportIds, challenge)}
      ${replayBrief(total, scenarioStatus, variance.evidenceRoute)}
      <div class="selected-evidence">
        <h3>報告に使った根拠</h3>
        ${reportIds
          .map((id, index) => reportEvidenceMarkup(id, index))
          .join("")}
      </div>
      <div class="phase-actions">
        <button class="action-button" id="restart-case">証拠構成を変えて再挑戦</button>
        <button class="ghost-button" id="case-select">案件選択へ</button>
        ${
          state.challengeMode
            ? `<button class="ghost-button" id="normal-case">通常レビューへ戻る</button>`
            : `<button class="ghost-button" id="challenge-case">監査レビューで二周目</button>`
        }
      </div>
    </article>
  `;
  wrapPhaseGameDesk("review");
  mentor(
    state.challengeMode
      ? "監査レビュー完了。次は同じ案件でも、証拠提示の順番と根拠の組み合わせで評価が変わる。"
      : "1件完了。監査レビューでは、同じ案件でも全現地論点と重要3カードの提示が求められる。",
  );
  setBgmSceneOverride("result");
  updateBgmPlayback();
  view.querySelector("#restart-case").addEventListener("click", () => resetCase({ challengeMode: state.challengeMode }));
  view.querySelector("#case-select").addEventListener("click", () => {
    state.phase = -1;
    state.storyIndex = 0;
    state.storyRevealed = false;
    renderScore();
    renderEvidenceBoard();
    renderPhase();
  });
  view.querySelector("#challenge-case")?.addEventListener("click", () => resetCase({ challengeMode: true }));
  view.querySelector("#normal-case")?.addEventListener("click", () => resetCase({ challengeMode: false }));
}

function showLearningCard(term, message) {
  overlayMarkup(
    "learning-card",
    [
      { tag: "em", text: "学びカード" },
      { tag: "strong", text: term },
      { tag: "span", text: message },
    ],
    OVERLAY_TIMEOUTS.learning,
    `学びカード。${term}。${message}`,
    "assertive",
  );
}

function saveResult(total, scenarioStatus = marketScenarioStatus(), replayTitles = []) {
  if (state.resultSaved) return;
  const record = currentRecord();
  if (state.challengeMode) record.bestAudit = Math.max(record.bestAudit ?? 0, total);
  else record.bestNormal = Math.max(record.bestNormal ?? 0, total);
  record.completions += 1;
  record.lastRank = grade(total);
  record.lastPlayed = new Date().toISOString().slice(0, 10);
  if (scenarioStatus.scenario) {
    const id = scenarioStatus.scenario.id;
    record.scenarioRuns[id] = (record.scenarioRuns[id] ?? 0) + 1;
    record.lastScenario = id;
    record.lastScenarioTitle = scenarioStatus.scenario.title;
    record.lastScenarioSeed = scenarioStatus.seed;
    record.lastScenarioMastery = scenarioStatus.mastery;
    record.bestScenarioMastery = Math.max(record.bestScenarioMastery ?? 0, scenarioStatus.mastery);
  }
  if (replayTitles.length) {
    record.titles = [...new Set([...(record.titles ?? []), ...replayTitles])];
  }
  saveRecords();
  state.resultSaved = true;
}

function elapsedSeconds() {
  if (!state.startedAt) return 0;
  return Math.max(0, Math.round((Date.now() - state.startedAt) / 1000));
}

function targetSeconds() {
  return scoring.targetSeconds({ caseId: state.caseId, challengeMode: state.challengeMode });
}

function challengePanel(challenge) {
  return `
    <section class="audit-panel">
      <span class="term-chip">監査レビュー</span>
      <div class="audit-list">
        ${challenge.checks
          .map(
            (check) => `
            <div class="${check.passed ? "passed" : "failed"}">
              <strong>${check.passed ? "適合" : "指摘"}: ${htmlText(check.label)}</strong>
              <span>${htmlText(check.detail)}</span>
            </div>
          `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function reviewChecklist(reportIds, challenge) {
  const requiredReport = currentCase().requiredReport;
  const spots = activeHotspots();
  const checks = state.challengeMode
    ? challenge.checks
    : [
        {
          label: "現地調査",
          passed: spots.filter((spot) => state.evidence.includes(spot.id)).length >= 3,
          detail: "通常レビューでは3か所以上の現地根拠があれば報告へ進める。次は5/5で監査に挑める。",
        },
        {
          label: "重要カード",
          passed: requiredReport.some((id) => reportIds.includes(id)),
          detail: "重要カードを1枚以上使うと、次周で狙うべき論証の芯が見える。",
        },
        {
          label: "説明可能な裁量",
          passed: state.ethicsChoice === "neutral",
          detail: "依頼者要望を、根拠で支えられる範囲内に収めたか。",
        },
      ];
  return challengePanel({ checks });
}

function replayBrief(total, scenarioStatus = marketScenarioStatus(), evidenceRoute = null) {
  const reportIds = Array.from(state.selectedReport);
  const scenario = activeMarketScenario();
  const alternate = caseHighValueCards()
    .filter((id) => evidenceCatalog[id] && !reportIds.includes(id))
    .slice(0, 3)
    .map((id) => `${evidenceCatalog[id].term} / ${evidenceCatalog[id].title}`);
  const missing = currentCaseEvidenceEntries()
    .filter(([id]) => !state.evidence.includes(id))
    .sort(([, a], [, b]) => scoreWeight(b.scores) - scoreWeight(a.scores))
    .slice(0, 2)
    .map(([, item]) => `${item.term} / ${item.title}`);
  const missed =
    missing.length === 0
      ? "主要論点は拾えている。次は提示カード3枚の組み合わせで説得力を上げる。"
      : `見落とし候補: ${missing.join("、")}`;
  const next =
    state.challengeMode
      ? "次周目標: 監査3条件をすべて満たしたまま、提示カードの順序と説明の見え方を変える。"
      : total >= 85
      ? "次周目標: 説明可能な裁量を保ったまま、別の根拠3枚で同等ランクを狙う。"
      : state.caseId === "case003"
      ? "次周目標: 現地調査を5/5にして、公法上の規制・権利調整・最有効使用を報告に絡める。"
      : state.caseId === "case002"
      ? "次周目標: 現地調査を5/5にして、レントロール・必要諸経費・還元利回りを報告に絡める。"
      : "次周目標: 現地調査を5/5にして、対象確定・事情補正・試算価格の調整を報告に絡める。";

  return `
    <section class="replay-brief">
      <span class="term-chip">次周メモ</span>
      <p>${htmlText(missed)}</p>
      <p>${htmlText(next)}</p>
      ${
        scenario
          ? `<p>${htmlText(`今回シナリオ: ${scenario.title}。重点証拠達成率 ${scenarioStatus.reportHits}/${scenarioStatus.total}。`)}</p>`
          : ""
      }
      ${
        alternate.length
          ? `<p>${htmlText(`別解ルート候補: ${alternate.join("、")}。同じ結論を別の三枚で支えると、監査・リプレイ評価が伸びる。`)}</p>`
          : ""
      }
      ${
        evidenceRoute?.nextCategory
          ? `<p>${htmlText(`次に詰める証拠カテゴリ: ${evidenceRoute.nextCategory}。同じ案件でも別解評価が変わる。`)}</p>`
          : ""
      }
      <p>${htmlText(currentCase().replayGoal ?? "スコア研究軸: 調査、論証構成、裁量説明、説明責任を別々に伸ばす。")}</p>
    </section>
  `;
}

function marketScenarioStatus() {
  const scenario = activeMarketScenario();
  return scenarioEngine.marketScenarioStatus({
    scenario,
    scenarioList: currentCase().marketScenarios ?? [],
    caseInfo: currentCase(),
    challengeMode: state.challengeMode,
    record: currentRecord(),
    resultSaved: state.resultSaved,
    selectedReport: state.selectedReport,
    evidence: state.evidence,
  });
}

function marketScenarioResultMarkup(status = marketScenarioStatus()) {
  if (!status.scenario) return "";
  const supportList = status.supportEvidence
    .map((id) => {
      const item = evidenceCatalog[id];
      const found = status.evidenceHits.includes(id);
      const reported = status.reportHits.includes(id);
      return `
        <li class="${reported ? "reported" : found ? "found" : "missing"}">
          <strong>${htmlText(item?.term ?? id)}</strong>
          <span>${htmlText(item?.title ?? id)}</span>
          <em>${htmlText(reported ? "報告済" : found ? "取得済" : "未取得")}</em>
        </li>
      `;
    })
    .join("");
  return `
    <section class="scenario-result-panel">
      <div>
        <span class="term-chip">市場シナリオ ${htmlText(status.scenarioIndex + 1)}/${htmlText(status.scenarioCount)}</span>
        <h3>${htmlText(status.scenario.title)}</h3>
        <p>${htmlText(status.scenario.detail)}</p>
        <small>seed ${htmlText(status.seed)} / 今回条件を記録し、別条件の再挑戦と比較できる。</small>
      </div>
      <div class="scenario-mastery">
        <strong>重点証拠達成率 ${htmlText(status.reportHits.length)}/${htmlText(status.total)} (${htmlText(Math.round(status.mastery * 100))}%)</strong>
        <span>${htmlText(status.scenario.appraisalHint)}</span>
      </div>
      <ul class="scenario-support-list">
        ${supportList}
      </ul>
    </section>
  `;
}

function alternativeEvidenceReviewMarkup(status = marketScenarioStatus(), scoredRoute = null) {
  const reportIds = Array.from(state.selectedReport);
  const requiredReport = currentCase().requiredReport ?? [];
  const requiredHits = requiredReport.filter((id) => reportIds.includes(id)).length;
  const scenarioHits = status.reportHits?.length ?? 0;
  const scenarioTotal = status.total ?? 0;
  const foundHighValue = caseHighValueCards().filter((id) => state.evidence.includes(id));
  const alternateIds = foundHighValue.filter((id) => !reportIds.includes(id)).slice(0, 3);
  const riskIds = [
    ...(status.supportEvidence ?? []),
    ...requiredReport,
  ].filter((id, index, list) => !reportIds.includes(id) && list.indexOf(id) === index).slice(0, 3);
  const route =
    scoredRoute ??
    (scenarioTotal > 0 && scenarioHits >= Math.min(2, scenarioTotal) && requiredHits >= 2
      ? {
          level: "optimal",
          label: "最適構成",
          detail: "今回シナリオの重点証拠と重要カードが重なり、説明責任・監査リスクの両方に強い。",
        }
      : requiredHits >= 2 || scenarioHits >= 1
      ? {
          level: "acceptable",
          label: "許容構成",
          detail: "結論は説明可能。ただし市場シナリオまたは重要カードの一部を差し替えると、監査耐性が伸びる。",
        }
      : {
          level: "risk",
          label: "監査リスクあり",
          detail: "三枚の根拠が今回条件と結論を支えきれていない。重点証拠か重要カードを入れ直したい。",
        });
  const routeLabel = scoredRoute
    ? scoredRoute.level === "optimal"
      ? "最適構成"
      : scoredRoute.level === "acceptable"
      ? "許容構成"
      : "監査リスクあり"
    : route.label;
  const routeDetail = scoredRoute?.label ?? route.detail ?? "";

  return `
    <section class="alternative-route-panel route-${classToken(route.level)}" aria-label="代替証拠評価">
      <div class="alternative-route-head">
        <span class="term-chip">代替証拠評価</span>
        <strong>${htmlText(routeLabel)}</strong>
      </div>
      <p>${htmlText(routeDetail)}</p>
      ${route.nextCategory ? `<p class="route-next-target">${htmlText(`次に詰める証拠カテゴリ: ${route.nextCategory}`)}</p>` : ""}
      <div class="route-comparison-grid">
        ${routeListMarkup("現在の三枚", reportIds, "今回の報告で依頼者へ提示した根拠。")}
        ${routeListMarkup(
          "別解候補",
          alternateIds,
          alternateIds.length
            ? "同じ結論を別の三枚で支える研究候補。"
            : "主要な高価値カードはすでに使えている。",
        )}
        ${routeListMarkup(
          "監査リスク",
          riskIds,
          riskIds.length
            ? "未提示のままだと監査コメントで突かれやすい根拠。"
            : "重点根拠の提示漏れは少ない。",
        )}
      </div>
    </section>
  `;
}

function routeListMarkup(title, ids, fallback) {
  return `
    <div class="route-list">
      <strong>${htmlText(title)}</strong>
      ${
        ids.length
          ? `<ul>${ids.map((id) => routeItemMarkup(id)).join("")}</ul>`
          : `<p>${htmlText(fallback)}</p>`
      }
    </div>
  `;
}

function routeItemMarkup(id) {
  const item = evidenceCatalog[id];
  return `<li><em>${htmlText(item?.term ?? id)}</em><span>${htmlText(item?.title ?? id)}</span></li>`;
}

function replayTitleBadges({ total, expertise, elapsed, scenarioStatus }) {
  const titles = [];
  const mastery = scenarioStatus?.mastery ?? 0;
  if (mastery >= 1) titles.push("市場重点コンプリート");
  if (total >= 90 && expertise >= 80) titles.push("説明責任A+");
  if (state.challengeMode && total >= 90 && mastery >= 1) titles.push("監査厳格化候補");
  if (state.ethicsChoice === "neutral" && state.score.ethics >= 80) titles.push("裁量説明S");
  if (elapsed <= targetSeconds()) titles.push("速度鑑定");
  if (state.caseId === "case003" && total >= 90) titles.push("HBU審査官");
  return [...new Set(titles)];
}

function replayTitleMarkup(titles = []) {
  if (!titles.length) {
    return `
      <section class="replay-title-strip pending">
        <span class="term-chip">周回称号</span>
        <p>称号未取得。市場重点、説明責任、裁量説明、速度のいずれかを伸ばすと次周の狙いが見える。</p>
      </section>
    `;
  }
  return `
    <section class="replay-title-strip">
      <span class="term-chip">獲得称号</span>
      <div>
        ${titles.map((title) => `<strong>${htmlText(title)}</strong>`).join("")}
      </div>
      <p>称号は記録一覧に保存され、同じ案件の別シナリオ攻略と比較できる。</p>
    </section>
  `;
}

function caseHighValueCards() {
  const scenarioCards = activeMarketScenario()?.supportEvidence ?? [];
  const baseCards = currentCase().highValueCards ?? (
    state.caseId === "case003"
      ? ["zoningCheck", "relocationCost", "infrastructureBurden", "developmentMethod", "bestUseAdjustment", "tenantRights"]
      : state.caseId === "case002"
      ? ["rentRoll", "expenseLeak", "capRateGap", "directCap", "incomeAdjustment", "vacancySign"]
      : ["areaMismatch", "specialTransaction", "comparableA", "riskAdjustment", "boundary", "road"]
  );
  return [...new Set([...scenarioCards, ...baseCards])];
}

function resultCelebrationText(finalGrade, total) {
  if (finalGrade === "S") return "証拠の拾い方、調整理由、裁量判断が一本の鑑定ストーリーとして通った。";
  if (finalGrade === "A") return "結論は実務に耐える。次周は市場シナリオに合わせて三枚の根拠を組み替えたい。";
  if (total >= 70) return "評価の骨格はある。弱い根拠や再反論の不足を補えば上位ランクが狙える。";
  return "現地、資料、判断の接続が切れている。先輩メモを頼りに、根拠の順序から組み直そう。";
}

function resultMentorLine(total, reportIds) {
  const requiredUsed = currentCase().requiredReport.filter((id) => reportIds.includes(id)).length;
  if (total >= 90 && requiredUsed >= 2) {
    return "今回は評価書の芯が見える。次は監査で、同じ結論を別の三枚でも支えられるか試せ。";
  }
  if (total >= 75) {
    return "結論は崩れていない。ただ、根拠の順序を変えれば依頼者への刺さり方も変わる。";
  }
  if (state.ethicsChoice !== "neutral") {
    return "根拠を超えて寄せた瞬間、説明の強さが落ちた。最後は説明可能な裁量の範囲に収めよう。";
  }
  return "拾った根拠が報告の三枚に変換しきれていない。現地、資料、判断のつながりを組み直そう。";
}

function scoreWeight(scores) {
  return Object.values(scores).reduce((total, value) => total + Math.max(0, value), 0);
}

function gradeCell(label, value) {
  return `<div><strong>${htmlText(grade(value))}</strong><span>${htmlText(label)} ${htmlText(clamp(value))}</span></div>`;
}

function grade(value) {
  if (value >= 85) return "S";
  if (value >= 70) return "A";
  if (value >= 55) return "B";
  if (value >= 40) return "C";
  return "D";
}

function reviewText(total, expertise) {
  if (total >= 80) {
    return `専門用語を使った論証が成立している。依頼者要望を根拠で支えられる範囲に収め、正常価格として説明できた。`;
  }
  if (expertise < 65) {
    return `証拠は集めたが、鑑定評価の言葉で説明しきれていない。事情補正、個別的要因、試算価格の調整を根拠としてつなげよう。`;
  }
  return `大筋は妥当だが、重要な根拠の見落としまたは裁量説明の弱さが残る。調査カードの集め方を変えて再鑑定してみよう。`;
}

function resetCase(options = {}) {
  state.caseId = options.caseId ?? state.caseId;
  state.challengeMode = options.challengeMode ?? state.challengeMode;
  const scenarios = currentCase().marketScenarios ?? [];
  const recordBeforeStart = currentRecord();
  state.marketScenario = scenarios.length > 0 ? scenarios[recordBeforeStart.completions % scenarios.length] : null;
  resetCaseProgress(state);
  const startMessage = currentCase().mentorStart ?? (
    state.caseId === "case003"
      ? "「最有効使用は依頼者の計画図ではない。合法性、物理的可能性、市場性、収益性を根拠で説明するんだ。」"
      : state.caseId === "case002"
      ? "「収益価格は融資希望額に近づける余地もある。だが、純収益、必要諸経費、還元利回りで説明できる金額に限る。」"
      : "「依頼者の希望は聞け。だが、根拠を積み上げて説明できる金額に収めるんだ。」"
  );
  mentor(
    state.challengeMode
      ? "監査レビュー開始。全現地論点を拾い、重要3カードで説明可能な裁量を示しきれ。"
      : startMessage,
  );
  renderScore();
  renderEvidenceBoard();
  renderPhase();
}

renderScore();
renderEvidenceBoard();
renderPhase();
window.setInterval(renderTimerMeta, 1000);

document.addEventListener("click", (event) => {
  if (event.target.closest("button:not(:disabled)")) playClick();
});

document.addEventListener("pointerdown", primeBgmPlayback, { once: true, passive: true });
document.addEventListener("keydown", primeBgmPlayback, { once: true });
document.addEventListener("pointerdown", primeVoicePlayback, { once: true, passive: true });
document.addEventListener("keydown", primeVoicePlayback, { once: true });

bgmToggle?.addEventListener("click", () => {
  toggleBgm();
});

audioToggle?.addEventListener("click", () => {
  toggleAudio();
});

voiceToggle?.addEventListener("click", () => {
  toggleVoice();
  speakVisibleConversation();
});

stimulusToggle?.addEventListener("click", () => {
  lowStimulus = !lowStimulus;
  localStorage.setItem(audio.STIMULUS_STORAGE_KEY, String(lowStimulus));
  renderStimulusToggle();
  renderVoiceToggle();
  document.body.classList.toggle("low-stimulus", lowStimulus);
  if (lowStimulus) cancelVoice();
  updateBgmPlayback();
  if (!lowStimulus) speakVisibleConversation();
});
}
