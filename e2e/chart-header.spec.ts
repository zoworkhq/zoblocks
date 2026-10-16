/**
 * ChartHeader in a real browser.
 *
 * The unit suite covers the component's data and rendering logic.
 * These tests focus on behaviour that needs a real browser:
 *
 *   - the patient context can be collapsed and expanded
 *   - the encounter control can be operated
 *   - the collapsed safety strip remains keyboard reachable
 *   - the header survives a narrow viewport
 *
 * The docs page is used as the fixture host so this tests the same
 * ChartHeader example that is shown to users.
 */

import { expect, test, type Page } from "@playwright/test";

const PAGE = "/components/chart-header";

async function openChartHeader(page: Page) {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");

  const header = page.locator("[data-zb-chart-header]").first();

  await expect(header).toBeVisible();

  return header;
}

test.describe("@a11y chart header", () => {
  test("renders the patient context and safety strip", async ({ page }) => {
    const header = await openChartHeader(page);

    const bar = header.locator(".zb-chart-header__bar");
    const strip = header.locator(".zb-chart-header__strip");

    await expect(bar).toBeVisible();
    await expect(strip).toBeVisible();

    await expect(strip).toHaveAttribute("aria-label", "Safety");
  });

  test("collapses and expands the patient details", async ({ page }) => {
    const header = await openChartHeader(page);

    const toggle = header.locator(".zb-chart-header__toggle");
    const detail = header.locator(".zb-chart-header__detail");

    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(detail).toBeVisible();

    await toggle.click();

    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(detail).toBeHidden();

    await toggle.click();

    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(detail).toBeVisible();
  });

  test("keeps the safety strip keyboard reachable when collapsed", async ({ page }) => {
    const header = await openChartHeader(page);

    const toggle = header.locator(".zb-chart-header__toggle");
    const strip = header.locator(".zb-chart-header__strip");

    await toggle.click();

    await expect(strip).toHaveAttribute("tabindex", "0");

    await strip.focus();

    await expect(strip).toBeFocused();
  });
});

test.describe("@a11y encounter selection", () => {
  test("allows the user to select an encounter", async ({ page }) => {
    const header = await openChartHeader(page);

    const select = header.locator(".zb-chart-header__encounter-select");

    await expect(select).toBeVisible();

    const options = select.locator("option");
    const optionCount = await options.count();

    expect(optionCount).toBeGreaterThan(1);

    const encounterValue = await options.nth(1).getAttribute("value");

    expect(encounterValue).toBeTruthy();

    await select.selectOption(encounterValue!);

    await expect(select).toHaveValue(encounterValue!);
  });

  test("shows no encounter selected when no encounter is chosen", async ({ page }) => {
    const header = await openChartHeader(page);

    const select = header.locator(".zb-chart-header__encounter-select");

    await expect(select).toBeVisible();

    await select.selectOption("");

    await expect(select).toHaveValue("");

    await expect(select.locator("option").first()).toHaveText("No encounter selected");
  });
});

test.describe("@reflow chart header", () => {
  test("does not overflow horizontally at 320px", async ({ page }) => {
    await page.setViewportSize({
      width: 320,
      height: 720,
    });

    const header = await openChartHeader(page);

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;

      return root.scrollWidth - root.clientWidth;
    });

    expect(overflow).toBeLessThanOrEqual(1);

    await expect(header).toBeVisible();
    await expect(header.locator(".zb-chart-header__strip")).toBeVisible();
  });
});

test.describe("@visual chart header", () => {
  test("matches the expanded visual baseline", async ({ page }) => {
    const header = await openChartHeader(page);

    await expect(header).toHaveScreenshot("chart-header-expanded.png");
  });

  test("matches the collapsed visual baseline", async ({ page }) => {
    const header = await openChartHeader(page);

    await header.locator(".zb-chart-header__toggle").click();

    await expect(header).toHaveScreenshot("chart-header-collapsed.png");
  });
});
