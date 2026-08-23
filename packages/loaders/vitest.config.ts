import { defineConfig } from "vitest/config";

/**
 * Custom elements need a real DOM with `customElements` and shadow roots, so
 * these run in jsdom rather than node. What they assert is exactly what a Vue
 * or Angular host would observe: the element upgrades, attributes reflect,
 * roles land on the host, and events cross the shadow boundary.
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
  },
});
