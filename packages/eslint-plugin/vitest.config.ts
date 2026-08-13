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
    // Rules live in rules/, not src/. The previous glob matched nothing, and
    // because the test script passes with no tests, the first rule test added
    // would have been skipped silently — the exact failure this file's comment
    // was written to prevent.
    include: ["rules/**/*.test.js"],
  },
});
