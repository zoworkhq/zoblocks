/**
 * The design-language switch on a component page, in a real browser.
 *
 * `packages/host-react` already asserts that each adapter renders its
 * framework's own controls, but it does so in jsdom against a tree it mounted
 * itself. Three things about this feature only exist in a browser and are
 * exactly where it would break:
 *
 *   · the frameworks arrive through `React.lazy`, so what is being tested is a
 *     code-split chunk resolving after hydration, not an import;
 *   · the token bridge writes custom properties that a *stylesheet* then has to
 *     resolve, and jsdom has no cascade worth the name;
 *
 * The docs used to draw a band of framework chrome — antd and MUI buttons,
 * inputs and a select — above every preview, and these tests asserted on it.
 * That band was removed (e88f930) and the pages now render only the component
 * being documented, so there is no `.ant-btn` or `.MuiButton-root` left on
 * them to find. What is still observable is the bridge itself: the lazy host
 * replaces the ZoBlocks fallback and marks its subtree with `data-zb-bridge`
 * only once its chunk has executed, which is the same "the real library
 * arrived" claim, read from the attribute rather than from its buttons. The
 * adapters' own controls are covered in `packages/host-react/src/hosts.test.tsx`.
 *
 * Tagged `@bridge` because every project in `playwright.config.ts` carries a
 * `grep`, and a tag with no project matches nothing while the run still reports
 * green. That is how `@motion` went unrun; `playwright test --list` is what
 * surfaces it.
 */

import { test, expect, type Page } from "@playwright/test";

/**
 * Clinical Status, because it is the page where the invariant is visible.
 *
 * Its preview is a wall of status chips, so a bridge that ever wrote a clinical
 * token would not need an assertion to notice — the page would change colour.
 */
const PAGE = "/components/clinical-status";

/** The chip colour that must survive every switch: `--zb-status-critical`, light. */
const ZOBLOCKS_CRITICAL = "rgb(185, 28, 28)";

function control(page: Page) {
  return page.getByRole("radiogroup", { name: "Design language" });
}

async function choose(page: Page, label: string) {
  await control(page).getByRole("radio", { name: label }).click();
  // The chunk is fetched on click; the wrapper appears when it has executed.
  await expect(page.locator(`[data-zb-bridge], [data-zb-host]`).first()).toBeVisible();
}

/** The element each host mounts its token patch on. */
function hosted(page: Page) {
  return page.locator("[data-zb-bridge], [data-zb-host]").first();
}

/** The lazy host has executed: its subtree is marked with its own bridge. */
async function expectBridge(page: Page, bridge: "antd" | "mui") {
  await expect(hosted(page)).toHaveAttribute("data-zb-bridge", bridge);
}

test.describe("@bridge design language switch", () => {
  test("mounts each framework's own components, lazily", async ({ page }) => {
    await page.goto(PAGE);
    await expect(control(page)).toBeVisible();

    // ZoBlocks is the default and must cost nothing: neither framework has been
    // fetched yet, so neither framework's classes exist.
    await expect(hosted(page)).toHaveAttribute("data-zb-host", "zoblocks");
    await expect(page.locator(".ant-btn")).toHaveCount(0);
    await expect(page.locator(".MuiButton-root")).toHaveCount(0);

    await choose(page, "Ant Design");
    // The ZoBlocks host is the Suspense fallback, so this attribute appears
    // only once antd's chunk has been fetched and executed.
    await expectBridge(page, "antd");

    await choose(page, "Material UI");
    await expectBridge(page, "mui");
    // Switching hosts must unmount the previous one rather than layering it.
    await expect(page.locator('[data-zb-bridge="antd"]')).toHaveCount(0);
  });

  test("re-themes the component but never its clinical colours", async ({ page }) => {
    await page.goto(PAGE);
    const chip = page.locator(".zb-cs").first();
    await expect(chip).toBeVisible();

    const before = await chip.evaluate((el) => getComputedStyle(el).color);
    expect(before).toBe(ZOBLOCKS_CRITICAL);

    for (const [label, accent] of [
      ["Ant Design", "#1677ff"],
      ["Material UI", "#1976d2"],
    ] as const) {
      await choose(page, label);

      // The chrome does move: the framework's primary reaches `--zb-accent`.
      // Read from the inline style rather than the computed value — the pane
      // can return a mid-transition colour, and this is the value the bridge
      // actually wrote.
      await expect
        .poll(() =>
          hosted(page).evaluate((el) => (el as HTMLElement).style.getPropertyValue("--zb-accent")),
        )
        .toBe(accent);

      // The clinical colour does not. `bridge-core` refuses a status write at
      // runtime and both bridges list all eight in `unmapped`; this is the same
      // rule observed from outside, on a real cascade.
      await expect(chip).toHaveCSS("color", ZOBLOCKS_CRITICAL);
    }
  });

  test("is linkable and survives a reload", async ({ page }) => {
    await page.goto(`${PAGE}?lang=mui`);
    await expectBridge(page, "mui");
    await expect(control(page).getByRole("radio", { name: "Material UI" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // Chosen, not linked: the cookie is what carries it to the next page.
    await page.goto(PAGE);
    await expectBridge(page, "mui");
  });

  test("is one tab stop, with arrows moving inside it", async ({ page }) => {
    await page.goto(PAGE);
    const group = control(page);
    const selected = group.getByRole("radio", { name: "ZoBlocks" });
    await selected.focus();

    // Roving tabindex, per the APG radiogroup pattern: the two unselected
    // radios must not be reachable with Tab.
    await expect(group.getByRole("radio", { name: "Ant Design" })).toHaveAttribute(
      "tabindex",
      "-1",
    );

    await page.keyboard.press("ArrowRight");
    await expect(group.getByRole("radio", { name: "Ant Design" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expectBridge(page, "antd");
  });
});
