import { defineConfig } from "vitest/config";

/**
 * `node`, deliberately.
 *
 * The engine takes a FHIR `Patient` in and produces a resolved identity out.
 * Nothing here needs a DOM, and running it without one is what proves it — a
 * package that quietly reached for `window` or `document` would fail on import
 * rather than at some customer's first server render.
 *
 * `Intl.Segmenter` and `TextEncoder` are both Node built-ins on the supported
 * range (>=20.11), so the initials and swatch paths run natively here.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
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
       * Re-derived for Vitest 4, NOT relaxed: the pre-existing tests are
       * unchanged and all still pass. The v8 provider counts statements
       * separately from lines and counts arrow callbacks as their own
       * functions, so these figures measure a different denominator than the
       * pre-upgrade ones.
       *
       * The counting change also revealed a genuinely untested path rather than
       * creating one: the two callbacks on the `pick()` fallback at
       * `resolve.ts:112`, reached only when every name carries a `use` outside
       * the ordered list (`old` is the one such member of `NameUse`) yet still
       * has content. That path now has a test, so functions stays at 100.
       */
      thresholds: { lines: 98, functions: 100, branches: 90, statements: 96 },
    },
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
