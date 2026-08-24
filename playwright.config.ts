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
 *
 * ## `Error: The destination stream closed early.`
 *
 * A clean run prints this ~60 times against the app server. It is benign,
 * it is not the app's, and it has been chased once already — so the
 * measurements are here rather than in someone's terminal history.
 *
 * Every aborted request carries `?_rsc=`: they are `next/link` prefetches of
 * the rail's destinations, cancelled when a page is torn down before the
 * response finishes. React's Flight server logs a cancelled stream as an error
 * because it usually is one. Here it is a browser closing a tab.
 *
 * What the numbers said, on `e2e/app.spec.ts` alone:
 *
 *   - `--workers=1` → 0 errors. `--workers=2` → 4. `--workers=4` → 27.
 *   - a prefetch stops at `(app)/loading.tsx` and completes in ~7ms
 *
 * So it scales with how many pages are being closed at once, not with anything
 * being slow or wrong. Nothing here is worth `prefetch={false}` on the rail:
 * that would trade instant navigation for a quieter log, and the log is only
 * loud because the harness closes pages faster than any person does.
 *
 * The reason it is written down at all: it sits next to an error that *was*
 * real. Twenty pages once logged `Cannot read properties of null (reading
 * 'orgId')` in the same stream, from a null-assertion that survived precisely
 * because it looked like more of this. Knowing which lines are furniture is
 * what makes a new one visible.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  /*
   * The JSON reporter is there so a flake can be *seen*.
   *
   * CI retries once, which is right — a genuinely intermittent failure should
   * not block a merge on its own. But a test that fails and then passes leaves
   * no signal anyone reads: the job is green and the retry is buried in the
   * log. Three real flakes were found in one week only because somebody
   * happened to be watching the output.
   *
   * `scripts/flaky.mjs` reads this file after the run and writes any
   * retried-but-passed test into the job summary, where it is visible without
   * opening the run.
   */
  reporter: process.env.CI
    ? [
        ["github"],
        ["html", { open: "never" }],
        ["json", { outputFile: "playwright-report/results.json" }],
      ]
    : [["list"]],

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
    {
      /*
       * The UI-framework hosts: one application source under antd, MUI and
       * neither, asserting the accessibility trees match.
       *
       * Chromium only, deliberately. This suite compares three renders of the
       * same page against *each other* rather than against a fixed
       * expectation, so a second engine would re-run the same comparison and
       * find the same answer — it tests our architecture, not the browser's
       * DOM. The cross-engine coverage that earns its keep is `@a11y`, which
       * checks things engines genuinely differ on.
       *
       * It needs a project at all because every project here carries a `grep`:
       * a tag with no project matches nothing, and Playwright reports the run
       * green while silently collecting none of it. That is how `@motion` went
       * unrun; `playwright test --list` is what surfaces it.
       */
      name: "bridge-chromium",
      grep: /@bridge/,
      use: { ...devices["Desktop Chrome"], colorScheme: "light" },
    },
    {
      /*
       * The app's own lifecycle, in one engine.
       *
       * Chromium only, on the same reasoning as `@bridge`: this suite asserts
       * that a sequence of *our* screens is reachable and that our gate refuses
       * what it should. None of that differs by engine. The app's
       * cross-engine coverage is `@a11y`, which checks the things engines do
       * genuinely disagree about — focus rings, forced colours, name
       * computation.
       */
      name: "app-chromium",
      grep: /@app/,
      use: { ...devices["Desktop Chrome"], colorScheme: "light" },
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
    /*
     * The app, with a throwaway MongoDB of its own.
     *
     * One command rather than three, because the steps are ordered and
     * Playwright's `webServer` owns exactly one: the database has to exist
     * before the seed, and the seed has to finish before a request assumes a
     * member exists. Three entries would race and the failure would look like a
     * flaky login. `scripts/e2e-server.mjs` does all three and tears the
     * database down with the process.
     */
    ...(process.env.OXYGEN_APP_URL
      ? []
      : [
          {
            command:
              "pnpm --filter @oxygenui-design/app build && pnpm --filter @oxygenui-design/app e2e:server",
            url: "http://localhost:6003/login",
            reuseExistingServer: !process.env.CI,
            timeout: 180_000,
          },
        ]),
    ...(process.env.OXYGEN_BASE_URL
      ? []
      : [
          {
            /*
             * Built here, not assumed.
             *
             * `next start` serves whatever is in `.next` from whenever it was
             * last written, so a fix made after the previous build is invisible
             * and the suite reports a failure that no longer exists. That has
             * now cost two debugging sessions — once on a stale registry, once
             * on a marketplace fix two hours older than the build under test.
             * The app entry above already builds for the same reason; turbo
             * makes the no-op case cheap.
             */
            command:
              "pnpm --filter @oxygenui-design/docs build && pnpm --filter @oxygenui-design/docs start",
            url: "http://localhost:6001",
            reuseExistingServer: !process.env.CI,
            // Matches the app's, now that this one builds before it serves.
            timeout: 180_000,
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
    // The three UI-framework hosts. `bridge-hosts.spec.ts` renders one
    // application source under antd, MUI and neither, and asserts the
    // accessibility trees match — the check that fails if framework coupling
    // ever leaks into a component.
    ...(process.env.OXYGEN_HOSTS_URL
      ? []
      : [
          {
            command:
              "pnpm --filter @oxygenui-design/smoke-hosts build && pnpm --filter @oxygenui-design/smoke-hosts preview",
            /*
             * `/none/`, not `/`.
             *
             * This app has three entry points and no root document — its Vite
             * input is `antd/`, `mui/` and `none/`, so `/` is a 404 by
             * construction. Polling it meant the server came up healthy, never
             * satisfied the check, and every run that started this server
             * failed after two minutes with "Timed out waiting for
             * config.webServer" — a message that points at the server rather
             * than at the URL, which is why it survived.
             */
            url: "http://localhost:6012/none/",
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
        ]),
  ],
});
