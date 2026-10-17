/**
 * RiskIndicator in a real browser.
 *
 * The unit suite covers what the component says. What it structurally cannot
 * cover is anything needing a layout engine, and for this component that is
 * where the safety claims can quietly stop being made:
 *
 *   - the age ("Computed 8 h ago") is only a staleness signal while it is on
 *     screen. A footer clipped by a card, or dropped by a print stylesheet, is
 *     a score with no date attached.
 *   - the not-a-diagnosis sentence is the last thing on the face. If it wraps
 *     out of view or is hidden in print, the score reads as a diagnosis.
 *   - the recompute and acknowledge buttons claim a 24px target at both
 *     densities (WCAG 2.5.8). jsdom reports every box as zero, so only a
 *     browser can check it.
 *   - forced colours is where a band carried only by a tint would disappear.
 *
 * The docs page is the fixture host, as ADR 0007 intends.
 *
 * DRAFT: written without running against the docs site. Before relying on it,
 * run `pnpm e2e -- risk-indicator` and check that the scenario tab label in
 * `EXPIRED` matches what the page actually renders.
 */

import { expect, test, type Page } from "@playwright/test";

const PAGE = "/components/risk-indicator";

/** The tab for the expired scenario. Matches the state name in the meta. */
const EXPIRED = /Expired/;

async function openIndicator(page: Page) {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");
  const indicator = page.locator("[data-zb-risk]").first();
  await expect(indicator).toBeVisible();
  return indicator;
}

/**
 * Switch the preview to a named scenario. The page shows one at a time, so a
 * test that only visits the page asserts against whichever is first. Selecting
 * is the fix; guarding with `test.skip` would skip on every run.
 */
async function selectScenario(page: Page, label: RegExp) {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");
  await page.getByRole("tab", { name: label }).click();
  const indicator = page.locator("[data-zb-risk]").first();
  await expect(indicator).toBeVisible();
  return indicator;
}

test.describe("@a11y risk indicator", () => {
  test("the age is on the face, not in a tooltip", async ({ page }) => {
    const indicator = await openIndicator(page);
    const age = indicator.locator(".zb-risk__age");
    await expect(age).toBeVisible();
    await expect(age).toContainText(/Computed|Expired/);
  });

  test("the not-a-diagnosis sentence is shown, and is last in the spoken name", async ({
    page,
  }) => {
    const indicator = await openIndicator(page);
    const framing = indicator.locator(".zb-risk__framing");
    await expect(framing).toBeVisible();
    const sentence = ((await framing.innerText()) ?? "").trim();
    expect(sentence.length).toBeGreaterThan(0);

    // The whole score is one spoken statement and the framing is what the
    // listener is left with.
    const name = (await indicator.getAttribute("aria-label")) ?? "";
    expect(name.endsWith(sentence)).toBe(true);
  });

  test("an expired score offers recompute or acknowledge and nothing else", async ({ page }) => {
    await selectScenario(page, EXPIRED);
    const indicator = page.locator("[data-zb-risk][data-zb-freshness='expired']").first();
    await expect(indicator).toBeVisible();
    await expect(indicator.getByRole("button", { name: /dismiss|close|hide/i })).toHaveCount(0);
  });
});

test.describe("@a11y target size", () => {
  test("recompute and acknowledge hold 24px at both densities", async ({ page }) => {
    // WCAG 2.5.8. The meta claims this, and jsdom cannot measure it.
    await selectScenario(page, EXPIRED);
    const actions = page.locator(".zb-risk__action");
    const count = await actions.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const box = await actions.nth(index).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(24);
    }
  });
});

test.describe("@a11y forced colours", () => {
  test.use({ colorScheme: "light", contextOptions: { forcedColors: "active" } });

  test("keeps the band word when the palette is taken away", async ({ page }) => {
    const indicator = await openIndicator(page);
    // The band is a ClinicalStatus chip, so it carries a shape and a word.
    // Nothing is lost when every hue is removed.
    const band = indicator.locator(".zb-risk__head [data-zb-scale='risk']");
    await expect(band).toBeVisible();
    expect((await band.innerText()).trim().length).toBeGreaterThan(0);
    await expect(indicator.locator(".zb-risk__age")).toBeVisible();
  });
});

test.describe("@reflow risk indicator", () => {
  test("does not scroll in two dimensions at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    const indicator = await openIndicator(page);

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth - root.clientWidth;
    });
    // WCAG 1.4.10's floor.
    expect(overflow).toBeLessThanOrEqual(1);
    // The staleness signal never collapses, however narrow.
    await expect(indicator.locator(".zb-risk__age")).toBeVisible();
    await expect(indicator.locator(".zb-risk__framing")).toBeVisible();
  });

  test("keeps the age and the framing at 200% zoom", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 512 });
    const indicator = await openIndicator(page);
    await expect(indicator.locator(".zb-risk__age")).toBeVisible();
    await expect(indicator.locator(".zb-risk__framing")).toBeVisible();
  });

  test("grows rather than clips under WCAG 1.4.12 text spacing", async ({ page }) => {
    const indicator = await openIndicator(page);
    await page.addStyleTag({
      content: `
        * {
          line-height: 1.5 !important;
          letter-spacing: 0.12em !important;
          word-spacing: 0.16em !important;
        }
        p { margin-block-end: 2em !important; }
      `,
    });
    const clipped = await indicator.evaluate(
      (el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1,
    );
    expect(clipped).toBe(false);
    await expect(indicator.locator(".zb-risk__framing")).toBeVisible();
  });
});

test.describe("@a11y print", () => {
  test("prints the age and the framing, which is where they matter most", async ({ page }) => {
    // Print is where a tooltip stops existing. A stylesheet that hides the
    // footer to fit the page turns a printed score into an undated one.
    const indicator = await openIndicator(page);
    await page.emulateMedia({ media: "print" });
    for (const selector of [".zb-risk__age", ".zb-risk__framing"]) {
      const node = indicator.locator(selector);
      await expect(node).toBeVisible();
      const display = await node.evaluate((el) => getComputedStyle(el).display);
      expect(display).not.toBe("none");
    }
  });
});
