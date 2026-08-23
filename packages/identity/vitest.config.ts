import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Absolute, because a bare `src/**` glob is not anchored to this package.
 *
 * This package's tests import `@oxygenui-design/identity-core`, whose sources
 * also live under a `src/` directory. Vitest 3 reported only this package's
 * files; Vitest 4 matches the sibling's `src/` too and folds ten of its files
 * into this gate — which drops the reported branch coverage from 94% to 67%
 * and fails the build.
 *
 * Those files are not untested. identity-core carries its own ratcheted gate
 * and clears it at 96% statements / 90% branches / 100% functions under its own
 * 301-test suite. They only look uncovered from here because this package's
 * tests exercise the slice of the engine a React component needs. Measuring
 * them twice, once against a suite never written to cover them, gates this
 * package on code it does not own.
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
       * The numbers are calibrated to Vitest 4's v8 provider, which counts
       * statements and lines separately where Vitest 3 reported them as one.
       */
      thresholds: { lines: 98, functions: 100, branches: 92, statements: 97 },
    },
    environment: "jsdom",
    /*
     * 20s, against Vitest's 5s default.
     *
     * These suites drive real overlays through jsdom, which has no layout
     * engine — the longest interaction chains sit seconds rather than
     * milliseconds, and a CI runner is slower again. Browser timing is
     * asserted in the Playwright suite.
     *
     * (This package takes no antd dependency; the note this was copied from
     * belongs to signature, which does.)
     */
    testTimeout: 20_000,
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
  },
});
