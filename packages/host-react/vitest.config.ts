import { defineConfig } from "vitest/config";

/**
 * jsdom, because the whole point of an adapter is what it renders: the MUI
 * translation is only correct if `type="primary"` reaches a real
 * `MuiButton-contained` in the DOM, and a unit test over the props object
 * would pass while the button came out wrong.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/index.ts", "**/*.d.ts"],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
    // antd's theme work is slow under load; the bridge-antd suite already
    // times out at the 5000 ms default when 50 turbo tasks compete.
    testTimeout: 20000,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    globals: true,
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
  },
});
