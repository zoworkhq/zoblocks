/**
 * Tabs in a real browser.
 *
 * The unit suite covers roles, names, keyboard intent and the arithmetic. What
 * it structurally cannot cover is everything that needs a layout engine — and
 * for this component that is most of the interesting part:
 *
 *   - the indicator is measured geometry. jsdom reports every box as zero, so
 *     the unit tests stub the numbers and verify the maths. Only a browser can
 *     say the thumb actually lands on the selected tab.
 *   - the overflow fitter measures text. A font that loads late, a locale that
 *     lengthens a label, a container query — none of it exists without layout.
 *   - `content-visibility`, `color-mix`, concentric radii and forced colours
 *     are CSS features jsdom does not implement at all.
 *
 * The docs gallery is the fixture host, as ADR 0007 intends: it already
 * renders every variant, mode and state, so this reuses it rather than
 * standing up a second harness that could drift from what ships.
 */

import { expect, test, type Locator, type Page } from "@playwright/test";

const PAGE = "/components/tabs";

/** Jump to the gallery and settle the site's scroll-reveal animation. */
async function openGallery(page: Page) {
  await page.goto(PAGE);
  const gallery = page.locator(".ox-gallery");
  await gallery.scrollIntoViewIfNeeded();
  // The reveal is an IntersectionObserver fade; without waiting, a screenshot
  // captures a half-faded panel and every run differs.
  await page.waitForTimeout(400);
  await expect(gallery).toBeVisible();
  return gallery;
}

/**
 * Click something in the gallery, out from under the site header.
 *
 * The docs header is sticky, and Playwright's own `scrollIntoViewIfNeeded`
 * does the *minimum* scroll that puts an element inside the viewport — which
 * leaves anything below the fold parked at the very top, underneath it.
 * Playwright then reports the click landing on the header's search control and
 * retries until it times out. It never reproduced locally because the failure
 * depends on where the element happens to sit, and that moves with font
 * metrics: the same test passed on macOS and failed on CI's Linux runners in
 * two engines.
 *
 * Centring is not enough on its own. Near the end of the document there is no
 * scroll left to give, so `block: "center"` silently leaves the element where
 * it was — which is how this was first "fixed" without being fixed. So the
 * overlap is measured against the header afterwards and corrected directly.
 */
async function clickClear(target: Locator) {
  await target.evaluate((element) => {
    element.scrollIntoView({ block: "center" });

    const header = document.querySelector("header");
    // A little more than the header, so the click lands on the control rather
    // than on the boundary between the two.
    const clearance = (header?.getBoundingClientRect().height ?? 0) + 12;
    const top = element.getBoundingClientRect().top;
    if (top < clearance) window.scrollBy(0, top - clearance);
  });
  await target.click();
}

