import { defineConfig, devices } from "@playwright/test";

/**
 * Browser-level testing: visual regression, and the accessibility checks that
 * need a real layout engine.
 *
 * ADR 0007 is explicit that visual regression must be deterministic or it
 * becomes noise the team learns to ignore — the failure mode that kills VRT
 * everywhere. Everything below is in service of that:
 *
 *   - animations disabled at the page level, so a screenshot is never a race
 *   - a fixed viewport and device scale factor
 *   - `reducedMotion` set per project rather than left to the runner's host
 *   - retries off locally, so a flake is visible immediately rather than
 *     retried into a pass
 *
 * The docs site is the fixture host: it already renders every component in
 * every state, so VRT reuses it rather than standing up a second harness.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: process.env.OXYGEN_BASE_URL ?? "http://localhost:6001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  expect: {
    toHaveScreenshot: {
      // A component library's diffs are small and deliberate. A generous
      // threshold hides exactly the regressions this exists to catch.
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
      scale: "device",
    },
  },

  // Each project runs only the suite it is for, selected by tag. Without that,
  // visual baselines multiply by project and a reflow-only check runs six times
  // in browsers it says nothing about.
  projects: [
    {
      name: "vrt-light",
      grep: /@vrt/,
      use: {
        ...devices["Desktop Chrome"],
        colorScheme: "light",
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: "vrt-dark",
      grep: /@vrt/,
      use: {
        ...devices["Desktop Chrome"],
        colorScheme: "dark",
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: "a11y-chromium",
      grep: /@a11y/,
      use: { ...devices["Desktop Chrome"], colorScheme: "light" },
    },
    {
      // The audit found a published WCAG 2.2 AA claim tested in Chromium only.
      // Rendering differences between engines are exactly where a focus ring or
      // a forced-colours fallback quietly stops working.
      name: "a11y-firefox",
      grep: /@a11y/,
      use: { ...devices["Desktop Firefox"], colorScheme: "light" },
    },
    {
      name: "a11y-webkit",
      grep: /@a11y/,
      use: { ...devices["Desktop Safari"], colorScheme: "light" },
    },
    {
      // 320px is the WCAG 1.4.10 reflow floor: content must not require
      // scrolling in two dimensions at that width.
      name: "reflow-mobile",
      grep: /@reflow/,
      use: { ...devices["iPhone SE"] },
    },
  ],

  webServer: process.env.OXYGEN_BASE_URL
    ? undefined
    : {
        command: "pnpm --filter @oxygenui-design/docs start",
        url: "http://localhost:6001",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
