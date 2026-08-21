import { defineConfig } from "vitest/config";

/**
 * `node`, deliberately.
 *
 * The validator takes a token source in and produces a list of problems out.
 * Nothing here needs a DOM — and running it without one is what proves the
 * claim that makes this package worth extracting: the same module runs in the
 * build, in a server action, and in a browser. A file that quietly reached for
 * `window` or `node:fs` would fail on import here rather than in the app.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["src/validate/**/*.ts"],
      exclude: ["src/validate/index.ts", "**/*.d.ts"],
      // The gate protecting clinical colour is held to the `stable` bar, not
      // `beta`: it is the one module whose silent failure ships a wrong
      // clinical signal.
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
