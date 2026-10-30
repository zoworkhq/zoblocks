import { expect, test } from "@playwright/test";

test.describe("@a11y care team presence", () => {
  test("opens the documentation page and renders its heading", async ({ page }) => {
    await page.goto("/components/care-team-presence");

    await expect(page.getByRole("heading", { name: "Care Team Presence", level: 1 })).toBeVisible();

    await expect(page.locator("#preview")).toBeVisible();
  });
});

test.describe("@vrt care team presence", () => {
  test("matches the documentation page visual baseline", async ({ page }) => {
    await page.goto("/components/care-team-presence");

    await expect(page.getByRole("heading", { name: "Care Team Presence", level: 1 })).toBeVisible();

    await expect(page).toHaveScreenshot("care-team-presence.png", {
      fullPage: true,
      animations: "disabled",
    });
  });
});
