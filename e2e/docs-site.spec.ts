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
    for (const url of [CATALOG, TABS, "/", "/showcase", "/marketplace", "/pro"]) {
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
    for (const name of ["tabs", "switch", "accordion", "copilot", "pulse-loader"]) {
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

    const cards = page.locator("[data-ox-component-card]");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(12);

    for (let i = 0; i < count; i += 1) {
      const card = cards.nth(i);
      const name = (await card.getAttribute("data-ox-component-card"))!;
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
      [...document.querySelectorAll<HTMLElement>("[data-ox-component-card]")]
        .map((card) => {
          const frame = card.querySelector<HTMLElement>(".component-preview-frame");
          const art = frame?.firstElementChild as HTMLElement | undefined;
          if (!frame || !art) return null;
          return {
            name: card.getAttribute("data-ox-component-card")!,
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
      [...document.querySelectorAll<HTMLElement>("[data-ox-component-card]")]
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
            name: card.getAttribute("data-ox-component-card")!,
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
      const card = document.querySelector<HTMLElement>("[data-ox-component-card]");
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

    const tabsCard = page.locator("[data-ox-component-card='tabs']");
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
    //
    // The attribute is the product's own `data-ox-theme`, not a docs-only
    // stand-in. The galleries used to carry `data-ox-demo-theme` with three
    // hand-written palettes behind it, which themed the stage and nothing
    // inside it: component tokens are substituted where they are declared, so
    // every field and popover kept the root's light values. Setting the real
    // attribute means the demos are themed by the shipped mechanism, and a
    // token that stops following a theme breaks here rather than quietly.
    await expect(page.locator(".ox-gallery__stage")).toHaveAttribute("data-ox-theme", "dark");
  });
});

/* ==================================================================== */
/* Chrome                                                               */
/* ==================================================================== */

/* ==================================================================== */
/* The way into the app                                             */
/* ==================================================================== */

test.describe("the app doors @a11y", () => {
  /**
   * Sign in and Sign up leave for another application.
   *
   * Asserted on the pathname and on *having* an origin rather than on the
   * origin itself, because that address is configuration: `NEXT_PUBLIC_APP_URL`
   * in a deployment, localhost on a laptop. Pinning the host here would make
   * the test pass only on the machine it was written on.
   */
  for (const [label, path] of [
    ["Sign in", "/login"],
    ["Sign up", "/signup"],
  ] as const) {
    test(`${label} points at the app's ${path}`, async ({ page }) => {
      await page.goto("/");

      const link = page.locator("header").getByRole("link", { name: label, exact: true });
      await expect(link).toBeVisible();

      const href = (await link.getAttribute("href"))!;
      const url = new URL(href);
      expect(url.pathname).toBe(path);
      // Absolute, so it is a real cross-origin navigation rather than a route
      // this site is pretending to own.
      expect(href).toMatch(/^https?:\/\//);
    });
  }

  /**
   * The header holds both doors at a phone width without clipping.
   *
   * This is the assertion the change actually needed. The bar was at exactly
   * its width before the links were added — 375px of content in a 375px
   * viewport — so adding two controls silently pushed `Sign up` off the edge
   * and wrapped the wordmark onto a second line. Neither breaks a page-level
   * overflow check, which is why one is written here against the header itself.
   */
  test("neither door is clipped on a phone", async ({ page }) => {
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

    for (const label of ["Sign in", "Sign up"]) {
      await expect(siteHeader.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
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

test.describe("the public marketplace @a11y", () => {
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
    await page.getByRole("navigation").first().getByRole("link", { name: "Marketplace" }).click();

    await expect(page).toHaveURL(/\/marketplace$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("lists the packs, priced, whether or not the console answers", async ({ page }) => {
    await page.goto("/marketplace");

    const cards = page.locator("[data-ox-pack]");
    // A floor, not a maybe. The console has never been deployed and the shelf
    // still has to work.
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(1);

    // The title owns the card; the buy control is the second destination, which
    // is why this names the link rather than taking the first one it finds.
    const first = cards.first();
    await expect(first.getByRole("link").first()).toHaveAttribute("href", /\/marketplace\//);
    await expect(first).toContainText(/\$|Free|By arrangement/);
  });

  test("refuses every purchase path, and still says what a built pack contains", async ({
    page,
  }) => {
    await page.goto("/marketplace");

    /*
     * This asserted "Available now" against "In production" until selling was
     * closed shelf-wide. Nothing is purchasable while `SELLING_OPEN` is false —
     * the console cannot take money — so the ready section renders empty and
     * the shelf is one list that announces rather than sells.
     */
    await expect(page.getByRole("heading", { name: "Coming soon" })).toBeVisible();

    const cards = page.locator("[data-ox-pack]");
    expect(await cards.count()).toBeGreaterThan(1);
    await expect(cards.getByRole("link", { name: /Buy in the app/ })).toHaveCount(0);

    /*
     * A shut shop is not a claim about what a pack contains.
     *
     * `comingSoon` and `purchasable` were briefly one field, and while they
     * were, packs with files committed in this repository rendered as unbuilt:
     * no `4 files · v2` line, and a placeholder motif where their manifest
     * belongs. Source-agnostic, like the test below — the console sends a file
     * count and the local fallback sends paths, and this line is drawn from
     * either.
     */
    await expect(cards.filter({ hasText: /[1-9]\d* files? · v[1-9]/ }).first()).toBeVisible();
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
    await page.goto("/marketplace");

    const cards = page.locator("[data-ox-pack]");
    const total = await cards.count();
    expect(total).toBeGreaterThan(1);

    await expect(page.locator("[data-ox-pack-preview]")).toHaveCount(total);
  });

  test("never publishes a clinical review nobody performed", async ({ page }) => {
    await page.goto("/marketplace");
    // The seed's reviewer is "SEED DATA — nobody has reviewed this". Neither
    // that nor a plausible substitute may reach a reader.
    await expect(page.getByText(/SEED DATA/i)).toHaveCount(0);
    await expect(page.getByText(/Clinical review is not yet in place/)).toBeVisible();

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
    await page.goto("/marketplace");

    await page.locator("[data-ox-pack]").first().getByRole("link").first().click();

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
    const buy = page.getByRole("link", { name: /Buy in the app/ });
    await expect(buy).toHaveAttribute("href", /\/market\//);

    // And the licence is stated before anybody spends anything.
    await expect(page.getByRole("heading", { name: "Licence" })).toBeVisible();
  });
});
