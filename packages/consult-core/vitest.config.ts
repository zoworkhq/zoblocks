import { defineConfig } from "vitest/config";

/**
 * `node`, deliberately — same reasoning as signature-core.
 *
 * This engine assembles prompts, runs classifiers, drives a state machine and
 * emits FHIR. None of that needs a DOM, and running the suite without one is
 * what proves it: a package that quietly reached for `window` or `document`
 * would fail on import here rather than at a customer's first server render.
 *
 * It is a stronger claim for this package than for signature-core, because the
 * safety pipeline is the part most likely to be run server-side — a host that
 * wants to classify before the request ever reaches the browser should be able
 * to import `runPipeline` in a Node handler and have it work.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/index.ts", "**/*.d.ts"],
      // The tier bar from the readiness audit: nothing merges below `beta`,
      // and `beta` is 90% lines / 85% branches.
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
