/**
 * The Signature demo, in a real browser.
 *
 * Everything else about this component is tested in jsdom, and jsdom is enough
 * for roles, names, and the outcome union. It is not enough for the two things
 * this file exists for.
 *
 * The first is that the demo mounts at all. Signature is the only component on
 * the site that carries Ant Design, and it is consumed from a workspace package
 * rather than from `registry/oxygen` like everything else. That import path is
 * the part with no test anywhere: for a while the page compiled, typechecked,
 * and rendered a heading above a 500, because the package's own ESM specifiers
 * were unresolvable by the bundler. A green unit suite said nothing about it.
 * `mounts with its real dependency` is the check that would have caught it.
 *
 * The second is keyboard operability. WCAG 2.1.1 is the load-bearing claim in
 * this component's accessibility notes — drawing is path-dependent, so the
 * typed path is what makes recording assent operable without a pointer, and the
 * component meta says so in public. jsdom can fire a keydown at any element it
 * likes; only a real engine decides what is actually focusable and in what
 * order. The test below signs the form using nothing but Tab and typing.
 */

import { expect, test, type Page } from "@playwright/test";

const PAGE = "/components/signature";

/**
 * Wait until the page is genuinely ready to be driven.
 *
 * Two separate things, and only the first is obvious. The reveal-on-scroll
 * wrapper hides content from a viewport-height run, so it is forced open.
 *
 * The second is hydration. `networkidle` means the network went quiet, which
 * says nothing about whether React has attached its handlers yet — and a click
 * that lands in that gap hits server-rendered markup and is simply lost. That
 * surfaced here as a dialog that "never opened", intermittently, only under
 * parallel load, in whichever test happened to lose the race. The demo sets
 * `data-hydrated` in an effect, so waiting for it removes the whole class.
 */
async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.locator(".instrument-demo[data-hydrated]").waitFor({ state: "attached" });
  /*
   * The hero signature draws itself and then loops. Waiting for the finished
   * state is what makes a screenshot of it meaningful — captured at an
   * arbitrary moment it is a different half-written name every run, which is
   * precisely the noise ADR 0007 says kills visual regression.
   */
  await page.locator("[data-drawing-complete]").waitFor({ state: "attached" });
  await page.evaluate(() => {
    document
      .querySelectorAll("[data-reveal]")
      .forEach((el) => el.setAttribute("data-revealed", "true"));
  });
}

const demo = (page: Page) => page.locator(".instrument-demo").first();

/**
 * Press a trigger until the dialog it opens is actually on screen.
 *
 * A `.click()` that passes its actionability checks has still only been
 * *delivered*; nothing guarantees the handler ran. Under four parallel workers
 * Firefox would occasionally swallow one, and the test then failed on a dialog
 * that "never opened" — a product bug in appearance, a lost event in fact. It
 * reproduced in roughly one full run in five and never once in isolation.
 *
 * The click is re-sent only while no dialog is present, so a slow-but-delivered
 * click is waited on rather than double-fired into the modal's overlay.
 */
