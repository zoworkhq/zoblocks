/**
 * Registry components reference tokens that exist, in syntax Tailwind 4 parses.
 *
 * This test exists because the Copilot skin shipped with all 89 of its colour
 * references dead, and every other test passed.
 *
 * Two failure modes stacked, and both are silent by construction:
 *
 * **The v3 shorthand.** Tailwind 3 let `bg-[--zb-surface]` mean
 * `background-color: var(--zb-surface)`. Tailwind 4 removed it, so the same
 * class now emits `background-color: --zb-surface` — not a build error, not a
 * console warning, just an invalid declaration the browser drops. The element
 * renders transparent. In v4 the shorthand is `bg-(--zb-surface)`; the house
 * writes `bg-[var(--zb-surface)]`, which works in both.
 *
 * **Invented token names.** `--zb-rule`, `--zb-status-accent` and
 * `--zb-surface-2` were plausible, consistent with their neighbours, and had
 * never been defined anywhere. An undefined custom property resolves to nothing
 * and the declaration is dropped — again silently.
 *
 * Neither is reachable by a rendering test that asserts on roles and text: the
 * component is perfectly accessible and perfectly functional while being
 * invisible. Only computed style catches it, and no test was reading computed
 * style. So the assertion moved to the source, where it is cheap and covers
 * every component at once rather than the one that happened to break.
 */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = path.join(ROOT, "registry/zoblocks");

/**
 * Every `--zb-*` a registry component may name.
 *
 * The theme sets plus the density and component scales — the tokens a consumer
 * gets from `@zoblocks/tokens` without opting into anything. A component
 * that reaches past this list is depending on a variable its own consumers will
 * not have, which is the same bug with a longer fuse.
 */
const tokens = JSON.parse(
  readFileSync(path.join(ROOT, "packages/tokens/src/tokens.json"), "utf8"),
) as Record<string, Record<string, Record<string, string>>>;

const DEFINED = new Set<string>(
  ["themes", "density", "component"].flatMap((group) =>
    Object.values(tokens[group] ?? {}).flatMap((set) => Object.keys(set ?? {})),
  ),
);

/**
 * Plus anything a shipped stylesheet declares.
 *
 * Component-scoped tokens (`--zb-accordion-font`, `--zb-switch-track-w`) are
 * declared in the CSS that ships beside the component rather than in
 * `tokens.json`, and they are just as real. Reading both is what keeps this
 * test a check on *existence* rather than on which file a token lives in.
 */
function declaredIn(dir: string): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(declaredIn(full));
    else if (full.endsWith(".css")) {
      out = out.concat(
        [...readFileSync(full, "utf8").matchAll(/^\s*(--zb-[a-z0-9-]+)\s*:/gm)].map(
          (m) => m[1] as string,
        ),
      );
    }
  }
  return out;
}

for (const dir of ["packages", "registry", "apps/docs/src"]) {
  for (const name of declaredIn(path.join(ROOT, dir))) DEFINED.add(name);
}

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return sources(full);
    if (!full.endsWith(".tsx") && !full.endsWith(".ts")) return [];
    if (/\.(test|stories)\.tsx?$/.test(full)) return [];
    return [full];
  });
}

const FILES = sources(REGISTRY).map((file) => ({
  name: path.relative(ROOT, file),
  text: readFileSync(file, "utf8"),
}));

describe("registry components reference CSS variables correctly", () => {
  it("finds sources to check, so a path change cannot quietly empty this suite", () => {
    expect(FILES.length).toBeGreaterThan(8);
  });

  it.each(FILES)("$name uses no Tailwind 3 bare-variable shorthand", ({ text }) => {
    // `bg-[--foo]` — parses, emits invalid CSS, renders transparent.
    const dead = [...text.matchAll(/[\w-]+-\[--[a-z0-9-]+\]/g)].map((m) => m[0]);
    expect(dead).toEqual([]);
  });

  it.each(FILES)("$name names only tokens that are defined", ({ text }) => {
    const unknown = [...text.matchAll(/var\((--zb-[a-z0-9-]+)\)/g)]
      .map((m) => m[1] as string)
      .filter((name) => !DEFINED.has(name));
    expect([...new Set(unknown)]).toEqual([]);
  });

  it.each(FILES)("$name applies no opacity modifier to an arbitrary colour", ({ text }) => {
    // `bg-[var(--x)]/20` does not compose — the modifier is dropped and the
    // colour lands at full strength, which reads as a styling choice rather
    // than a bug. `color-mix()` is the form that survives.
    const bad = [...text.matchAll(/\[var\(--zb-[a-z0-9-]+\)\]\/\d+/g)].map((m) => m[0]);
    expect(bad).toEqual([]);
  });
});
