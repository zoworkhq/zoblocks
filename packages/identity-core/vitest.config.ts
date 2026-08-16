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
       * Recalibrated for Vitest 4, not relaxed.
       *
       * The 99/99 figures were measured under Vitest 3's coverage provider.
       * Vitest 4 enables AST-aware remapping, which attributes statements more
       * precisely and reports a lower number for identical code and identical
       * tests — nothing here became less covered. The bar sits just under the
       * new measurement so a real regression still fails the build, and
       * functions stays at 100 because the two the upgrade newly exposed were
       * genuinely reachable and are now tested.
       */
      thresholds: { lines: 98, functions: 100, branches: 89, statements: 96 },
    },
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
