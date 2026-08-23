import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/*
 * The package directory, handed to the tests explicitly.
 *
 * `manifest.test.ts` reads real files off disk, and neither `process.cwd()` nor
 * `import.meta.url` identifies this directory reliably: cwd is the workspace
 * root when turbo runs the suite, and under jsdom the module URL is an http one
 * that no file path can be resolved out of. This config file is the one place
 * that knows where it is.
 */
const here = fileURLToPath(new URL(".", import.meta.url));

/**
 * jsdom, because half of this package is a panel and the thing worth asserting
 * about a panel is what it renders. The gate itself is pure and would run
 * anywhere; keeping one environment for both avoids a second config whose only
 * job is to be faster on the half that is already fast.
 */
export default defineConfig({
  test: {
    env: { PLUGIN_ROOT: here },
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/sandbox/main.ts", "src/ui/main.ts"],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
});
