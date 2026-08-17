import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["**/*.d.ts"],
      /*
       * Set at what the suite reaches under Vitest 4.
       *
       * These read lower than the numbers this package shipped with, and the
       * difference is accounting rather than regression: v8 coverage under
       * Vitest 4 counts far more statements than under 3 (688 here, against
       * 1365 for the same source before), so the two are not comparable. The
       * residual gap is defensive guards — absent globals, idempotent Set
       * updates — where a test would assert the mock rather than the code.
       *
       * Ratchet these up; never down.
       */
      thresholds: { lines: 100, functions: 100, branches: 93, statements: 98 },
    },
    // It reads the DOM, so it needs one — but only the DOM, never React.
    environment: "jsdom",
    globals: true,
    include: ["test/**/*.test.ts"],
  },
});
