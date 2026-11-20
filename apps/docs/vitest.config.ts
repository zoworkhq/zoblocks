import { readFileSync } from "node:fs";
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

/** `@/components/zoblocks/*` and `@/lib/zoblocks-*`, one exact alias each. */
function generatedAliases() {
  const config = JSON.parse(readFileSync(path.join(root, "tsconfig.generated.json"), "utf8")) as {
    compilerOptions: { paths: Record<string, string[]> };
  };
  return (
    Object.entries(config.compilerOptions.paths)
      // The docs app has its own `cn`; the `@` catch-all below finds it.
      .filter(([specifier]) => specifier !== "@/lib/utils")
      .map(([specifier, [target]]) => ({
        find: new RegExp(`^${specifier.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}$`),
        replacement: path.join(root, target as string),
      }))
  );
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    /*
     * The tsconfig paths the registry components need: they import each other
     * and their shared core by the paths the CLI writes in a consumer's
     * project. Read from tsconfig.generated.json rather than repeated here — a
     * hand-kept copy missed `@/lib/zoblocks-allergy`, and every suite that
     * reached the allergy chip failed to load. Exact matches come before the
     * `@` catch-all, because Vite takes the first alias that matches.
     */
    alias: [
      { find: /^@\/registry\/(.*)$/, replacement: path.join(root, "../../registry/$1") },
      { find: /^@examples\/(.*)$/, replacement: path.join(root, "../../examples/$1") },
      ...generatedAliases(),
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
