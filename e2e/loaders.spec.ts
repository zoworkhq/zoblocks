/**
 * Visual regression and the accessibility checks that need a real layout engine.
 *
 * jsdom covers roles, names, and structure; it has no layout, so it cannot see
 * a focus ring that fails contrast, a component that stops reflowing at 320px,
 * or a forced-colours mode that erases a severity signal. Those are here.
 *
 * Determinism, per ADR 0007: animations are disabled by the config, the
 * viewport and scale are fixed, and every loader is additionally frozen at a
 * known frame before capture — a beating heart photographed at an arbitrary
 * moment produces a diff on every run.
 */

import { expect, test, type Page } from "@playwright/test";

const COMPONENTS = [
  "pulse-loader",
  "rhythm-loader",
  "breath-loader",
  "helix-loader",
  "infusion-loader",
] as const;

/**
 * Freezes every animation at a fixed point in its cycle.
 *
 * `animations: "disabled"` in the config stops them, but stops them wherever
 * they happen to be. Seeking to a known time makes the captured frame a
 * property of the CSS rather than of when the screenshot ran.
 */
async function freezeAt(page: Page, fraction: number) {
  await page.evaluate((f) => {
    for (const animation of document.getAnimations()) {
      const timing = animation.effect?.getComputedTiming();
      const duration = typeof timing?.duration === "number" ? timing.duration : 1000;
      animation.pause();
      animation.currentTime = duration * f;
    }
  }, fraction);
  // Let the compositor settle on the seeked frame.
  await page.waitForTimeout(60);
}

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    document
      .querySelectorAll("[data-reveal]")
      .forEach((el) => el.setAttribute("data-revealed", "true"));
  });
}

test.describe("visual regression", () => {
  for (const name of COMPONENTS) {
    test(`@vrt ${name} preview is visually stable`, async ({ page }) => {
      await page.goto(`/components/${name}`);
      await settle(page);

      const preview = page.locator(".instrument-demo").first();
      await expect(preview).toBeVisible();

      // Three points in the cycle. A loader that only looks right at t=0 is a
      // loader that looks wrong for most of the time it is on screen.
      for (const fraction of [0, 0.33, 0.66]) {
        await freezeAt(page, fraction);
        await expect(preview).toHaveScreenshot(`${name}-t${Math.round(fraction * 100)}.png`);
      }
    });
  }

  test("@vrt the catalog grid is visually stable", async ({ page }) => {
    await page.goto("/components");
    await settle(page);
    await freezeAt(page, 0.25);
    await expect(page.locator("main")).toHaveScreenshot("catalog.png", { fullPage: false });
  });
});

test.describe("accessibility in a real layout engine", () => {
  test("@reflow no page scrolls horizontally at 320px", async ({ page }) => {
    for (const path of ["/", "/components", ...COMPONENTS.map((c) => `/components/${c}`)]) {
      await page.goto(path);
      await settle(page);
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      // WCAG 1.4.10: content must reflow to 320px without two-dimensional
      // scrolling. A props table that forces the page sideways fails it.
      expect(overflows, `${path} scrolls horizontally at 320px`).toBe(false);
    }
  });

  test("@a11y content survives 200% zoom", async ({ page }) => {
    await page.goto("/components/pulse-loader");
    await page.setViewportSize({ width: 640, height: 900 }); // 1280 at 200%
    await settle(page);

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflows, "page scrolls horizontally at 200% zoom").toBe(false);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("@a11y the loader stays visible in forced-colours mode", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/components/pulse-loader");
    await settle(page);

    const loader = page.locator("[data-zb-loader]").first();
    await expect(loader).toBeVisible();

    // Forced colours discards every custom colour, which is exactly why the
    // stroke must fall back to a system colour rather than to nothing.
    const stroke = await loader
      .locator(".zb-loader__stroke")
      .first()
      .evaluate((el) => getComputedStyle(el).stroke);
    expect(stroke).not.toBe("none");
    expect(stroke).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("@a11y the focus indicator is visible where a keyboard lands", async ({ page }) => {
    await page.goto("/components/pulse-loader");
    await settle(page);
    await page.keyboard.press("Tab");

    const outline = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      return { width: style.outlineWidth, style: style.outlineStyle, color: style.outlineColor };
    });

    expect(outline, "nothing received focus on the first Tab").not.toBeNull();
    expect(outline?.style, "focus indicator has no outline style").not.toBe("none");
    expect(parseFloat(outline?.width ?? "0")).toBeGreaterThan(0);
  });

  test("@motion reduced motion turns the loader off, not down", async ({ page }) => {
    await page.goto("/components/pulse-loader");
    await settle(page);

    // Asserted on computed style rather than on `document.getAnimations()`.
    // The site-wide guard sets `animation-duration: 0.01ms !important`, so an
    // animation still *exists* in the timeline while being visually instant —
    // a page-level count therefore proves nothing about the component. What
    // the loader CSS actually guarantees is `animation: none` on everything
    // that moves, which is the difference between a designed still state and a
    // paused one.
    const media = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
    expect(media, "prefers-reduced-motion emulation is not active in this project").toBe(true);

    const state = await page.evaluate(() => {
      const nameFor = (selector: string) => {
        const el = document.querySelector(selector);
        return el ? getComputedStyle(el).animationName : null;
      };
      const art = document.querySelector(".zb-loader__art");
      return {
        beat: nameFor(".zb-loader__beat"),
        head: nameFor(".zb-loader__head"),
        tail: nameFor(".zb-loader__tail"),
        draw: nameFor(".zb-loader__draw"),
        art: art ? getComputedStyle(art).animationName : null,
        drawOffset: (() => {
          const el = document.querySelector(".zb-loader__draw");
          return el ? getComputedStyle(el).strokeDashoffset : null;
        })(),
      };
    });

    for (const [part, name] of [
      ["beat", state.beat],
      ["head", state.head],
      ["tail", state.tail],
      ["draw", state.draw],
    ] as const) {
      expect(name, `${part} still animates under prefers-reduced-motion`).toBe("none");
    }

    // The designed part: the shape completes rather than freezing part-drawn,
    // and the mark breathes in opacity so it still reads as working.
    expect(state.drawOffset, "the heart is left part-drawn").toBe("0px");
    expect(state.art, "the still state should breathe").toBe("zb-loader-still");
  });
});