async function chooseChapter(page: Page, label: string) {
  await clickClear(page.locator(".ox-gallery__chapters").getByRole("radio", { name: label }));
  await page.waitForTimeout(250);

  /*
   * Wait for the strips to have measured themselves.
   *
   * A tab list sets `data-ox-measured` once the indicator geometry is known;
   * before that the fit is still being decided and the whole strip is moving.
   * Interacting during that window is what produced clicks landing on the
   * wrong element on CI — a fixed timeout is a guess at how long a slower,
   * more contended runner needs, and it was the wrong guess.
   */
  const strips = page.locator(".ox-gallery [data-ox-list]");
  const count = await strips.count();
  for (let i = 0; i < count; i++) {
    await strips.nth(i).evaluate((element) => {
      if (element.hasAttribute("hidden")) return;
      return new Promise<void>((resolve) => {
        if (element.hasAttribute("data-ox-measured")) return resolve();
        const observer = new MutationObserver(() => {
          if (element.hasAttribute("data-ox-measured")) {
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(element, { attributes: true, attributeFilter: ["data-ox-measured"] });
        // A strip with no indicator never sets it, and that is not a failure.
        setTimeout(() => {
          observer.disconnect();
          resolve();
        }, 2000);
      });
    });
  }
}

async function setControl(page: Page, group: string, value: string) {
  await clickClear(page.getByRole("group", { name: group }).getByRole("button", { name: value }));
  await page.waitForTimeout(200);
}

/* ==================================================================== */
/* Geometry — the half jsdom cannot reach                               */
/* ==================================================================== */

test.describe("indicator geometry @a11y", () => {
  test("the thumb lands on the selected tab", async ({ page }) => {
    await openGallery(page);
    const demo = page.locator("#v01");
    const thumb = demo.locator(".ox-tabs__thumb");
    const selected = demo.locator('[role="tab"][aria-selected="true"]');

    const before = await thumb.boundingBox();
    const target = await selected.boundingBox();
    expect(before).not.toBeNull();
    expect(target).not.toBeNull();
    // Within a pixel: the whole point of measuring offsets rather than rects.
    expect(Math.abs(before!.x - target!.x)).toBeLessThan(1.5);
    expect(Math.abs(before!.width - target!.width)).toBeLessThan(1.5);
  });

  test("the thumb follows a click", async ({ page }) => {
    await openGallery(page);
    const demo = page.locator("#v01");
    await clickClear(demo.getByRole("tab", { name: "Shared" }));
    // Let the 180ms transition finish before measuring where it settled.
    await page.waitForTimeout(400);

    const thumb = await demo.locator(".ox-tabs__thumb").boundingBox();
    const selected = await demo.locator('[role="tab"][aria-selected="true"]').boundingBox();
    expect(Math.abs(thumb!.x - selected!.x)).toBeLessThan(1.5);
    expect(Math.abs(thumb!.width - selected!.width)).toBeLessThan(1.5);
  });

  test("the underline sits on the rail, not floating above it", async ({ page }) => {
    await openGallery(page);
    const demo = page.locator("#v03");
    const line = await demo.locator(".ox-tabs__line").boundingBox();
    const list = await demo.locator('[role="tablist"]').boundingBox();
    // The indicator's bottom edge should coincide with the list's.
    expect(Math.abs(line!.y + line!.height - (list!.y + list!.height))).toBeLessThan(1.5);
  });

  test("the thumb re-measures when density changes", async ({ page }) => {
    await openGallery(page);
    const demo = page.locator("#v01");
    const before = await demo.locator(".ox-tabs__thumb").boundingBox();

    await setControl(page, "Density", "patient");
    await page.waitForTimeout(400);

    const after = await demo.locator(".ox-tabs__thumb").boundingBox();
    const selected = await demo.locator('[role="tab"][aria-selected="true"]').boundingBox();
    // A density change resizes every trigger. If the indicator did not
    // re-measure it would still be sized for the old one.
    expect(after!.height).not.toBeCloseTo(before!.height, 0);
    expect(Math.abs(after!.width - selected!.width)).toBeLessThan(1.5);
  });

  test("the thumb is placed correctly in RTL", async ({ page }) => {
    await openGallery(page);
    await setControl(page, "Text direction", "rtl");
    await page.waitForTimeout(400);

    const demo = page.locator("#v01");
    const thumb = await demo.locator(".ox-tabs__thumb").boundingBox();
    const selected = await demo.locator('[role="tab"][aria-selected="true"]').boundingBox();
    // Physical offsets in a mirrored layout: the case a logical-property
    // implementation gets exactly backwards.
    expect(Math.abs(thumb!.x - selected!.x)).toBeLessThan(1.5);
  });
});

/* ==================================================================== */
/* Overflow — needs real text measurement                               */
/* ==================================================================== */

test.describe("overflow @a11y", () => {
  test("a narrow container collapses the strip to a native picker", async ({ page }) => {
    await openGallery(page);
    await chooseChapter(page, "Overflow");
    const demo = page.locator("#o3");
    // Driven by the container, not the viewport — the demo is deliberately
    // constrained rather than the window being resized.
    await expect(demo.getByRole("combobox")).toBeVisible();
  });

  test("the scroll strip reports its edges and moves", async ({ page }) => {
    await openGallery(page);
    await chooseChapter(page, "Overflow");
    const bar = page.locator("#o1 .ox-tabs__bar");
    await expect(bar).toHaveAttribute("data-ox-start", "true");

    const list = page.locator("#o1 .ox-tabs__list");
    await list.evaluate((element) => element.scrollBy({ left: 240 }));
    await page.waitForTimeout(300);
    await expect(bar).toHaveAttribute("data-ox-start", "false");
  });

  test("the priority-plus menu keeps the selected tab visible", async ({ page }) => {
    await openGallery(page);
    await chooseChapter(page, "Overflow");
    const demo = page.locator("#o2");

    /*
     * Opened from the keyboard rather than with a pointer, and not only
     * because this is an @a11y test.
     *
     * A click is hit-tested: Playwright scrolls, waits for the box to hold
     * still, then checks what is actually on top at that point. In a
     * priority-plus strip the box moves while the fit is being decided, and on
     * CI's Linux font metrics it kept moving long enough for the click to land
     * on a neighbouring tab label instead — twice, in two engines, having
     * never once done so on macOS.
     *
     * Focus and Enter answer the question the test is asking without depending
     * on where anything currently sits, and they exercise the path that
     * matters more for a menu button: the one a keyboard user takes.
     */
    const more = demo.getByRole("button", { name: /More/ }).first();

    // `isVisible`, not `count`: whether anything overflows at all depends on
    // the width the fonts produce, so a run with nothing hidden is a real
    // outcome rather than a failure.
    if (await more.isVisible()) {
      await expect(more).toHaveAttribute("aria-haspopup", "menu");
      await expect(more).toHaveAttribute("aria-expanded", "false");

      await more.focus();
      await page.keyboard.press("Enter");

      await expect(page.getByRole("menu")).toBeVisible();
      await expect(more).toHaveAttribute("aria-expanded", "true");

      await page.keyboard.press("Escape");
      await expect(page.getByRole("menu")).toBeHidden();
      // Focus comes back to the trigger, or the keyboard user is stranded
      // wherever the menu used to be.
      await expect(more).toBeFocused();
    }

    // Whatever the fit decided, the selected tab is never the one hidden.
    await expect(demo.locator('[role="tab"][aria-selected="true"]')).toBeVisible();
  });
});

/* ==================================================================== */
/* Keyboard, in a real engine                                           */
/* ==================================================================== */

test.describe("keyboard @a11y", () => {
  test("arrow keys move selection and the focus ring is visible", async ({ page }) => {
    await openGallery(page);
    const demo = page.locator("#v01");
    await demo.getByRole("tab", { name: "Personal" }).focus();
    await page.keyboard.press("ArrowRight");

    const shared = demo.getByRole("tab", { name: "Shared" });
    await expect(shared).toHaveAttribute("aria-selected", "true");
    await expect(shared).toBeFocused();

    // A focus ring that renders as `none` is the classic CSS-reset casualty.
    const outline = await shared.evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(outline).not.toBe("none");
  });

  test("Tab enters the strip once and then leaves it", async ({ page }) => {
    await openGallery(page);
    const demo = page.locator("#v01");
    await demo.getByRole("tab", { name: "Personal" }).focus();
    await page.keyboard.press("Tab");
    await expect(demo.getByRole("tab", { name: "Shared" })).not.toBeFocused();
  });
});

/* ==================================================================== */
/* Visual regression                                                    */
/* ==================================================================== */

test.describe("visual @vrt", () => {
  test("the nine-cell theme x density matrix", async ({ page }) => {
    await openGallery(page);
    await chooseChapter(page, "Theme × density");
    const matrix = page.locator(".ox-matrix");
    await expect(matrix).toBeVisible();
    await page.waitForTimeout(400);
    /*
     * The one baseline worth keeping. A token regression that only shows up in
     * clinical-density dark mode — the combination nobody opens by hand — is
     * exactly what this catches, and it catches all nine in one image rather
     * than nine screenshots that drift apart.
     */
    await expect(matrix).toHaveScreenshot("tabs-matrix.png");
  });

  test("every variant, one strip each", async ({ page }) => {
    await openGallery(page);
    await chooseChapter(page, "States");
    const variants = page.locator("#s4 .ox-variants");
    await expect(variants).toBeVisible();
    await page.waitForTimeout(400);
    await expect(variants).toHaveScreenshot("tabs-variants.png");
  });
});

/* ==================================================================== */
/* Reflow — WCAG 1.4.10                                                 */
/* ==================================================================== */

test.describe("reflow @reflow", () => {
  test("the gallery does not scroll horizontally at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await openGallery(page);

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    // SC 1.4.10: content must not require scrolling in two dimensions.
    expect(overflows).toBe(false);
  });

  test("a tab strip stays operable at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await openGallery(page);
    const demo = page.locator("#v01");
    await clickClear(demo.getByRole("tab", { name: "Shared" }));
    await expect(demo.getByRole("tab", { name: "Shared" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
