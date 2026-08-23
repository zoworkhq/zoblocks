import { defineConfig } from "vitest/config";

/**
 * Present so this package does not inherit the repository-root config.
 *
 * The root config describes the registry and excludes `packages/**`. Inherited
 * here it matches nothing — and because this package's test script passes with
 * no tests, the first test added would be skipped silently rather than failing.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
  },
});
