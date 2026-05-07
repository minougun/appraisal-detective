(() => {
  const { htmlText, classToken, pressureLineHtml } = window.APPRAISAL_UTILS ?? {};
  if (
    typeof htmlText !== "function" ||
    typeof classToken !== "function" ||
    typeof pressureLineHtml !== "function"
  ) {
    throw new Error("APPRAISAL_UTILS must be loaded before gameplay-cast.js.");
  }

  const PLAYER_SPEAKER = Object.freeze({ name: "新人鑑定士", initial: "新" });
  const CAST_PHASES = new Set(["field", "documents", "appraisal", "report"]);

  function gameplayCastReactions(key, context) {
    if (!CAST_PHASES.has(key)) return [];
    const {
      client,
      scenario,
      found = 0,
      selectedDocs = 0,
      supportCount = 0,
      reportCount = 0,
    } = context;
    const scenarioLine = scenario ? `${scenario.title}。${scenario.appraisalHint}` : "価格時点の市場条件を忘れない。";

    if (key === "field") {
      return [
        { kind: "player", speaker: PLAYER_SPEAKER, line: `違和感 ${found}/5。写真の中から価格形成要因を拾います。` },
        { kind: "mentor", speaker: {}, line: "見た目の傷ではなく、市場参加者が嫌う理由に変換しろ。" },
        { kind: "client", speaker: client, line: "そこまで細かく見るんですか。", pressure: false },
      ];
    }
    if (key === "documents") {
      return [
        { kind: "player", speaker: PLAYER_SPEAKER, line: `資料照合 ${selectedDocs}/2。説明と一次資料のズレを探します。` },
        { kind: "mentor", speaker: {}, line: "矛盾は数字の綻びだ。事情補正や対象確定へ落とせ。" },
        { kind: "client", speaker: client, line: "資料にも事情がありますから。", pressure: true },
      ];
    }
    if (key === "appraisal") {
      return [
        { kind: "player", speaker: PLAYER_SPEAKER, line: `調整根拠 ${supportCount}/2。集めたカードで調整幅を支えます。` },
        { kind: "mentor", speaker: {}, line: scenarioLine },
        { kind: "client", speaker: client, line: "結論が硬すぎると困ります。", pressure: true },
      ];
    }
    return [
      { kind: "player", speaker: PLAYER_SPEAKER, line: `報告根拠 ${reportCount}/3。事実、分析、結論の順で組みます。` },
      { kind: "mentor", speaker: {}, line: "証拠は多いほどいいわけじゃない。三枚で説明責任を果たせ。" },
      { kind: "client", speaker: client, line: "もう少し言い方で調整できませんか。", pressure: true },
    ];
  }

  function gameplayCastMarkup(key, reactions) {
    if (reactions.length === 0) return "";
    return `
      <aside class="gameplay-cast gameplay-cast-${classToken(key)}" aria-label="ゲームプレイ中の会話反応">
        ${reactions.map((reaction) => miniReactionMarkup(reaction)).join("")}
      </aside>
    `;
  }

  function miniReactionMarkup({ kind, speaker, line, pressure = false }) {
    const isClient = kind === "client";
    const isPlayer = kind === "player";
    const name = isClient ? speaker.name : isPlayer ? speaker.name ?? "新人鑑定士" : "先輩鑑定士";
    const initial = isClient ? speaker.initial : isPlayer ? speaker.initial ?? "新" : "先";
    const portraitClass = isClient ? speaker.portraitClass : isPlayer ? "portrait-player" : "portrait-mentor";
    return `
      <div class="cast-reaction cast-${classToken(kind)} ${pressure ? "pressure" : ""}">
        <span class="mini-portrait ${classToken(portraitClass, "portrait-mentor")}" aria-hidden="true">${htmlText(initial)}</span>
        <p><strong>${htmlText(name)}</strong><span>「${pressureLineHtml(line)}」</span></p>
      </div>
    `;
  }

  window.APPRAISAL_GAMEPLAY_CAST = Object.freeze({
    gameplayCastReactions,
    gameplayCastMarkup,
  });
})();
