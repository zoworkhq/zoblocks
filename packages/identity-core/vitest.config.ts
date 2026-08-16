import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Absolute, for the reason spelled out in `packages/signature/vitest.config.ts`. */
const packageRoot = fileURLToPath(new URL(".", import.meta.url));

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
      thresholds: { lines: 98, functions: 100, branches: 89, statements: 96 },
    },
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
