/**
 * Recorder in a real layout engine.
 *
 * jsdom covers the roles, the names and the structure, and the unit suite
 * already asserts the whole fault catalogue numerically. What it cannot see is
 * a waveform that reflows off the page at 320px, a struck span that vanishes
 * under forced colours, or a level meter whose fills stop being distinguishable
 * once a compositor has actually painted them. Those are here.
 *
 * One thing this file does NOT do: photograph a live capture art mid-flight.
 * The lane is driven by an analyser, so a screenshot of it is a screenshot of
 * whatever the demo source happened to be saying — which is a diff on every
 * run. The playback arts are deterministic by construction (peaks in, pixels
 * out) and are what the visual baselines are taken from. The capture arts are
 * pinned by their DOM instead, which is the honest version of the same check.
 */

import { expect, test, type Page } from "@playwright/test";

const RECORDER = "/components/recorder";

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    document
      .querySelectorAll("[data-reveal]")
      .forEach((el) => el.setAttribute("data-revealed", "true"));
  });
  await expect(page.locator("[data-zb-recorder]").first()).toBeVisible();
}

/** Select one of the state-browser scenarios by its rail label. */
async function scenario(page: Page, label: string) {
  await page.getByRole("tab", { name: label }).click();
  await page.waitForTimeout(120);
}

/**
 * Stop the analyser so a capture art holds still.
 *
 * Not `animations: "disabled"` — there is no animation to disable. The lane
 * moves because data arrives, so the way to freeze it is to stop the data,
 * which is also a decent proof that nothing else is moving it.
 */
async function silenceTheSource(page: Page) {
  await page.evaluate(() => {
    window.requestAnimationFrame = (() => 0) as unknown as typeof window.requestAnimationFrame;
  });
  await page.waitForTimeout(80);
}

test.describe("visual regression", () => {
  test("@vrt the playback art is visually stable", async ({ page }) => {
    await page.goto(RECORDER);
    await settle(page);
    await scenario(page, "Who spoke when");

    const art = page.locator('[data-zb-recorder="duet"]').first();
    await expect(art).toBeVisible();
    // Peaks in, pixels out: no clock anywhere in this art, so the frame is a
    // property of the data rather than of when the shot was taken.
    await expect(art).toHaveScreenshot("recorder-duet.png");
  });

  test("@vrt the marker lane keeps a struck span visible", async ({ page }) => {
    await page.goto(RECORDER);
    await settle(page);
    await scenario(page, "Who spoke when");
    await expect(page.locator(".zb-rec-markbar")).toHaveScreenshot("recorder-markers.png");
  });

  test("@vrt the disposition strip is visually stable", async ({ page }) => {
    await page.goto(RECORDER);
    await settle(page);
    await scenario(page, "Where the recording is");
    // No waveform and no transport, so nothing here has a clock either.
    const strip = page.locator('[data-zb-recorder="disposition"]').first();
    await expect(strip).toBeVisible();
    await expect(strip).toHaveScreenshot("recorder-disposition-held.png");
  });

  test("@vrt the transcript art is visually stable", async ({ page }) => {
    await page.goto(RECORDER);
    await settle(page);
    await scenario(page, "Live transcript");
    const art = page.locator('[data-zb-recorder="stream"]').first();
    await expect(art).toHaveScreenshot("recorder-stream.png");
  });
});

test.describe("the art is a function of the signal", () => {
  test("@a11y the lane stops when the frames stop", async ({ page }) => {
    await page.goto(RECORDER);
    await settle(page);
    await scenario(page, "Capturing");

    const lane = page.locator(".zb-rec-lane").first();
    const read = () =>
      lane.evaluate((el) =>
        [...el.children].map((b) => (b as HTMLElement).style.getPropertyValue("--_h")).join(","),
      );

    await page.waitForTimeout(400);
    await silenceTheSource(page);
    const first = await read();
    await page.waitForTimeout(500);
    const second = await read();

    // Nothing here owns a clock, so with no frames arriving the art is
    // identical half a second later. A timer-driven waveform would not be.
    expect(second).toBe(first);
  });

  test("@a11y unplugging the device names the fault and holds the audio", async ({ page }) => {
    await page.goto(RECORDER);
    await settle(page);
    // The state browser only shows the selected scenario, so the switch has to
    // be brought on screen before it can be pressed.
    await scenario(page, "Capturing");

    await page.getByRole("button", { name: "Device unplugged" }).click();
    await page.waitForTimeout(200);

    const alert = page.getByRole("alert").first();
    await expect(alert).toContainText("disconnected");
    // The distinction that keeps a pipeline from throwing away the expensive
    // artefact because the cheap one broke.
    await expect(alert).toContainText("not lost");
    await expect(page.locator("[data-zb-recorder]").first()).toHaveAttribute(
      "data-fault",
      "critical",
    );
  });
});

test.describe("accessibility in a real layout engine", () => {
  test("@reflow the recorder page does not scroll sideways at 320px", async ({ page }) => {
    await page.goto(RECORDER);
    await settle(page);
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    // WCAG 1.4.10. A 72-bar lane that refuses to shrink fails it.
    expect(overflows, "recorder page scrolls horizontally at 320px").toBe(false);
  });

  test("@a11y the waveform survives forced colours", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto(RECORDER);
    await settle(page);

    const bar = page.locator(".zb-rec-lane > i").first();
    const background = await bar.evaluate((el) => getComputedStyle(el).backgroundColor);
    // Forced colours discards every custom colour, and the lane is painted with
    // a gradient — which is discarded too. Without an explicit system-colour
    // fallback the bars disappear entirely and the pane reads as empty.
    expect(background).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("@a11y the elapsed timer is polled, not pushed", async ({ page }) => {
    await page.goto(RECORDER);
    await settle(page);
    const timer = page.locator('[role="timer"]').first();
    // A polite timer announces a number every second for twenty minutes.
    await expect(timer).not.toHaveAttribute("aria-live", /polite|assertive/);
  });

  test("@motion the record tell stops looping under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(RECORDER);
    await settle(page);

    const tell = page.locator(".zb-rec-tell").first();
    const running = await tell.evaluate(
      (el) => getComputedStyle(el, "::before").animationName !== "none",
    );
    // The still state is designed, not paused: the ring goes to full strength
    // rather than the dot freezing mid-breath.
    expect(running).toBe(false);
  });
});
