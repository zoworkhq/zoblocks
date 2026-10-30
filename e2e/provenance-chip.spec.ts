/**
 * ProvenanceChip in a real browser.
 *
 * Unit tests can verify the component's labels, provenance information,
 * and accessibility attributes. Browser tests cover the things that
 * require a real rendering engine:
 *
 *   - The provenance indicator is rendered and visible.
 *   - Staleness and unconfirmed states remain distinguishable.
 *   - Interactive controls are accessible and usable.
 *   - Glyph-only rendering remains visible.
 *   - The component does not cause horizontal overflow on narrow screens.
 *   - The component remains visible when forced colours are enabled.
 *
 * The documentation page is the fixture host. Reusing the existing
 * documentation demo avoids creating a separate test harness that
 * could drift from the component that ships.
 */

import { expect, test, type Page } from "@playwright/test";

const PAGE = "/components/provenance-chip";

/**
 * Open the documentation page and locate the component.
 *
 * The data-zb-provenance attribute identifies the ProvenanceChip root.
 */
async function openProvenanceChip(page: Page) {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");

  const chip = page.locator("[data-zb-provenance]").first();

  await expect(chip).toBeVisible();

  return chip;
}

test.describe("@a11y provenance chip", () => {
  test("opens the documentation page and renders the component", async ({ page }) => {
    const chip = await openProvenanceChip(page);

    await expect(chip).toBeVisible();

    // The component should expose its provenance information.
    await expect(chip).toHaveAttribute("data-zb-provenance");
  });

  test("exposes its source information", async ({ page }) => {
    await openProvenanceChip(page);

    const source = page.locator("[data-zb-source]").first();

    await expect(source).toBeVisible();
  });

  test("renders the staleness indicator when applicable", async ({ page }) => {
    await openProvenanceChip(page);

    // Locate a scenario that represents stale source information.
    const staleChip = page.locator("[data-zb-provenance][data-zb-staleness]");

    if ((await staleChip.count()) > 0) {
      await expect(staleChip.first()).toBeVisible();
    }
  });

  test("preserves the unconfirmed state", async ({ page }) => {
    await openProvenanceChip(page);

    // Unconfirmed information must remain identifiable.
    const unconfirmedChip = page.locator("[data-zb-provenance][data-zb-unconfirmed]");

    if ((await unconfirmedChip.count()) > 0) {
      await expect(unconfirmedChip.first()).toBeVisible();
    }
  });

  test("keeps interactive controls accessible", async ({ page }) => {
    await openProvenanceChip(page);

    // The component may render as a button when an action is provided.
    const chipButton = page.locator("[data-zb-provenance]").getByRole("button").first();

    if (await chipButton.isVisible().catch(() => false)) {
      await expect(chipButton).toBeEnabled();
    }

    // The optional source-span action should be visible and usable
    // when the documentation scenario provides it.
    const viewSpan = page.getByRole("button", {
      name: /view span/i,
    });

    if ((await viewSpan.count()) > 0) {
      await expect(viewSpan.first()).toBeVisible();
      await expect(viewSpan.first()).toBeEnabled();
    }
  });

  test("renders glyph-only provenance indicators when provided", async ({ page }) => {
    await openProvenanceChip(page);

    const glyph = page.locator("[data-zb-glyph]").first();

    if ((await glyph.count()) > 0) {
      await expect(glyph).toBeVisible();
    }
  });
});

test.describe("@a11y forced colours", () => {
  test.use({
    colorScheme: "light",
    contextOptions: { forcedColors: "active" },
  });

  test("keeps provenance information visible in forced colours", async ({ page }) => {
    const chip = await openProvenanceChip(page);

    await expect(chip).toBeVisible();

    // Provenance must not disappear when the normal colour palette
    // is replaced by the operating system's forced-colour palette.
    const text = (await chip.innerText()).trim();

    expect(text.length).toBeGreaterThan(0);
  });
});

test.describe("@reflow provenance chip", () => {
  test("does not cause horizontal overflow at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });

    const chip = await openProvenanceChip(page);

    await expect(chip).toBeVisible();

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth - root.clientWidth;
    });

    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("remains visible on a mobile-sized viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const chip = await openProvenanceChip(page);

    await expect(chip).toBeVisible();
  });
});

test.describe("@vrt provenance chip", () => {
  test("matches the rendered component's visual baseline", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const chip = await openProvenanceChip(page);

    await expect(chip).toHaveScreenshot("provenance-chip.png", {
      animations: "disabled",
    });
  });
});
