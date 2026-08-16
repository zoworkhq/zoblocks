import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/index.ts", "**/*.d.ts"],
      /**
       * Ratcheted to what the suite actually reaches, not to the repo floor.
       *
       * What is left uncovered is the class of branch that cannot be reached by
       * construction: the `?? fallback` arms that `noUncheckedIndexedAccess`
       * forces on every indexed read, and the `never` default that makes a new
       * union member a compile error. A test that claimed to exercise those
       * would be asserting on a lie, so the ceiling sits just under them and the
       * gate protects the rest.
       */
      thresholds: { lines: 98, functions: 100, branches: 93, statements: 98 },
    },
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.tsx", "test/**/*.test.tsx"],
  },
});
