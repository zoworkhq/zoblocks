import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Coverage globs are anchored to this package.
 *
 * Vitest 4 resolves a relative `coverage.include` against the workspace root
 * rather than the config file, and every Oxygen package resolves its workspace
 * siblings to their TypeScript source — so this package silently began
 * instrumenting its own core and reporting that core's coverage as its own.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: [path.join(HERE, "src/**/*.ts")],
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
