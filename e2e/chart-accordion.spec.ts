/**
 * ChartAccordion in a real browser.
 *
 * The component's summaries remain readable while sections are closed.
 * The browser tests cover the interactive behavior and responsive layout
 * that the unit tests cannot fully verify.
 */

import { expect, test, type Locator, type Page } from "@playwright/test";

const PAGE = "/components/chart-accordion";

async function openChartAccordion(page: Page): Promise<Locator> {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");

  const accordion = page.locator(".zb-chart-accordion").first();
  await expect(accordion).toBeVisible();

  return accordion;
}

test.describe("@a11y chart accordion", () => {
  test("opens the documentation page and renders section summaries", async ({ page }) => {
    const accordion = await openChartAccordion(page);

    const sections = accordion.locator("time.zb-chart-accordion__time");
    const counts = accordion.locator(".zb-chart-accordion__count");

    // The fixture should demonstrate the record's summary information.
    const summaryCount = (await sections.count()) + (await counts.count());

    expect(summaryCount).toBeGreaterThan(0);
  });

  test("expand all and collapse all controls are available", async ({ page }) => {
    const accordion = await openChartAccordion(page);

    await expect(accordion.getByRole("button", { name: /expand all/i })).toBeVisible();

    await expect(accordion.getByRole("button", { name: /collapse all/i })).toBeVisible();
  });
});

test.describe("@visual chart accordion", () => {
  test("captures the initial state", async ({ page }) => {
    const accordion = await openChartAccordion(page);

    await expect(accordion).toHaveScreenshot("chart-accordion-initial.png", {
      animations: "disabled",
    });
  });

  test("captures the expanded state", async ({ page }) => {
    const accordion = await openChartAccordion(page);

    await accordion.getByRole("button", { name: /expand all/i }).click();

    await expect(accordion).toHaveScreenshot("chart-accordion-expanded.png", {
      animations: "disabled",
    });
  });

  test("captures the collapsed state", async ({ page }) => {
    const accordion = await openChartAccordion(page);

    await accordion.getByRole("button", { name: /expand all/i }).click();

    await accordion.getByRole("button", { name: /collapse all/i }).click();

    await expect(accordion).toHaveScreenshot("chart-accordion-collapsed.png", {
      animations: "disabled",
    });
  });
});

test.describe("@reflow chart accordion", () => {
  test("does not cause horizontal page overflow at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });

    const accordion = await openChartAccordion(page);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(1);
    await expect(accordion).toBeVisible();
  });
});
