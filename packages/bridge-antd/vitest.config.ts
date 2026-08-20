import { defineConfig } from "vitest/config";

/**
 * jsdom, because the wrapper is a React component and the thing worth
 * asserting is what lands on the element's `style`. The mapping itself is a
 * pure function and is tested without rendering.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/index.ts", "**/*.d.ts"],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
  },
});
