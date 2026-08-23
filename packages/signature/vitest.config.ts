import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Absolute, because a bare `src/**` glob is not anchored to this package.
 *
 * This package's tests import `@oxygenui-design/signature-core`, whose own
 * sources also live under a `src/` directory. Vitest 3 reported only this
 * package's files; Vitest 4 matched the sibling's `src/` too and folded five
 * of its files into this gate — which dropped the reported branch coverage to
 * 64% and failed the build.
 *
 * Those files are not untested. signature-core carries the identical 90/85
 * gate and clears it at 95% statements / 87% branches under its own suite.
 * They only look uncovered from here because this package's tests exercise the
 * slice of the engine a React component needs. Measuring them twice, once
 * against a suite never written to cover them, gates this package on code it
 * does not own.
 */
const packageRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: [`${packageRoot}src/**/*.{ts,tsx}`],
      exclude: ["src/index.ts", "**/*.stories.tsx", "**/*.d.ts"],
      // The tier bar from the readiness audit: nothing merges below `beta`,
      // and `beta` is 90% lines / 85% branches.
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
    /**
     * 15s, not the 5s default.
     *
     * `signs with the keyboard alone` drives a whole signing flow through
     * `userEvent.tab()` and `.keyboard()` — no pointer events anywhere, which
     * is the point of it — and every one of those keystrokes yields to the
     * event loop. Under jsdom 30 that flow lands near five seconds, so the test
     * passed alone and failed intermittently in a full parallel run.
     *
     * The timeout is the honest lever here. Shortening the interaction would
     * weaken the WCAG 2.1.1 argument the test exists to make, and
     * `delay: null` would remove the async gaps that make it resemble a real
     * keyboard user.
     */
    testTimeout: 15_000,
    environment: "jsdom",
    /*
     * 20s, against Vitest's 5s default.
     *
     * Every test here drives a real antd Modal through jsdom, which has no
     * layout engine and no compositor — the suite takes ~26s for 45 tests on a
     * developer machine, and the longest chains (open the modal, switch tab,
     * fill two fields, submit) sit near 2.5s locally. A CI runner is several
     * times slower, so 5s is a budget the environment cannot meet rather than a
     * signal that anything is wrong. The Playwright suite covers the same paths
     * in a browser, where they take milliseconds.
     */
    testTimeout: 20_000,
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
  },
});
