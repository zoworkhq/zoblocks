import { defineConfig } from "vitest/config";

/**
 * `node`, deliberately.
 *
 * This package writes files and talks to a registry over HTTP. There is no
 * component in it and nothing that renders, so a DOM would only slow the suite
 * down and invite tests that assert against one.
 *
 * The tests drive the real commands against a temp directory and a stub fetch,
 * so what they assert on is the files that actually land on disk.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["src/**/*.ts"],
      /*
       * The barrel is re-exports. `constants.ts` is four strings. Covering
       * either would measure the test runner rather than the code.
       */
      exclude: ["src/index.ts", "src/constants.ts", "**/*.d.ts"],
      /*
       * Set at what the suite reaches. The residual gap is the interactive
       * dependency-install path, which spawns a package manager: exercising it
       * for real would run pnpm inside a test, and mocking `spawn` would assert
       * the mock rather than the behaviour.
       *
       * Ratchet these up; never down.
       */
      thresholds: { lines: 92, functions: 93, branches: 82, statements: 91 },
    },
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
