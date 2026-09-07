/**
 * `@/lib/utils` means two different files, and both must satisfy the registry.
 *
 * Registry components import `@/lib/utils` because that is where the ZoBlocks
 * CLI writes it in a consumer's project. Inside the docs app the same specifier
 * resolves to `apps/docs/src/lib/utils.ts` — the app's own utils, mapped ahead
 * of `@/*` in its tsconfig — and the two files happen to agree on `cn`, so
 * nothing has ever noticed.
 *
 * A second export added to the registry's copy is where it stops being a
 * coincidence. `clockTime` was added there, every unit test passed, the
 * generator passed, the typecheck passed, and the docs preview failed at
 * runtime with "Export clockTime doesn't exist in target module" — because the
 * preview was reading the other file. The bug is invisible everywhere except a
 * browser, which is the worst place to find it.
 *
 * The real invariant is that the app's utils must be a superset of the
 * registry's. Two ways to satisfy it: add the export to both, or (better) put
 * the shared thing in its own `@/lib/zoblocks-*` module, which no application
 * shadows. `lib/clock.ts` is what came of this one.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Specifiers a registry component may use that an application is likely to
 * own already, mapped to the file each side resolves to.
 *
 * `@/lib/utils` is the only one today. `@/lib/zoblocks-*` is deliberately not
 * here: the prefix exists precisely so those cannot collide with an app's own
 * modules.
 */
const SHADOWED: ReadonlyArray<{
  specifier: string;
  registry: string;
  app: string;
}> = [
  {
    specifier: "@/lib/utils",
    registry: "registry/zoblocks/lib/utils.ts",
    app: "apps/docs/src/lib/utils.ts",
  },
];

/** Top-level `export function foo` / `export const foo`. */
function exportsOf(file: string): Set<string> {
  const source = readFileSync(path.join(ROOT, file), "utf8");
  const names = new Set<string>();
  for (const match of source.matchAll(
    /^export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z0-9_$]+)/gm,
  )) {
    names.add(match[1] as string);
  }
  return names;
}

describe("a shadowed shared module keeps both copies compatible", () => {
  it.each(SHADOWED)(
    "$specifier — the app's copy exports everything the registry's does",
    ({ registry, app }) => {
      const required = exportsOf(registry);
      const provided = exportsOf(app);

      // Sanity: both files were actually read.
      expect(required.size).toBeGreaterThan(0);
      expect(provided.size).toBeGreaterThan(0);

      const missing = [...required].filter((name) => !provided.has(name));
      expect(
        missing,
        "add these to the app's utils, or move them into a `@/lib/zoblocks-*` module " +
          "that no application shadows — see lib/clock.ts",
      ).toEqual([]);
    },
  );
});
