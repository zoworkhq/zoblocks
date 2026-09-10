/**
 * `/pro` at every width, in both themes.
 *
 * The page is a bento whose tiles are sized unequally and whose largest one
 * holds a preview of an application. That is a layout with a lot of ways to go
 * wrong off the two or three widths a person actually looks at, and it has
 * gone wrong on several of them during its three redesigns — a truncating URL,
 * a wrapping button label, a control stretched across a whole cell.
 *
 * So this sweeps eight widths from a 320px phone to a 2560px ultrawide, in
 * light and dark, and asserts the three things that catch nearly all of it:
 * nothing wider than the viewport, no tile collapsed, no text clipped out of
 * its own box. It runs in about twenty seconds because it asserts geometry
 * rather than pixels — there are no snapshots here to go stale.
 *
 * The WCAG audit runs on a subset. Four corners is enough to catch a token
 * used on the wrong ground, which is the failure that actually recurs, and
 * axe at sixteen combinations would make this too slow to run often.
 */

import { expect, test, type Page } from "@playwright/test";
import { source as AXE_SOURCE } from "axe-core";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

interface AxeResult {
  violations: { id: string; impact?: string; help: string; nodes: { target: string[] }[] }[];
}

async function audit(page: Page) {
  await page.evaluate(AXE_SOURCE);
  const result = (await page.evaluate(
    (tags) =>
      (window as unknown as { axe: { run: (o: unknown) => Promise<AxeResult> } }).axe.run({
        runOnly: { type: "tag", values: tags },
      }),
    TAGS,
  )) as AxeResult;
  return result.violations;
}

const SIZES = [
  { name: "320 phone", width: 320, height: 700 },
  { name: "390 phone", width: 390, height: 844 },
  { name: "768 tablet", width: 768, height: 1024 },
  { name: "1024 laptop", width: 1024, height: 768 },
  { name: "1280 desktop", width: 1280, height: 800 },
  { name: "1440 desktop", width: 1440, height: 900 },
  { name: "1920 wide", width: 1920, height: 1080 },
  { name: "2560 ultrawide", width: 2560, height: 1440 },
];

for (const theme of ["light", "dark"] as const) {
  for (const size of SIZES) {
    test(`${theme} · ${size.name} @a11y`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto("/pro");
      await page.evaluate((t) => {
        document.documentElement.classList.toggle("dark", t === "dark");
      }, theme);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      // Nothing scrolls sideways, at any width.
      const overflow = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
        wide: [...document.querySelectorAll<HTMLElement>(".pro *")]
          .filter((el) => el.scrollWidth > document.documentElement.clientWidth + 1)
          .map((el) => el.className.toString().slice(0, 60))
          .slice(0, 5),
      }));
      expect(overflow.wide, `wider than the viewport: ${overflow.wide.join(", ")}`).toEqual([]);
      expect(overflow.doc).toBeLessThanOrEqual(overflow.client);

      // Every tile is present and has painted something.
      await expect(page.locator(".pbentoTile")).toHaveCount(6);
      for (const tile of await page.locator(".pbentoTile").all()) {
        const box = await tile.boundingBox();
        expect(box!.height, "a tile collapsed").toBeGreaterThan(60);
      }

      // No text clipped out of its own box.
      /*
       * Text wider than its own box, unless it was asked to be.
       *
       * `overflow` is tested with `includes` rather than `===`: Firefox
       * returns the two-value form (`"hidden hidden"`) and Chromium the
       * one-value form, so an equality test passes in one engine and reports
       * every deliberately ellipsised URL in the other. `text-overflow` is
       * tested too — a truncated stylesheet path in the delivery tile is a
       * design decision, not a defect.
       */
      const clipped = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>(".pro h1, .pro h3, .pro dt, .pro p, .pro code")]
          .filter((el) => {
            const style = getComputedStyle(el);
            /*
             * Inline boxes are skipped: `scrollWidth` and `clientWidth` are
             * defined on them differently across engines, and Firefox reports
             * every one of the ellipsised paths in the delivery tile as
             * overflowing while Chromium reports none. A block box measures
             * the same everywhere, and the text this is guarding is all in
             * block boxes anyway.
             */
            if (style.display === "inline") return false;
            if (el.scrollWidth <= el.clientWidth + 2) return false;
            // Asked to be clipped is not the same as clipped.
            if (style.overflow.includes("hidden") || style.overflowX.includes("hidden")) {
              return false;
            }
            return style.textOverflow !== "ellipsis";
          })
          .map((el) => `${el.tagName}.${el.className.toString().slice(0, 30)}`)
          .slice(0, 5),
      );
      expect(clipped, `clipped: ${clipped.join(", ")}`).toEqual([]);

      // The four corners get the full audit.
      if (size.width === 320 || size.width === 1440) {
        await page.locator(".pbentoGrid").evaluate(async (el) => {
          /*
           * Finite animations only, and a cancelled one is not a failure.
           *
           * Toggling the theme class cancels whatever is mid-reveal, and a
           * cancelled animation rejects `finished` with an `AbortError` — so
           * awaiting them bare turns a theme switch into a test failure. An
           * infinite one never resolves at all.
           */
          const settling = el
            .getAnimations({ subtree: true })
            .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => undefined));
          await Promise.all(settling);
        });
        const failures = (await audit(page)).map(
          (v) =>
            `${v.id} (${v.impact ?? "unknown"}) — ${v.help}\n    ${v.nodes[0]?.target.join(" ")}`,
        );
        expect(failures, `\n${failures.join("\n")}\n`).toEqual([]);
      }
    });
  }
}
