/**
 * RecentPatientStack in the docs site's real browser preview.
 *
 * The page is a Playground page. Its Playground holds the default stack — a
 * pinned chart (R. Vance), the active one (A. Okonkwo), and one with an unsigned
 * note (T. Boateng) — and each documented Example (`#ex-<id>-panel-preview`)
 * mounts its own: `similar` for two names four letters apart, and `closing`
 * for one chart per close verdict (clean, unsigned note, draft order). The old
 * `?state=` scenarios and their tabpanels are gone. Chart data is documentation
 * fixture data, and activation is controlled by the host. These checks cover
 * the rendered chart identity, controlled selection, keyboard focus movement,
 * and the close verdicts the component implements.
 */

import { expect, test, type Page } from "@playwright/test";

const PAGE = "/components/recent-patient-stack";

/** The Playground, or an Example by its registry id. */
type Region = "playground" | "similar" | "closing";

async function openStack(page: Page, region: Region = "playground") {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto(PAGE);
  expect(response?.status()).toBe(200);
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: "Recent Patient Stack", exact: true }),
  ).toBeVisible();

  const panel = page.locator(
    region === "playground" ? "#playground" : `#ex-${region}-panel-preview`,
  );
  await panel.scrollIntoViewIfNeeded();
  const tablist = panel.getByRole("tablist", { name: "Open charts" });
  await expect(tablist).toBeVisible();

  return { panel, tablist, pageErrors };
}

test.describe("@vrt recent patient stack", () => {
  test("the default multi-chart stack is visually stable", async ({ page }) => {
    const { panel } = await openStack(page);
    const stack = panel.locator("[data-zb-stack]");

    await expect(stack).toBeVisible();
    await expect(stack).toHaveScreenshot("recent-patient-stack-default.png");
  });

  test("the expanded chart actions are visually stable", async ({ page }) => {
    const { panel } = await openStack(page, "closing");
    const stack = panel.locator("[data-zb-stack]");

    await expect(stack).toBeVisible();
    await expect(stack).toHaveScreenshot("recent-patient-stack-expanded.png");
  });

  test("the unsigned-note close confirmation is visually stable", async ({ page }) => {
    const { panel } = await openStack(page, "closing");

    await panel.getByRole("button", { name: "Close T. Boateng" }).click();
    const confirmation = page.getByRole("alertdialog", { name: "Close this chart?" });
    await expect(confirmation).toBeVisible();
    await expect(confirmation).toHaveScreenshot("recent-patient-stack-close-confirmation.png");
  });
});

test.describe("@a11y recent patient stack", () => {
  test("renders the synthetic open charts, active chart, and outstanding work", async ({
    page,
  }) => {
    const { tablist, pageErrors } = await openStack(page);
    const tabs = tablist.getByRole("tab");

    await expect(tabs).toHaveCount(3);
    await expect(tablist.getByRole("tab", { name: /A\. Okonkwo/, selected: true })).toBeVisible();
    await expect(tablist.getByRole("tab", { name: /T\. Boateng.*Unsigned note/ })).toBeVisible();
    await expect(tablist.getByRole("tab", { name: /R\. Vance.*Pinned/ })).toBeVisible();
    // The Playground drives expansion with its "Expanded" knob rather than
    // `onExpandedChange`, so the component renders no "N charts" button here.
    expect(pageErrors).toEqual([]);
  });

  test("similar synthetic names both display their identifiers", async ({ page }) => {
    const { panel, pageErrors } = await openStack(page, "similar");

    await expect(panel).toContainText("J. Okonkwo");
    await expect(panel).toContainText("093-441-208");
    await expect(panel).toContainText("J. Okonjo");
    await expect(panel).toContainText("093-118-774");
    await expect(panel).not.toContainText("093-772-115");
    expect(pageErrors).toEqual([]);
  });

  test("arrow keys move focus without changing the host-controlled active chart", async ({
    page,
  }) => {
    const { tablist, pageErrors } = await openStack(page);
    const active = tablist.getByRole("tab", { name: /A\. Okonkwo/ });
    const pinned = tablist.getByRole("tab", { name: /R\. Vance/ });

    await pinned.focus();
    await page.keyboard.press("ArrowRight");
    await expect(active).toBeFocused();
    await expect(active).toHaveAttribute("aria-selected", "true");

    // The docs host's onActivate is intentionally a no-op. Selection remains
    // controlled by activeId until the host supplies a new value.
    await pinned.click();
    await expect(active).toHaveAttribute("aria-selected", "true");
    expect(pageErrors).toEqual([]);
  });

  test("closing a clean chart passes through, an unsigned note asks, and a draft order refuses", async ({
    page,
  }) => {
    const { panel, pageErrors } = await openStack(page, "closing");

    // A. Okonkwo is the `closing` Example's clean chart: nothing outstanding.
    await panel.getByRole("button", { name: "Close A. Okonkwo" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);

    await panel.getByRole("button", { name: "Close T. Boateng" }).click();
    const confirmation = page.getByRole("alertdialog", { name: "Close this chart?" });
    await expect(confirmation).toContainText(/unsigned progress note/i);
    await confirmation.getByRole("button", { name: "Close and lose the draft" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);

    await panel.getByRole("button", { name: "Close L. Marsh" }).click();
    const refusal = page.getByRole("alertdialog", { name: "Cannot close" });
    await expect(refusal).toContainText("Lithium level");
    await expect(refusal.getByRole("button")).toHaveCount(1);
    await refusal.getByRole("button", { name: "Back to the chart" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });
});
