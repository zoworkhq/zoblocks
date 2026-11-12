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

/**
 * The three layouts the docs Playground offers, by the label of their `Mode`
 * knob.
 *
 * The page used to be a states rail with two scenarios, the rail and "an Ant
 * Design v5 call site". It is now a Playground page with a single timeline,
 * and the v5 prop spellings it demonstrated (`label`, `children`, `dot`,
 * `mode="left"`) are covered by the unit suite. What a browser adds is layout,
 * and that is what the mode changes: `alternate` puts items on both sides of
 * the rail, which is where a 320px reflow would break first.
 */
const SCENARIOS = [
  { name: "the start layout", mode: "start" },
  { name: "the end layout", mode: "end" },
  { name: "the alternate layout", mode: "alternate" },
] as const;

/** Set the Playground's mode and return its timeline. */
async function selectScenario(page: Page, mode: (typeof SCENARIOS)[number]["mode"]) {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");
  const playground = page.locator("#playground");
  await playground.scrollIntoViewIfNeeded();
  // `start`, `end` and `alternate` are unique labels within the Playground. The
  // input is visually hidden behind its label, so click the label, as a person
  // would, and confirm the knob took.
  // `has` is resolved inside each label, so its locator must not be scoped to
  // the Playground as well.
  const radio = page.getByRole("radio", { name: mode, exact: true });
  await playground.locator("label", { has: radio }).click();
  await expect(playground.getByRole("radio", { name: mode, exact: true })).toBeChecked();
  const timeline = playground.locator("[data-zb-timeline]").first();
  await expect(timeline).toBeVisible();
  return timeline;
}

test.describe("@a11y timeline", () => {
  for (const scenario of SCENARIOS) {
    test(`${scenario.name} is a named ordered list`, async ({ page }) => {
      const timeline = await selectScenario(page, scenario.mode);
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
      const timeline = await selectScenario(page, scenario.mode);
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
      const timeline = await selectScenario(page, scenario.mode);

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
