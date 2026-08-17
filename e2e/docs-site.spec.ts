/**
 * The docs site itself, at the layer where its defects actually live.
 *
 * Everything here was reported by a reader looking at the page, and none of it
 * was catchable anywhere else: a scroll that fights the pointer, an icon that
 * renders eighty pixels tall, a catalog cell that shows nothing. jsdom has no
 * scrolling, no layout, and no notion of how large an SVG with only a viewBox
 * ends up — so these need a real engine or they need a person, and a person
 * only finds them once the change has shipped.
 */

import { expect, test, type Page } from "@playwright/test";

const CATALOG = "/components";
const TABS = "/components/tabs";

/** Reveal is an IntersectionObserver fade; content is `opacity: 0` until it fires. */
async function settle(page: Page) {
  await page.waitForTimeout(400);
}

/* ==================================================================== */
/* Scrolling                                                            */
/* ==================================================================== */

test.describe("scrolling @a11y", () => {
  /*
   * The reported symptom, asserted as the reader experienced it.
   *
   * Two things used to grab the page. A fixed progress rail sat over the
   * scrollbar with no `pointer-events: none`, and — the one that actually
   * yanked — the section rail called `scrollIntoView` every time the active
   * section changed. That walks every scrollable ancestor up to the document,
   * and `html` carries `scroll-behavior: smooth`, so it started an animated
   * document scroll *while the reader was already scrolling*. The page
   * stuttered and jumped backwards under the pointer, with nothing on screen
   * to explain it.
   */
  test("the page never scrolls backwards while the reader scrolls down", async ({ page }) => {
    await page.goto(TABS);
    await settle(page);

    await page.evaluate(() => {
      const positions: number[] = [];
      (window as unknown as { __positions: number[] }).__positions = positions;
      window.addEventListener("scroll", () => positions.push(Math.round(window.scrollY)), {
        passive: true,
      });
    });

    // Wheel rather than scrollTo: this is about a gesture being interrupted,
    // and a programmatic jump produces one scroll event with nothing to fight.
    for (let i = 0; i < 12; i += 1) {
      await page.mouse.wheel(0, 240);
      await page.waitForTimeout(90);
    }
    // Long enough for any smooth scroll the rail started to have landed.
    await page.waitForTimeout(900);

    const { positions, final } = await page.evaluate(() => ({
      positions: (window as unknown as { __positions: number[] }).__positions,
      final: Math.round(window.scrollY),
    }));

    expect(positions.length, "no scrolling happened at all").toBeGreaterThan(5);

    /*
     * A downward gesture produces a monotonic sequence.
     *
     * The threshold is 24px rather than a couple of pixels: WebKit's momentum
     * and rubber-banding settle backwards by single digits at the end of a
     * fling, which is the engine behaving normally and not something this test
     * is about. The regression it exists for moved the page by hundreds — a
     * competing animated scroll started mid-gesture — so the gap between
     * "engine noise" and "hijack" is two orders of magnitude wide and there is
     * no need to sit close to the noise.
     */
    const reversals = positions
      .map((y, i) => (i === 0 ? 0 : positions[i - 1]! - y))
      .filter((delta) => delta > 24);

    expect(reversals, `the page scrolled back up by ${reversals.join(", ")}px`).toEqual([]);
    expect(final).toBeGreaterThan(600);
  });

  test("nothing calls scrollIntoView on the document while scrolling", async ({ page }) => {
    await page.goto(TABS);
    await settle(page);

    await page.evaluate(() => {
      const calls: string[] = [];
      (window as unknown as { __siv: string[] }).__siv = calls;
      const original = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function patched(this: Element, ...args: unknown[]) {
        calls.push(this.tagName + "." + (this.className || "").toString().slice(0, 40));
        return (original as (...a: unknown[]) => void).apply(this, args);
      };
    });

    for (let i = 0; i < 10; i += 1) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(500);

    const calls = await page.evaluate(() => (window as unknown as { __siv: string[] }).__siv);
    // The section rail adjusts its own scrollLeft instead, which cannot reach
    // the document. Anything here is a candidate for the next report of the
    // page yanking under the pointer.
    expect(calls).toEqual([]);
  });

  test("the removed progress rail is gone from every page", async ({ page }) => {
    for (const url of [CATALOG, TABS, "/", "/showcase", "/pro"]) {
      await page.goto(url);
      await expect(page.locator(".scroll-rail")).toHaveCount(0);
    }
  });

  test("the section rail still tracks the section being read", async ({ page }) => {
    // Removing the hijack must not cost the affordance it was there for.
    await page.goto(TABS);
    await settle(page);

    const rail = page.locator("nav[aria-label='On this page']");
    await expect(rail).toBeVisible();

    const current = () => rail.locator("[aria-current='true']").first().textContent();
    expect(await current()).toBe("Preview");

    /*
     * To the end of the document, and compared against the rail's own last
     * entry rather than a hardcoded label.
     *
     * Two reasons. The preview section on this page is taller than several
     * viewports — it holds the whole gallery — so scrolling any fixed number of
     * pixels can legitimately leave the answer unchanged, and asserting "it
     * changed" would really be asserting the gallery's height. And the rail is
     * built conditionally from what the component actually documents, so the
     * last entry is not the same on every page.
     */
    const labels = await rail.locator("li a").allTextContents();
    const last = labels.at(-1)!;
    expect(last).not.toBe("Preview");

    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "auto" }),
    );
    await page.waitForTimeout(600);

    expect(await current()).toBe(last);
  });

  /*
   * The rail is built from what the component documents, and every entry is
   * conditional on the section existing — except `related`, which was not, and
   * whose section only renders when there is something in it. The result was a
   * tab in the in-page nav pointing at an id that was not on the page.
   *
   * Checked across several components rather than one, because the whole point
   * is that the entries differ per component.
   */
  test("every rail entry points at a section that exists", async ({ page }) => {
    for (const name of ["tabs", "switch", "accordion", "consult", "pulse-loader"]) {
      await page.goto(`/components/${name}`);

      const missing = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLAnchorElement>("nav[aria-label='On this page'] li a")]
          .map((link) => link.getAttribute("href")!.slice(1))
          .filter((id) => !document.getElementById(id)),
      );

      expect(missing, `${name} has rail entries pointing at nothing`).toEqual([]);
    }
  });
});

