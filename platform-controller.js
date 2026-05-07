(() => {
  const GAMEPAD_POLL_MS = 100;
  const REPEAT_MS = 180;
  const buttons = {
    confirm: 0,
    cancel: 1,
    evidence: 2,
    hint: 3,
    minus: 8,
    plus: 9,
    dpadUp: 12,
    dpadDown: 13,
    dpadLeft: 14,
    dpadRight: 15,
  };

  let lastGamepad = "";
  let lastActionAt = 0;

  function visible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function focusables() {
    return Array.from(
      document.querySelectorAll(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ),
    ).filter(visible);
  }

  function focusByStep(step) {
    const items = focusables();
    if (!items.length) return;
    const currentIndex = Math.max(0, items.indexOf(document.activeElement));
    const next = items[(currentIndex + step + items.length) % items.length];
    next.focus({ preventScroll: false });
    announceController(`フォーカス: ${labelFor(next)}`);
  }

  function labelFor(element) {
    return (
      element?.getAttribute("aria-label") ||
      element?.textContent?.trim()?.replace(/\s+/g, " ") ||
      element?.getAttribute("name") ||
      element?.id ||
      "操作対象"
    );
  }

  function preferredAction() {
    return (
      document.querySelector("[data-novel-next]") ||
      document.querySelector(".phase-view button:not([disabled])") ||
      document.querySelector("#phase-view [tabindex='0']") ||
      focusables()[0]
    );
  }

  function clickElement(element) {
    if (!element || !visible(element)) return false;
    element.focus({ preventScroll: true });
    element.click();
    return true;
  }

  function confirm() {
    const active = document.activeElement;
    if (active?.matches?.("button, input, select, textarea, [tabindex]:not([tabindex='-1'])") && visible(active)) {
      active.click();
      return;
    }
    clickElement(preferredAction());
  }

  function cancel() {
    const close = document.querySelector("[data-close-product-panel]");
    if (clickElement(close)) return;
    const skip = document.querySelector("[data-novel-skip]");
    if (clickElement(skip)) return;
    document.body.classList.remove("controller-evidence-open");
    announceController("キャンセル");
  }

  function toggleEvidence() {
    document.body.classList.toggle("controller-evidence-open");
    document.querySelector(".side-panel")?.focus?.({ preventScroll: false });
    announceController(document.body.classList.contains("controller-evidence-open") ? "証拠ボードを表示" : "証拠ボードを閉じる");
  }

  function hint() {
    const objective = document.querySelector("#phase-objective")?.textContent?.trim();
    if (objective) announceController(`目標: ${objective}`);
    document.querySelector("#phase-title")?.focus?.({ preventScroll: true });
  }

  function toggleSettings() {
    const settings = document.querySelector("[data-product-panel='settings']");
    if (clickElement(settings)) return;
    clickElement(document.querySelector("#stimulus-toggle"));
  }

  function toggleLowStimulus() {
    clickElement(document.querySelector("#stimulus-toggle"));
  }

  function announceController(message) {
    const node = document.querySelector("#sr-announcer");
    if (node) node.textContent = message;
    const meta = document.querySelector("#controller-meta");
    if (meta) meta.textContent = `操作 A決定 / B戻る / X証拠 / +設定 - ${message}`;
  }

  function runAction(action) {
    const now = Date.now();
    if (now - lastActionAt < REPEAT_MS) return;
    lastActionAt = now;
    action();
  }

  function handleKeyboard(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const tag = document.activeElement?.tagName;
    if ((tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") && !["Escape", "F1"].includes(event.key)) return;
    const map = {
      Enter: confirm,
      " ": confirm,
      Escape: cancel,
      ArrowDown: () => focusByStep(1),
      ArrowRight: () => focusByStep(1),
      ArrowUp: () => focusByStep(-1),
      ArrowLeft: () => focusByStep(-1),
      KeyX: toggleEvidence,
      KeyY: hint,
      F1: hint,
      Minus: toggleLowStimulus,
      Equal: toggleSettings,
    };
    const action = map[event.code] || map[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  }

  function gamepadSignature(gamepad) {
    return gamepad.buttons.map((button) => (button.pressed ? "1" : "0")).join("");
  }

  function pollGamepad() {
    const gamepad = navigator.getGamepads?.().find(Boolean);
    if (gamepad) {
      const signature = gamepadSignature(gamepad);
      if (signature !== lastGamepad) {
        lastGamepad = signature;
        if (gamepad.buttons[buttons.confirm]?.pressed) runAction(confirm);
        else if (gamepad.buttons[buttons.cancel]?.pressed) runAction(cancel);
        else if (gamepad.buttons[buttons.evidence]?.pressed) runAction(toggleEvidence);
        else if (gamepad.buttons[buttons.hint]?.pressed) runAction(hint);
        else if (gamepad.buttons[buttons.plus]?.pressed) runAction(toggleSettings);
        else if (gamepad.buttons[buttons.minus]?.pressed) runAction(toggleLowStimulus);
        else if (gamepad.buttons[buttons.dpadDown]?.pressed || gamepad.buttons[buttons.dpadRight]?.pressed) runAction(() => focusByStep(1));
        else if (gamepad.buttons[buttons.dpadUp]?.pressed || gamepad.buttons[buttons.dpadLeft]?.pressed) runAction(() => focusByStep(-1));
      }
    }
    window.setTimeout(pollGamepad, GAMEPAD_POLL_MS);
  }

  document.addEventListener("keydown", handleKeyboard);
  window.addEventListener("gamepadconnected", (event) => {
    announceController(`${event.gamepad.id || "Gamepad"} 接続`);
  });
  window.setTimeout(pollGamepad, GAMEPAD_POLL_MS);

  window.APPRAISAL_PLATFORM_CONTROLLER = Object.freeze({
    buttons,
    focusables,
  });
})();
