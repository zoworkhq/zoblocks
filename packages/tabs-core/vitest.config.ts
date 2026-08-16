import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "**/*.d.ts"],
      // The tier bar from the readiness audit: nothing merges below `beta`,
      // and `beta` is 90% lines / 85% branches.
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
    // No DOM: that is the point of this package, and running it in jsdom would
    // let a DOM dependency creep in without failing anything.
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
