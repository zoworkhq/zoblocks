import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Tests for the docs app itself.
 *
 * It had none, and the gap had a cost: the component playground is the one
 * place in this repository that builds prop combinations nobody wrote by hand,
 * and it shipped two crashes — a string handed to an array prop, and a
 * semantic mode given items shaped for a different one. Both were reachable in
 * two clicks and neither was reachable by any existing suite.
 */
const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.join(root, "src") },
  },
  test: {
    environment: "jsdom",
    /*
     * 20s, against Vitest's 5s default — the convention across this repo's
     * suites. These tests drive antd Modals, Selects and Forms through a
     * jsdom with no layout engine, several hundred times.
     */
    testTimeout: 20_000,
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
  },
});
