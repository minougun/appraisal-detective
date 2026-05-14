const { expect } = require("@playwright/test");

async function revealStory(page) {
  const scene = page.locator(".novel-scene");
  if (!(await scene.isVisible().catch(() => false))) return;

  for (let index = 0; index < 8; index += 1) {
    const next = page.locator("[data-novel-next]");
    if (!(await next.isVisible().catch(() => false))) return;
    const label = (await next.textContent()).trim();
    await next.click();
    if (label !== "次へ") return;
  }
}

async function resolveIntakeIntro(page, caseId) {
  const risk = {
    case001: "低い額だと困る、という依頼者の希望",
    case002: "低めに",
    case003: "最大容積まで使える前提",
  }[caseId] ?? "低い額だと困る、という依頼者の希望";
  const next = {
    case001: "取引事例の日付",
    case002: "収入と費用の内訳",
    case003: "前面道路とのつながり",
  }[caseId] ?? "取引事例の日付";
  const rebuttal = {
    case001: "取引事例の日付",
    case002: "収入と費用の内訳",
    case003: "前面道路とのつながり",
  }[caseId] ?? "取引事例の日付";
  if (risk && (await page.getByRole("button", { name: risk }).isVisible().catch(() => false))) {
    await page.getByRole("button", { name: risk }).click();
  }
  if (next && (await page.getByRole("button", { name: next }).isVisible().catch(() => false))) {
    await page.getByRole("button", { name: next }).click();
  }
  if (rebuttal && (await page.getByRole("button", { name: rebuttal }).isVisible().catch(() => false))) {
    await page.getByRole("button", { name: rebuttal }).click();
  }
}

async function startCase(page, caseId, mode = "normal", options = {}) {
  await revealStory(page);
  await page.locator(`[data-start-case=${caseId}][data-mode=${mode}]`).click();
  await expect(page.locator(".novel-scene")).toBeVisible();
  await revealStory(page);
  await expect(page.locator(".phase-game-intake")).toBeVisible();
  if (options.resolveIntakeIntro !== false) {
    await resolveIntakeIntro(page, caseId);
  }
}

async function advancePhase(page, buttonName) {
  await page.getByRole("button", { name: buttonName }).click();
  await revealStory(page);
}

module.exports = {
  advancePhase,
  revealStory,
  resolveIntakeIntro,
  startCase,
};
