/**
 * The Pro holding page.
 *
 * Pro is out of the first release, so `/pro` does not sell the console. It
 * states the release status, says in one sentence what the product is, and
 * lists six of the console's capabilities.
 *
 * ## What this file used to test, and why it does not any more
 *
 * The page it replaced made its point with an animated stage and the console's
 * four-step pipeline, `Publish` held open on a dashed rail. Six of the eleven
 * tests here checked that gate — that it read three-done-one-open, that the
 * state was carried by shape rather than colour, that the dashed segment was
 * the last one, and that the letter-by-letter headline still copied as one
 * word. None of that exists now, so none of those tests do either.
 *
 * Five rules survived the redesign, because they are about the page rather
 * than about that design:
 *
 *   1. Every colour comes from a site token, never a literal.
 *   2. Both ways off the page lead somewhere.
 *   3. The status is stated in words, not only in styling.
 *   4. Nothing scrolls sideways at 320px.
 *   5. No WCAG 2.2 AA violations.
 *
 * The spec for the console page itself is in this file's history; it comes
 * back with `console-page.tsx`.
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

test.describe("the Pro holding page @a11y", () => {
  /**
   * The status is the `h1`, which is deliberate and easy to lose.
   *
   * A later edit that promotes "Theme management for ZoBlocks" to the heading
   * would read better as marketing and would remove the only fact on the page
   * a visitor does not already have. If that trade is ever made it should be
   * made on purpose, which is what this test forces.
   */
  test("the release status is the page's heading", async ({ page }) => {
    await page.goto("/pro");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(/coming soon/i);
    await expect(page.locator("main h1")).toHaveCount(1);
  });

  /**
   * Status in words, not only in styling.
   *
   * The old page carried its state in the shape of a marker. This one carries
   * it in a sentence, which has to survive a stylesheet failing to load — so
   * the assertion is on text content rather than on anything computed.
   */
  test("says what is held and what is not, in text", async ({ page }) => {
    await page.goto("/pro");
    const main = page.locator("main");
    await expect(main).toContainText(/not in the current release/i);
    await expect(main).toContainText(/available now/i);
  });

  /** Six capabilities, each a term with its own definition. */
  test("lists the console's capabilities as described terms", async ({ page }) => {
    await page.goto("/pro");
    const cells = page.locator(".pro .proCell");
    await expect(cells).toHaveCount(6);

    // Every cell is a dt/dd pair. A grid of bare divs would announce twelve
    // unrelated fragments instead of six named things.
    const pairs = await page.evaluate(() =>
      [...document.querySelectorAll(".pro .proCell")].map((cell) => ({
        term: cell.querySelector("dt")?.textContent?.trim() ?? "",
        detail: (cell.querySelector("dd")?.textContent ?? "").trim().length,
      })),
    );
    expect(pairs.every((p) => p.term.length > 0 && p.detail > 30)).toBe(true);
    expect(pairs.map((p) => p.term)).toContain("Contrast validation");
  });

  /**
   * Every colour comes from a site token.
   *
   * The stage this replaced wrote its colours as literals because it was dark
   * under both themes, and that cost twice: a light reader got a dark slab
   * wedged between a light header and a light footer, and the high-contrast
   * reader, who had asked for maximum contrast in the toggle, was the only one
   * who did not get it. A literal is invisible to every theme; this sees it.
   */
  test("the page follows the theme rather than a literal", async ({ page }) => {
    await page.goto("/pro");

    const read = () =>
      page.evaluate(() => {
        /*
         * Colours are compared through a probe rather than as strings. The
         * same colour comes back as `#000`, `#000000` or `rgb(0, 0, 0)`
         * depending on the engine and on whether the stylesheet was minified;
         * letting the browser resolve both sides removes all three from the
         * comparison.
         */
        const probe = document.createElement("span");
        probe.style.display = "none";
        document.body.append(probe);
        const rgb = (value: string) => {
          probe.style.color = "";
          probe.style.color = value.trim();
          return getComputedStyle(probe).color;
        };
        const root = getComputedStyle(document.documentElement);
        const out = {
          ink: rgb(root.getPropertyValue("--site-ink")),
          head: rgb(getComputedStyle(document.querySelector(".pro .proHead")!).color),
          ground: rgb(root.getPropertyValue("--site-paper")),
          cellGround: rgb(
            getComputedStyle(document.querySelector(".pro .proCell")!).backgroundColor,
          ),
        };
        probe.remove();
        return out;
      });

    const setTheme = (t: "light" | "dark" | "high-contrast") =>
      page.evaluate((theme) => {
        const e = document.documentElement;
        e.classList.toggle("dark", theme === "dark");
        if (theme === "high-contrast") e.setAttribute("data-zb-theme", "high-contrast");
        else e.removeAttribute("data-zb-theme");
      }, t);

    await setTheme("light");
    const light = await read();
    await setTheme("dark");
    const dark = await read();
    await setTheme("high-contrast");
    const hc = await read();

    // The headline takes the theme's own ink in every one of the three.
    for (const [name, t] of [
      ["light", light],
      ["dark", dark],
      ["high contrast", hc],
    ] as const) {
      expect(t.head, `${name}: the headline ignored --site-ink`).toBe(t.ink);
      expect(t.cellGround, `${name}: a capability cell ignored --site-paper`).toBe(t.ground);
    }

    // And the three are genuinely different, so none of this passed by accident.
    expect(new Set([light.head, dark.head, hc.head]).size).toBe(3);
    expect(light.ground).not.toBe(dark.ground);
  });

  test("every way off the page leads somewhere", async ({ page }) => {
    await page.goto("/pro");
    const main = page.locator("main");

    const notify = main.getByRole("link", { name: /notify me when it ships/i });
    await expect(notify).toHaveAttribute("href", /^mailto:[^@]+@[^@]+\./);

    // Two routes to the catalogue: one in the hero, one closing the page.
    const toComponents = main.getByRole("link", { name: /view components|browse components/i });
    await expect(toComponents).toHaveCount(2);
    for (const href of await toComponents.evaluateAll((els) =>
      els.map((e) => e.getAttribute("href")),
    )) {
      expect(href).toBe("/components");
    }

    await toComponents.first().click();
    await expect(page).toHaveURL(/\/components$/);
  });

  /**
   * Nothing on this page moves, which is the point of checking.
   *
   * The stage it replaced was almost entirely animation, and every rule was
   * declared inside `prefers-reduced-motion: no-preference` so that opting out
   * left the composed picture. This page has no animation to opt out of, and a
   * future edit that reintroduces one without that guard should fail here.
   */
  test("nothing animates, with or without a motion preference", async ({ page }) => {
    await page.goto("/pro");
    const running = await page.evaluate(() =>
      [...document.querySelectorAll(".pro, .pro *")].flatMap((n) =>
        [null, "::before", "::after"]
          .map((pseudo) => getComputedStyle(n, pseudo).animationName)
          .filter((name) => name !== "none")
          .map((name) => `${n.className || n.tagName} ${name}`),
      ),
    );
    // The Zowork plate's reply indicator is the one exception, and it is
    // already guarded by its own reduced-motion rule.
    const unguarded = running.filter((r) => !r.includes("zw-ping"));
    expect(unguarded, `unguarded animations: ${unguarded.join(", ")}`).toEqual([]);
  });

  test("does not scroll sideways at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/pro");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflows).toBe(false);
  });

  test("has no WCAG 2.2 AA violations", async ({ page }) => {
    await page.goto("/pro");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const failures = (await audit(page)).map(
      (v) => `${v.id} (${v.impact ?? "unknown"}) — ${v.help}\n    ${v.nodes[0]?.target.join(" ")}`,
    );
    expect(failures, `\n${failures.join("\n")}\n`).toEqual([]);
  });
});