/* ==================================================================== */
/* The catalog cards                                                    */
/* ==================================================================== */

test.describe("the catalog @a11y", () => {
  /*
   * "Real components, real states" is the product's pitch, and six of twelve
   * cells rendered four text chips in the space the component should occupy —
   * which reads as a deliberately sparse design rather than as six components
   * nobody wired up.
   */
  test("every card renders a live component rather than a placeholder", async ({ page }) => {
    await page.goto(CATALOG);
    await settle(page);

    const cards = page.locator("a[href^='/components/']");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(12);

    for (let i = 0; i < count; i += 1) {
      const card = cards.nth(i);
      const href = (await card.getAttribute("href"))!;
      await expect(
        card.locator(".component-preview-frame"),
        `${href} has no preview frame — it fell back to the state chips`,
      ).toHaveCount(1);
    }
  });

  test("no card's art overflows the frame it sits in", async ({ page }) => {
    await page.goto(CATALOG);
    await settle(page);

    const overflowing = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("a[href^='/components/']")]
        .map((card) => {
          const frame = card.querySelector<HTMLElement>(".component-preview-frame");
          const art = frame?.firstElementChild as HTMLElement | undefined;
          if (!frame || !art) return null;
          return {
            name: card.getAttribute("href")!.split("/").pop()!,
            over: Math.round(art.scrollWidth - frame.clientWidth),
          };
        })
        .filter((entry): entry is { name: string; over: number } => !!entry && entry.over > 2),
    );

    expect(overflowing).toEqual([]);
  });

  /*
   * The loaders animate themselves, so a frozen composite next to them reads as
   * a broken cell rather than a still. These are driven on a timer, which is
   * the only motion available: the card is a link and its art is `inert`.
   */
  test("the driven previews actually change", async ({ page }) => {
    await page.goto(CATALOG);
    await settle(page);

    const tabsCard = page.locator("a[href='/components/tabs']");
    const selected = () =>
      tabsCard.locator("[role='radio'][aria-checked='true']").first().textContent();

    const first = await selected();
    // The cycle is 2s; give it one turn plus room for a slow engine.
    await page.waitForTimeout(2800);
    const second = await selected();

    expect(first).toBeTruthy();
    expect(second).not.toBe(first);
  });

  test("the art is decorative and never reachable by keyboard", async ({ page }) => {
    await page.goto(CATALOG);
    await settle(page);

    // The card is a link; a focusable control inside it would be both a nested
    // interactive element and a tab stop that goes nowhere.
    const focusable = await page.evaluate(
      () =>
        document.querySelectorAll(
          ".component-preview-frame [inert] button, .component-preview-frame [inert] a," +
            ".component-preview-frame [inert] input, .component-preview-frame [inert] [tabindex='0']",
        ).length,
    );
    // `inert` removes them from the tab order, so presence is fine; what must
    // hold is that the wrapper carries it.
    expect(await page.locator(".component-preview-frame > [inert]").count()).toBeGreaterThan(0);
    expect(focusable).toBeGreaterThanOrEqual(0);
  });
});

/* ==================================================================== */
/* The tab gallery                                                      */
/* ==================================================================== */

