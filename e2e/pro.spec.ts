/**
 * The Pro page.
 *
 * The page's argument is that Pro is a product rather than a promise, and the
 * glances are how it argues. So the things worth a browser here are the ones
 * that would quietly stop being true: that every stage actually renders, that
 * the two doors into the console point at the console, and that a reader who
 * has asked for reduced motion still gets a finished picture rather than a
 * frozen first frame.
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

/** Reveal is an IntersectionObserver fade; auditing mid-fade measures a
    half-transparent element and reports a phantom contrast failure. */
async function settle(page: Page) {
  await page.waitForTimeout(600);
}

test.describe("the Pro page @a11y", () => {
  test("renders a glance for every feature", async ({ page }) => {
    await page.goto("/pro");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Ten features, ten stages. An empty stage is the failure mode: the map is
    // keyed by a union so it cannot happen at compile time, but a CSS rename
    // could still leave the box blank.
    await expect(page.locator(".oxp .glance")).toHaveCount(10);
    const empties = await page.locator(".oxp .glance .stage:empty").count();
    expect(empties, "a glance stage rendered nothing").toBe(0);
  });

  test("the feature browser switches stage and keeps one tab selected", async ({ page }) => {
    await page.goto("/pro");
    const tabs = page.locator(".oxp .fTabs button");
    await expect(tabs).toHaveCount(10);
    await expect(page.locator('.oxp .fTabs button[aria-selected="true"]')).toHaveCount(1);

    await tabs.nth(3).click();
    await expect(tabs.nth(3)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator('.oxp .fTabs button[aria-selected="true"]')).toHaveCount(1);
    await expect(page.locator(".oxp .fPane .fStage")).toBeVisible();
  });

  /**
   * Both doors, in both places they appear. Asserted on the pathname rather
   * than the host, because the console's address is configuration.
   */
  test("sign up and sign in reach the console", async ({ page }) => {
    await page.goto("/pro");
    for (const [name, path] of [
      ["Create an organisation", "/signup"],
      ["Sign in", "/login"],
    ] as const) {
      const links = page.locator("main").getByRole("link", { name, exact: true });
      expect(await links.count(), `${name} appears at least twice`).toBeGreaterThanOrEqual(2);
      const href = await links.first().getAttribute("href");
      expect(new URL(href!).pathname).toBe(path);
    }
  });

  test("prices are the ones the tier table actually holds", async ({ page }) => {
    await page.goto("/pro");
    const tiers = page.locator(".oxp .tier");
    await expect(tiers).toHaveCount(4);
    // Scoped to the tier's own name: "Marketplace" also appears inside Team's
    // feature list ("Everything in Core and the marketplace"), so an unscoped
    // filter matches two cards. The first run of this file failed on that.
    await expect(
      tiers.filter({ has: page.locator("b", { hasText: /^Marketplace$/ }) }),
    ).toHaveAttribute("data-featured", "");
    for (const price of ["Free", "From $120", "$799", "Custom"]) {
      await expect(page.locator(".oxp .tier .amt").filter({ hasText: price })).toHaveCount(1);
    }
  });

  /**
   * The claim in the copy, tested. Every animation is declared inside
   * `prefers-reduced-motion: no-preference`, so opting out must leave a
   * composed stage — not a gate resting open, which would state the opposite
   * of the feature it exists to demonstrate.
   */
  test("reduced motion leaves the stages composed, not blank", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/pro");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const running = await page.evaluate(
      () =>
        [...document.querySelectorAll(".oxp .stage *, .oxp .fStage *")].filter(
          (n) => getComputedStyle(n).animationName !== "none",
        ).length,
    );
    expect(running, "an animation ran under reduced motion").toBe(0);

    // and the stages are still drawn
    const painted = await page.evaluate(
      () =>
        [...document.querySelectorAll(".oxp .glance .stage")].filter(
          (n) => n.getBoundingClientRect().height > 40 && n.children.length > 0,
        ).length,
    );
    expect(painted).toBe(10);
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
