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
 *   · MUI's ripple is a mounted DOM node driven by real pointer events.
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

/** The chip colour that must survive every switch: `--ox-status-critical`, light. */
const OXYGEN_CRITICAL = "rgb(185, 28, 28)";

function control(page: Page) {
  return page.getByRole("radiogroup", { name: "Design language" });
}

async function choose(page: Page, label: string) {
  await control(page).getByRole("radio", { name: label }).click();
  // The chunk is fetched on click; the wrapper appears when it has executed.
  await expect(page.locator(`[data-ox-bridge], [data-ox-host]`).first()).toBeVisible();
}

/** The element each host mounts its token patch on. */
function hosted(page: Page) {
  return page.locator("[data-ox-bridge], [data-ox-host]").first();
}

/**
 * Reveal is an IntersectionObserver fade, and until it finishes the paragraph
 * above the preview still overlays the buttons — Playwright reports the click
 * as intercepted by a `[data-reveal]` element, which reads as a layout bug and
 * is not one. Same helper as `docs-site.spec.ts`.
 */
async function settle(page: Page) {
  await page.waitForTimeout(500);
}

test.describe("@bridge design language switch", () => {
  test("mounts each framework's own components, lazily", async ({ page }) => {
    await page.goto(PAGE);
    await expect(control(page)).toBeVisible();

    // Oxygen is the default and must cost nothing: neither framework has been
    // fetched yet, so neither framework's classes exist.
    await expect(hosted(page)).toHaveAttribute("data-ox-host", "oxygen");
    await expect(page.locator(".ant-btn")).toHaveCount(0);
    await expect(page.locator(".MuiButton-root")).toHaveCount(0);

    await choose(page, "Ant Design");
    // `.ant-btn-primary` is emitted by antd itself. A reproduction cannot
    // produce it, which is what makes this an assertion about the real library.
    await expect(page.locator(".ant-btn-primary").first()).toBeVisible();
    await expect(hosted(page)).toHaveAttribute("data-ox-bridge", "antd");

    await choose(page, "Material UI");
    await expect(page.locator(".MuiButton-contained").first()).toBeVisible();
    await expect(page.locator(".MuiOutlinedInput-notchedOutline").first()).toBeAttached();
    await expect(hosted(page)).toHaveAttribute("data-ox-bridge", "mui");
    // Switching hosts must unmount the previous one rather than layering it.
    await expect(page.locator(".ant-btn")).toHaveCount(0);
  });

  test("keeps MUI's ripple, which a reproduction cannot have", async ({ page }) => {
    await page.goto(PAGE);
    await choose(page, "Material UI");

    const button = page.locator(".MuiButton-contained").first();
    await expect(button).toBeVisible();
    await button.scrollIntoViewIfNeeded();
    await settle(page);

    // MUI mounts `TouchRipple` lazily on first interaction, so asserting before
    // the press fails against a perfectly working button.
    await expect(page.locator(".MuiTouchRipple-root")).toHaveCount(0);

    /*
     * `dispatchEvent` rather than `click`, deliberately.
     *
     * The page's reveal fades and the preview's settle animation keep the
     * stage moving, so Playwright's actionability check reports "element is
     * not stable" until it times out — a property of the docs page, not of the
     * button. Click actionability is already covered by the radio clicks in
     * every other test here; what this one is about is whether MUI's real
     * `ButtonBase` is underneath, and its ripple starts on `mousedown`.
     */
    await button.dispatchEvent("mousedown");
    await expect(page.locator(".MuiTouchRipple-root").first()).toBeAttached();
    // The ripple itself, not just its container: proof the animation ran.
    await expect(page.locator(".MuiTouchRipple-ripple").first()).toBeAttached();
  });

  test("re-themes the component but never its clinical colours", async ({ page }) => {
    await page.goto(PAGE);
    const chip = page.locator(".ox-cs").first();
    await expect(chip).toBeVisible();

    const before = await chip.evaluate((el) => getComputedStyle(el).color);
    expect(before).toBe(OXYGEN_CRITICAL);

    for (const [label, accent] of [
      ["Ant Design", "#1677ff"],
      ["Material UI", "#1976d2"],
    ] as const) {
      await choose(page, label);

      // The chrome does move: the framework's primary reaches `--ox-accent`.
      // Read from the inline style rather than the computed value — the pane
      // can return a mid-transition colour, and this is the value the bridge
      // actually wrote.
      await expect
        .poll(() =>
          hosted(page).evaluate((el) => (el as HTMLElement).style.getPropertyValue("--ox-accent")),
        )
        .toBe(accent);

      // The clinical colour does not. `bridge-core` refuses a status write at
      // runtime and both bridges list all eight in `unmapped`; this is the same
      // rule observed from outside, on a real cascade.
      await expect(chip).toHaveCSS("color", OXYGEN_CRITICAL);
    }
  });

  test("is linkable and survives a reload", async ({ page }) => {
    await page.goto(`${PAGE}?lang=mui`);
    await expect(page.locator(".MuiButton-contained").first()).toBeVisible();
    await expect(control(page).getByRole("radio", { name: "Material UI" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // Chosen, not linked: the cookie is what carries it to the next page.
    await page.goto(PAGE);
    await expect(page.locator(".MuiButton-contained").first()).toBeVisible();
  });

  test("is one tab stop, with arrows moving inside it", async ({ page }) => {
    await page.goto(PAGE);
    const group = control(page);
    const selected = group.getByRole("radio", { name: "Oxygen" });
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
    await expect(page.locator(".ant-btn-primary").first()).toBeVisible();
  });
});
