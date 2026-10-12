import { defineConfig } from "vitest/config";

/**
 * `node`: this package answers questions over stdio and HTTP. Nothing renders.
 *
 * The tests read the manifest `pnpm gen` wrote — the same one the build
 * bundles — so every answer is checked against the real catalog.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["src/**/*.ts"],
      // The barrel is re-exports; stdio.ts's serving branch needs a real stdin,
      // and the binary is smoke-tested end to end instead.
      exclude: ["src/index.ts", "**/*.d.ts"],
      // Set at what the suite reaches. Ratchet these up; never down.
      thresholds: { lines: 95, functions: 88, branches: 83, statements: 93 },
    },
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
