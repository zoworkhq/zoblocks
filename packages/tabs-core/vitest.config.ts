import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "**/*.d.ts"],
      // Well above the `beta` bar from the readiness audit (90% lines / 85%
      // branches), and set at what the suite actually clears. Ratchet these
      // up; never down. The remaining branch gap is a handful of defensive
      // guards whose only reachable form would be a faked global — a test of
      // the mock rather than of the code.
      thresholds: { lines: 100, functions: 100, branches: 99, statements: 100 },
    },
    // No DOM: that is the point of this package, and running it in jsdom would
    // let a DOM dependency creep in without failing anything.
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
