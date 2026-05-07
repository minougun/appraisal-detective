(() => {
  const { htmlText, classToken } = window.APPRAISAL_UTILS ?? {};
  if (typeof htmlText !== "function" || typeof classToken !== "function") {
    throw new Error("APPRAISAL_UTILS must be loaded before evidence-renderer.js.");
  }

  function evidenceCategory(evidenceCatalog, id) {
    const scores = evidenceCatalog[id]?.scores ?? {};
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "appraisal";
  }

  function evidenceBoardOrder(ids, { selectable = false, priorityIds = [] } = {}) {
    if (!selectable || priorityIds.length === 0) return ids;
    const originalIndex = new Map(ids.map((id, index) => [id, index]));
    return [...ids].sort((a, b) => {
      const aPriority = priorityIds.includes(a) ? 0 : 1;
      const bPriority = priorityIds.includes(b) ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return originalIndex.get(a) - originalIndex.get(b);
    });
  }

  function evidenceButton({ id, item, category, selectable, selected, disabled, scenarioPriority }) {
    const button = document.createElement("button");
    button.className = `evidence-card evidence-${classToken(category, "appraisal")} ${selected ? "selected" : ""} ${
      scenarioPriority ? "scenario-priority" : ""
    }`;
    if (scenarioPriority && selectable) {
      button.setAttribute("aria-label", `${item.term} ${item.title}。今回の市場シナリオ重点根拠`);
    }
    button.dataset.evidence = id;
    button.disabled = !selectable || disabled;

    const term = document.createElement("em");
    term.textContent = item.term;
    const title = document.createElement("strong");
    title.textContent = item.title;
    const detail = document.createElement("span");
    detail.textContent = item.detail;
    button.append(term, title, detail);
    return button;
  }

  function reportEvidenceMarkup({ id, item, category, index }) {
    return `
      <div class="evidence-card evidence-${classToken(category, "appraisal")}">
        <i>提示 ${index + 1}</i>
        <em>${htmlText(item.term)}</em>
        <strong>${htmlText(item.title)}</strong>
        <span>${htmlText(item.detail)}</span>
      </div>
    `;
  }

  window.APPRAISAL_EVIDENCE_RENDERER = Object.freeze({
    evidenceCategory,
    evidenceBoardOrder,
    evidenceButton,
    reportEvidenceMarkup,
  });
})();
