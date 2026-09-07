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
 * `jsdom` here, unlike copilot-core's `node`.
 *
 * This package exists to own the parts that only make sense with a DOM —
 * focus movement, live-region announcement, keyboard handling on a combobox.
 * Testing those without a DOM would mean testing something else.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: [path.join(HERE, "src/**/*.{ts,tsx}")],
      exclude: ["src/index.ts", "**/*.d.ts"],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
    environment: "jsdom",
    /*
     * 20s, against Vitest's 5s default — same reason as the signature package.
     * These suites drive real antd overlays through jsdom, which has no layout
     * engine, so the long interaction chains sit seconds rather than
     * milliseconds and a CI runner is slower again. The browser coverage of the
     * same paths lives in the Playwright suite.
     */
    testTimeout: 20_000,
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
  },
});
