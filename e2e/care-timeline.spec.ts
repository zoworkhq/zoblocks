/**
 * CareTimeline in a real browser.
 *
 * The unit suite covers what the component says — every safety claim in
 * `care-timeline.test.tsx` is an assertion about words in the output, which is
 * exactly where those assertions belong. What it structurally cannot cover is
 * anything needing a layout engine, and for this component that is the part
 * where a claim can quietly stop being made:
 *
 *   - the coverage sentence is only a safety control while it is *on screen*.
 *     A footer that has scrolled off, been clipped by a card, or dropped by a
 *     print stylesheet is a timeline with no claim attached to it.
 *   - the rail is a grid column, and the reason it is a grid column is 320px
 *     reflow and 200% zoom. jsdom reports every box as zero, so only a browser
 *     can say the layout survived.
 *   - forced colours and `color-mix` are CSS features jsdom does not implement
 *     at all, and forced colours is where a state carried only by a dash or a
 *     tint would disappear.
 *
 * The docs page is the fixture host, as ADR 0007 intends: it already renders
 * the states, so this reuses it rather than standing up a second harness that
 * could drift from what ships.
 */

import { expect, test, type Page } from "@playwright/test";

const PAGE = "/components/care-timeline";

async function openTimeline(page: Page) {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");
  const timeline = page.locator("[data-zb-care-timeline]").first();
  await expect(timeline).toBeVisible();
  return timeline;
}

/**
 * Switch the preview to a named scenario.
 *
 * The page shows one scenario at a time, so a test that only visits the page
 * asserts against whichever one happens to be first. An earlier version of the
 * two tests below guarded with `test.skip` when their fixture was absent — and
 * skipped on every run, which is the failure this repository's Playwright
 * config already carries a paragraph about. Selecting is the fix; there is
 * nothing to skip.
 */
async function selectScenario(page: Page, label: RegExp) {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");
  await page.getByRole("tab", { name: label }).click();
  const timeline = page.locator("[data-zb-care-timeline]").first();
  await expect(timeline).toBeVisible();
  return timeline;
}

test.describe("@a11y care timeline", () => {
  test("the coverage sentence is rendered, not implied", async ({ page }) => {
    const timeline = await openTimeline(page);
    const coverage = timeline.locator(".zb-care-timeline__coverage").first();
    await expect(coverage).toBeVisible();
    await expect(coverage).toContainText(/Showing/);
    await expect(coverage).toContainText(/newest first|oldest first/);
  });

  test("a failed source interrupts rather than sitting in grey", async ({ page }) => {
    // The repeat-CT case. If this ever becomes a quiet footnote, the component
    // has stopped doing the one thing it was built for.
    await selectScenario(page, /source that could not be reached/);
    const timeline = page.locator("[data-zb-care-timeline][data-zb-degraded]").first();
    await expect(timeline.getByRole("alert")).toBeVisible();
  });

  test("every list on the page is named", async ({ page }) => {
    const timeline = await openTimeline(page);
    const lists = timeline.locator("ol.zb-timeline");
    const count = await lists.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const name = await lists.nth(index).getAttribute("aria-label");
      expect(name?.length ?? 0).toBeGreaterThan(0);
    }
  });

  test("the relative time is hidden from the accessibility tree", async ({ page }) => {
    // Spoken aloud it doubles the length of every item and adds nothing the
    // absolute date has not said — but it is never the only time on the row.
    const timeline = await openTimeline(page);
    const ago = timeline.locator(".zb-care-timeline__ago").first();
    await expect(ago).toHaveAttribute("aria-hidden", "true");
    await expect(timeline.locator("time").first()).toBeVisible();
  });
});

test.describe("@a11y forced colours", () => {
  test.use({ colorScheme: "light", contextOptions: { forcedColors: "active" } });

  test("keeps the state words when the palette is taken away", async ({ page }) => {
    const timeline = await openTimeline(page);
    // Nothing here is carried by colour, so nothing is lost. The chips are the
    // proof: a dashed node without the word "Planned" beside it would be a
    // signal only some readers receive.
    await expect(timeline).toContainText(/Showing/);
    const chips = timeline.locator(".zb-care-timeline__chip");
    if ((await chips.count()) > 0) {
      await expect(chips.first()).toBeVisible();
      expect((await chips.first().innerText()).trim().length).toBeGreaterThan(0);
    }
  });
});

test.describe("@a11y register layout", () => {
  test("is two columns above the breakpoint and one below", async ({ page }) => {
    // The split is a media query, so jsdom can assert the markup and only a
    // browser can assert the layout. Both matter: two columns rendered on top
    // of each other is the bug this breakpoint exists to prevent.
    await selectScenario(page, /Clinical on one side/);
    const columns = page.locator(".zb-care-timeline__columns").first();
    await expect(columns).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    const wide = await columns.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    expect(wide.split(" ").length).toBe(2);

    await page.setViewportSize({ width: 375, height: 812 });
    const narrow = await columns.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    // One column, and the register survives as the kind label on each event.
    expect(narrow.split(" ").length).toBe(1);
  });
});

test.describe("@a11y jump control", () => {
  test("moves focus to the period it jumped to", async ({ page }) => {
    await selectScenario(page, /Clinical on one side/);
    const jump = page.locator("select.zb-care-timeline__jump").first();
    await expect(jump).toBeVisible();

    const values = await jump
      .locator("option")
      .evaluateAll((options) =>
        options.map((option) => (option as HTMLOptionElement).value).filter(Boolean),
      );
    await jump.selectOption(values[values.length - 1] as string);
    // Scrolling without moving focus leaves a keyboard user where they were.
    const focused = await page.evaluate(() => document.activeElement?.className ?? "");
    expect(focused).toContain("zb-care-timeline__group");
  });
});

test.describe("@reflow care timeline", () => {
  test("does not scroll in two dimensions at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    const timeline = await openTimeline(page);

    const overflows = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth - root.clientWidth;
    });
    // WCAG 1.4.10's floor. The rail is a grid column precisely so this holds.
    expect(overflows).toBeLessThanOrEqual(1);
    await expect(timeline.locator(".zb-care-timeline__coverage").first()).toBeVisible();
  });

  test("keeps the coverage sentence at 200% zoom", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 512 });
    const timeline = await openTimeline(page);
    await expect(timeline.locator(".zb-care-timeline__coverage").first()).toBeVisible();
  });
});

test.describe("@a11y print", () => {
  test("prints the claim, which is where it matters most", async ({ page }) => {
    // Print is where "See all" stops existing. A stylesheet that hides the
    // footer to fit the page turns a printed chronology into an unattributed
    // list, which is the artefact a medico-legal review is built from.
    const timeline = await openTimeline(page);
    await page.emulateMedia({ media: "print" });
    const coverage = timeline.locator(".zb-care-timeline__coverage").first();
    await expect(coverage).toBeVisible();
    const display = await coverage.evaluate((el) => getComputedStyle(el).display);
    expect(display).not.toBe("none");
  });
});
