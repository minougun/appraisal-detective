(() => {
  const { htmlText, htmlAttr } = window.APPRAISAL_UTILS ?? {};
  if (typeof htmlText !== "function" || typeof htmlAttr !== "function") {
    throw new Error("APPRAISAL_UTILS must be loaded before hbu-renderer.js.");
  }

  function hbuMatrixMarkup(matrix) {
    if (!matrix) return "";
    return `
      <article class="hbu-matrix" aria-label="${htmlAttr(matrix.title ?? "最有効使用の前提確認")}">
        <div class="hbu-head">
          <span class="term-chip">最有効使用</span>
          <div>
            <h3>${htmlText(matrix.title ?? "最有効使用の前提確認")}</h3>
            <p>${htmlText(matrix.lead ?? "最有効使用を価格判断の前提として確認する。")}</p>
          </div>
        </div>
        <div class="hbu-grid">
          ${(matrix.rows ?? [])
            .map(
              ([label, detail]) => `
                <div class="hbu-cell">
                  <strong>${htmlText(label)}</strong>
                  <span>${htmlText(detail)}</span>
                </div>
              `,
            )
            .join("")}
        </div>
        <p class="hbu-conclusion">${htmlText(matrix.conclusion ?? "")}</p>
      </article>
    `;
  }

  function auditCriteriaMarkup(criteria, reportIds = [], evidenceLabels = {}) {
    if (!criteria) return "";
    const required = criteria.requiredEvidence ?? [];
    return `
      <section class="audit-criteria-card">
        <span class="term-chip">監査コメント</span>
        <h3>最有効使用と報告根拠の接続</h3>
        <div class="audit-criteria-grid">
          ${auditCriteriaCell("監査焦点", criteria.focus)}
          ${auditCriteriaCell("主要リスク", criteria.risk)}
          ${auditCriteriaCell("講評", criteria.comment)}
        </div>
        ${
          required.length
            ? `<p class="audit-required">必須根拠: ${required
                .map((id) => `${reportIds.includes(id) ? "提示済" : "未提示"} ${htmlText(evidenceLabels[id] ?? id)}`)
                .join(" / ")}</p>`
            : ""
        }
      </section>
    `;
  }

  function auditCriteriaCell(label, value) {
    return `
      <div>
        <strong>${htmlText(label)}</strong>
        <span>${htmlText(value ?? "")}</span>
      </div>
    `;
  }

  window.APPRAISAL_HBU_RENDERER = Object.freeze({
    hbuMatrixMarkup,
    auditCriteriaMarkup,
  });
})();
