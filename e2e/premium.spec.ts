/**
 * The Premium page: the theming console (was `/pro`) and the design packs
 * (was `/marketplace`), merged on 16 Sep 2026.
 *
 * It does not sell anything — Premium is out of the first release. It says
 * what the products are, shows them working, and states plainly that they are
 * not available yet. The packs half is covered in `docs-site.spec.ts`.
 *
 * ## What this file used to test
 *
 * Three designs ago it was an animated stage with a four-step pipeline. Then a
 * grid of ten equal panels. Then a scroll tour with a pinned console. None of
 * them exist now, and each took its own tests with it. What survives
 * is the set of rules that are about the *page* rather than about a design:
 *
 *   1. The chrome takes every colour from a site token, never a literal.
 *   2. Both ways off the page lead somewhere.
 *   3. The release state is stated in words, not only in styling.
 *   4. Nothing scrolls sideways at 320px.
 *   5. No WCAG 2.2 AA violations.
 *   6. The motion is opt-out, and opting out costs nothing.
 *
 * ## One rule was deliberately reversed
 *
 * The `h1` used to be the words "Coming soon", on the argument that the
 * release state is the only fact a visitor does not already hold. That was
 * right for a page of prose. The heading now says what the product *is*, and
 * the status sits above it in a chip. The test
 * below asserts both halves so the trade stays deliberate rather than drifting
 * back by accident.
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

/**
 * Settle every reveal on the page, not only the console's.
 *
 * Clicking the picker can scroll, and the design-pack headings below then
 * start their scroll-reveal fade; axe caught one at half opacity. Infinite
 * animations never resolve, and a cancelled one rejects, so both are handled.
 */
async function settle(page: Page) {
  await page.evaluate(async () => {
    const running = document
      .getAnimations()
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
      .map((a) => a.finished.catch(() => undefined));
    await Promise.all(running);
  });
}

