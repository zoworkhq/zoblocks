/**
 * ChartContextMenu in a real browser.
 *
 * The unit suite covers what the menu *says* — every refusal in
 * `chart-context-menu.test.tsx` is an assertion about the output, which is
 * where those belong. What it structurally cannot cover is the one rule that
 * is entirely geometric:
 *
 *   **The pixel under the pointer at the moment of opening is never a verb.**
 *
 * jsdom reports every box as zero and `elementFromPoint` with it, so the claim
 * that makes this component different from a themed popup is exactly the claim
 * jsdom cannot check. It is checked here, from real coordinates, at the top,
 * middle and bottom of the viewport — because the interesting case is the one
 * where the menu cannot open downward and has to go somewhere else.
 *
 * Two earlier versions of this failed here and only here. The first put the
 * popup's corner exactly on the cursor, where an 8px `border-radius` leaves the
 * pointer just outside the menu and `elementFromPoint` returns the row
 * underneath. The second flipped a tall menu above the cursor — and because
 * consequence sorts to the bottom, that put the *most* consequential verb under
 * the pointer, which is the opposite of the rule.
 *
 * The docs page is the fixture host, as ADR 0007 intends. Tagged `@a11y` so it
 * runs in all three engines: WebKit is the one that does not synthesise a
 * `contextmenu` event for Shift+F10, which is why the component handles that
 * key itself, and a Chromium-only pass would not be evidence of it.
 */

import { expect, test, type Page } from "@playwright/test";

const PAGE = "/components/chart-context-menu";

/**
 * Put a row at a chosen fraction of the viewport and summon its menu there.
 *
 * A fraction rather than `scrollIntoView`'s `block`, for two reasons. It is the
 * only way to reach the case that matters — a row low enough that the menu
 * cannot open downward — and `block: "start"` parks the row underneath the
 * docs site's own sticky header, where the thing over the cursor is the site
 * chrome and the measurement says nothing about this component.
 */
async function landingAt(page: Page, index: number, fraction: number) {
  return page.evaluate(
    async ({ index, fraction }) => {
      document.documentElement.style.scrollBehavior = "auto";
      /*
       * `mousedown`, not `click`. Dismissal listens on the down-event (SC
       * 2.5.2), so a `click()` leaves the previous menu open — and the next
       * iteration then measures the cursor against a popup belonging to a
       * different row, which reads exactly like the bug this file exists to
       * catch. It cost an afternoon.
       */
      document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const row = document.querySelectorAll<HTMLElement>("[data-ox-menu]")[index];
      if (!row) throw new Error(`no trigger at index ${index}`);

      const target = window.innerHeight * fraction;
      window.scrollBy(0, row.getBoundingClientRect().top - target);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const box = row.getBoundingClientRect();
      const x = Math.round(box.left + 120);
      const y = Math.round(box.top + 16);
      row.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: x, clientY: y }));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const hit = document.elementFromPoint(x, y);
      const menu = document.querySelector(".ox-menu");
      const rect = menu?.getBoundingClientRect();
      return {
        landing: hit?.closest(".ox-menu__subject")
          ? "subject"
          : hit?.closest(".ox-menu__item")
            ? "verb"
            : hit?.closest(".ox-menu")
              ? "chrome"
              : "outside",
        cursorX: x,
        cursorY: y,
        menuTop: rect ? Math.round(rect.top) : null,
        menuBottom: rect ? Math.round(rect.bottom) : null,
        menuLeft: rect ? Math.round(rect.left) : null,
        menuRight: rect ? Math.round(rect.right) : null,
        hitTag: hit ? `${hit.tagName}.${String(hit.className).slice(0, 40)}` : null,
        viewport: window.innerHeight,
      };
    },
    { index, fraction },
  );
}

test.describe("@a11y the pointer never lands on a verb", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("[data-ox-menu]").first()).toBeVisible();
  });

  for (const [name, fraction] of [
    ["the top", 0.25],
    ["the middle", 0.5],
    ["the bottom", 0.88],
  ] as const) {
    test(`opening near ${name} of the viewport`, async ({ page }) => {
      for (let index = 0; index < 3; index += 1) {
        const result = await landingAt(page, index, fraction);

        // Either the header is under the cursor, or the menu flipped above it
        // and the cursor is in the gap below. Never a row.
        expect(
          result.landing,
          `row ${index} at ${name}: cursor landed on "${result.landing}" (${result.hitTag}) ` +
            `— cursor ${result.cursorX},${result.cursorY}; menu x ${result.menuLeft}–${result.menuRight}, ` +
            `y ${result.menuTop}–${result.menuBottom}; viewport ${result.viewport}`,
        ).not.toBe("verb");

        if (result.landing === "outside") {
          // The flip case: the menu is entirely above the cursor, by design.
          expect(result.menuBottom).toBeLessThanOrEqual(result.cursorY);
        }
      }
    });
  }

  test("stays inside the viewport wherever it is summoned", async ({ page }) => {
    for (const fraction of [0.25, 0.5, 0.88]) {
      const result = await landingAt(page, 0, fraction);
      expect(result.menuTop).not.toBeNull();
      expect(result.menuTop!).toBeGreaterThanOrEqual(0);
      expect(result.menuBottom!).toBeLessThanOrEqual(result.viewport);
    }
  });
});

