import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
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
      thresholds: { lines: 100, functions: 98, branches: 93, statements: 100 },
    },
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.tsx", "test/**/*.test.tsx", "test/**/*.test.ts"],
  },
});
