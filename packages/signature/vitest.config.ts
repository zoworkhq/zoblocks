import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Absolute, because a bare `src/**` glob is not anchored to this package.
 *
 * This package's tests import `@oxygenui-design/signature-core`, whose own
 * sources also live under a `src/` directory. Vitest 3 reported only this
 * package's files; Vitest 4 matched the sibling's `src/` too and folded five
 * of its files into this gate — which dropped the reported branch coverage to
 * 64% and failed the build.
 *
 * Those files are not untested. signature-core carries the identical 90/85
 * gate and clears it at 95% statements / 87% branches under its own suite.
 * They only look uncovered from here because this package's tests exercise the
 * slice of the engine a React component needs. Measuring them twice, once
 * against a suite never written to cover them, gates this package on code it
 * does not own.
 */
const packageRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: [`${packageRoot}src/**/*.{ts,tsx}`],
      exclude: ["src/index.ts", "**/*.d.ts"],
      // The tier bar from the readiness audit: nothing merges below `beta`,
      // and `beta` is 90% lines / 85% branches.
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.tsx", "test/**/*.test.tsx"],
    /**
     * Four times the default, because these are the slowest tests in the repo
     * and the default was written for unit tests.
     *
     * "signs with the keyboard alone" drives a full typed signature through
     * `userEvent` — every keystroke separately, inside an antd Modal, against a
     * canvas — and each keystroke costs a jsdom layout pass. It runs in ~0.7s on
     * a developer machine and took 5.13s on a shared CI runner, which is a 7×
     * spread against a 5s budget.
     *
     * Raised rather than the test trimmed: what makes it worth having is that
     * it types a real name key by key, which is the path a keyboard-only signer
     * actually takes. Sampling fewer keystrokes to fit a timer would test
     * something nobody does. A generous ceiling costs nothing when the suite
     * passes and prevents a flake that reads as a component bug.
     */
    testTimeout: 20_000,
  },
});
