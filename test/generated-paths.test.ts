/**
 * The path mappings, checked in both places they have to exist.
 *
 * Registry components import each other by the path the Zoblocks CLI writes into
 * a consumer's project — `@/components/zoblocks/accordion`, `@/lib/zoblocks-switch`
 * — so those specifiers have to resolve in this repository too, and separately
 * in the docs app, which resolves from its own directory and cannot extend the
 * root file.
 *
 * The root map is generated and has been since four components were found
 * importing siblings that did not resolve. The docs map was not: it held three
 * of ten component specifiers, hand-written, and the seven that were missing
 * were not missing on purpose. They were simply unimportable, so nobody could
 * write a preview for them, so six components on the docs site rendered "Live
 * preview coming with the next release" — which reads as a roadmap rather than
 * as a missing line in a config file.
 *
 * Both are generated now. This asserts they agree, that every target exists,
 * and that the docs app's own tsconfig carries what the generator emits — the
 * last being the step a human still performs, and therefore the one that can
 * still drift.
 */

import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { CATALOG } from "../apps/docs/src/lib/generated/catalog";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = path.join(ROOT, "apps", "docs");

/**
 * tsconfig files are JSONC — comments and all — so this uses TypeScript's own
 * parser rather than JSON.parse plus a regex that strips comments. A regex gets
 * this wrong on the first `//` that appears inside a string, and `$schema` is a
 * URL.
 */
function readTsconfig(absolute: string): {
  compilerOptions?: { paths?: Record<string, string[]> };
} {
  const parsed = ts.parseConfigFileTextToJson(absolute, readFileSync(absolute, "utf8"));
  expect(parsed.error, `${path.relative(ROOT, absolute)} is not valid JSONC`).toBeUndefined();
  return parsed.config as { compilerOptions?: { paths?: Record<string, string[]> } };
}

const pathsOf = (absolute: string) => readTsconfig(absolute).compilerOptions?.paths ?? {};

const rootPaths = pathsOf(path.join(ROOT, "tsconfig.generated.json"));
const docsGeneratedPaths = pathsOf(path.join(DOCS, "tsconfig.generated.json"));
const docsPaths = pathsOf(path.join(DOCS, "tsconfig.json"));

/** Specifiers a registry component or a docs preview actually imports by. */
const specifiers = Object.keys(rootPaths);

describe("the generated maps agree with each other", () => {
  it("covers the same specifiers in both files", () => {
    expect(Object.keys(docsGeneratedPaths).sort()).toEqual(specifiers.sort());
  });

  it.each(specifiers)("%s points at the same file from both roots", (specifier) => {
    const fromRoot = path.resolve(ROOT, rootPaths[specifier]![0]!);
    const fromDocs = path.resolve(DOCS, docsGeneratedPaths[specifier]![0]!);
    expect(fromDocs).toBe(fromRoot);
  });

  it.each(specifiers)("%s resolves to a file that exists", (specifier) => {
    expect(existsSync(path.resolve(ROOT, rootPaths[specifier]![0]!))).toBe(true);
  });
});

describe("every component is importable from the docs app", () => {
  /*
   * The docs app's own tsconfig is hand-maintained — TypeScript does not merge
   * `paths` through `extends`, so the generated file cannot simply be extended.
   * That makes this the one remaining place the drift can happen, and the one
   * worth a test.
   *
   * Only the `@/` specifiers. A workspace package specifier in the generated map
   * (`@zoblocks/fhir` and friends) is there so registry source typechecks
   * at the root; the docs app resolves those through node_modules like any other
   * dependency and needs no mapping. Requiring one would be asserting a fact
   * about this repository's layout rather than about the code.
   */
  const consumerSpecifiers = specifiers.filter((s) => s.startsWith("@/"));

  it("found the specifiers this rule is about", () => {
    expect(consumerSpecifiers.length).toBeGreaterThan(0);
  });

  it.each(consumerSpecifiers)("%s is mapped in apps/docs/tsconfig.json", (specifier) => {
    expect(Object.keys(docsPaths)).toContain(specifier);
  });

  it.each(consumerSpecifiers)("%s points at the same file the generator emitted", (specifier) => {
    // `@/lib/utils` is the deliberate exception: the docs app maps it to its own
    // copy under src/lib, because `cn` is used by the site's own components as
    // well as by registry source, and the site is not a registry consumer.
    if (specifier === "@/lib/utils") {
      expect(path.resolve(DOCS, docsPaths[specifier]![0]!)).toBe(
        path.join(DOCS, "src", "lib", "utils.ts"),
      );
      return;
    }

    const expected = path.resolve(DOCS, docsGeneratedPaths[specifier]![0]!);
    const actual = path.resolve(DOCS, docsPaths[specifier]![0]!);
    expect(actual).toBe(expected);
  });

  /*
   * Registry components only. A package component (tabs, signature) is imported
   * by its npm specifier and resolves through node_modules, so it has no entry
   * here and needing one would mean something had gone wrong.
   */
  const registryComponents = CATALOG.filter((c) => c.distribution !== "package").map((c) => c.name);

  it.each(registryComponents)("%s has a consumer specifier mapped", (name) => {
    expect(specifiers).toContain(`@/components/zoblocks/${name}`);
  });
});

