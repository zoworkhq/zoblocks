import { defineConfig } from "vitest/config";

/**
 * `node`, deliberately — and this one is load-bearing rather than tidy.
 *
 * The whole argument for building on ProseMirror's `model` and `transform`
 * rather than on an editor framework is that the document, its schema, the
 * gate rules and every serializer are pure data transformations. Running the
 * suite without a DOM is what proves that claim: a module that quietly reached
 * for `document` or `window` would fail on import here rather than at some
 * customer's first server render.
 *
 * It also keeps the suite fast enough that the fuzz tests survive. A provenance
 * fuzzer that takes thirty seconds gets deleted within a month, and the bugs it
 * would have caught ship instead.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/index.ts", "**/*.d.ts"],
      // Above the `beta` tier bar (90/85) from the readiness audit. This
      // package is pure functions with no I/O, so there is no honest excuse
      // for uncovered branches in it.
      thresholds: { lines: 95, functions: 95, branches: 90, statements: 95 },
    },
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
