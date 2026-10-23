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
    /*
     * Mirrors the tsconfig paths the registry components need: they import
     * each other and their shared core by the paths the CLI writes in a
     * consumer's project. More specific entries first — Vite takes the first
     * alias that matches.
     */
    alias: [
      { find: /^@\/registry\/(.*)$/, replacement: path.join(root, "../../registry/$1") },
      {
        find: /^@\/lib\/zoblocks-loader$/,
        replacement: path.join(root, "../../registry/zoblocks/lib/loader.tsx"),
      },
      {
        find: /^@\/lib\/zoblocks-clinical-status$/,
        replacement: path.join(root, "../../registry/zoblocks/lib/clinical-status.ts"),
      },
      {
        find: /^@\/lib\/zoblocks-accordion$/,
        replacement: path.join(root, "../../registry/zoblocks/lib/accordion-core.tsx"),
      },
      {
        find: /^@\/lib\/zoblocks-(datetime(?:-field|-parts)?|availability|recurrence)$/,
        replacement: path.join(root, "../../registry/zoblocks/lib/$1"),
      },
      {
        find: /^@\/lib\/zoblocks-grid$/,
        replacement: path.join(root, "../../registry/zoblocks/lib/grid.ts"),
      },
      {
        find: /^@\/lib\/timeline-(core|fhir)$/,
        replacement: path.join(root, "../../registry/zoblocks/lib/timeline-$1.ts"),
      },
      {
        find: /^@\/components\/zoblocks\/timeline$/,
        replacement: path.join(root, "../../registry/zoblocks/timeline/timeline.tsx"),
      },
      {
        find: /^@\/lib\/zoblocks-recorder$/,
        replacement: path.join(root, "../../registry/zoblocks/lib/recorder.tsx"),
      },
      {
        find: /^@\/lib\/zoblocks-menu$/,
        replacement: path.join(root, "../../registry/zoblocks/lib/menu.ts"),
      },
      {
        find: /^@\/lib\/zoblocks-switch$/,
        replacement: path.join(root, "../../registry/zoblocks/lib/switch.tsx"),
      },
      {
        find: /^@\/components\/zoblocks\/([a-z-]+-loader)$/,
        replacement: path.join(root, "../../registry/zoblocks/$1/$1.tsx"),
      },
      { find: "@", replacement: path.join(root, "src") },
    ],
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
