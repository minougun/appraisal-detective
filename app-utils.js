(() => {
  function renderDataLoadError(kind = "案件データ", fileName = "case-data.js") {
    const target = document.querySelector("#phase-view") ?? document.body;
    const card = document.createElement("article");
    card.className = "result-card data-error";

    const chip = document.createElement("span");
    chip.className = "term-chip";
    chip.textContent = "読込エラー";

    const title = document.createElement("h3");
    title.textContent = `${kind}を読み込めませんでした`;

    const message = document.createElement("p");
    message.textContent = `${fileName} の配信または読み込み順を確認して、ページを再読み込みしてください。`;

    card.append(chip, title, message);
    target.replaceChildren(card);

    const phaseTitle = document.querySelector("#phase-title");
    if (phaseTitle) phaseTitle.textContent = "読込エラー";

    const objective = document.querySelector("#phase-objective");
    if (objective) objective.textContent = `${kind}の読み込みに失敗したため、ゲームを開始できません。`;

    const alert = document.querySelector("#sr-alert") ?? document.querySelector("#sr-announcer");
    if (alert) alert.textContent = `${kind}を読み込めませんでした。${fileName} を確認してください。`;
  }

  function htmlText(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function htmlAttr(value) {
    return htmlText(value);
  }

  function classToken(value, fallback = "unknown") {
    return String(value ?? fallback).replace(/[^a-zA-Z0-9_-]/g, "") || fallback;
  }

  function localAssetPath(value, fallback = "") {
    const text = String(value ?? "").trim();
    const normalized = text.startsWith("./") ? text.slice(2) : text.startsWith("/") ? text.slice(1) : text;
    if (!normalized.startsWith("assets/")) return fallback;
    if (normalized.includes("..") || normalized.includes("\\") || normalized.includes("//")) return fallback;
    if (!/\.(png|svg|jpe?g|webp|mp3|ttf)$/i.test(normalized)) return fallback;
    return `./${normalized}`;
  }

  function caseImagePath(value, fallback = "./assets/kawabe-estate.svg") {
    return localAssetPath(value, localAssetPath(fallback, "./assets/kawabe-estate.svg"));
  }

  function pressureLineHtml(value) {
    return htmlText(value)
      .replaceAll("&lt;span class=&quot;pressure-word&quot;&gt;", '<span class="pressure-word">')
      .replaceAll("&lt;/span&gt;", "</span>");
  }

  window.APPRAISAL_UTILS = {
    renderDataLoadError,
    htmlText,
    htmlAttr,
    classToken,
    localAssetPath,
    caseImagePath,
    pressureLineHtml,
  };
})();
