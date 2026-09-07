import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Coverage globs are anchored to this package.
 *
 * Vitest 4 resolves a relative `coverage.include` against the workspace root
 * rather than the config file, and every ZoBlocks package resolves its workspace
 * siblings to their TypeScript source. The combination silently pulled
 * copilot-core's files into this package's report and tanked the branch figure
 * with code another suite already covers. Anchoring says what was always meant.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url));

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
      include: [path.join(HERE, "src/**/*.{ts,tsx}")],
      // `fhir-types.ts` is type declarations only — it emits no runtime code, so
      // v8 reports it as 0% of nothing and drags the total down for a file that
      // cannot be covered. The barrel is excluded for the same reason.
      exclude: ["src/index.ts", "src/fhir-types.ts", "**/*.d.ts"],
      // The tier bar from the readiness audit: nothing merges below `beta`,
      // and `beta` is 90% lines / 85% branches.
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
