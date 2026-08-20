import { defineConfig } from "vitest/config";

/**
 * `node`, deliberately.
 *
 * A bridge is a pure function from a framework's resolved theme to a set of
 * custom properties. It renders nothing, so nothing here needs a DOM — and
 * proving that is the point: the mapping can be tested, and a host's theme
 * validated, without mounting anything.
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
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
  },
});
