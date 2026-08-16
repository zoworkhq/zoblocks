import { defineConfig } from "vitest/config";

/**
 * `jsdom` here, unlike consult-core's `node`.
 *
 * This package exists to own the parts that only make sense with a DOM —
 * focus movement, live-region announcement, keyboard handling on a combobox.
 * Testing those without a DOM would mean testing something else.
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
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
  },
});
