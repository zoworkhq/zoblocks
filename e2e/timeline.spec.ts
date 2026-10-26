/**
 * Timeline in a real browser.
 *
 * What a browser adds is the real accessibility tree and the real tab
 * order. Timeline's claim is that it is the ordered list Ant Design's
 * Timeline does not ship: a named list, with nothing in the rail that
 * takes focus. Both are properties of the rendered page, so this checks
 * the page.
 *
 * The docs page is the fixture host, as ADR 0007 intends: it already
 * renders the scenarios, so this reuses it rather than standing up a
 * second harness that could drift from what ships.
 */

import { expect, test, type Page } from "@playwright/test";

const PAGE = "/components/timeline";

/** The two scenarios the docs preview offers, by the name of their tab. */
const SCENARIOS = [
  { name: "the rail", label: /the rail/i },
  { name: "an Ant Design v5 call site", label: /ant design v5 call site/i },
] as const;

/**
 * Switch the preview to a named scenario.
 *
 * The page shows one scenario at a time, so a test that only visits the
 * page asserts against whichever one happens to be first. Selecting is
 * the fix; there is nothing to skip.
 */
async function selectScenario(page: Page, label: RegExp) {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");
  await page.getByRole("tab", { name: label }).click();
  const timeline = page.locator("[data-zb-timeline]").first();
  await expect(timeline).toBeVisible();
  return timeline;
}

test.describe("@a11y timeline", () => {
  for (const scenario of SCENARIOS) {
    test(`${scenario.name} is a named ordered list`, async ({ page }) => {
      const timeline = await selectScenario(page, scenario.label);
      // An `ol`, not a `ul`: the order is the point of the component.
      await expect(timeline).toHaveJSProperty("tagName", "OL");
      // `list-style: none` drops list semantics in Safari, so the role is
      // stated rather than assumed.
      await expect(timeline).toHaveAttribute("role", "list");
      // The browser's computed name, so aria-label and aria-labelledby
      // both count.
      await expect(timeline).toHaveAccessibleName(/\S/);
    });
  }
});

test.describe("@a11y timeline focus", () => {
  for (const scenario of SCENARIOS) {
    test(`${scenario.name} adds no tab stops`, async ({ page }) => {
      const timeline = await selectScenario(page, scenario.label);
      // Timeline is a structure, not a widget: no arrow keys, no roving
      // focus, so no `tabindex` anywhere in the rail. A reader tabbing
      // through the page should never stop inside it.
      await expect(timeline).not.toHaveAttribute("tabindex");
      await expect(timeline.locator("[tabindex]")).toHaveCount(0);
    });
  }
});

test.describe("@reflow timeline at 320px", () => {
  for (const scenario of SCENARIOS) {
    test(`${scenario.name} does not scroll sideways`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 720 });
      const timeline = await selectScenario(page, scenario.label);

      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return root.scrollWidth - root.clientWidth;
      });
      // WCAG 1.4.10's floor. One pixel of slack covers sub-pixel rounding.
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(timeline).toBeVisible();
    });
  }
});
