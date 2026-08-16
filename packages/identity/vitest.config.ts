import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Absolute, because a bare `src/**` glob is not anchored to this package.
 *
 * This package's tests import `@oxygenui-design/identity-core`, whose own
 * sources also live under a `src/` directory. Vitest 3 reported only this
 * package's files; Vitest 4 follows the workspace symlink and folded all
 * eleven of the sibling's files into this gate — 11 of the 19 files measured
 * here — which dropped reported branch coverage to 67% and failed the build.
 *
 * Those files are not untested. identity-core carries its own gate and clears
 * it under its own suite. They only look uncovered from here because this
 * package's tests exercise the slice of the engine a React component needs.
 * See `packages/signature/vitest.config.ts` for the same fix and its history.
 */
const packageRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: [`${packageRoot}src/**/*.{ts,tsx}`],
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
       *
       * Statements re-derived for Vitest 4, NOT relaxed: the suite is unchanged
       * and still passes 174/174. The v8 provider now counts statements
       * separately from lines, so the old figure measured a different
       * denominator. Ratchet up; never down.
       */
      thresholds: { lines: 98, functions: 100, branches: 93, statements: 97 },
    },
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.tsx", "test/**/*.test.tsx"],
  },
});
