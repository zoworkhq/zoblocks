/**
 * Shipped stylesheets reference tokens that exist.
 *
 * `test/registry-css-vars.test.ts` already asserts this — for `.ts` and `.tsx`
 * only. Every component's colour actually lives in a `.css` file beside it, so
 * the check covered the smaller half of the surface and the CSS went unread.
 *
 * CareTeamPresence shipped `var(--zb-surface-sunken, #f1f5f9)` and
 * `var(--zb-radius-md, 6px)`. Neither name has ever existed: the real ones are
 * `--zb-bg-muted` and `--zb-radius`. Both had a plausible fallback, so nothing
 * failed — the fallback simply won in every theme, and the avatar chip stayed
 * light grey in dark mode with light-grey initials on it, at roughly 1.9:1.
 * Every unit test passed, axe passed, the contrast gate passed (it reads
 * tokens, not stylesheets), and the component was invisible only to a person
 * looking at it in the dark theme.
 *
 * That is the same failure the sibling test was written for, one file
 * extension over. A fallback is what makes it silent: without one the
 * declaration is dropped and something obviously breaks; with one the wrong
 * value is used forever and looks deliberate.
 */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ICON_SLOTS } from "@zoblocks/theme";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SKIP_DIRS = new Set(["node_modules", "dist", ".next", ".turbo", ".claude"]);

function filesUnder(dir: string, extensions: readonly string[]): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry) || entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(filesUnder(full, extensions));
    else if (extensions.some((extension) => full.endsWith(extension))) out.push(full);
  }
  return out;
}

const SEARCHED = ["packages", "registry", "apps/docs/src"];

const STYLESHEETS = SEARCHED.flatMap((dir) => filesUnder(path.join(ROOT, dir), [".css"]));
const SOURCES = SEARCHED.flatMap((dir) => filesUnder(path.join(ROOT, dir), [".ts", ".tsx"]));

/**
 * Every `--zb-*` a stylesheet may legitimately name.
 *
 * Three origins, all of them real:
 *
 *  - the token build, which is what a consumer gets from
 *    `@zoblocks/tokens` without opting into anything;
 *  - a declaration in any shipped stylesheet, which is where component-scoped
 *    tokens like `--zb-switch-track-w` live;
 *  - a property set at runtime from TypeScript. `--zb-loader-phase`,
 *    `--zb-tabs-ind-x` and `--zb-signature-bleed` are written as inline styles
 *    by the component that reads them, and they are as real as the other two.
 */
const tokens = JSON.parse(
  readFileSync(path.join(ROOT, "packages/tokens/src/tokens.json"), "utf8"),
) as Record<string, unknown>;

const DEFINED = new Set<string>();

for (const group of ["themes", "density", "component"] as const) {
  const sets = tokens[group];
  if (!sets || typeof sets !== "object") continue;
  for (const set of Object.values(sets as Record<string, unknown>)) {
    if (set && typeof set === "object") {
      for (const name of Object.keys(set as Record<string, unknown>)) DEFINED.add(name);
    }
  }
}

for (const file of STYLESHEETS) {
  for (const match of readFileSync(file, "utf8").matchAll(/^\s*(--zb-[a-z0-9-]+)\s*:/gm)) {
    DEFINED.add(match[1] as string);
  }
}

for (const file of SOURCES) {
  // `"--zb-loader-phase"` as an object key or a setProperty argument. Blunt on
  // purpose: over-collecting here costs a token that was going to be fine, and
  // under-collecting costs a false failure on a component that works.
  for (const match of readFileSync(file, "utf8").matchAll(/["'`](--zb-[a-z0-9-]+)["'`]/g)) {
    DEFINED.add(match[1] as string);
  }
}

/**
 * Override slots: named on purpose, defined nowhere on purpose.
 *
 * These are the opposite of the bug above. The whole contract is that the
 * property is *unset* until a deployment sets it — `var(--zb-icon-send,
 * <the built-in>)` draws the shipped glyph and takes the customer's when
 * they provide one. Defining them would break the mechanism, so the check
 * cannot ask for a definition; it asks for the name to be listed here, which
 * is the difference between an override slot and a typo.
 *
 * The icon family is read from the theme package rather than retyped, so a new
 * replaceable slot does not need an edit in two places.
 */
for (const { slot } of ICON_SLOTS) DEFINED.add(`--zb-icon-${slot}`);

const OVERRIDE_SLOTS: ReadonlyArray<[name: string, why: string]> = [
  // `mask-image: var(--zb-icon-{slot}, …)` is assembled from a data attribute,
  // so the bare prefix appears in the source as a composition rather than a name.
  ["--zb-icon-", "the prefix the icon rules compose a slot name onto"],
  [
    "--zb-accordion-intrinsic",
    "content-visibility guess for a collapsed section; a host that knows its own row height sets it",
  ],
  ["--zb-signature-bleed", "print bleed for the signature block, set per deployment"],
  ["--zb-tabs-font-numeric", "numeric face for tab counts, after --zb-font-numeric"],
];

for (const [name] of OVERRIDE_SLOTS) DEFINED.add(name);

const SHEETS = STYLESHEETS.map((file) => ({
  name: path.relative(ROOT, file),
  text: readFileSync(file, "utf8"),
}));

describe("stylesheets reference tokens that exist", () => {
  it("finds stylesheets to check, so a path change cannot quietly empty this suite", () => {
    expect(SHEETS.length).toBeGreaterThan(10);
    // And the token build was actually read, rather than silently parsed to {}.
    expect(DEFINED.has("--zb-text-muted")).toBe(true);
    expect(DEFINED.has("--zb-bg-muted")).toBe(true);
  });

  it("keeps the override-slot list honest, so it cannot become a dumping ground", () => {
    // Every listed slot is still referenced by a stylesheet. An entry nobody
    // uses any more is a suppression waiting to hide the next real one.
    const referenced = new Set(
      SHEETS.flatMap(({ text }) =>
        [...text.matchAll(/var\(\s*(--zb-[a-z0-9-]+)/g)].map((m) => m[1] as string),
      ),
    );
    const stale = OVERRIDE_SLOTS.map(([name]) => name).filter((name) => !referenced.has(name));
    expect(stale).toEqual([]);
  });

  it.each(SHEETS)("$name names only tokens that are defined", ({ text }) => {
    const unknown = new Set<string>();
    // Matches with or without a fallback. The fallback is precisely what makes
    // the bug silent, so it cannot also be what excuses the reference.
    for (const match of text.matchAll(/var\(\s*(--zb-[a-z0-9-]+)/g)) {
      const name = match[1] as string;
      if (!DEFINED.has(name)) unknown.add(name);
    }
    expect([...unknown]).toEqual([]);
  });
});
