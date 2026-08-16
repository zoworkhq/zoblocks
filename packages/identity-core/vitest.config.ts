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
      // The tier bar from the readiness audit: nothing merges below `beta`,
      // and `beta` is 90% lines / 85% branches.
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
