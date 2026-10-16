/**
 * Copilot in a real browser.
 *
 * The docs page is the fixture host. These tests verify the rendered
 * Copilot and its interactions using Playwright.
 */

import { expect, test, type Locator, type Page } from "@playwright/test";

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

  return { copilot, input };
}

/**
 * Set the input value without submitting the question.
 * Mirrors the type() helper used by the Copilot Storybook stories.
 */

async function typeWithoutSubmitting(input: Locator, value: string) {
  await input.pressSequentially(value);
}

test.describe("copilot @a11y", () => {
  test("opens the clinical assistant", async ({ page }) => {
    const { copilot, input } = await openCopilot(page);

    await expect(copilot).toBeVisible();
    await expect(input).toHaveAttribute("placeholder", /.+/);
  });

  test("opens the shortcut menu and keeps focus in the input", async ({ page }) => {
    const { input } = await openCopilot(page);

    await typeWithoutSubmitting(input, "/");

    const menu = page.getByRole("listbox", { name: "Shortcuts" });

    await expect(menu).toBeVisible();
    await expect(input).toHaveAttribute("aria-activedescendant", /.+/);
  });
});

test.describe("visual @vrt", () => {
  test("the resting assistant", async ({ page }) => {
    const { copilot } = await openCopilot(page);

    await expect(copilot).toHaveScreenshot("copilot-rest.png");
  });

  test("the shortcut menu", async ({ page }) => {
    const { copilot, input } = await openCopilot(page);

    await typeWithoutSubmitting(input, "/");

    await expect(page.getByRole("listbox", { name: "Shortcuts" })).toBeVisible();

    await expect(copilot).toHaveScreenshot("copilot-shortcuts.png");
  });
});
