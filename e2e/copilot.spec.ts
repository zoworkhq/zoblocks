import { expect, test, type Page } from "@playwright/test";

const PAGE = "/components/copilot";

async function openCopilot(page: Page) {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");

  const copilot = page.locator("[data-zb-copilot]").first();

  await expect(copilot).toBeVisible();

  const input = copilot.getByRole("combobox", {
    name: "Clinical assistant",
  });

  await expect(input).toBeVisible();

  return copilot;
}

test.describe("copilot @a11y", () => {
  test("opens the clinical assistant", async ({ page }) => {
    const copilot = await openCopilot(page);

    await expect(copilot.getByRole("combobox", { name: "Clinical assistant" })).toHaveAttribute(
      "placeholder",
      /.+/,
    );
  });
});

test.describe("copilot @vrt", () => {
  test("matches the resting assistant baseline", async ({ page }) => {
    const copilot = await openCopilot(page);

    await expect(copilot).toHaveScreenshot("copilot-rest.png", {
      animations: "disabled",
      caret: "hide",
    });
  });
});