test.describe("the Premium page @a11y", () => {
  /**
   * The status is the heading, and the eyebrow names the product.
   *
   * This is a rule the page has reversed once and reversed back. On a page
   * about something nobody can have yet, the release state is the only fact a
   * visitor does not already hold, so it takes the largest type. A version of
   * this page put the product description in the `h1` with the status in a
   * chip above it; Rahul asked for that to be undone. The test asserts both
   * halves so the next person to make the trade has to make it on purpose.
   */
  test("the release status is the page's heading", async ({ page }) => {
    await page.goto("/premium");

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(/coming soon/i);
    await expect(page.locator("main h1")).toHaveCount(1);

    // And the product is named directly above it, not left to the tab title.
    await expect(page.locator("main .eyebrow").first()).toContainText(/zoblocks premium/i);
  });

  test("says what is held and what is not, in text", async ({ page }) => {
    await page.goto("/premium");
    const main = page.locator("main");
    await expect(main).toContainText(/not in this release/i);
    await expect(main).toContainText(/available now/i);
  });

  test("the bento names every capability it shows", async ({ page }) => {
    await page.goto("/premium");

    const tiles = page.locator(".pbentoTile");
    await expect(tiles).toHaveCount(6);

    /*
     * Every tile is a titled section, which is what makes the page an outline
     * rather than six boxes that happen to be different sizes. The unequal
     * sizing is the design and cannot be asserted; the headings can.
     */
    for (const tile of await tiles.all()) {
      await expect(tile.getByRole("heading")).toBeVisible();
    }
  });

  /**
   * The console computes its own numbers.
   *
   * The page claims the ratios come from the module the server runs. This
   * checks the claim the only way that means anything: each ratio on screen
   * has to agree with the WCAG formula applied to the two colours that row is
   * actually painting. A console drawing plausible numbers beside unrelated
   * swatches would pass a snapshot and fail this.
   */
  test("the gate's numbers are the gate's numbers", async ({ page }) => {
    await page.goto("/premium");
    const measured = await page.evaluate(() => {
      // Written out rather than imported, so the test is not checking the
      // implementation against itself.
      const luminance = (hex: string) => {
        const channel = (i: number) => {
          const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
      };
      const toHex = (rgb: string) => {
        const [r, g, b] = rgb.match(/\d+/g)!.map(Number);
        return `#${[r, g, b].map((n) => n!.toString(16).padStart(2, "0")).join("")}`;
      };

      return [...document.querySelectorAll(".pbentoChecks > li")].map((row) => {
        const pair = row.querySelector<HTMLElement>(".pbentoPair")!;
        const ground = luminance(toHex(getComputedStyle(pair).backgroundColor));
        const ink = luminance(toHex(getComputedStyle(pair.firstElementChild!).backgroundColor));
        const hi = Math.max(ground, ink);
        const lo = Math.min(ground, ink);
        return {
          computed: (hi + 0.05) / (lo + 0.05),
          shown: Number(row.querySelector(".pbentoRatio")!.textContent),
          ok: row.hasAttribute("data-ok"),
        };
      });
    });

    expect(measured).toHaveLength(3);
    for (const row of measured) {
      expect(row.shown, `shown ${row.shown} vs computed ${row.computed}`).toBeCloseTo(
        row.computed,
        1,
      );
      expect(row.ok).toBe(row.shown >= 4.5);
    }
  });

  /**
   * A failing theme cannot publish, and cannot repaint anything either.
   *
   * `Seafoam` is a soft teal, the kind of colour a customer picks and assumes
   * is safe; it fails two of the three pairs. Nothing about that was arranged
   * — it comes out of the real generator — so this also fails honestly if the
   * generator ever changes enough to let it through, which is worth being told
   * about.
   */
  test("a blocked draft takes no version and repaints nothing", async ({ page }) => {
    await page.goto("/premium");
    const picker = page.locator(".pbentoPicker");

    await picker.getByRole("button", { name: /^Seafoam/ }).click();

    // The gate says so, and says how many.
    await expect(page.locator(".pbentoVerdict")).toContainText(/refused/i);
    await expect(page.locator(".pbentoChecks > li[data-ok]")).toHaveCount(1);

    /*
     * And the application is still wearing the last theme that got through,
     * which is the consequence worth showing: a draft that fails the gate does
     * not repaint anything.
     */
    await expect(page.locator(".pbentoTile--app .pbentoSay")).toContainText(/is blocked/i);
    await expect(page.locator(".pbentoTile--app .pbentoSay")).toContainText(/still wearing/i);

    // A passing one publishes, at the immutable path.
    await picker.getByRole("button", { name: /^Slate/ }).click();
    await expect(page.locator(".pbentoTile--app .pbentoSay")).toContainText(/wearing slate/i);
    await expect(page.locator(".pbentoVersions li[data-current] code")).toHaveText(
      /^\/t\/[a-z-]+\/[a-z-]+@\d+\.css$/,
    );
  });

  /**
   * The preview follows the page's theme, until somebody chooses for it.
   *
   * It defaulted to light whatever the page was doing, which put a blazing
   * white application in the middle of a dark page — the one element on screen
   * not answering to the theme, on a page about theming.
   *
   * The second half matters as much as the first: `Mode` is a real control, so
   * once it is used the preview must stop following. A preview that snaps back
   * to the page's theme the moment somebody looks away is worse than one that
   * never followed at all.
   */
  test("the preview takes the page's theme, then takes yours", async ({ page }) => {
    await page.goto("/premium");
    const modes = page.getByRole("group", { name: "Mode" });

    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await expect(modes.getByRole("button", { name: "Dark" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await expect(modes.getByRole("button", { name: "Light" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Choosing takes over, and the page's theme stops mattering.
    await modes.getByRole("button", { name: "Dark" }).click();
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await expect(modes.getByRole("button", { name: "Dark" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  /**
   * The chrome takes every colour from a site token.
   *
   * A literal is invisible to the theme system. This page has carried two
   * designs that learned it the hard way — a dark stage whose colours were
   * hex, and hero buttons that kept the panel's near-white text after the
   * panel behind them became paper. It is not: a literal
   * is invisible to the theme system, and the version of this page that made
   * that mistake left the high-contrast reader — who asked for maximum
   * contrast in the toggle — as the only one who did not get it.
   */
  test("the page follows the theme rather than a literal", async ({ page }) => {
    await page.goto("/premium");

    const read = () =>
      page.evaluate(() => {
        /*
         * Colours are compared through a probe rather than as strings. The
         * same colour comes back as `#000`, `#000000` or `rgb(0, 0, 0)`
         * depending on the engine and on whether the stylesheet was minified.
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
          head: rgb(getComputedStyle(document.querySelector("main h1")!).color),
          tileName: rgb(getComputedStyle(document.querySelector(".pbentoName")!).color),
          paper: rgb(root.getPropertyValue("--site-paper")),
          tileGround: rgb(getComputedStyle(document.querySelector(".pbentoTile")!).backgroundColor),
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

    for (const [name, t] of [
      ["light", light],
      ["dark", dark],
      ["high contrast", hc],
    ] as const) {
      expect(t.head, `${name}: the headline ignored --site-ink`).toBe(t.ink);
      expect(t.tileName, `${name}: a tile heading ignored --site-ink`).toBe(t.ink);
      expect(t.tileGround, `${name}: a tile ignored --site-paper`).toBe(t.paper);
    }

    // And the three are genuinely different, so none of this passed by chance.
    expect(new Set([light.head, dark.head, hc.head]).size).toBe(3);
    expect(light.tileGround).not.toBe(dark.tileGround);
  });

  /**
   * The notify button asks for an address, and cannot swallow one.
   *
   * It was a `mailto:`, which works and asks a lot — a compose window when all
   * somebody wanted was to leave an address, and nothing at all on a machine
   * with no mail client. It is a dialog now, posting to `/api/notify`.
   *
   * The rule the route and the dialog exist to keep is that no path accepts an
   * address and drops it. With no `NOTIFY_WEBHOOK_URL` configured — which is
   * the state this suite runs in — the route answers `501` and the dialog
   * hands the visitor to their mail client with the address filled in. That
   * hand-off is asserted here, because "the form did nothing" and "the form
   * quietly ate it" look identical from outside.
   */
  test("the notify dialog opens, validates, and never swallows an address", async ({ page }) => {
    await page.goto("/premium");

    await page.getByRole("button", { name: /notify me at launch/i }).click();
    const dialog = page.getByRole("dialog", { name: /notify me when premium launches/i });
    await expect(dialog).toBeVisible();

    // Focus lands on the field, so a keyboard reader can type immediately.
    await expect(dialog.getByLabel("Email")).toBeFocused();

    // The server refuses what cannot be an address, and the dialog says so
    // rather than pretending. `novalidate` is set so the browser's own bubble
    // does not intercept before the request goes.
    await dialog.getByLabel("Email").fill("nope@nope");
    await dialog.evaluate((el) => el.querySelector("form")?.setAttribute("novalidate", ""));
    await dialog.getByRole("button", { name: "Notify me" }).click();
    await expect(dialog.getByRole("status")).toContainText(/does not look like an email/i);

    /*
     * A real address with nothing configured behind it: the dialog must say it
     * is handing over rather than claiming success. Navigation is blocked so
     * the `mailto:` does not take the test with it.
     */
    await page.route("mailto:**", (route) => route.abort());
    await dialog.getByLabel("Email").fill("someone@example.org");
    await dialog.getByRole("button", { name: "Notify me" }).click();
    await expect(dialog.getByRole("status")).toContainText(/mail app/i);

    // Escape closes it and returns focus to the button that opened it.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: /notify me at launch/i })).toBeFocused();
  });

  /**
   * The endpoint itself, at the boundary rather than through the UI.
   *
   * `501` is a distinct status on purpose — it is what tells the dialog to
   * fall back — so it is worth pinning separately from a generic failure.
   */
  test("the notify endpoint refuses rather than pretends", async ({ request }) => {
    const bad = await request.post("/api/notify", { data: { email: "nope" } });
    expect(bad.status()).toBe(400);

    const malformed = await request.post("/api/notify", {
      headers: { "content-type": "application/json" },
      data: "not json",
    });
    expect(malformed.status()).toBe(400);

    // No webhook configured in this environment, so it must say so.
    const good = await request.post("/api/notify", { data: { email: "someone@example.org" } });
    expect(good.status()).toBe(501);
    expect(await good.json()).toMatchObject({ ok: false, reason: "not-configured" });
  });

  test("every way off the page leads somewhere", async ({ page }) => {
    await page.goto("/premium");
    const main = page.locator("main");

    /*
     * The notify action is a button now, not a `mailto:` link — it opens a
     * dialog. Its own behaviour is covered above; what this suite cares about
     * is that the page still offers it.
     */
    await expect(main.getByRole("button", { name: /notify me at launch/i })).toBeVisible();

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

  test("does not scroll sideways at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto("/premium");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

  /**
   * Audited in both of the console's states, and settled first.
   *
   * Both states because the blocked one is the only place `--site-critical`
   * appears on this page, and a failing contrast token would be a poor thing
   * to ship on a page about a contrast gate. Settled because the panels reveal
   * over about half a second, and axe reads computed colour as it goes — a run
   * that starts immediately reports mid-fade text as failing.
   */
  for (const [state, brand] of [
    ["publishing", "Slate"],
    ["blocked", "Seafoam"],
  ] as const) {
    test(`has no WCAG 2.2 AA violations, ${state}`, async ({ page }) => {
      await page.goto("/premium");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      await page
        .locator(".pbentoPicker")
        .getByRole("button", { name: new RegExp(`^${brand}`) })
        .click();
      await settle(page);

      const failures = (await audit(page)).map(
        (v) =>
          `${v.id} (${v.impact ?? "unknown"}) — ${v.help}\n    ${v.nodes[0]?.target.join(" ")}`,
      );
      expect(failures, `\n${failures.join("\n")}\n`).toEqual([]);
    });
  }
});

/* ==================================================================== */
/* The tour, with motion turned off                                 */
/* ==================================================================== */

/**
 * Opting out of motion has to cost nothing, and this is where that is proved.
 *
 * Its own describe, outside the `@a11y` block: every test there runs under
 * projects that do *not* emulate the preference, so a `@motion` tag inside it
 * would match both greps and then assert stillness on a page that is correctly
 * moving. `reducedMotion` is set on the project rather than in the test, so
 * the preference is in place before first paint.
 */
test.describe("the Premium console under reduced motion @motion", () => {
  test("nothing runs, and nothing is lost", async ({ page }) => {
    await page.goto("/premium");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const running = await page.evaluate(() =>
      [...document.querySelectorAll(".pro, .pro *")].flatMap((node) =>
        [null, "::before", "::after"]
          .map((pseudo) => getComputedStyle(node, pseudo).animationName)
          .filter((name) => name !== "none")
          .map((name) => `${node.className || node.tagName} ${name}`),
      ),
    );
    expect(running, `still animating: ${running.join(", ")}`).toEqual([]);

    /*
     * Nothing here plays by itself, so with motion off the page is simply the
     * finished page. That is the whole bargain: the reader gives up the
     * reveal and loses none of what the reveal was showing.
     */
    await expect(page.locator(".pbentoStop")).toHaveCount(11);

    for (const row of await page.locator(".pbentoChecks > li").all()) {
      await expect(row).toBeVisible();
      await expect(row.locator(".pbentoRatio")).toHaveText(/^\d+\.\d\d$/);
    }
    await expect(page.locator(".pbentoVerdict")).not.toBeEmpty();
  });
});