describe("the support modules registry components share", () => {
  /*
   * These are installed into a consumer's project under `lib/` by the Zoblocks
   * CLI and imported by that path. A missing one does not fail loudly — the
   * component simply cannot be resolved by whichever project is missing it,
   * which is how the accordion family stayed out of the docs app.
   */
  it.each([
    "@/lib/utils",
    "@/lib/zoblocks-loader",
    "@/lib/zoblocks-accordion",
    "@/lib/zoblocks-switch",
  ])("%s is mapped in both projects", (specifier) => {
    expect(Object.keys(rootPaths)).toContain(specifier);
    expect(Object.keys(docsPaths)).toContain(specifier);
  });
});

describe("stylesheets the support modules need are loaded by the docs app", () => {
  /*
   * The other half of why the accordion family had no preview: the mapping can
   * be right and the component still render as unstyled markup, because these
   * stylesheets are shipped to customers as separate registry items and have to
   * be imported by anything that renders the components here.
   *
   * Unstyled is not a visible error on most components. On this family it
   * deletes the severity rail, which is the signal the component exists to
   * carry — so it is worth asserting rather than eyeballing.
   */
  const globals = readFileSync(path.join(DOCS, "src", "app", "globals.css"), "utf8");

  it.each(["loader.css", "switch.css", "accordion.css"])("globals.css imports %s", (file) => {
    expect(globals).toContain(`registry/zoblocks/lib/${file}`);
  });
});

describe("workspace packages the docs app bundles", () => {
  /*
   * The NodeNext packages carry `.js` extensions on relative imports that
   * resolve to `.ts` on disk — correct for Node, and unresolvable to Turbopack,
   * which takes the specifier literally. They are aliased to `dist` in
   * next.config.ts instead. A package imported without an alias does not fail
   * subtly: the page 500s. It is still worth a test, because it is discovered
   * only by importing the package, which is how Copilot reached the app without
   * one.
   */
  const nextConfig = readFileSync(path.join(DOCS, "next.config.ts"), "utf8");
  const dependencies: Record<string, string> =
    JSON.parse(readFileSync(path.join(DOCS, "package.json"), "utf8")).dependencies ?? {};

  /**
   * Workspace packages the docs source imports as a module.
   *
   * Derived from the imports rather than from the dependency list, because the
   * rule is about module resolution: `@zoblocks/tokens` is a dependency
   * and is only ever imported as a stylesheet, so it needs neither treatment.
   * A subpath import is excluded for the same reason.
   */
  const imported = new Set<string>();
  const sources = ts.sys.readDirectory(path.join(DOCS, "src"), [".ts", ".tsx"]);
  for (const file of sources) {
    for (const match of readFileSync(file, "utf8").matchAll(/from\s+"(@zoblocks\/[a-z0-9-]+)"/g)) {
      imported.add(match[1]!);
    }
  }

  const moduleDeps = [...imported].sort();

  it("found the packages this rule is about", () => {
    expect(moduleDeps.length).toBeGreaterThan(0);
  });

  it.each(moduleDeps)("%s is a declared dependency", (name) => {
    expect(Object.keys(dependencies)).toContain(name);
  });

  it.each(moduleDeps)("%s is either transpiled from source or aliased to dist", (name) => {
    const transpiled = new RegExp(`transpilePackages[\\s\\S]*?"${name}"[\\s\\S]*?\\]`).test(
      nextConfig,
    );
    const aliased = nextConfig.includes(`"${name}":`);

    expect(
      transpiled || aliased,
      `${name} has neither treatment in next.config.ts, so importing it 500s the page`,
    ).toBe(true);
  });

  /*
   * The aliased ones point at built output, so the build has to have happened.
   * Turbo guarantees the order — the docs app depends on each package and
   * `build` declares `dependsOn: ["^build"]` — which is what makes asserting
   * the file's presence meaningful rather than flaky.
   */
  const aliasedDeps = moduleDeps.filter((name) => nextConfig.includes(`"${name}":`));

  it.each(aliasedDeps)("%s is aliased to its built entry point", (name) => {
    expect(nextConfig).toMatch(
      new RegExp(`"${name.replace("/", "\\/")}":\\s*"[^"]*dist/index\\.js"`),
    );
  });

  it.each(aliasedDeps)("%s has been built, so the alias resolves", (name) => {
    const dir = path.join(ROOT, "packages", name.replace("@zoblocks/", ""));
    expect(existsSync(path.join(dir, "dist", "index.js"))).toBe(true);
  });
});
