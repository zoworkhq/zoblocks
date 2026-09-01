/**
 * The Pro holding page.
 *
 * Pro is out of the first release, so `/pro` no longer sells the console. The
 * things worth a browser here are the ones a later edit would quietly break:
 * that the gate still reads three-done-one-open rather than four of anything,
 * that the state is carried by something other than colour, that the two ways
 * off the page still lead somewhere, and that a reader who has asked for
 * reduced motion gets the composed picture instead of a frozen first frame.
 *
 * The spec that tested the console page is in this file's history; it comes
 * back with `console-page.tsx`.
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

/** The entrance is a staggered fade; auditing mid-fade measures a
    half-transparent element and reports a phantom contrast failure. */
async function settle(page: Page) {
  await page.waitForTimeout(1600);
}

test.describe("the Pro holding page @a11y", () => {
  test("holds the gate one step short", async ({ page }) => {
    await page.goto("/pro");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Coming soon");

    // Four steps, exactly one of them outstanding. Both halves matter: four
    // ticks would say the console shipped, and four rings would say none of it
    // is built — the page exists to say neither.
    await expect(page.locator(".soon .soonStep")).toHaveCount(4);
    await expect(page.locator(".soon .soonStep[data-pending]")).toHaveCount(1);
    await expect(page.locator(".soon .soonStep[data-pending]")).toContainText("Publish");
  });

  /**
   * The state is a difference in shape, not only in colour, so it survives a
   * greyscale print and a red-green deficiency. Asserted on the rendered
   * marker: settled steps paint a filled disc, the outstanding one a ring.
   */
  test("done and outstanding differ by more than colour", async ({ page }) => {
    await page.goto("/pro");
    const borders = await page.evaluate(() =>
      [...document.querySelectorAll(".soon .soonStep")].map((step) => {
        const marker = getComputedStyle(step.querySelector(".soonDot")!, "::before");
        return {
          pending: step.hasAttribute("data-pending"),
          border: parseFloat(marker.borderTopWidth) || 0,
          background: marker.backgroundColor,
        };
      }),
    );
    expect(borders).toHaveLength(4);
    for (const { pending, border, background } of borders) {
      if (pending) {
        expect(border, "the outstanding step should be a ring").toBeGreaterThan(0);
        expect(background).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
      } else {
        expect(border, "a settled step should be a filled disc").toBe(0);
        expect(background).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
      }
    }
  });

  /**
   * Per-letter spans are the animation's mechanism, and both the readings they
   * can corrupt are asserted here. The first build hid the letters and added a
   * visually-hidden copy for the name — correct to a screen reader, and it put
   * `ComingsoonComing soon` on the clipboard.
   */
  test("the headline reads as one line, spoken and copied", async ({ page }) => {
    await page.goto("/pro");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText("Coming soon");
    expect(await h1.evaluate((h) => h.getAttribute("aria-label"))).toBe("Coming soon");
    // Eleven letters, and not one of them offered to the accessibility tree.
    expect(await page.locator(".soon .soonHead .soonCh").count()).toBe(10);
    expect(
      await h1.evaluate((h) =>
        [...h.querySelectorAll(".soonCh")].every((n) => n.closest("[aria-hidden='true']") !== null),
      ),
      "a headline letter was left in the accessibility tree",
    ).toBe(true);
  });

  test("both ways off the page lead somewhere", async ({ page }) => {
    await page.goto("/pro");
    const notify = page.locator("main").getByRole("link", { name: /email me when it ships/i });
    await expect(notify).toHaveAttribute("href", /^mailto:[^@]+@[^@]+\./);

    const components = page.locator("main").getByRole("link", { name: /browse the open/i });
    await expect(components).toHaveAttribute("href", "/components");
    await components.click();
    await expect(page).toHaveURL(/\/components$/);
  });

  /**
   * Every animation is declared inside `prefers-reduced-motion: no-preference`,
   * so opting out must leave the composed picture — a gate that still reads
   * three-done-one-open, not a blank panel or a first frame.
   */
  test("reduced motion leaves the page composed, not blank", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/pro");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const running = await page.evaluate(
      () =>
        [...document.querySelectorAll(".soon *")].filter(
          (n) => getComputedStyle(n).animationName !== "none",
        ).length,
    );
    expect(running, "an animation ran under reduced motion").toBe(0);

    // The panel is drawn, the headline is legible and the gate still reads.
    const composed = await page.evaluate(() => {
      const panel = document.querySelector(".soon .soonPanel")!;
      const head = document.querySelector(".soon .soonHead")!;
      return {
        panelHeight: panel.getBoundingClientRect().height,
        headOpacity: getComputedStyle(head).opacity,
        letters: [...document.querySelectorAll(".soon .soonCh")].every(
          (n) => getComputedStyle(n).opacity === "1",
        ),
      };
    });
    expect(composed.panelHeight).toBeGreaterThan(200);
    expect(composed.headOpacity).toBe("1");
    expect(composed.letters, "a headline letter stayed transparent").toBe(true);
  });

  test("does not scroll sideways at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/pro");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflows).toBe(false);
  });

  test("has no WCAG 2.2 AA violations", async ({ page }) => {
    await page.goto("/pro");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await settle(page);
    const failures = (await audit(page)).map(
      (v) => `${v.id} (${v.impact ?? "unknown"}) — ${v.help}\n    ${v.nodes[0]?.target.join(" ")}`,
    );
    expect(failures, `\n${failures.join("\n")}\n`).toEqual([]);
  });
});
