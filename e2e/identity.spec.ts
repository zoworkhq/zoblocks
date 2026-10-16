import { expect, test, type Page } from "@playwright/test";

const PAGE = "/components/identity";

async function openIdentity(page: Page) {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("tablist")).toBeVisible();
}

async function selectScenario(page: Page, label: string) {
  await page.getByRole("tab", { name: label }).click();
  await expect(page.getByRole("tabpanel")).toBeVisible();
}

test.describe("Identity component", () => {
  test("renders the patient banner with identifying information", async ({ page }) => {
    await openIdentity(page);
    await selectScenario(page, "The banner");

    const banner = page.locator('[data-zb-banner="ready"]');

    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Amara Chinelo Okonkwo");
    await expect(banner).toHaveAttribute("data-zb-context", "action");
    await expect(banner.locator('[data-zb-field="identifier"]')).toHaveCount(2);
  });

  test("renders distinct patient record states", async ({ page }) => {
    await openIdentity(page);
    await selectScenario(page, "Four states, not one pill");

    const banners = page.locator('[data-zb-banner="ready"]');

    await expect(banners).toHaveCount(5);
    await expect(banners).toContainText("Halima Yusuf");
    await expect(banners).toContainText("Devraj Anand Iyer");
    await expect(banners).toContainText("Kofi Mensah");
    await expect(banners).toContainText("Integration ZZZTEST");
    await expect(banners).toContainText("Sofía Ramírez Cruz");
  });

  test("disambiguates patients with confusable names", async ({ page }) => {
    await openIdentity(page);
    await selectScenario(page, "Two patients, one name");

    const toggle = page.getByRole("checkbox", {
      name: "Run disambiguate()",
    });

    await toggle.check();

    await expect(page.getByRole("status")).toBeVisible();

    // Turning the feature off should remove the list-level notice.
    await toggle.uncheck();
    await expect(page.getByRole("status")).toHaveCount(0);
  });

  test("reveals sensitivity labels at full disclosure", async ({ page }) => {
    await openIdentity(page);
    await selectScenario(page, "Who is looking");

    await expect(page.getByRole("button", { name: "Waiting room" })).toBeVisible();

    await page.getByRole("button", { name: "Full record" }).click();

    await expect(page.locator('[data-zb-field="sensitivity"]')).toBeVisible();
  });

  test("blocks the order form when the displayed patient changes", async ({ page }) => {
    await openIdentity(page);
    await selectScenario(page, "Wrong patient");

    await expect(page.getByText("Order form for this patient — Clozapine 25 mg")).toBeVisible();

    await page.getByRole("button", { name: "Switch patient" }).click();

    await expect(page.getByRole("alert")).toContainText("Wrong patient");
    await expect(page.getByText("Order form for this patient — Clozapine 25 mg")).toHaveCount(0);
  });

  test("requires the patient's initials before confirming", async ({ page }) => {
    await openIdentity(page);
    await selectScenario(page, "Confirm before ordering");

    const dialog = page.getByRole("alertdialog", {
      name: "Confirm the patient before ordering Clozapine 25 mg",
    });

    await expect(dialog).toBeVisible();

    const initials = dialog.getByRole("textbox", {
      name: "Type this patient's initials to continue",
    });

    await initials.fill("ZZ");
    await dialog.getByRole("button", { name: "Confirm" }).click();

    await expect(dialog).toContainText("Nothing has been ordered");

    await initials.fill("AO");
    await dialog.getByRole("button", { name: "Confirm" }).click();

    await expect(
      page.getByText("Confirmed. In a real deployment the order proceeds from here."),
    ).toBeVisible();
  });

  test("renders the loading state without a partial identity", async ({ page }) => {
    await openIdentity(page);
    await selectScenario(page, "Five kinds of missing");

    const loadingBanner = page.locator('[data-zb-banner="loading"]');

    await expect(loadingBanner).toBeVisible();
    await expect(loadingBanner).toHaveAttribute("aria-busy", "true");
    await expect(loadingBanner).toContainText("Loading patient");
  });

  test("@reflow keeps the patient banner within a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await openIdentity(page);
    await selectScenario(page, "The banner");

    const banner = page.locator('[data-zb-banner="ready"]');
    await expect(banner).toBeVisible();

    const bounds = await banner.boundingBox();

    expect(bounds).not.toBeNull();

    if (bounds) {
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
    }
  });
});
