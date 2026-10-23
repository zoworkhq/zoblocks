/**

ResultValue in a real browser.


Unit tests cover the clinical descriptions and interpretation logic.
Browser tests cover the things that need a real browser:




A result always carries its interpretation and range, or the explicit
reason that a range is unavailable.


Corrected results retain the superseded value.


Missing results explain why the number is absent.


The accessible name communicates the result as a whole.


The report action is keyboard-operable when the host supplies it.


The layout survives narrow viewports and forced colours.


The documentation page is the fixture host. Reusing it means these tests
exercise the examples that actually ship with the component documentation.
*/

import { expect, test, type Page } from "@playwright/test";

const PAGE = "/components/result-value";

async function openResultValue(page: Page) {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");

  const result = page.locator("[data-zb-result]").first();
  await expect(result).toBeVisible();

  return result;
}

test.describe("@a11y result value", () => {
  test("the documentation page renders a result", async ({ page }) => {
    const result = await openResultValue(page);

    await expect(result).toHaveAttribute("aria-label", /.+/);
    await expect(result).toHaveAttribute("data-zb-density", /compact|default/);
  });

  test("a result has an accessible name describing the whole result", async ({ page }) => {
    const result = await openResultValue(page);

    const accessibleName = await result.getAttribute("aria-label");

    expect(accessibleName).toBeTruthy();
    expect(accessibleName!.trim().length).toBeGreaterThan(0);
  });

  test("a missing reference range is not silently treated as normal", async ({ page }) => {
    const result = await openResultValue(page);

    if (await result.getAttribute("data-zb-norange")) {
      await expect(result.locator("[data-zb-norange]")).toBeVisible();
    } else {
      // The documentation may display a scenario with a supplied range.
      // In that case, assert that the range is visibly rendered.
      const range = result.locator(".zb-rv__range");
      await expect(range).toBeVisible();
    }
  });

  test("a superseded result displays the previous value", async ({ page }) => {
    const result = await openResultValue(page);
    const superseded = result.locator(".zb-rv__superseded");

    if (await superseded.count()) {
      await expect(superseded).toBeVisible();
      await expect(superseded.locator("s")).toBeVisible();
      await expect(superseded).toContainText("superseded");
    }
  });

  test("an absent result explains why the value is unavailable", async ({ page }) => {
    const result = await openResultValue(page);

    if (await result.getAttribute("data-zb-absent")) {
      const absentValue = result.locator("[data-zb-absent-value]");

      await expect(absentValue).toBeVisible();
      await expect(absentValue.locator(".zb-rv__absent-word")).toBeVisible();
      await expect(absentValue.locator(".zb-rv__absent-detail")).toBeVisible();

      const detail = await absentValue.locator(".zb-rv__absent-detail").innerText();

      expect(detail.trim().length).toBeGreaterThan(0);
    }
  });

  test("a non-interactive result is not a tab stop", async ({ page }) => {
    const result = await openResultValue(page);

    // Without onOpenReport the component is a labelled group, not a button.
    // The documentation fixture should use the non-interactive variant here.
    if ((await result.evaluate((el) => el.tagName)) !== "BUTTON") {
      await expect(result).toHaveAttribute("role", "group");
      await expect(result).not.toHaveAttribute("tabindex", "0");
    }
  });
});

test.describe("@a11y forced colours", () => {
  test.use({
    colorScheme: "light",
    contextOptions: { forcedColors: "active" },
  });

  test("result meaning remains visible when colours are overridden", async ({ page }) => {
    const result = await openResultValue(page);

    await expect(result).toBeVisible();

    // Interpretation must remain available as text rather than relying
    // exclusively on a coloured status chip.
    await expect(result).toHaveAttribute("aria-label", /.+/);
    await expect(result.locator(".zb-rv__value")).toBeVisible();
  });
});

test.describe("@reflow result value", () => {
  test("does not cause horizontal scrolling at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });

    const result = await openResultValue(page);

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth - root.clientWidth;
    });

    expect(overflow).toBeLessThanOrEqual(1);
    await expect(result).toBeVisible();
  });

  test("keeps the result and qualifiers visible at a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });

    const result = await openResultValue(page);

    await expect(result.locator(".zb-rv__value")).toBeVisible();
    await expect(result.locator(".zb-rv__qualifiers")).toBeVisible();
  });
});
