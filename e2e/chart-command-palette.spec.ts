/**
 * ChartCommandPalette in a real browser.
 *
 * The docs preview is the fixture host: it provides the same patient scope,
 * search results, unavailable action, and clinically significant action that
 * the component documents.
 *
 * These tests focus on behavior that depends on the browser's real keyboard,
 * focus, accessibility tree, and layout engine. The docs fixture uses no-op
 * callbacks, so this spec does not claim to verify persisted audit records or
 * actual clinical action execution.
 */

import { expect, test, type Page } from "@playwright/test";

const PAGE = "/components/chart-command-palette";

async function selectScenario(page: Page, label: RegExp) {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");

  await page.getByRole("tab", { name: label }).click();

  const panel = page.getByRole("tabpanel").first();
  await expect(panel).toBeVisible();

  const palette = panel.locator("[data-zb-palette]");
  await expect(palette).toBeVisible();

  return { panel, palette };
}

async function searchInput(palette: ReturnType<Page["locator"]>) {
  const input = palette.getByRole("combobox", {
    name: "Search or run a command",
  });
  await expect(input).toBeVisible();
  return input;
}

test.describe("@a11y chart command palette", () => {
  test("the empty palette does not disclose the size of the patient index", async ({ page }) => {
    const { palette } = await selectScenario(page, /Counted, never named/);

    await expect(palette.getByRole("combobox")).toHaveValue("");
    await expect(palette.locator(".zb-palette__empty")).toContainText(/Type to search/);
    await expect(palette.locator(".zb-palette__withheld")).toHaveCount(0);

    // An empty query must not count patients outside the treatment relationship.
    await expect(palette).not.toContainText("A. Okonjo");
    await expect(palette).not.toContainText("A. Okoro");
  });

  test("out-of-scope patients are counted but never named", async ({ page }) => {
    const { palette } = await selectScenario(page, /Counted, never named/);
    const input = await searchInput(palette);

    await input.fill("oko");

    // The debounce applies to the withheld count as well as the live results.
    await expect(palette.locator(".zb-palette__withheld")).toHaveText(
      "2 further matches outside your patients — break-glass required",
    );

    await expect(palette.getByRole("option", { name: /A\. Okonkwo/ })).toBeVisible();

    // The two matching patients outside the user's scope must never appear
    // in visible result text or accessible option names.
    await expect(palette).not.toContainText("A. Okonjo");
    await expect(palette).not.toContainText("A. Okoro");
    await expect(palette.getByRole("option", { name: /A\. Okonjo|A\. Okoro/ })).toHaveCount(0);
  });

  test("the combobox exposes its listbox and active option", async ({ page }) => {
    const { palette } = await selectScenario(page, /Verbs first/);
    const input = await searchInput(palette);

    await expect(input).toHaveAttribute("aria-expanded", "true");
    await expect(input).toHaveAttribute("aria-autocomplete", "list");

    const listbox = palette.getByRole("listbox", { name: "Results" });
    await expect(listbox).toBeVisible();

    const controls = await input.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    await expect(listbox).toHaveAttribute("id", controls!);

    await input.fill("lith");

    // The combobox's active descendant must point to a real option in the list.
    const activeId = await input.getAttribute("aria-activedescendant");
    expect(activeId).toBeTruthy();

    const activeOption = page.locator(`[id="${activeId}"]`);
    await expect(activeOption).toHaveAttribute("role", "option");
    await expect(activeOption).toHaveAttribute("aria-selected", "true");
  });

  test("actions rank ahead of chart resources for a clinical search", async ({ page }) => {
    const { palette } = await selectScenario(page, /Verbs first/);
    const input = await searchInput(palette);

    await input.fill("phq");

    const options = palette.getByRole("option");
    await expect(options.first()).toContainText("Start PHQ-9");

    const actionGroup = palette.getByRole("group", { name: "Actions" });
    const chartGroup = palette.getByRole("group", { name: "In this chart" });

    await expect(actionGroup).toBeVisible();
    await expect(chartGroup).toBeVisible();

    // The action is the first result even though a matching chart resource exists.
    await expect(actionGroup.getByRole("option").first()).toContainText("Start PHQ-9");
    await expect(chartGroup.getByRole("option")).toContainText("PHQ-9 result, 12 Aug");
  });

  test("Tab accepts an action that still needs an argument without running it", async ({
    page,
  }) => {
    const { palette } = await selectScenario(page, /Verbs first/);
    const input = await searchInput(palette);

    await input.fill("order lithium");
    await expect(palette.getByRole("option", { name: /Order lithium level/ })).toBeVisible();

    await input.press("Tab");

    // Tab accepts the verb and returns its label to the input for the argument
    // step. The palette stays open instead of handing focus away.
    await expect(input).toHaveValue("Order lithium level ");
    await expect(palette).toBeVisible();
    await expect(input).toBeFocused();
  });

  test("a clinically significant action asks for confirmation on the first Enter", async ({
    page,
  }) => {
    const { palette } = await selectScenario(page, /Verbs first/);
    const input = await searchInput(palette);

    await input.fill("discontinue lithium");
    const action = palette.getByRole("option", {
      name: /Discontinue lithium/,
    });
    await expect(action).toBeVisible();

    // The first Enter arms the action. It must not silently execute it.
    await input.press("Enter");

    await expect(palette.getByText("Press Enter again to confirm")).toBeVisible();
    await expect(action).toHaveAttribute("data-zb-armed", "");
  });

  test("an unavailable action stays visible with its reason", async ({ page }) => {
    const { palette } = await selectScenario(page, /Verbs first/);
    const input = await searchInput(palette);

    await input.fill("sign");

    const action = palette.getByRole("option", { name: /Sign note/ });
    await expect(action).toBeVisible();
    await expect(action).toHaveAttribute("aria-disabled", "true");
    await expect(action).toContainText("Offline");

    // It is disclosed as unavailable rather than silently omitted.
    await expect(palette).toContainText("Sign note");
    await expect(palette).toContainText("Offline");
  });
});

test.describe("@reflow chart command palette", () => {
  test("the documented palette remains visible at a 320px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });

    const { palette } = await selectScenario(page, /Counted, never named/);
    await expect(palette).toBeVisible();

    const input = await searchInput(palette);
    await input.fill("oko");

    await expect(palette.locator(".zb-palette__withheld")).toContainText(/2 further matches/);

    // Check the actual browser layout rather than jsdom's zero-sized boxes.
    const horizontalOverflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth - root.clientWidth;
    });

    expect(horizontalOverflow).toBeLessThanOrEqual(1);
  });
});
