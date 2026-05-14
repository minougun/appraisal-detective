const { test, expect } = require("@playwright/test");
const { revealStory, resolveIntakeIntro } = require("./helpers");

test("capture phase two screenshot", async ({ page }) => {
  await page.goto("http://127.0.0.1:44561/", { waitUntil: "networkidle" });
  await revealStory(page);
  await page.locator("[data-start-case=case001][data-mode=normal]").click();
  await expect(page.locator(".novel-scene")).toBeVisible();
  await revealStory(page);
  await resolveIntakeIntro(page, "case001");
  await page.locator("[data-intake=professional]").click();
  await page.getByRole("button", { name: "現地調査へ" }).click();
  await revealStory(page);
  await expect(page.getByRole("img", { name: /川辺町の住宅地外観/ })).toBeVisible();
  await page.screenshot({ path: "/tmp/appraisal-detective-phase2.png", fullPage: true });
});
