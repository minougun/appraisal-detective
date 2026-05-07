(() => {
  function storageKey() {
    return document
      .querySelector('meta[name="appraisal-low-stimulus-storage-key"]')
      ?.getAttribute("content");
  }

  try {
    const key = storageKey();
    window.__APPRAISAL_LOW_STIMULUS_STORAGE_KEY__ = key;
    const stored = key ? localStorage.getItem(key) === "true" : false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.__APPRAISAL_LOW_STIMULUS_BOOT__ = stored || reduced;
    if (window.__APPRAISAL_LOW_STIMULUS_BOOT__) {
      document.documentElement.classList.add("low-stimulus-boot");
    }
  } catch {
    window.__APPRAISAL_LOW_STIMULUS_BOOT__ = false;
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!window.__APPRAISAL_LOW_STIMULUS_BOOT__) return;
    document.body.classList.add("low-stimulus");
    const toggle = document.querySelector("#stimulus-toggle");
    if (!toggle) return;
    toggle.textContent = "低刺激 ON";
    toggle.setAttribute("aria-pressed", "true");
  });
})();
