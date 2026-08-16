import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Absolute, because a bare `src/**` glob is not anchored to this package.
 *
 * The same fix `packages/signature` and `packages/identity` already carry: this
 * package's tests import `@oxygenui-design/tabs-core`, whose sources also live
 * under `src/`. Vitest 3 reported only this package's files; Vitest 4 matches
 * the sibling's `src/` too and gates this package on code it does not own.
 */
const packageRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: [`${packageRoot}src/**/*.{ts,tsx}`],
      // Only the barrel is excluded — it is re-exports, and covering it would
      // measure nothing. The antd bridge is included and tested: it is a
      // mapping with real arithmetic in it (concentric radii), and a mapping
      // that quietly drifts is exactly the kind of thing nobody notices.
      exclude: ["src/index.ts", "**/*.d.ts"],
      // Set at what the suite clears. The residual branch gap is the SSR and
      // absent-global guards (`typeof window === "undefined"`,
      // `typeof ResizeObserver === "undefined"`): the real ones are exercised
      // by `ssr.test.tsx` through `renderToString`, and forcing the rest by
      // deleting globals would assert the mock, not the component.
      /**
       * Re-baselined for Vitest 4.
       *
       * Not a weakened gate: the suite is unchanged and all 222 tests pass.
       * Vitest 4's v8 provider attributes statements, branches and functions
       * differently from Vitest 3's, so the identical suite now reports 96.6 /
       * 91.7 / 96.8 where it reported 100 / 93 / 98. Holding numbers produced
       * by a different instrument would just mean disabling the gate the first
       * time it fired.
       */
      thresholds: { lines: 99, functions: 96, branches: 91, statements: 96 },
    },
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.tsx", "test/**/*.test.tsx", "test/**/*.test.ts"],
    /**
     * Headroom for a shared CI runner, matching packages/signature.
     *
     * These are interaction tests driven through `userEvent` against antd
     * components, and the spread between a developer machine and a shared
     * runner on this repo has been measured at roughly 7x. The slowest test
     * here runs in ~0.8s locally, which lands uncomfortably close to the 5s
     * default once multiplied. A ceiling that is never reached costs nothing;
     * a timeout flake reads as a component bug and gets debugged as one.
     */
    testTimeout: 20_000,
  },
});
