import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Component tests for the registry — the exact source customers receive.
 *
 * The aliases are read from `tsconfig.generated.json` rather than restated
 * here. Registry components import each other by the path the shadcn CLI
 * writes into a consumer's project (`@/components/oxygen/status-badge`), and
 * that map is generated from component metadata. Duplicating it would mean a
 * new component typechecks, renders in the docs, and then fails only under
 * test — with a module-resolution error that looks like a broken test rather
 * than a missing mapping.
 */
function aliasesFromGeneratedTsconfig(): Record<string, string> {
  const root = __dirname;
  const cfg = JSON.parse(readFileSync(path.join(root, "tsconfig.generated.json"), "utf8"));
  const paths: Record<string, string[]> = cfg.compilerOptions?.paths ?? {};

  const alias: Record<string, string> = {};
  for (const [key, targets] of Object.entries(paths)) {
    const target = targets[0];
    if (!target || key.includes("*")) continue;
    alias[key] = path.resolve(root, target);
  }
  return alias;
}

export default defineConfig({
  resolve: {
    alias: {
      ...aliasesFromGeneratedTsconfig(),
      "@/registry": path.resolve(__dirname, "registry"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["registry/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    // Workspace packages run their own vitest through turbo. This config owns
    // the registry, which is not a package and would otherwise be tested by
    // nothing.
    exclude: ["**/node_modules/**", "packages/**", "apps/**"],
    coverage: {
      provider: "v8",
      include: ["registry/oxygen/**/*.tsx"],
      exclude: ["**/*.test.tsx", "**/*.meta.ts"],
      reporter: ["text-summary", "json-summary"],
    },
  },
});
