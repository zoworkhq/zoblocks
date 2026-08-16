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
    {
      /*
       * The @motion suite had no project, so it never ran.
       *
       * Every project here carries a `grep`, which means a tag with no project
       * matches nothing — Playwright reports the remaining tests as passing
       * and says nothing about the ones it never collected. The reduced-motion
       * test was written, committed, and silently skipped from that day on.
       * `playwright test --list` is what surfaces this; it prints exactly the
       * tests that will run, and anything absent from it is not being tested.
       *
       * `reducedMotion` belongs on a project rather than in the test, so the
       * preference is set before first paint instead of after the page has
       * already animated. It goes under `contextOptions`: unlike
       * `colorScheme`, it is not a top-level `use` key in Playwright 1.62, and
       * putting it there is accepted silently and then ignored — which is how
       * this test came to assert its own emulation is active.
       */
      name: "motion-reduced",
      grep: /@motion/,
      use: { ...devices["Desktop Chrome"], contextOptions: { reducedMotion: "reduce" } },
    },

    // The cross-framework claim, run in all three engines. Custom elements are
    // the one part of this library whose behaviour genuinely differs per
    // engine — attribute reflection, upgrade timing, and `adoptedStyleSheets`
    // support all diverge — so a Chromium-only pass would not be evidence.
    {
      name: "framework-chromium",
      grep: /@framework/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "framework-firefox",
      grep: /@framework/,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "framework-webkit",
      grep: /@framework/,
      use: { ...devices["Desktop Safari"] },
    },
  ],

  // Three hosts, because the smoke apps cannot share one: React 18 and React 19
  // need separate installs. Each smoke server builds before it serves, so the
  // framework compilers run on every e2e invocation — half the value of these
  // pages is that Angular's and Vue's compilers get a chance to reject the
  // markup before any assertion runs.
  //
  // Each override variable skips only its own server. They used to be one
  // ternary over the docs variable, which meant pointing the docs suite at a
  // deployed URL also silently stopped the smoke apps from starting, and the
  // framework suite failed on connection refused rather than on anything real.
  webServer: [
    ...(process.env.OXYGEN_BASE_URL
      ? []
      : [
          {
            command: "pnpm --filter @oxygenui-design/docs start",
            url: "http://localhost:6001",
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
        ]),
    ...(process.env.OXYGEN_SMOKE_URL
      ? []
      : [
          {
            command:
              "pnpm --filter @oxygenui-design/smoke build && pnpm --filter @oxygenui-design/smoke preview",
            url: "http://localhost:6010",
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
        ]),
    ...(process.env.OXYGEN_SMOKE_18_URL
      ? []
      : [
          {
            command:
              "pnpm --filter @oxygenui-design/smoke-react18 build && pnpm --filter @oxygenui-design/smoke-react18 preview",
            url: "http://localhost:6011",
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
        ]),
  ],
});
