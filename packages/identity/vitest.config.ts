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
      exclude: ["src/index.ts", "**/*.d.ts"],
      /**
       * Ratcheted to what the suite actually reaches, not to the repo floor.
       *
       * What is left uncovered is the class of branch that cannot be reached by
       * construction: the `?? fallback` arms that `noUncheckedIndexedAccess`
       * forces on every indexed read, and the `never` default that makes a new
       * union member a compile error. A test that claimed to exercise those
       * would be asserting on a lie, so the ceiling sits just under them and the
       * gate protects the rest.
       */
      /*
       * Statements recalibrated for Vitest 4, not relaxed.
       *
       * Vitest 4 enables AST-aware coverage remapping, which attributes
       * statements more precisely than Vitest 3 and reports a slightly lower
       * number for identical code and identical tests. Nothing here became less
       * covered — lines still clear 98, branches 93, functions 100. The
       * statement bar moves 98 → 97 to sit just under the new measurement, so a
       * real regression still fails the build.
       */
      thresholds: { lines: 98, functions: 100, branches: 93, statements: 97 },
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
    include: ["src/**/*.test.tsx", "test/**/*.test.tsx"],
  },
});