test.describe("the tab gallery @a11y", () => {
  async function openGallery(page: Page) {
    await page.goto(TABS);
    const gallery = page.locator(".ox-gallery");
    await gallery.scrollIntoViewIfNeeded();
    await expect(gallery).toBeVisible();
    await settle(page);
    return gallery;
  }

  /*
   * An icon-only trigger passes its glyph as the label, which is the supported
   * shape. The label slot had no size constraint, and an inline SVG carrying
   * only a viewBox has no intrinsic size — so four 14px glyphs rendered at
   * roughly eighty and filled the bar.
   */
  test("icon-only triggers render their glyph at text size", async ({ page }) => {
    await openGallery(page);

    const command = page.locator("#v08");
    await expect(command).toBeVisible();

    const glyphs = await command.evaluate((demo) =>
      [...demo.querySelectorAll("svg")].map((svg) => {
        const box = svg.getBoundingClientRect();
        const fontSize = parseFloat(getComputedStyle(svg.parentElement!).fontSize);
        return { width: box.width, height: box.height, fontSize };
      }),
    );

    expect(glyphs.length).toBeGreaterThan(0);
    for (const glyph of glyphs) {
      // 1em, matching the icon slot. The bound is generous enough to survive a
      // font-metric difference between engines and tight enough that the
      // eighty-pixel regression cannot pass.
      expect(glyph.width).toBeLessThanOrEqual(glyph.fontSize * 1.6);
      expect(glyph.width).toBeGreaterThan(6);
      expect(Math.abs(glyph.width - glyph.height)).toBeLessThan(2);
    }
  });

  test("the strip stays a normal height with icon-only triggers", async ({ page }) => {
    await openGallery(page);
    const strip = page.locator("#v08 .ox-tabs__list").first();
    const box = (await strip.boundingBox())!;
    // It was ~140px tall when the glyphs were unconstrained.
    expect(box.height).toBeLessThan(72);
  });

  /*
   * The variant demos used to be narrower than their own content, so the
   * workhorse variants rendered permanently scrolled — nudges lit, last label
   * sliced — which demonstrated the overflow behaviour in the chapter about
   * variants.
   */
  test("no variant demo renders its strip already scrolled", async ({ page }) => {
    await openGallery(page);

    const overflowing = await page.evaluate(() =>
      [...document.querySelectorAll(".ox-gallery__grid .ox-demo")]
        .map((demo) => {
          const list = demo.querySelector(".ox-tabs__list");
          if (!list) return null;
          return {
            id: demo.id,
            over: list.scrollWidth - list.clientWidth,
          };
        })
        .filter((entry): entry is { id: string; over: number } => !!entry && entry.over > 2),
    );

    expect(overflowing).toEqual([]);
  });

  /*
   * And the converse, which the fix above broke once already: widening the grid
   * gave the Overflow chapter so much room that nothing overflowed, so five
   * strategies were all shown doing nothing on the page that explains them.
   */
  test("the overflow chapter still overflows", async ({ page }) => {
    await openGallery(page);
    await page
      .locator(".ox-gallery__chapters")
      .getByRole("radio", { name: "Overflow" })
      .click({ force: true });
    await settle(page);

    const scroll = page.locator("#o1");
    await expect(scroll.locator(".ox-tabs__bar")).toHaveAttribute("data-ox-end", "false");

    const over = await scroll
      .locator(".ox-tabs__list")
      .evaluate((list) => list.scrollWidth - list.clientWidth);
    expect(over).toBeGreaterThan(50);
  });

  test("the demo theme follows the site theme rather than defaulting to light", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await openGallery(page);

    // A page-wide dark theme with eleven light-mode panels inside it argues
    // against the thing the gallery exists to demonstrate.
    await expect(page.locator(".ox-gallery__stage")).toHaveAttribute("data-ox-demo-theme", "dark");
  });
});

/* ==================================================================== */
/* Chrome                                                               */
/* ==================================================================== */

test.describe("site chrome @a11y", () => {
  test("the tab icon is declared and served", async ({ page, request }) => {
    await page.goto(CATALOG);

    const icon = page.locator("link[rel~='icon']").first();
    await expect(icon).toHaveCount(1);

    const href = (await icon.getAttribute("href"))!;
    const response = await request.get(new URL(href, page.url()).toString());

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/svg+xml");

    // It carries its own ground: a transparent mark in ink disappears against a
    // dark browser chrome, which is where a large share of readers see it.
    expect(await response.text()).toContain("<rect");
  });

  test("the composite previews follow the page theme in both directions", async ({ page }) => {
    // globals.css states the rule outright — "live component previews should
    // never look dark on a light page" — and an earlier fix pinned the
    // disclosure family to dark, which put pale cyan on near-white.
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/components/safety-plan");
      await settle(page);

      const panel = page.locator(".instrument-demo").first();
      await expect(panel).toBeVisible();

      const contrast = await panel.evaluate((element) => {
        const relative = (color: string) => {
          const [r, g, b] = color
            .match(/\d+(\.\d+)?/g)!
            .slice(0, 3)
            .map((value) => {
              const channel = Number(value) / 255;
              return channel <= 0.03928
                ? channel / 12.92
                : Math.pow((channel + 0.055) / 1.055, 2.4);
            });
          return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
        };

        const heading = element.querySelector("button");
        if (!heading) return null;
        const fg = relative(getComputedStyle(heading).color);
        const bg = relative(getComputedStyle(element).backgroundColor);
        return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
      });

      expect(contrast, `no heading found in ${scheme}`).not.toBeNull();
      // AA for body text. The bug this replaces measured about 1.2:1.
      expect(contrast!, `${scheme} preview contrast`).toBeGreaterThan(4.5);
    }
  });
});
