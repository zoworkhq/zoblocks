import { defineConfig } from "vitest/config";

/**
 * `node`, deliberately.
 *
 * A codemod that needed a DOM would be a codemod that had reached for a
 * browser parser. This one operates on text and runs in CI, in a pre-commit
 * hook, or from a terminal — none of which have a window.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "**/*.d.ts"],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
