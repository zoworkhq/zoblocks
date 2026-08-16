import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Absolute, because a bare `src/**` glob is not anchored to this package.
 *
 * This package's tests import `@oxygenui-design/identity-core`, whose sources
 * also live under `src/`. Vitest 3 reported only this package's files; Vitest 4
 * matches the sibling's `src/` too and folds eleven of its files into this
 * gate — which drops the reported statements to 77% and fails the build.
 *
 * Those files are not untested. identity-core carries its own 99/89/100 gate
 * and clears it under its own suite. They only look uncovered from here because
 * this package's tests exercise the slice of the engine a React component
 * needs. Measuring them twice, once against a suite never written to cover
 * them, gates this package on code it does not own.
 *
 * The same fix, for the same reason, is in packages/signature/vitest.config.ts.
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
       */
      thresholds: { lines: 98, functions: 100, branches: 93, statements: 98 },
    },
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.tsx", "test/**/*.test.tsx"],
  },
});
