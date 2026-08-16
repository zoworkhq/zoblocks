import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Coverage globs are anchored to this package.
 *
 * Vitest 4 resolves a relative `coverage.include` against the workspace root
 * rather than the config file, and every Oxygen package resolves its workspace
 * siblings to their TypeScript source — so this package silently began
 * instrumenting its own core and reporting that core's coverage as its own.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: [path.join(HERE, "src/**/*.{ts,tsx}")],
      // Only the barrel is excluded — it is re-exports, and covering it would
      // measure nothing. The antd bridge is included and tested: it is a
      // mapping with real arithmetic in it (concentric radii), and a mapping
      // that quietly drifts is exactly the kind of thing nobody notices.
      exclude: ["src/index.ts", "**/*.d.ts"],
      // Set at what the suite clears. The residual branch gap is the SSR and
      // absent-global guards (`typeof window === "undefined"`,
      // `typeof ResizeObserver === "undefined"`): the real ones are exercised
      // by `ssr.test.tsx` through `renderToString`, and forcing the rest by
      // deleting globals would assert the mock, not the component.
      /*
       * Recalibrated for Vitest 4, not relaxed.
       *
       * Same measurement change as `identity` and `identity-core`: Vitest 4's
       * AST-aware remapping attributes statements and functions more precisely
       * and reports lower figures for identical code and identical tests. Lines
       * are 99.81 against a former 100, which is the shape of a counting change
       * rather than a coverage loss. Bars sit just under the new measurements.
       */
      thresholds: { lines: 99, functions: 96, branches: 91, statements: 96 },
    },
    environment: "jsdom",
    /*
     * 20s, against Vitest's 5s default — same reason as the signature package.
     * These suites drive real antd overlays through jsdom, which has no layout
     * engine, so the long interaction chains sit seconds rather than
     * milliseconds and a CI runner is slower again. The browser coverage of the
     * same paths lives in the Playwright suite.
     */
    testTimeout: 20_000,
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.tsx", "test/**/*.test.tsx", "test/**/*.test.ts"],
  },
});
