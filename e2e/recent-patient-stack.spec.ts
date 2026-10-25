import { expect, test } from "@playwright/test";

test.describe("Recent Patient Stack", () => {
  test("opens the documentation page @vrt", async ({ page }) => {
    await page.goto("/components/recent-patient-stack");

    const stack = page.locator("[data-zb-stack]");

    await expect(stack).toBeVisible();
    await expect(stack.getByRole("tablist", { name: "Open charts" })).toBeVisible();
  });

  test("supports keyboard navigation between chart tabs @vrt", async ({ page }) => {
    await page.goto("/components/recent-patient-stack");

    const stack = page.locator("[data-zb-stack]");
    const tabs = stack.getByRole("tab");
    const firstTab = tabs.first();
    const secondTab = tabs.nth(1);
    const selectedTab = stack.getByRole("tab", { selected: true });
    const selectedLabel = await selectedTab.getAttribute("aria-label");

    await firstTab.focus();
    await firstTab.press("ArrowRight");

    await expect(secondTab).toBeFocused();
    await expect(selectedTab).toHaveAttribute("aria-label", selectedLabel ?? "");
  });

  test("matches the collapsed visual baseline @vrt", async ({ page }) => {
    await page.goto("/components/recent-patient-stack");

    const stack = page.locator("[data-zb-stack]");

    await expect(stack).toBeVisible();
    await expect(stack).toHaveScreenshot("recent-patient-stack-collapsed.png", {
      animations: "disabled",
      caret: "hide",
    });
  });

  test("matches the expanded visual baseline @vrt", async ({ page }) => {
    await page.goto("/components/recent-patient-stack");

    await page.getByRole("tab", { name: "Closing is graded, not binary" }).click();

    const stack = page.locator("[data-zb-stack]");

    await expect(stack).toBeVisible();
    await expect(stack.locator(".zb-stack__panel")).toBeVisible();

    await expect(stack).toHaveScreenshot("recent-patient-stack-expanded.png", {
      animations: "disabled",
      caret: "hide",
    });
  });
});
