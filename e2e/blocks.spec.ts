/**
 * The block gallery.
 *
 * Two properties are worth a browser and cannot be reached without one. A
 * block is a composition rendered at three viewport widths, so "does it fit"
 * is a layout question jsdom has no answer to — and the frames are links with
 * a click handler layered over them, which is exactly the arrangement that
 * silently stops being linkable when someone converts it to a button.
 */

import { expect, test, type Page } from "@playwright/test";
import { source as AXE_SOURCE } from "axe-core";

const SLUGS = ["dashboard-01", "note-01", "patient-01", "copilot-01"] as const;

/**
 * Scoped to the gallery on purpose.
 *
 * The page's "On this page" list links to the same four addresses, so an
 * unscoped `a[href="/showcase/…"]` matches the nav entry first — which has no
 * preview inside it and navigates rather than opening the overlay. The first
 * run of this file failed on exactly that and the test was wrong, not the page.
 */
const card = (page: Page, slug: string) =>
  page.locator(`[data-gallery] a[href="/showcase/${slug}"]`);

/**
 * The frames are links first and enhanced second, so a click before hydration
 * is a navigation rather than an overlay. `data-ready` is set when the handler
 * attaches; waiting for it tests the enhancement instead of racing it.
 */
async function galleryReady(page: Page) {
  await page.locator("[data-gallery][data-ready]").waitFor();
}

/** Reveal is an IntersectionObserver fade; auditing mid-fade measures the
    contrast of a half-transparent element and reports a phantom failure. */
async function settle(page: Page) {
  await page.waitForTimeout(600);
}
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

test.describe("the block gallery @a11y", () => {
  test("shows every block as a live frame, not a screenshot", async ({ page }) => {
    await page.goto("/showcase");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    for (const slug of SLUGS) {
      const frame = card(page, slug);
      await expect(frame).toBeVisible();
      // The preview is the real component tree, so the rail inside it exists.
      await expect(frame.locator(".oxb")).toHaveCount(1);
    }
  });

  /**
   * The property the overlay must not cost us. A frame is a link first: it has
   * an href, it survives a middle click, and it works with the handler never
   * running. Asserting the href rather than the overlay is deliberate — the
   * overlay is the part that is allowed to change.
   */
  test("every frame is a real link to its own address", async ({ page }) => {
    await page.goto("/showcase");
    for (const slug of SLUGS) {
      const href = await card(page, slug).getAttribute("href");
      expect(href).toBe(`/showcase/${slug}`);
    }
  });

  test("a plain click opens the viewer, and Escape closes it", async ({ page }) => {
    await page.goto("/showcase");
    await galleryReady(page);
    await card(page, "dashboard-01").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Clinical caseload dashboard");

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });

  test("the viewport switcher resizes the frame and drops the rail", async ({ page }) => {
    await page.goto("/showcase");
    await galleryReady(page);
    await card(page, "patient-01").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await expect(dialog.locator(".oxb")).toHaveAttribute("data-vp", "desktop");
    await expect(dialog.locator(".rail")).toBeVisible();

    await dialog.getByRole("button", { name: "Mobile", exact: true }).click();
    await expect(dialog.locator(".oxb")).toHaveAttribute("data-vp", "mobile");
    // The rail is the first thing to go: a 216px column on a 390px frame is
    // most of the screen spent on navigation.
    await expect(dialog.locator(".rail")).toBeHidden();
  });

  for (const slug of SLUGS) {
    test(`${slug} renders at its own address`, async ({ page }) => {
      const response = await page.goto(`/showcase/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(".oxb").first()).toBeVisible();
    });
  }

  test("a slug with no block is a 404, not an empty frame", async ({ page }) => {
    const response = await page.goto("/showcase/not-a-block");
    expect(response?.status()).toBe(404);
  });

  /**
   * Every block at 320px. The clinical content is dense by necessity, which
   * makes it exactly the kind of layout that overflows sideways — and a chart
   * a reader has to pan horizontally is one they will misread.
   */
  test("no block scrolls the page sideways at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    for (const slug of SLUGS) {
      await page.goto(`/showcase/${slug}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflows, `${slug} scrolls horizontally at 320px`).toBe(false);
    }
  });

  test("the gallery and a block page have no WCAG 2.2 AA violations", async ({ page }) => {
    const failures: string[] = [];
    for (const path of ["/showcase", "/showcase/patient-01", "/showcase/dashboard-01"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await settle(page);
      for (const violation of await audit(page)) {
        failures.push(
          `${path} · ${violation.id} (${violation.impact ?? "unknown"}) — ${violation.help}\n` +
            `    ${violation.nodes[0]?.target.join(" ")}`,
        );
      }
    }
    expect(failures, `\n${failures.join("\n")}\n`).toEqual([]);
  });
});
