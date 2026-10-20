/**
 * Recent Patient Stack in a real browser.
 *
 * The component docs page is the fixture host. These tests cover the visible
 * stack, its keyboard interaction, and visual baselines for the collapsed and
 * expanded states.
 */

import { expect, test, type Locator, type Page } from "@playwright/test";

const PAGE = "/components/recent-patient-stack";

async function openRecentPatientStack(page: Page) {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");

  const stack = page.locator("[data-zb-stack]").first();
  await expect(stack).toBeVisible();
  await expect(stack.getByRole("tablist", { name: "Open charts" })).toBeVisible();

  return stack;
}

async function captureStackBaseline(stack: Locator, name: string) {
  await expect(stack).toHaveScreenshot(name, {
    animations: "disabled",
    caret: "hide",
  });
}

test.describe("recent patient stack @vrt", () => {
  test("opens the recent patient stack and matches the collapsed baseline", async ({ page }) => {
    const stack = await openRecentPatientStack(page);

    const tabs = stack.getByRole("tab");
    expect(await tabs.count()).toBeGreaterThan(0);
    await expect(stack.getByRole("tab", { selected: true })).toBeVisible();

    await captureStackBaseline(stack, "recent-patient-stack-collapsed.png");
  });

  test("moves keyboard focus between charts without activating a different chart", async ({
    page,
  }) => {
    const stack = await openRecentPatientStack(page);
    const tabs = stack.getByRole("tab");
    const count = await tabs.count();

    test.skip(count < 2, "Keyboard navigation needs at least two open charts.");

    const selectedBefore = await stack
      .getByRole("tab", { selected: true })
      .getAttribute("aria-label");

    await tabs.first().focus();
    await tabs.first().press("ArrowRight");

    await expect(tabs.nth(1)).toBeFocused();
    await expect(stack.getByRole("tab", { selected: true })).toHaveAttribute(
      "aria-label",
      selectedBefore ?? "",
    );
  });

  test("expands the chart panel and matches the expanded baseline", async ({ page }) => {
    const stack = await openRecentPatientStack(page);
    const expandButton = stack.locator(".zb-stack__expand");

    await expect(expandButton).toBeVisible();
    await expandButton.click();

    await expect(expandButton).toHaveAttribute("aria-expanded", "true");
    await expect(stack.locator(".zb-stack__panel")).toBeVisible();
    await captureStackBaseline(stack, "recent-patient-stack-expanded.png");
  });
});
