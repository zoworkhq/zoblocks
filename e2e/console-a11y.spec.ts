/**
 * Every console screen, in every theme, against WCAG 2.2 AA.
 *
 * `scripts/a11y.ts` audits the documentation site and derives its page list
 * from the generated catalog. It cannot cover the console: every screen here is
 * behind a session, and a script that signs in would be a second auth
 * implementation to keep working.
 *
 * So the console's audit lives in the Playwright suite instead, where sign-in
 * is one helper and the three engine projects come for free. That last part
 * earns its keep: a focus ring and a forced-colours fallback are exactly the
 * things engines disagree about, and a Chromium-only pass is not evidence for a
 * published AA claim.
 *
 * Automated testing catches roughly a third of WCAG issues. This is a floor,
 * not a certificate.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.OXYGEN_CONSOLE_URL ?? "http://localhost:6003";
const AXE_SOURCE = readFileSync(
  createRequire(`${process.cwd()}/`).resolve("axe-core/axe.min.js"),
  "utf8",
);

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const THEME = "northwind-clinical";

/**
 * Every authenticated surface, plus the four anyone can reach.
 *
 * `/account`, `/forgot` and `/reset` were built after this list and never added
 * to it — which is how a sweep quietly stops covering the product: not by
 * failing, but by passing over less of it each release. `/reset` is included
 * with a token that cannot resolve, because the refusal screen is the one a
 * stranger with a stale link actually sees.
 */
const PAGES = [
  "/login",
  "/signup",
  "/forgot",
  "/reset?token=not-a-real-grant",
  "/account",
  "/themes",
  "/themes/new",
  "/frameworks",
  "/members",
  "/settings",
  "/playground",
  `/themes/${THEME}`,
  `/themes/${THEME}/brand`,
  `/themes/${THEME}/tokens`,
  `/themes/${THEME}/typography`,
  `/themes/${THEME}/components`,
  `/themes/${THEME}/compare`,
  `/themes/${THEME}/history`,
  `/themes/${THEME}/transfer`,
];

interface AxeResult {
  violations: {
    id: string;
    impact?: string;
    help: string;
    nodes: { target: string[]; failureSummary?: string }[];
  }[];
}

async function audit(page: Page): Promise<AxeResult["violations"]> {
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

test.describe("@a11y the console", () => {
  // Serial, because every test shares one signed-in context and the audit is
  // cheap relative to the sign-in.
  test.describe.configure({ mode: "serial" });

  for (const theme of ["light", "dark"] as const) {
    test(`has no WCAG 2.2 AA violations in ${theme}`, async ({ page }) => {
      /*
       * The preference is set BEFORE the first navigation.
       *
       * The no-flash script in `app/layout.tsx` reads localStorage during head
       * execution. Toggling after load leaves translucent surfaces composited
       * against the previous theme and produces phantom contrast failures a
       * real reader would never see — the same trap `scripts/a11y.ts` documents.
       */
      await page.addInitScript((choice) => {
        localStorage.setItem("oxygen-console-theme", choice);
      }, theme);

      await page.goto(`${BASE}/login`);
      await page.getByLabel("Email", { exact: true }).fill("admin@northwind.example");
      await page.getByLabel("Password", { exact: true }).fill("correct-horse-battery-staple");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(page).toHaveURL(/\/themes$/);

      const failures: string[] = [];

      for (const path of PAGES) {
        await page.goto(`${BASE}${path}`);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

        for (const violation of await audit(page)) {
          failures.push(
            `${path} · ${violation.id} (${violation.impact ?? "unknown"}) — ${violation.help}\n` +
              `    ${violation.nodes[0]?.target.join(" ")}`,
          );
        }
      }

      expect(failures, `\n${failures.join("\n")}\n`).toEqual([]);
    });
  }
});

test.describe("@reflow the console", () => {
  /**
   * WCAG 1.4.10: content must not require scrolling in two dimensions at
   * 320 CSS pixels. The rail collapses at that width rather than pushing the
   * page sideways, and this is what proves it stayed collapsed.
   */
  test("does not scroll sideways at 320px", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.getByLabel("Email", { exact: true }).fill("admin@northwind.example");
    await page.getByLabel("Password", { exact: true }).fill("correct-horse-battery-staple");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/themes$/);

    await page.setViewportSize({ width: 320, height: 640 });

    for (const path of ["/themes", "/frameworks", `/themes/${THEME}/tokens`, "/members"]) {
      await page.goto(`${BASE}${path}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });
});
