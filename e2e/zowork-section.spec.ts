/**
 * The Zowork section on the home page: the orb, the services and the rotating
 * "Clients and work" card.
 *
 * The rotation is the part a unit test cannot hold. It depends on a timer, an
 * IntersectionObserver, real focus and the reduced-motion preference, so it
 * runs here against a real engine with Playwright's clock driving the timer.
 */

import { expect, test, type Page } from "@playwright/test";

const SECTION = "#zowork";

/*
 * Order matters. Hydrate on real timers first, or clicks land on markup React
 * has not picked up yet. (Run against a build: under `next dev`, jumping the
 * clock trips the hot-reload heartbeat and the page reloads mid-test.) Then
 * install the clock, and only then scroll the card into view: the
 * rotation starts its timer when the observer reports the card on screen, so
 * that timer is created under the fake clock.
 */
async function open(page: Page) {
  await page.goto("/");
  const card = page.locator(".zwhClients");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const seg = document.querySelector(".zwhSeg");
        return !!seg && Object.keys(seg).some((key) => key.startsWith("__reactProps"));
      }),
    )
    .toBe(true);
  // Installed, the clock still ticks with real time; paused, only the test moves it.
  await page.clock.install();
  await page.clock.pauseAt(Date.now() + 1000);
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeInViewport();
  return card;
}

const showing = (page: Page) => page.locator(".zwhStage > li[data-on] .zwhClientName");

/*
 * React commits a resume on its own schedule, which the fake clock does not
 * drive. Jumping the clock before the commit skips a timer that does not exist
 * yet, so wait for the bar to say the rotation is running, then give the
 * passive effect that starts the timer a real moment to run.
 */
async function whenRunning(page: Page) {
  await expect(page.locator(".zwhSeg[data-state='on'] i")).toHaveCSS(
    "animation-play-state",
    "running",
  );
  await page.waitForTimeout(150);
}

/** The same wait the other way: the hold has committed and the timer is gone. */
async function whenHeld(page: Page) {
  await expect(page.locator(".zwhSeg[data-state='on'] i")).toHaveCSS(
    "animation-play-state",
    "paused",
  );
  await page.waitForTimeout(150);
}

/*
 * `fastForward`, not `runFor`: the home page is full of animation, and
 * `runFor` plays every frame in between — enough to crash Firefox over twenty
 * seconds. `fastForward` jumps and fires the timers that fell due, once.
 */
async function advance(page: Page, ms: number, expected: string) {
  await page.clock.fastForward(ms);
  await expect(showing(page)).toHaveText(expected);
}

/*
 * Somewhere off the card, so a pointer resting there holds nothing. In steps:
 * WebKit drops the `pointerleave` of a single jump made straight after a click.
 */
async function pointAway(page: Page) {
  await page.locator("#zwp-title").hover();
  const box = await page.locator("#zwp-title").boundingBox();
  if (box) await page.mouse.move(box.x + 4, box.y + 4, { steps: 6 });
  await page.locator("#zwp-title").evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });
}

test.describe("the Zowork section @a11y", () => {
  test("opens on Netsmart, with exactly one client on show", async ({ page }) => {
    await open(page);
    await expect(showing(page)).toHaveText("Netsmart");
    await expect(page.locator(".zwhStage > li[data-on]")).toHaveCount(1);
    // The others are out of the tab order and the accessibility tree.
    await expect(page.locator(".zwhStage > li[inert][aria-hidden='true']")).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Show Netsmart" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("rotates through every client, Netsmart longest, and comes back", async ({ page }) => {
    await open(page);
    await whenRunning(page);
    // Netsmart is up for 7s: not gone at 5s, gone by 7.
    await advance(page, 5000, "Netsmart");
    await advance(page, 2100, "eVisit");
    for (const next of ["RemarkableHealth", "The Change Companies", "Netsmart"]) {
      await whenRunning(page);
      await advance(page, 4600, next);
    }
  });

  test("a segment shows its client, and the orb takes that client's colour", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Show The Change Companies" }).click();
    await expect(showing(page)).toHaveText("The Change Companies");
    await expect(page.locator(".zwhLeft")).toHaveAttribute("data-accent", "coral");
  });

  test("the pause button stops the rotation, and play starts it again", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Pause client rotation" }).click();
    await pointAway(page);
    await whenHeld(page);
    await advance(page, 20_000, "Netsmart");

    await page.getByRole("button", { name: "Play client rotation" }).click();
    await pointAway(page);
    await whenRunning(page);
    await advance(page, 7100, "eVisit");
  });

  test("keyboard focus inside the card holds it, and leaving lets it go", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Show Netsmart" }).focus();
    await whenHeld(page);
    await advance(page, 20_000, "Netsmart");

    await pointAway(page);
    await whenRunning(page);
    await advance(page, 7100, "eVisit");
  });

  test("a pointer resting on the card holds it", async ({ page }) => {
    const card = await open(page);
    await card.hover();
    await whenHeld(page);
    await advance(page, 20_000, "Netsmart");
  });

  test("says what Zowork does without ranking its clients", async ({ page }) => {
    await page.goto("/");
    const section = page.locator(SECTION);
    await expect(section.getByRole("heading", { level: 2 })).toHaveText(
      "Healthcare expertise, on your team.",
    );
    await expect(section.getByRole("list", { name: "Services" }).getByRole("listitem")).toHaveCount(
      4,
    );
    await expect(section).not.toContainText(/major client/i);
    await expect(section).not.toContainText(/healthcare only|only in healthcare/i);
  });

  test("both calls to action go to zowork.com", async ({ page }) => {
    await page.goto("/");
    const section = page.locator(SECTION);
    await expect(section.getByRole("link", { name: /Book a consultation/ })).toHaveAttribute(
      "href",
      "https://www.zowork.com/",
    );
    await expect(section.getByRole("link", { name: /See case studies/ })).toHaveAttribute(
      "href",
      "https://www.zowork.com/case-studies/",
    );
  });
});

test.describe("the Zowork section on a phone @reflow", () => {
  test("every client fits the card without cutting its work label", async ({ page }) => {
    await open(page);
    const card = page.locator(".zwhClients");
    const edge = await card.evaluate((el) => el.getBoundingClientRect().right);
    for (const name of ["Netsmart", "eVisit", "RemarkableHealth", "The Change Companies"]) {
      await page.getByRole("button", { name: `Show ${name}` }).click();
      const item = page.locator(".zwhStage > li[data-on]");
      await expect(item.locator(".zwhClientName")).toHaveText(name);
      const { right, clipped } = await item.evaluate((li) => {
        const work = li.querySelector<HTMLElement>(".zwhWork");
        return {
          right: Math.max(
            ...[...li.querySelectorAll("*")].map((n) => n.getBoundingClientRect().right),
          ),
          clipped: work ? work.scrollWidth > work.clientWidth + 1 : true,
        };
      });
      expect(right, `${name} overflows the card`).toBeLessThanOrEqual(edge + 1);
      expect(clipped, `${name}'s work label is cut off`).toBe(false);
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("the Zowork section without motion @motion", () => {
  test("never rotates and offers no pause", async ({ page }) => {
    await open(page);
    await page.clock.runFor(30_000);
    await expect(showing(page)).toHaveText("Netsmart");
    await expect(page.getByRole("button", { name: /client rotation/ })).toHaveCount(0);
    // The client can still be chosen by hand.
    await page.getByRole("button", { name: "Show eVisit" }).click();
    await expect(showing(page)).toHaveText("eVisit");
  });
});
