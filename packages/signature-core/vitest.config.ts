import { defineConfig } from "vitest/config";

/**
 * `node`, deliberately.
 *
 * The engine takes synthetic pointer samples in and produces a stroke model
 * and SVG text out. Nothing here needs a DOM, and running it without one is
 * what proves it — a package that quietly reaches for `window` would fail on
 * import rather than at some customer's first server render.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