async function openDialog(page: Page, trigger: ReturnType<Page["locator"]>) {
  const dialog = page.getByRole("dialog");
  await expect(async () => {
    if ((await dialog.count()) === 0) await trigger.click();
    await expect(dialog).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  return dialog;
}

/**
 * Walk focus to a locator using Tab presses only.
 *
 * Deliberately not `locator.focus()`. Everything in the keyboard test below is
 * about what a keyboard can *reach*, and a programmatic focus call answers a
 * different question — it would keep passing for a control that no amount of
 * tabbing gets to.
 */
async function tabTo(page: Page, target: ReturnType<Page["locator"]>, limit = 40) {
  for (let i = 0; i < limit; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`never reached ${await target.textContent()} with ${limit} Tab presses`);
}

test.describe("the live demo", () => {
  test("@framework mounts with its real dependency", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") failures.push(message.text());
    });

    await page.goto(PAGE);
    await settle(page);

    // antd rendered, not just our wrapper: if the package failed to resolve,
    // the section is empty and every assertion below this one still needs to
    // fail, so the antd class is asserted rather than our own markup.
    await expect(demo(page).locator(".ant-form-item")).toBeVisible();
    await expect(page.getByRole("button", { name: /add signature/i })).toBeVisible();

    // The scenarios are the demo's whole argument, one per state the component
    // claims to hold. A missing tab means the "can't sign" case — the reason
    // this component exists — is not being shown to anyone evaluating it.
    for (const label of ["Consent", "Can't sign", "Locked", "Awaiting", "Withdrawn"]) {
      await expect(page.getByRole("tab", { name: label })).toBeVisible();
    }

    expect(failures, `console errors on ${PAGE}:\n${failures.join("\n")}`).toEqual([]);
  });

  test("@framework the modal offers all three capture methods", async ({ page }) => {
    await page.goto(PAGE);
    await settle(page);
    const dialog = await openDialog(page, page.getByRole("button", { name: /add signature/i }));

    for (const method of ["Draw", "Type", "Upload"]) {
      await expect(dialog.getByRole("tab", { name: method })).toBeVisible();
    }

    // Colour is never the only carrier: the ink swatches are named.
    const ink = dialog.getByRole("radiogroup", { name: /ink/i });
    await expect(ink.getByRole("radio", { name: "Black" })).toBeVisible();
    await expect(ink.getByRole("radio", { name: "Blue" })).toBeVisible();

    // Close and Cancel both dismiss, so they must not share an accessible name.
    await expect(dialog.getByRole("button", { name: "Close without signing" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  test("@framework a decline is recorded, not left blank", async ({ page }) => {
    await page.goto(PAGE);
    await settle(page);

    await page.getByRole("tab", { name: "Can't sign" }).click();
    const dialog = await openDialog(page, page.getByRole("button", { name: /add signature/i }));

    // The outcome sheet replaces the signing modal rather than stacking on it,
    // so the same idempotent press applies: retry until its heading is up.
    await expect(async () => {
      const heading = dialog.getByText("Record what happened instead");
      if ((await heading.count()) === 0) {
        await dialog.getByRole("button", { name: /can.t sign/i }).click();
      }
      await expect(heading).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    await dialog.getByRole("radio", { name: /declined to sign/i }).check();

    // A decline without a reason is not recordable. Asserting the refusal
    // first proves the happy path below went through validation rather than
    // around it.
    await dialog.getByRole("button", { name: "Record", exact: true }).click();
    await expect(dialog).toBeVisible();

    await dialog.getByRole("textbox").first().fill("Wants to discuss with their daughter first.");
    await dialog.getByRole("button", { name: "Record", exact: true }).click();
    await expect(dialog).toBeHidden();

    // The point of the component: the form now holds a fact rather than a null,
    // and the demo says out loud that the fact is not consent.
    await expect(page.getByText(/answered, not consent/i)).toBeVisible();
    await expect(page.getByText('"outcome": "declined"')).toBeVisible();

    // recordedBy is required on every unsigned outcome — an unattributable
    // refusal is the record the value type exists to prevent.
    await expect(page.getByText(/"recordedBy"/)).toBeVisible();
  });
});

test.describe("accessibility in a real layout engine", () => {
  /*
   * SC 2.1.1, Level A — the claim the component's own metadata makes.
   *
   * Nothing here is a click. Tab decides what is reachable and in what order,
   * and if the typed path ever stops being keyboard-operable this fails, which
   * is the only automated protection that claim has.
   */
  test("@a11y the form can be signed with the keyboard alone", async ({ page, browserName }) => {
    /*
     * Not run in WebKit, and the reason is WebKit's rather than ours.
     *
     * With macOS "Full Keyboard Access" off — the default, and what Playwright
     * ships — WebKit's Tab order contains only form controls. Buttons and
     * links are skipped outright, which was confirmed against a bare page of
     * `<a> <button> <input> <select>`: Tab visits the input and the select and
     * nothing else. Every affordance in this flow is a button, so the walk
     * below cannot run there no matter how the component is written.
     *
     * That is a platform setting, not an authoring failure, and SC 2.1.1 is
     * about what the page makes operable. Chromium and Firefox both model the
     * full order, so the claim is still verified in two engines. The rest of
     * this file — including forced colours — still runs in WebKit.
     */
    test.skip(
      browserName === "webkit",
      "WebKit omits buttons from the Tab order unless Full Keyboard Access is enabled",
    );

    await page.goto(PAGE);
    await settle(page);

    const trigger = page.getByRole("button", { name: /add signature/i });
    await trigger.scrollIntoViewIfNeeded();

    // Walk in from the top of the document rather than focusing the button
    // directly — reaching it is half of what is being claimed.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    let reached = false;
    for (let i = 0; i < 60 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await trigger.evaluate((el) => el === document.activeElement);
    }
    expect(reached, "the signature trigger is not reachable by Tab").toBe(true);

    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // antd lands focus on an invisible sentinel; the component moves it to the
    // first required field so that tabbing forward follows reading order.
    await expect(dialog.getByLabel(/full name/i)).toBeFocused();
    await page.keyboard.type("Josh Randall");

    /*
     * antd's Tabs use *manual* activation: ArrowRight moves focus along the
     * tablist and Enter selects. Tab would leave the tablist entirely, and
     * ArrowRight alone would move focus without switching panes.
     *
     * The focused tab's accessible name also gains antd's "Tab 2 of 3"
     * position prefix, so these match on a substring rather than exactly.
     */
    await tabTo(page, dialog.getByRole("tab", { name: /Draw/ }));
    await page.keyboard.press("ArrowRight");

    // Focus has to land before Enter can activate it. Sending both keys back
    // to back made this fail in Firefox roughly one run in six, because Enter
    // arrived while focus was still on Draw and re-selected the tab that was
    // already selected.
    const typeTab = dialog.getByRole("tab", { name: /Type/ });
    await expect(typeTab).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(typeTab).toHaveAttribute("aria-selected", "true");

    await tabTo(page, dialog.getByLabel(/type your name to sign/i));
    await page.keyboard.type("Josh Randall");

    await tabTo(page, dialog.getByRole("button", { name: /sign and continue/i }));
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();

    await expect(page.getByText(/consent given/i)).toBeVisible();
  });

  test("@reflow the signature page does not scroll sideways at 320px", async ({ page }) => {
    await page.goto(PAGE);
    await settle(page);

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflows, "the signature page scrolls horizontally at 320px").toBe(false);
  });

  test("@reflow the modal does not scroll sideways at 320px", async ({ page }) => {
    // A dialog with a fixed-width capture surface inside it is the classic way
    // to pass 1.4.10 on the page and fail it the moment the dialog opens.
    await page.goto(PAGE);
    await settle(page);
    await openDialog(page, page.getByRole("button", { name: /add signature/i }));

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflows, "the signature dialog scrolls horizontally at 320px").toBe(false);
  });

  test("@a11y the ink stays visible in forced-colours mode", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto(PAGE);
    await settle(page);
    const dialog = await openDialog(page, page.getByRole("button", { name: /add signature/i }));

    // The reason the pad is SVG rather than canvas: forced colours discards
    // every custom colour, and a script-painted bitmap has nothing to fall
    // back to. currentColor is recoloured with everything else.
    const surface = dialog.locator("svg").first();
    const stroke = await surface.evaluate((el) => getComputedStyle(el).color);
    expect(stroke).not.toBe("rgba(0, 0, 0, 0)");
  });
});

test.describe("the replayed signature", () => {
  /*
   * How much of the signature is inked, and how much there is to ink.
   *
   * Both read from the DOM rather than from a constant. The mark is artwork
   * and its segment count changes whenever it is redrawn or the engine's
   * smoothing is tuned — which it has been, from 33 segments to 146. A
   * hardcoded total turns any such change into three mysteriously failing
   * tests about animation. The ghost layer underneath is always the complete
   * set, so it is the honest denominator.
   */
  const segments = (page: Page, layer: 0 | 1) =>
    page
      .locator('[data-signature-band="hero"] svg g')
      .nth(layer)
      .evaluate((el) => el.children.length);

  const drawn = (page: Page) => segments(page, 1);
  const total = (page: Page) => segments(page, 0);

  test("@framework draws progressively rather than appearing at once", async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForLoadState("networkidle");

    /*
     * The thing worth testing is that it is an animation of the recorded
     * model, not a static image with a spinner over it. Sampled rather than
     * asserted at one instant: a single reading cannot distinguish "drawing"
     * from "already finished", and the run may join at any point in the loop.
     */
    const samples: number[] = [];
    for (let i = 0; i < 16; i++) {
      samples.push(await drawn(page));
      await page.waitForTimeout(110);
    }

    const whole = await total(page);
    expect(whole, "the signature has no segments at all").toBeGreaterThan(20);

    const partial = samples.filter((n) => n > 0 && n < whole);
    expect(
      partial.length,
      `never observed a partial signature: ${samples.join(",")} of ${whole}`,
    ).toBeGreaterThan(0);
    expect(Math.max(...samples), "never finished the signature").toBe(whole);
  });

  test("@framework holds the finished name rather than stopping halfway", async ({ page }) => {
    await page.goto(PAGE);
    await settle(page);
    // `settle` waits for completion, so the whole name must be inked.
    expect(await drawn(page)).toBe(await total(page));
  });

  test("@motion reduced motion shows the signature, not a faster one", async ({ page }) => {
    /*
     * SC 2.3.3, and the reason the accommodation is skip-to-end rather than
     * speed-up: the still state here *is* the content. Shortening the
     * animation would keep the movement and lose only the legibility, which
     * is the wrong half to give up.
     */
    await page.goto(PAGE);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("[data-drawing-complete]")).toBeAttached();

    const samples: number[] = [];
    for (let i = 0; i < 6; i++) {
      samples.push(await drawn(page));
      await page.waitForTimeout(150);
    }
    // Never restarts, never partial — there is no animation to observe.
    const whole = await total(page);
    expect(
      samples.every((n) => n === whole),
      `saw ${samples.join(",")} of ${whole}`,
    ).toBe(true);
  });
});

test.describe("visual regression", () => {
  /*
   * Captured band by band rather than as one tall element.
   *
   * The demo is taller than the viewport, and Playwright captures an
   * oversized element by scrolling and stitching — which drags the sticky
   * section nav across the top of the result. A baseline with a floating
   * navbar painted over it is not a baseline of the component, and the diff
   * it produces is about scroll position rather than about anything anyone
   * changed. Three shorter shots each fit, and each fails for one reason.
   */
  const band = (page: Page, name: string) => page.locator(`[data-signature-band="${name}"]`);

  test("@vrt the replayed signature settles on the finished name", async ({ page }) => {
    await page.goto(PAGE);
    await settle(page);
    // `settle` already waited for the drawing to finish, so this is the
    // completed state every time rather than whichever frame the run landed on.
    await expect(band(page, "hero")).toHaveScreenshot("signature-hero.png");
  });

  test("@vrt the live component is stable across scenarios", async ({ page }) => {
    await page.goto(PAGE);
    await settle(page);

    const live = demo(page).locator(".ant-form").first();
    for (const scenario of ["Consent", "Can't sign", "Locked", "Awaiting", "Withdrawn"]) {
      await page.getByRole("tab", { name: scenario }).click();
      const slug = scenario.toLowerCase().replace(/[^a-z]+/g, "-");
      await expect(live).toHaveScreenshot(`signature-${slug}.png`);
    }
  });

  test("@vrt the stroke anatomy is stable in each stage", async ({ page }) => {
    await page.goto(PAGE);
    await settle(page);

    const anatomy = band(page, "anatomy");
    for (const stage of ["Sampled", "Joined", "Rendered"]) {
      await anatomy.getByRole("button", { name: stage }).click();
      await expect(anatomy).toHaveScreenshot(`signature-anatomy-${stage.toLowerCase()}.png`);
    }
  });

  test("@vrt the signing dialog is visually stable", async ({ page }) => {
    await page.goto(PAGE);
    await settle(page);
    const dialog = await openDialog(page, page.getByRole("button", { name: /add signature/i }));
    await expect(dialog).toHaveScreenshot("signature-dialog.png");
  });
});
