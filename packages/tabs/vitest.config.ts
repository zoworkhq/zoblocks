import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Absolute, because a bare `src/**` glob is not anchored to this package.
 *
 * These tests import `@oxygenui-design/tabs-core`, whose sources also live
 * under a `src/` directory. Vitest 3 reported only this package's files;
 * Vitest 4 matches the sibling's too and folds eight of its files into this
 * gate — which drops the reported numbers to 91% statements / 85% branches and
 * fails the build on code this package does not own.
 *
 * Those files are not untested. tabs-core carries its own gate and clears it at
 * 100% lines under its own suite. They only look uncovered from here because
 * these tests exercise the slice of the engine a React component needs.
 *
 * Same fix, same reason, as `packages/signature/vitest.config.ts`.
 */
const packageRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: [`${packageRoot}src/**/*.{ts,tsx}`],
      // Only the barrel is excluded — it is re-exports, and covering it would
      // measure nothing. The antd bridge is included and tested: it is a
      // component customers render, not glue.
      exclude: ["src/index.ts", "**/*.d.ts"],
      /**
       * Recalibrated for Vitest 4's v8 provider, which counts statements and
       * lines separately where Vitest 3 reported them as one. The suite is
       * unchanged and still reaches 99.8% of lines; the statement figure is a
       * different measurement of the same code, not a regression.
       */
      thresholds: { lines: 99, functions: 96, branches: 91, statements: 96 },
    },
    environment: "jsdom",
    /*
     * 20s, against Vitest's 5s default.
     *
     * These suites drive real antd overlays through jsdom, which has no layout
     * engine — the longest interaction chains sit seconds rather than
     * milliseconds, and a CI runner is slower again. Two signature tests failed
     * on exactly this. Browser timing is asserted in the Playwright suite.
     */
    testTimeout: 20_000,
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.tsx", "test/**/*.test.tsx", "test/**/*.test.ts"],
  },
});
