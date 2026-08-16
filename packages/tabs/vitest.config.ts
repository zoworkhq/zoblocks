import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      // `antd.ts` is the optional bridge: exercising it means booting antd's
      // whole theme engine in jsdom to assert a token map, which tests antd
      // rather than this package. It is covered by the smoke app instead.
      exclude: ["src/index.ts", "src/antd.ts", "**/*.d.ts"],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.tsx", "test/**/*.test.tsx", "test/**/*.test.ts"],
  },
});
