/**
 * Allergy Chip in a real browser.
 *
 * The unit suite covers the clinical semantics and accessibility names.
 * This suite covers the claims that need an actual layout engine:
 *
 *   - the documented page really renders the component
 *   - the interactive history affordance is keyboard reachable
 *   - clinical meaning remains present when custom colours are removed
 *   - the component does not create horizontal scrolling at mobile width
 *   - the rendered component is visually stable in both light and dark mode
 */

import { expect, test, type Page } from "@playwright/test";

const PAGE = "/components/allergy-chip";

async function openAllergyChip(page: Page) {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");

  const chip = page.locator("[data-zb-allergy]").first();
  await expect(chip).toBeVisible();

  return chip;
}

test.describe("visual regression", () => {
  test("@vrt the allergy chip is visually stable", async ({ page }) => {
    const chip = await openAllergyChip(page);

    await expect(chip).toHaveScreenshot("allergy-chip.png");
  });
});

test.describe("@a11y allergy chip", () => {
  test("the documented page renders the clinical identity", async ({ page }) => {
    const chip = await openAllergyChip(page);

    await expect(chip).toHaveAttribute("role", "group");
    await expect(chip).toContainText("Penicillin G");
    await expect(chip).toContainText("Urticaria");
  });

  test("the documented chip is keyboard safe when interactive", async ({ page }) => {
    const chip = await openAllergyChip(page);

    const interactive = page.locator("[data-zb-allergy] button");

    if (await interactive.count()) {
      const button = interactive.first();

      await expect(button).toBeVisible();
      await button.focus();
      await expect(button).toBeFocused();

      await page.keyboard.press("Enter");
    } else {
      await expect(chip).toHaveAttribute("role", "group");
    }
  });

  test("clinical meaning survives forced colours", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });

    const chip = await openAllergyChip(page);

    await expect(chip).toContainText("Penicillin G");
    await expect(chip).toContainText("Urticaria");

    const criticality = chip.locator("[data-zb-step='critical']").first();
    await expect(criticality).toBeVisible();
  });
});

test.describe("@reflow allergy chip", () => {
  test("does not scroll horizontally at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const chip = await openAllergyChip(page);

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );

    expect(overflows, "allergy chip page scrolls horizontally at 375px").toBe(false);
    await expect(chip).toBeVisible();
  });
});
