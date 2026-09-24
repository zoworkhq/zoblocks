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

import { expect, test, type Locator, type Page } from "@playwright/test";

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
    for (const url of [CATALOG, TABS, "/", "/showcase", "/premium"]) {
      await page.goto(url);
      await expect(page.locator(".scroll-rail")).toHaveCount(0);
    }
  });

  test("the section bar is tabs: one panel at a time, and the page does not move", async ({
    page,
  }) => {
    /*
     * This used to assert scroll-spy on a row of anchors. The row is a tablist
     * now — the anchors jumped the page under the reader — so what it owes is
     * the opposite: choosing a tab swaps the panel in place and scrolls
     * nothing. Every panel is still in the document, hidden, which is what
     * keeps the page indexable and the audit complete.
     */
    await page.goto(TABS);
    await settle(page);

    const bar = page.locator("nav[aria-label='On this page']");
    await expect(bar).toBeVisible();
    /*
     * Hydrated before clicking. The click below is a raw mouse event at a
     * point, and one that lands on server-rendered markup is simply lost.
     */
    await page
      .locator("nav[aria-label='On this page'][data-hydrated]")
      .waitFor({ state: "attached" });
    const tabs = bar.getByRole("tab");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await expect(tabs.first()).toHaveText("Preview");

    /*
     * Scroll into the page first, so a jump would be measurable — but not so
     * far that a shorter panel could not hold the position. Preview on this
     * page is taller than several viewports; switching to a short panel
     * shrinks the document and the browser clamps scrollY to the new maximum,
     * which is not a scroll and must not read as one.
     */
    await page.evaluate(() => window.scrollTo(0, 300));

    /*
     * Let the header finish shrinking, with scroll anchoring off.
     *
     * Scrolling past 12px sets `data-scrolled` on the site header a frame
     * later, and it transitions from 64px to 52px over 500ms. Waiting for that
     * keeps the tab still under the pointer below.
     *
     * Anchoring is off because the engines compensate for that 12px at
     * different times: Chromium follows the header down frame by frame, and
     * WebKit held it back and applied it at the next large reflow — the panel
     * swap — so the tab was charged with a 300 → 288 it did not cause. With
     * anchoring off the browser adjusts nothing on its own, and any scroll the
     * page itself makes (a hash jump, `scrollIntoView`, the router) still
     * shows.
     */
    await page.evaluate(() => {
      document.documentElement.style.overflowAnchor = "none";
    });
    const header = page.locator("[data-site-header]");
    await expect(header).toHaveAttribute("data-scrolled");
    await header.evaluate((element) =>
      Promise.all(element.getAnimations().map((animation) => animation.finished)),
    );

    /*
     * A mouse click at the tab's coordinates, not `locator.click()`.
     *
     * `click()` scrolls its target into view first, and for a sticky bar the
     * engines disagree about where that is — Chromium to 0 (the bar's static
     * position is on screen from the top), WebKit to 202, Gecko to 296 —
     * while a real click on a visible tab moves nothing. That scroll happened
     * between the baseline and the click, so the harness's own positioning
     * was reported as the page jumping. Traced under a parallel run: `scrollY`
     * was already 0 when the click event arrived, and nothing on the page had
     * called a scroll API. The tab is on screen here, so the pointer can go
     * straight to it.
     */
    const usage = bar.getByRole("tab", { name: "Usage & props" });
    const box = (await usage.boundingBox())!;
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(usage).toHaveAttribute("aria-selected", "true");

    /*
     * Within a few pixels, not exact. Swapping a panel several viewports tall
     * for a short one reflows the document, and the engines settle scrollY on
     * different sub-pixel values afterwards — measured at 0.9px, 2px, and once
     * 5px in WebKit under a full parallel run. The defect this rules out is the
     * old one: an anchor jump to the section, which is hundreds of pixels.
     */
    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before), `scrolled from ${before} to ${after}`).toBeLessThan(8);
    expect(await page.evaluate(() => window.location.hash)).toBe("#usage");

    /*
     * Only the bar's own panels. The Tabs page demonstrates the Tabs
     * component, so the document holds a dozen other tabpanels that belong to
     * the demos; the ones this bar controls are named by its tabs.
     */
    const visible = await page.evaluate(() => {
      const owned = [
        ...document.querySelectorAll<HTMLElement>("nav[aria-label='On this page'] [role='tab']"),
      ].map((tab) => tab.getAttribute("aria-controls"));
      return owned.filter((id) => id && !document.getElementById(id)?.hidden);
    });
    expect(visible).toEqual(["usage"]);
  });

  test("a section link still opens its tab", async ({ page }) => {
    // An old `#usage` link — from a README, a chat, a bookmark — must keep
    // landing on Usage, not on a hidden panel.
    await page.goto(`${TABS}#usage`);
    await settle(page);
    const bar = page.locator("nav[aria-label='On this page']");
    await expect(bar.getByRole("tab", { name: "Usage & props" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await page.evaluate(() => document.getElementById("usage")?.hidden)).toBe(false);
  });

  /*
   * A tab that controls nothing is the tabs version of a link into a 404:
   * a section that was renamed or removed leaves a control in the bar that
   * shows an empty page. Checked across several components rather than one,
   * because the bar is built conditionally from what each one documents.
   */
  test("every tab controls a panel that exists", async ({ page }) => {
    for (const name of ["tabs", "switch", "accordion", "pulse-loader", "data-grid"]) {
      await page.goto(`/components/${name}`);

      const missing = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("nav[aria-label='On this page'] [role='tab']")]
          .map((tab) => tab.getAttribute("aria-controls") ?? "")
          .filter((id) => !id || !document.getElementById(id)),
      );

      expect(missing, `${name} has tabs controlling nothing`).toEqual([]);
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

    const cards = page.locator("[data-zb-component-card]");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(12);

    for (let i = 0; i < count; i += 1) {
      const card = cards.nth(i);
      const name = (await card.getAttribute("data-zb-component-card"))!;
      await expect(
        card.locator(".component-preview-frame"),
        `${name} has no preview frame — it fell back to the state chips`,
      ).toHaveCount(1);
    }
  });

  test("no card's art overflows the frame it sits in", async ({ page }) => {
    await page.goto(CATALOG);
    await settle(page);

    const overflowing = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("[data-zb-component-card]")]
        .map((card) => {
          const frame = card.querySelector<HTMLElement>(".component-preview-frame");
          const art = frame?.firstElementChild as HTMLElement | undefined;
          if (!frame || !art) return null;
          return {
            name: card.getAttribute("data-zb-component-card")!,
            over: Math.round(art.scrollWidth - frame.clientWidth),
          };
        })
        .filter((entry): entry is { name: string; over: number } => !!entry && entry.over > 2),
    );

    expect(overflowing).toEqual([]);
  });

  /*
   * The vertical half of the check above, which is the half that broke.
   *
   * `ScaledArt` paints through a transform, and a transform reserves the
   * untransformed box: a preview drawn at 0.74 still booked 100% of its height.
   * The grid was `auto-rows-fr`, which sizes every row to the tallest row — so
   * the single densest preview set the height of all sixteen cards, and the
   * catalog rendered as a column of near-empty frames roughly twice as tall as
   * the components in them.
   *
   * Both halves are asserted, because either alone passes while the bug is
   * live: the reserved box is the right width, and every card is the same
   * height as every other. What is wrong is the size of the gap between the art
   * and the frame around it.
   */
  test("no card reserves more height than its art paints", async ({ page }) => {
    await page.goto(CATALOG);
    await settle(page);

    const slack = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("[data-zb-component-card]")]
        .map((card) => {
          const frame = card.querySelector<HTMLElement>(".component-preview-frame");
          const band = frame?.firstElementChild as HTMLElement | undefined;
          if (!frame || !band) return null;

          // What the art actually paints, including anything a descendant puts
          // outside its own border box.
          let top = Infinity;
          let bottom = -Infinity;
          for (const node of band.querySelectorAll("*")) {
            const box = node.getBoundingClientRect();
            if (!box.height || !box.width) continue;
            top = Math.min(top, box.top);
            bottom = Math.max(bottom, box.bottom);
          }
          if (bottom < top) return null;

          const reserved = band.getBoundingClientRect();
          return {
            name: card.getAttribute("data-zb-component-card")!,
            // Positive: the band holds more height than the art needs.
            unused: Math.round(reserved.height - (bottom - top)),
            // Positive: the art paints outside the band it was given.
            //
            // Unrounded, deliberately. `Math.round` here made the assertion
            // depend on which side of 0.5 a float happened to land: Care
            // Timeline overhangs its band by the same ~0.65px in every engine,
            // and Gecko measured the top gap at exactly 0.5 (rounds to 1, and
            // failed) where Blink measured 0.4952 (rounds to 0, and passed).
            // The check was real but only enforced in one browser by accident.
            spill: Math.max(reserved.top - top, bottom - reserved.bottom),
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    );

    expect(slack.length).toBeGreaterThanOrEqual(12);

    // The band is deliberately taller than the smallest loaders — a rhythm
    // strip is 35px and would read as a hairline centred in a 330px cell. What
    // it must never be is a multiple of the art, which is what the reserved-box
    // bug produced.
    expect(
      slack.filter((entry) => entry.unused > 160),
      "a card is reserving more than a band of empty height above and below its art",
    ).toEqual([]);

    /*
     * A whole CSS pixel, not a hair over zero.
     *
     * The bug this guards against reserved *hundreds* of pixels; the residue
     * left after the fix is sub-pixel, and it is not removable by tightening
     * the number — `ScaledArt` paints through `transform: scale()`, so a
     * fractional height is what scaling produces. Stating the tolerance out
     * loud is the honest version of a threshold that was already 0.5px in
     * Blink and 0.4999px in Gecko without saying so.
     */
    expect(
      slack.filter((entry) => entry.spill >= 1).map((entry) => entry.name),
      "a card's art paints a full pixel outside the band, so the frame clips it",
    ).toEqual([]);
  });

  /*
   * `auto-rows-fr` sizes every row to the tallest row in the whole grid, so one
   * dense preview is enough to inflate a catalog that is otherwise uniform. The
   * rows are meant to differ — a featured cell is taller — but by their own
   * content, not by the worst case anywhere on the page.
   */
  test("a row is not sized by a card in some other row", async ({ page }) => {
    await page.goto(CATALOG);
    await settle(page);

    const rows = await page.evaluate(() => {
      // Derived from a card rather than by class: `main div.grid` is the hero's
      // two-column header, which is also a grid and also matches.
      const card = document.querySelector<HTMLElement>("[data-zb-component-card]");
      const grid = card?.parentElement;
      if (!grid || getComputedStyle(grid).display !== "grid") return null;
      return getComputedStyle(grid)
        .gridTemplateRows.split(" ")
        .map((value) => Math.round(parseFloat(value)))
        .filter((value) => Number.isFinite(value) && value > 0);
    });

    expect(rows, "the catalog grid was not found").not.toBeNull();
    expect(rows!.length).toBeGreaterThan(2);

    // Every row identical is the signature of `auto-rows-fr`: a grid whose
    // cards carry different amounts of prose cannot honestly produce it.
    expect(
      new Set(rows!).size,
      `every row is ${rows![0]}px — the rows are being equalised`,
    ).toBeGreaterThan(1);
  });

  /*
   * The loaders animate themselves, so a frozen composite next to them reads as
   * a broken cell rather than a still. These are driven on a timer, which is
   * the only motion available: the card is a link and its art is `inert`.
   */
  test("the driven previews actually change", async ({ page }) => {
    await page.goto(CATALOG);
    await settle(page);

    const tabsCard = page.locator("[data-zb-component-card='tabs']");
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
    const gallery = page.locator(".zb-gallery");
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
    const strip = page.locator("#v08 .zb-tabs__list").first();
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
      [...document.querySelectorAll(".zb-gallery__grid .zb-demo")]
        .map((demo) => {
          const list = demo.querySelector(".zb-tabs__list");
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
      .locator(".zb-gallery__chapters")
      .getByRole("radio", { name: "Overflow" })
      .click({ force: true });
    await settle(page);

    const scroll = page.locator("#o1");
    await expect(scroll.locator(".zb-tabs__bar")).toHaveAttribute("data-zb-end", "false");

    const over = await scroll
      .locator(".zb-tabs__list")
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
    //
    // The attribute is the product's own `data-zb-theme`, not a docs-only
    // stand-in. The galleries used to carry `data-zb-demo-theme` with three
    // hand-written palettes behind it, which themed the stage and nothing
    // inside it: component tokens are substituted where they are declared, so
    // every field and popover kept the root's light values. Setting the real
    // attribute means the demos are themed by the shipped mechanism, and a
    // token that stops following a theme breaks here rather than quietly.
    await expect(page.locator(".zb-gallery__stage")).toHaveAttribute("data-zb-theme", "dark");
  });
});

/* ==================================================================== */
/* Chrome                                                               */
/* ==================================================================== */

/* ==================================================================== */
/* No way into the app                                              */
/* ==================================================================== */

test.describe("the app doors @a11y", () => {
  /**
   * There are no doors, and that is the assertion.
   *
   * Sign in and Request access were the header's only cross-origin links and
   * its only filled control. They came out on 10 Sep 2026 because the app is
   * not in this release. This test is what stops them returning by accident —
   * a stray import of `signInHref` into chrome would otherwise reinstate them
   * silently, and nothing else on the site would notice.
   *
   * Scoped to the whole page rather than the header: the footer carried the
   * same pair in an "App" column, and both went together.
   */
  for (const label of ["Sign in", "Request access"] as const) {
    test(`the site offers no ${label} link`, async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("link", { name: label, exact: true })).toHaveCount(0);
    });
  }

  /**
   * The header still fits a phone.
   *
   * Written when the two doors were added — the bar was at exactly its width
   * beforehand, 375px of content in a 375px viewport, and two more controls
   * pushed the sign-up button off the edge and wrapped the wordmark onto a
   * second line. Removing them gives that room back, so this now has slack
   * rather than none. It stays because a page-level overflow check never
   * caught the original break, and the next control added here will have the
   * same problem.
   */
  test("the header is not clipped on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    /*
     * The site header, not any header.
     *
     * `page.locator("header")` became ambiguous the moment a card rendered
     * ChartHeader as its art — that component *is* a `<header role="banner">`,
     * and a strict locator is right to refuse rather than pick one.
     */
    const siteHeader = page.locator("[data-site-header]");
    const overflow = await siteHeader.evaluate((el) => ({
      content: el.scrollWidth,
      box: Math.round(el.getBoundingClientRect().width),
    }));
    expect(overflow.content, "header content is wider than the header").toBeLessThanOrEqual(
      overflow.box,
    );
  });

  /**
   * What the room was bought with, and the proof it cost nothing.
   *
   * Fitting both doors on a phone meant standing the theme picker down from the
   * header below `sm`, and it carries the high-contrast theme — an
   * accessibility control, not a preference. So it moves to the footer rather
   * than disappearing, and exactly one instance is ever rendered: two would put
   * two radiogroups called "Color theme" in front of a screen reader.
   */
  for (const width of [375, 1280]) {
    test(`the theme picker is reachable, exactly once, at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");

      const pickers = page.getByRole("radiogroup", { name: "Color theme" });
      await expect(pickers).toHaveCount(1);
      await expect(pickers.first()).toBeVisible();
    });
  }
});

test.describe("site chrome @a11y", () => {
  /**
   * The command menu gives focus back, and gives it back to the right place.
   *
   * Both halves have failed. The dialog restored `document.activeElement` as
   * captured on open — and Safari follows the macOS convention of not focusing
   * a `<button>` when you click it, so that was `<body>`, and `body.focus()`
   * is a no-op. Focus ended up nowhere: dismiss the dialog and a keyboard
   * reader is at the top of the document with no idea where they were. Only
   * WebKit shows it, which is why it survived until a cross-engine run.
   *
   * The second case is why the fix is not simply "focus the trigger". This
   * dialog opens from anywhere with a keyboard shortcut, so somebody who
   * opened it from a link three screens down must be returned to that link and
   * not to the search box in the header.
   */
  test("the command menu returns focus where it came from", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /^Search/ });
    const dialog = page.getByRole("dialog", { name: /search components and pages/i });

    // Opened by clicking the trigger: focus comes back to the trigger.
    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    /*
     * Opened by shortcut from somewhere else: focus comes back *there*.
     * `Meta+k` on this runner's platform and `Control+k` elsewhere — the
     * component listens for both.
     */
    const link = page.getByRole("link", { name: "Components", exact: true }).first();
    await link.focus();
    await page.keyboard.press(process.platform === "darwin" ? "Meta+k" : "Control+k");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(link).toBeFocused();
  });

  /**
   * Both tab icons are declared and both are served.
   *
   * This asserted a single icon link and read `.first()`, which was true when
   * it was written and stopped being true on 2 Sep 2026 — `6b3d245` added a
   * real `favicon.ico` so browsers that will not take an SVG get something,
   * and Next emits it ahead of the SVG in the head. The test then read the
   * `.ico` and asserted it was SVG. The page was right and the test was
   * measuring the wrong one of two correct things.
   *
   * So it now checks each for what that format is *for*: the SVG for its own
   * ground, the `.ico` for existing at all.
   */
  test("both tab icons are declared and served", async ({ page, request }) => {
    await page.goto(CATALOG);

    const svg = page.locator("link[rel~='icon'][type='image/svg+xml']");
    const ico = page.locator("link[rel~='icon'][type='image/x-icon']");
    await expect(svg).toHaveCount(1);
    await expect(ico).toHaveCount(1);

    const svgResponse = await request.get(
      new URL((await svg.getAttribute("href"))!, page.url()).toString(),
    );
    expect(svgResponse.status()).toBe(200);
    expect(svgResponse.headers()["content-type"]).toContain("image/svg+xml");

    // It carries its own ground: a transparent mark in ink disappears against a
    // dark browser chrome, which is where a large share of readers see it.
    expect(await svgResponse.text()).toContain("<rect");

    /*
     * The fallback has to exist, which is the whole reason it was added — a
     * declared icon that 404s is worse than no icon, because the browser stops
     * looking rather than falling through to the next declaration.
     */
    const icoResponse = await request.get(
      new URL((await ico.getAttribute("href"))!, page.url()).toString(),
    );
    expect(icoResponse.status()).toBe(200);
    expect(icoResponse.headers()["content-type"]).toMatch(/icon|image/);
  });

  test("the composite previews follow the page theme in both directions", async ({ page }) => {
    // globals.css states the rule outright — "live component previews should
    // never look dark on a light page" — and an earlier fix pinned the
    // disclosure family to dark, which put pale cyan on near-white.
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      /*
       * Accordion, not Safety Plan. Safety Plan is installable but has no
       * page — the route refuses it by the readiness list — so this was
       * asserting against a 404. Accordion is the documented member of the
       * same disclosure family, and the fix this guards was made to that
       * family's shared preview.
       */
      await page.goto("/components/accordion");
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

  /*
   * The command palette's field draws no focus ring, and the rest of the site
   * still does.
   *
   * Reported as "the green highlight looks odd": the field runs the full width
   * of the dialog, so the global ring's `outline-offset: 3px` put it outside
   * the panel, where `overflow-hidden` cut the top off and left a stray green
   * box. The field already carried `focus-visible:outline-none`, and it did
   * nothing — the global rule is unlayered and Tailwind's utilities are in
   * @layer utilities, so the global rule wins whatever the specificity. That
   * is invisible in the markup, which is why this asserts the painted result
   * rather than the class list.
   *
   * The second half is the guard rail. Suppressing the ring is only safe here
   * because the dialog is modal with a single focusable control; deleting the
   * global rule to get the same effect would strip focus from the whole site,
   * and would otherwise pass.
   */
  test("the palette field has no focus ring, and everything else keeps one", async ({ page }) => {
    await page.goto(CATALOG);

    const ring = (target: Locator) =>
      target.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          focusVisible: element.matches(":focus-visible"),
          outlineStyle: style.outlineStyle,
          boxShadow: style.boxShadow,
        };
      });

    // Keyboard focus, so `:focus-visible` matches the way it does for a reader
    // arriving on the Tab key rather than the pointer.
    await page.keyboard.press("Tab");
    const chrome = await ring(page.locator(":focus"));

    expect(chrome.focusVisible, "the first tab stop is not focus-visible").toBe(true);
    expect(chrome.outlineStyle, "the site lost its focus ring").toBe("solid");
    expect(chrome.boxShadow, "the site lost its focus halo").not.toBe("none");

    await page.getByRole("button", { name: /press Command K/i }).click();

    // Scoped to the palette: the catalog page carries component demos of its
    // own, and two of them are also comboboxes.
    const field = page
      .getByRole("dialog", { name: /search components and pages/i })
      .getByRole("combobox");
    await expect(field).toBeFocused();

    const palette = await ring(field);

    expect(palette.focusVisible, "the field is not focus-visible").toBe(true);
    expect(palette.outlineStyle, "the clipped outline is back").toBe("none");
    expect(palette.boxShadow, "the clipped halo is back").toBe("none");
  });
});

test.describe("the design packs on Premium @a11y", () => {
  /**
   * The catalogue is rendered here and bought in the app.
   *
   * A storefront reachable only after sign-up has no top of funnel: the app
   * has no anonymous traffic and this site does. So the shelf lives here, where
   * it can be linked to and indexed, and the app keeps the parts that need
   * to know who you are.
   *
   * These used to be tolerant of an empty catalogue, because the data came
   * from a separate service over HTTP and that service has never been
   * deployed. It still wins when it answers — but the page now has a floor, so
   * "there might be nothing here" is no longer a state worth allowing: an
   * empty shelf means the fallback broke too.
   */
  test("is reachable from the site chrome", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation").first().getByRole("link", { name: "Premium" }).click();

    await expect(page).toHaveURL(/\/premium$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  /*
   * Marketplace and Pro merged into Premium on 16 Sep 2026. Both old
   * addresses are indexed, so they move permanently, and the header offers
   * neither any more.
   */
  test("sends the old Marketplace and Pro addresses to Premium", async ({ page, request }) => {
    for (const [from, to] of [
      ["/pro", "/premium"],
      ["/marketplace", "/premium#design-packs"],
    ] as const) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status(), from).toBe(308);
      const location = new URL(response.headers()["location"] ?? "", "http://localhost");
      expect(location.pathname + location.hash, from).toBe(to);
    }

    await page.goto("/");
    const header = page.getByRole("navigation").first();
    await expect(header.getByRole("link", { name: "Marketplace" })).toHaveCount(0);
    await expect(header.getByRole("link", { name: "Pro", exact: true })).toHaveCount(0);
  });

  test("lists the packs whether or not the console answers", async ({ page }) => {
    await page.goto("/premium");

    const cards = page.locator("[data-zb-pack]");
    // A floor, not a maybe. The console has never been deployed and the shelf
    // still has to work.
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(1);
    // Curated to five on 16 Sep 2026.
    expect(await cards.count()).toBeLessThanOrEqual(5);

    const first = cards.first();
    // No card links anywhere while nothing can be bought — the detail page
    // says nothing the card does not, and the shelf must not send a reader
    // through a door with nothing behind it.
    await expect(first.getByRole("link")).toHaveCount(0);
    // The pack is named and described. That is the card.
    await expect(first.getByRole("heading")).toBeVisible();
  });

  /**
   * The shop being shut is said once, by the section, and nowhere else.
   *
   * Every card used to carry it four times over: a `Not built yet` chip, a
   * price, a file count and a disabled `Coming soon` button. Rahul asked for
   * all four to go on 10 Sep 2026, and the risk with a change like that is a
   * later edit quietly putting one back — a price is the obvious candidate,
   * because it is the field a shop is expected to have.
   *
   * The section heading is asserted too, so this cannot pass by the page
   * having stopped saying it at all.
   */
  test("says the shop is shut once, not on every card", async ({ page }) => {
    await page.goto("/premium");

    await expect(page.getByText(/Purchasing opens with the ZoBlocks console/)).toBeVisible();

    const cards = page.locator("[data-zb-pack]");
    for (const card of await cards.all()) {
      await expect(card).not.toContainText(/\$\d/);
      await expect(card).not.toContainText(/coming soon|not built yet|not for sale/i);
    }
  });

  test("refuses every purchase path, and still says what a built pack contains", async ({
    page,
  }) => {
    await page.goto("/premium");

    /*
     * This asserted "Available now" against "In production" until selling was
     * closed shelf-wide. Nothing is purchasable while `SELLING_OPEN` is false —
     * the console cannot take money — so the ready section renders empty and
     * the shelf is one list that announces rather than sells.
     *
     * The heading was "Announced" until the `h1` became "Coming soon", at
     * which point the page carried two words for one status. Both are asserted
     * now: the status belongs to the heading of the page, and the list below
     * it is named for what it holds.
     */
    await expect(page.getByRole("heading", { level: 1, name: "Coming soon" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Design packs" })).toBeVisible();

    const cards = page.locator("[data-zb-pack]");
    expect(await cards.count()).toBeGreaterThan(1);
    await expect(cards.getByRole("link", { name: /Buy in the app/ })).toHaveCount(0);

    /*
     * A shut shop is not a claim about what a pack contains.
     *
     * This used to assert the `4 files · v2` line, which went with the price
     * and the disabled control when the card footer came out. The claim it was
     * really making survives in the preview: `comingSoon` and `purchasable`
     * were briefly one field, and while they were, packs with files committed
     * in this repository drew a placeholder motif where their manifest
     * belongs. So this asks the preview, which is the part a reader actually
     * looks at.
     */
    await expect(cards.first().locator("[data-zb-pack-preview]")).toHaveCount(1);
  });

  /*
   * Source-agnostic on purpose.
   *
   * This suite starts the console with a seeded catalogue, so here the console
   * wins and the cards carry what it sends — a count, since it does not send
   * file paths. Against the local fallback the same cards draw artwork, a
   * manifest or a motif. What must hold either way is that every card shows
   * *something* about the pack: which of the four it is belongs to the unit
   * tests, where the source can be chosen.
   */
  test("shows what is in a pack rather than only describing it", async ({ page }) => {
    await page.goto("/premium");

    const cards = page.locator("[data-zb-pack]");
    const total = await cards.count();
    expect(total).toBeGreaterThan(1);

    await expect(page.locator("[data-zb-pack-preview]")).toHaveCount(total);
  });

  test("never publishes a clinical review nobody performed", async ({ page }) => {
    await page.goto("/premium");
    // The seed's reviewer is "SEED DATA — nobody has reviewed this". Neither
    // that nor a plausible substitute may reach a reader.
    await expect(page.getByText(/SEED DATA/i)).toHaveCount(0);
    await expect(
      page.getByText(/No pack has been reviewed by a registered clinician/),
    ).toBeVisible();

    /*
     * The detail page too, which is where this actually escaped.
     *
     * This suite runs against a seeded console, and the index never renders a
     * reviewer — so an index-only assertion passed while the item page printed
     * "Clinically reviewed 2026-08-11 — SEED DATA — nobody has reviewed this"
     * from the console's own provenance. The reviewer is rendered on exactly
     * one page, so that is the page this has to open.
     */
    await page.goto("/marketplace/empty-state-system");
    await expect(page.getByText(/SEED DATA/i)).toHaveCount(0);
    await expect(page.getByText(/Clinically reviewed/)).toHaveCount(0);
    await expect(page.getByText("Clinical review pending").first()).toBeVisible();
  });

  test("an item states what was checked and where it is bought", async ({ page }) => {
    await page.goto("/premium");

    // By address, not by clicking a card: cards do not link while selling
    // is closed. The page is still built and still reachable.
    const slug = await page.locator("[data-zb-pack]").first().getAttribute("data-zb-pack");
    await page.goto(`/marketplace/${slug}`);

    await expect(page.getByRole("heading", { name: "What was checked" })).toBeVisible();
    await expect(page.getByText(/contrast pairs at or above/)).toBeVisible();

    /*
     * The review is stated either way.
     *
     * Reviewed, with a name and a registration; or pending, in those words.
     * What must never happen is the row going missing — a safety officer told
     * by omission has been told nothing, and this is the field the whole page
     * is built on.
     */
    await expect(page.getByText(/Clinically reviewed|Clinical review pending/)).toBeVisible();

    // The limitations survive whichever it is: a pack is not a medical device
    // regardless of who looked at it.
    await expect(page.getByText("Not a medical device or clinical decision support")).toBeVisible();

    /*
     * Buying leaves for the app, because a purchase belongs to an
     * organisation and this site does not know about organisations.
     */
    /*
     * While `SELLING_OPEN` is false there is no buy link at all — the control
     * is a disabled "Coming soon" and the price line says what the figure is.
     * When selling opens, this becomes the `/market/` href check it used to be.
     */
    await expect(page.getByRole("link", { name: /Buy in the app/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Coming soon" })).toBeDisabled();
    await expect(page.getByText(/not yet on sale|not built yet/)).toBeVisible();

    // And the licence is stated before anybody spends anything.
    await expect(page.getByRole("heading", { name: "Licence" })).toBeVisible();
  });
});
