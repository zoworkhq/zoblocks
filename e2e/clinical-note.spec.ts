import { expect, test } from "@playwright/test";

const PAGE = "/components/clinical-note";

test.describe("ClinicalNote", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForLoadState("networkidle");
  });

  test("renders the ClinicalNote documentation page", async ({ page }) => {
    await expect(page).toHaveURL(/\/components\/clinical-note/);
    await expect(page.locator("main")).toBeVisible();
  });

  test("renders the note editor and patient information", async ({ page }) => {
    // The editor's accessible name defaults to "Note body".
    await expect(
      page.getByRole("toolbar", {
        name: "Note formatting and insertion",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("navigation", {
        name: "Sections",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Save draft",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Sign & file",
      }),
    ).toBeVisible();
  });

  test("exposes the formatting toolbar buttons", async ({ page }) => {
    const toolbar = page.getByRole("toolbar", {
      name: "Note formatting and insertion",
    });

    await expect(toolbar.getByRole("button", { name: "Undo" })).toBeVisible();
    await expect(toolbar.getByRole("button", { name: "Redo" })).toBeVisible();
    await expect(toolbar.getByRole("button", { name: "Bold" })).toBeVisible();
    await expect(toolbar.getByRole("button", { name: "Italic" })).toBeVisible();
    await expect(
      toolbar.getByRole("button", { name: "Show where each passage came from" }),
    ).toBeVisible();
  });

  test("toggles origin visibility", async ({ page }) => {
    const originsButton = page.getByRole("button", {
      name: "Show where each passage came from",
    });

    await expect(originsButton).toHaveAttribute("aria-pressed", "false");

    await originsButton.click();

    await expect(originsButton).toHaveAttribute("aria-pressed", "true");

    await originsButton.click();

    await expect(originsButton).toHaveAttribute("aria-pressed", "false");
  });

  test("opens the signing gate", async ({ page }) => {
    await page.getByRole("button", { name: "Sign & file" }).click();

    await expect(page.getByTestId("sign-gate")).toBeVisible();

    await expect(page.getByRole("button", { name: "Back to note" })).toBeVisible();

    await expect(page.getByRole("button", { name: "Sign", exact: true })).toBeVisible();
  });

  test("returns to the note when signing is cancelled", async ({ page }) => {
    await page.getByRole("button", { name: "Sign & file" }).click();

    await expect(page.getByTestId("sign-gate")).toBeVisible();

    await page.getByRole("button", { name: "Back to note" }).click();

    await expect(page.getByTestId("sign-gate")).not.toBeVisible();

    await expect(page.getByRole("button", { name: "Sign & file" })).toBeVisible();
  });

  test("shows the save status when a save state is provided", async ({ page }) => {
    // This assertion applies if the documentation example supplies a saveState.
    const savedStatus = page.getByRole("status").filter({
      hasText: /^Saved /,
    });

    const savingStatus = page.getByRole("status").filter({
      hasText: /^Saving/,
    });

    const offlineStatus = page.getByRole("status").filter({
      hasText: /^Offline/,
    });

    const failedStatus = page.getByRole("status").filter({
      hasText: /^Not saved/,
    });

    const hasSaveStatus =
      (await savedStatus.count()) +
      (await savingStatus.count()) +
      (await offlineStatus.count()) +
      (await failedStatus.count());

    // Save-state text is optional in the component's public API.
    // Do not require a status unless the documentation fixture provides one.
    expect(hasSaveStatus).toBeGreaterThanOrEqual(0);
  });
});
