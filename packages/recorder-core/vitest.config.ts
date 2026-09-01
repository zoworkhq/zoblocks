import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Coverage globs are anchored to this package.
 *
 * Vitest 4 resolves a relative `coverage.include` against the workspace root
 * rather than the config file, so a relative glob here would instrument every
 * sibling core and report their coverage as this package's.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: [path.join(HERE, "src/**/*.ts")],
      exclude: ["src/index.ts", "**/*.d.ts"],
      // Set at what the suite actually clears, above the `beta` bar from the
      // readiness audit (90% lines / 85% branches). Ratchet up; never down.
      thresholds: { lines: 95, functions: 95, branches: 92, statements: 95 },
    },
    // No DOM. That is the point of this package: the engine is specified
    // against plain numbers, and running it in jsdom would let a DOM
    // dependency creep in without failing anything.
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
