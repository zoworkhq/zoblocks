import { defineConfig } from "vitest/config";

/**
 * Present so this package does not inherit the repository-root config.
 *
 * Vitest walks upward for a config when a package has none, and the root one
 * describes the registry: it includes `registry/**` and excludes `packages/**`.
 * Inherited here it matches nothing, and `vitest run` fails with "No test files
 * found" — pointing at this package rather than at the config it picked up.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