test.describe("@a11y the subject survives a real layout engine", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForLoadState("networkidle");
  });

  test("names the popup, and a masked row keeps its name back", async ({ page }) => {
    const rows = page.locator("[data-ox-menu]");
    await rows.first().click({ button: "right" });

    const menu = page.locator(".ox-menu");
    await expect(menu).toBeVisible();
    await expect(menu.locator(".ox-menu__subject")).toContainText("Lisinopril 10 mg");

    // The header is the popup's accessible name, so both audiences get the
    // wrong-patient check from one element.
    const labelledBy = await menu.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    await expect(page.locator(`#${labelledBy}`)).toContainText("Lisinopril");

    await page.keyboard.press("Escape");

    // The third row is a 42 CFR Part 2 note rendered masked. The menu may say
    // less than its trigger; it may never say more.
    await rows.nth(2).click({ button: "right" });
    await expect(menu.locator(".ox-menu__subject")).toContainText("Restricted record");
    await expect(menu).not.toContainText("Nwosu");
  });

  test("the subject stays visible however long the list is", async ({ page }) => {
    await page.locator("[data-ox-menu]").first().click({ button: "right" });
    const subject = page.locator(".ox-menu__subject");
    await expect(subject).toBeInViewport();

    // Only the list scrolls. A menu that can scroll its own subject out of
    // view has thrown away the reason it has one.
    const list = page.locator(".ox-menu__list");
    await list.evaluate((node) => node.scrollTo(0, node.scrollHeight));
    await expect(subject).toBeInViewport();
  });
});

test.describe("@a11y consequence is reachable but never adjacent", () => {
  test("a clinical verb takes a second step, in the menu", async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForLoadState("networkidle");
    await page.locator("[data-ox-menu]").first().click({ button: "right" });

    const menu = page.locator(".ox-menu");
    // A separator between every band: a discontinue is never one row below a copy.
    expect(await menu.locator(".ox-menu__separator").count()).toBeGreaterThan(0);

    await menu.getByRole("menuitem", { name: /Discontinue/ }).click();
    await expect(menu).toContainText("next scheduled dose is 14:00 today");
    // Still open, and the confirm control carries the verb rather than "OK".
    await expect(menu.getByRole("button", { name: "Discontinue" })).toBeVisible();
  });

  test("opens from the keyboard alone", async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForLoadState("networkidle");

    const row = page.locator("[data-ox-menu]").first();
    await row.focus();
    await page.keyboard.press("Shift+F10");

    const menu = page.locator(".ox-menu");
    await expect(menu).toBeVisible();
    // A keyboard open arms the first verb; a pointer open arms nothing.
    await expect(menu.getByRole("menuitem", { name: /Open order/ })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(row).toBeFocused();
  });
});

test.describe("@a11y a submenu is a menu, not a chevron", () => {
  /*
   * This shipped as a decoration: a chevron, `aria-haspopup="menu"`, and a
   * click that ran the parent as a command. jsdom could have caught that much,
   * and the unit suite now does. What it could not catch is the part that is
   * geometry and portals — whether the child lands beside its row, whether it
   * stays inside the viewport, and whether the outside-click listener treats a
   * second portal as "outside" and dismisses everything before the click that
   * would have run the item. The last one was real.
   */
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForLoadState("networkidle");
  });

  test("opens beside its row and runs a child", async ({ page }) => {
    // The result row: "Trend" is the only submenu on the page.
    await page.locator("[data-ox-menu]").nth(1).click({ button: "right" });

    const parent = page.locator(".ox-menu").first();
    const trigger = parent.getByRole("menuitem", { name: /Trend/ });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();

    const child = page.locator(".ox-menu--sub");
    await expect(child).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    // Beside, not on top of, and fully on screen.
    const p = await parent.boundingBox();
    const c = await child.boundingBox();
    expect(c!.x + c!.width <= p!.x + 2 || c!.x >= p!.x + p!.width - 6).toBeTruthy();
    await expect(child).toBeInViewport();

    // The one jsdom nearly missed: the child is a separate portal, so a click
    // inside it must not read as a click away.
    await child.getByRole("menuitem", { name: "Last 30 days" }).click();
    await expect(page.locator(".ox-menu")).toHaveCount(0);
  });

  test("opens on hover after an intent delay, and survives the gap between menus", async ({
    page,
  }) => {
    await page.locator("[data-ox-menu]").nth(1).click({ button: "right" });
    const parent = page.locator(".ox-menu").first();
    const trigger = parent.getByRole("menuitem", { name: /Trend/ });

    await trigger.hover();
    const child = page.locator(".ox-menu--sub");
    await expect(child).toBeVisible();

    // Crossing from the trigger into the child passes over dead space between
    // the two popups. Without a safe triangle that is where a naive close
    // timer kills it; here nothing closes until a different row is reached.
    await child.getByRole("menuitem", { name: "Last 7 days" }).hover();
    await expect(child).toBeVisible();

    // Reaching a different row is what closes it.
    await parent.getByRole("menuitem", { name: /Open result/ }).hover();
    await expect(child).toHaveCount(0);
    await expect(parent).toBeVisible();
  });

  test("ArrowRight opens it, ArrowLeft gives the row back", async ({ page }) => {
    const row = page.locator("[data-ox-menu]").nth(1);
    await row.focus();
    await page.keyboard.press("Shift+F10");
    await expect(page.locator(".ox-menu").first()).toBeVisible();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(
      page.locator(".ox-menu").first().getByRole("menuitem", { name: /Trend/ }),
    ).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".ox-menu--sub")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Last 7 days" })).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator(".ox-menu--sub")).toHaveCount(0);
    await expect(
      page.locator(".ox-menu").first().getByRole("menuitem", { name: /Trend/ }),
    ).toBeFocused();
  });
});
