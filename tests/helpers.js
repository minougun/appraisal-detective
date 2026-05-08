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

async function startCase(page, caseId, mode = "normal") {
  await revealStory(page);
  await page.locator(`[data-start-case=${caseId}][data-mode=${mode}]`).click();
  await expect(page.locator(".novel-scene")).toBeVisible();
  await revealStory(page);
  await expect(page.locator(".phase-game-intake")).toBeVisible();
}

async function advancePhase(page, buttonName) {
  await page.getByRole("button", { name: buttonName }).click();
  await revealStory(page);
}

module.exports = {
  advancePhase,
  revealStory,
  startCase,
};
