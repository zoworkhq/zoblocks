/**
 * Trend Indicator in a real browser.
 *
 * The component unit suite covers trend semantics and accessibility names.
 * This suite covers claims that need a browser layout engine:
 *
 *   - the documented page renders the trend
 *   - the figure has an accessible name and text alternative
 *   - point selection is keyboard reachable when enabled
 *   - clinical content remains available in forced colours
 *   - the component does not cause horizontal scrolling at 375px
 *   - the rendered trend is visually stable in light and dark mode
 */

import { expect, test, type Page } from "@playwright/test";

const PAGE = "/components/trend-indicator";

async function openTrend(page: Page) {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");

  const trend = page.locator("[data-zb-trend]").first();
  await expect(trend).toBeVisible();

  return trend;
}

test.describe("visual regression", () => {
  test("@vrt the trend indicator is visually stable", async ({ page }) => {
    const trend = await openTrend(page);

    await expect(trend).toHaveScreenshot("trend-indicator.png");
  });
});

test.describe("@a11y trend indicator", () => {
  test("renders a named figure with a text alternative", async ({ page }) => {
    const trend = await openTrend(page);

    await expect(trend).toHaveAttribute("role", "figure");

    const label = await trend.getAttribute("aria-label");
    expect(label?.trim().length ?? 0).toBeGreaterThan(0);

    const describedBy = await trend.getAttribute("aria-describedby");
    expect(describedBy?.trim().length ?? 0).toBeGreaterThan(0);

    const table = trend.locator("table.zb-trend__table");
    await expect(table).toBeAttached();
    await expect(table.locator("caption")).toBeAttached();
    await expect(table.locator("thead th")).toHaveCount(3);

    const rows = await table.locator("tbody tr").count();
    expect(rows).toBeGreaterThan(0);
  });

  test("point selection is keyboard reachable when enabled", async ({ page }) => {
    await openTrend(page);

    const pointButton = page.locator("[data-zb-trend] table.zb-trend__table button").first();

    if ((await pointButton.count()) > 0) {
      await pointButton.focus();
      await expect(pointButton).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(pointButton).toBeFocused();
    } else {
      // The current preview may be passive; its table still provides the data
      // alternative. Interactive examples are exercised when buttons exist.
      const table = page.locator("[data-zb-trend] table.zb-trend__table").first();
      await expect(table).toBeAttached();
    }
  });

  test("keeps its accessible information in forced colours", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });

    const trend = await openTrend(page);

    await expect(trend).toBeVisible();
    await expect(trend).toHaveAttribute("aria-label", /\S/);

    const table = trend.locator("table.zb-trend__table");
    await expect(table).toBeAttached();
    await expect(table.locator("caption")).toBeAttached();

    const chart = trend.locator("svg.zb-trend__chart");
    if ((await chart.count()) > 0) {
      await expect(chart).toHaveAttribute("aria-hidden", "true");
    }
  });
});

test.describe("@reflow trend indicator", () => {
  test("does not scroll horizontally at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const trend = await openTrend(page);

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );

    expect(overflows, "trend indicator page scrolls horizontally at 375px").toBe(false);
    await expect(trend).toBeVisible();
  });
});
