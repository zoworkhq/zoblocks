import { defineConfig } from "vitest/config";

/**
 * jsdom, for the one React file. Everything else — the document model, the ramp
 * generator, the CSS emitter — is pure and is tested without a DOM, because it
 * has to run in three places: a build, a server action, and a browser.
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
