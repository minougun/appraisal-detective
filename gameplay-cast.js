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
      caseInfo,
      found = 0,
      selectedDocs = 0,
      supportCount = 0,
      reportCount = 0,
    } = context;
    const scenarioLine = scenario ? `${scenario.title}。${scenario.appraisalHint}` : "価格時点の市場条件を忘れない。";
    const clientLine = (phase, fallback) => {
      const authored = client?.gameplayLines?.[phase];
      if (authored) return authored;
      return generatedClientLine(phase, { client, scenario, caseInfo }) ?? fallback;
    };

    if (key === "field") {
      return [
        { kind: "player", speaker: PLAYER_SPEAKER, line: `違和感 ${found}/5。写真の中から価格形成要因を拾います。` },
        { kind: "mentor", speaker: {}, line: "見た目の傷ではなく、市場参加者が嫌う理由に変換しろ。" },
        { kind: "client", speaker: client, line: clientLine("field", "そこまで細かく見るんですか。"), pressure: false },
      ];
    }
    if (key === "documents") {
      return [
        { kind: "player", speaker: PLAYER_SPEAKER, line: `資料照合 ${selectedDocs}/2。説明と一次資料のズレを探します。` },
        { kind: "mentor", speaker: {}, line: "矛盾は数字の綻びだ。事情補正や対象確定へ落とせ。" },
        { kind: "client", speaker: client, line: clientLine("documents", "資料にも事情がありますから。"), pressure: true },
      ];
    }
    if (key === "appraisal") {
      return [
        { kind: "player", speaker: PLAYER_SPEAKER, line: `調整根拠 ${supportCount}/2。集めたカードで調整幅を支えます。` },
        { kind: "mentor", speaker: {}, line: scenarioLine },
        { kind: "client", speaker: client, line: clientLine("appraisal", "結論が硬すぎると困ります。"), pressure: true },
      ];
    }
    return [
      { kind: "player", speaker: PLAYER_SPEAKER, line: `報告根拠 ${reportCount}/3。事実、分析、結論の順で組みます。` },
      { kind: "mentor", speaker: {}, line: "証拠は多いほどいいわけじゃない。三枚で説明責任を果たせ。" },
      { kind: "client", speaker: client, line: clientLine("report", "もう少し言い方で調整できませんか。"), pressure: true },
    ];
  }

  function generatedClientLine(phase, { client, scenario, caseInfo }) {
    const title = caseInfo?.shortTitle ?? "この案件";
    const scenarioTitle = scenario?.title;
    const tension = client?.tension ?? "";
    const isFinance = /融資|担保|銀行|借換/.test(tension + title);
    const isFamily = /相続|兄妹|家族|実家/.test(tension + title);
    const isDevelopment = /開発|再開発|地権者|最大容積/.test(tension + title);
    const isRights = /借地|底地|区分|権利|承諾/.test(tension + title);

    if (phase === "field") {
      if (isDevelopment) return "現況だけでなく、計画後の姿も評価に入りますよね。";
      if (isFinance) return "現地の小さな傷まで、銀行の見方に響くんですか。";
      if (isRights) return "見た目より契約の話が重くなるんですね。";
      if (isFamily) return "古い家なのは分かっています。でも、思い出まで減点されるんですか。";
      return `${title}でも、現地の印象だけで価格が動くんですか。`;
    }
    if (phase === "documents") {
      if (isDevelopment) return "協議は進めます。資料上の未確定だけで弱く見られると困ります。";
      if (isFinance) return "提出資料の見え方で、融資判断がかなり変わります。";
      if (isRights) return "契約の細かい条項まで買主に見られるんですか。";
      if (isFamily) return "面積や名義の話、家族にどう説明すればいいんでしょう。";
      return "資料にはこちらの事情もあります。評価書で汲める範囲はありますか。";
    }
    if (phase === "appraisal") {
      if (scenarioTitle) return `${scenarioTitle}なら、根拠の範囲で有利に説明できる余地はありますよね。`;
      if (isFinance) return "利回りや掛目ひとつで、こちらの資金計画が変わります。";
      if (isDevelopment) return "最大案を完全に切ると、地権者への説明が崩れます。";
      return "その調整幅だと、こちらの事情があまり残らない気がします。";
    }
    if (scenarioTitle) return `${scenarioTitle}を前提に、評価書の表現でこちらの事情が伝わるようにできませんか。`;
    if (isFinance) return "弱く見える書き方だと、銀行の稟議が止まります。";
    if (isDevelopment) return "計画の前向きさまで否定されたように読まれるのは困ります。";
    if (isRights) return "権利の制約は分かりますが、売れる余地も残して書けませんか。";
    return "根拠の範囲で、こちらに一番不利にならない説明にできませんか。";
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
