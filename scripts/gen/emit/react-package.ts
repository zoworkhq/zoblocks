/**
 * Generates `packages/react/src` from the registry source.
 *
 * The invariant this exists to protect: **no component's logic is written
 * twice.** Oxygen ships React two ways — copied into a customer's repository by
 * the shadcn CLI, and installed from npm — and the moment those are two
 * hand-written trees they drift. The parity test between the registry and the
 * custom elements already caught two divergences in its first week; a third
 * copy would make that the project's main source of bugs.
 *
 * Direction of generation: **registry is authored, the package is derived.**
 * That is deliberate. The copy-source channel is the one a customer reads line
 * by line before trusting it, and readable authored source is the product there.
 * The npm package is a packaging concern, so it is the side that gets
 * mechanically produced.
 *
 * The only transformation is import specifiers. A registry component imports
 * the way the shadcn CLI lays files out in a consumer's project
 * (`@/components/oxygen/rhythm-loader`); inside a package those become ordinary
 * relative paths. Nothing else is rewritten — if this file ever needs to change
 * logic, the abstraction is wrong.
 */

import { readFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { COMPONENTS_DIR, banner, paths } from "../config";
import type { LoadedComponent } from "../load";
import type { Emitter } from "../write";

const PACKAGE_SRC = path.join(paths.reactPackage, "src");

/**
 * Rewrites consumer-project specifiers to package-relative ones.
 *
 * `fromDepth` is how many directories the importing file sits below `src`, so
 * the same table serves both `src/lib/loader.tsx` and
 * `src/components/pulse-loader/pulse-loader.tsx`.
 */
function rewriteImports(source: string, fromDepth: number): string {
  const up = "../".repeat(fromDepth) || "./";

  return (
    source
      // The shared utility module.
      .replace(/(["'])@\/lib\/utils\1/g, `"${up}lib/utils"`)
      // The loader core.
      .replace(/(["'])@\/lib\/oxygen-loader\1/g, `"${up}lib/loader"`)
      // The accordion core.
      .replace(/(["'])@\/lib\/oxygen-accordion\1/g, `"${up}lib/accordion-core"`)
      // A sibling component, by the path the CLI writes in a consumer's project.
      .replace(
        /(["'])@\/components\/oxygen\/([a-z0-9-]+)\1/g,
        (_match, _quote, name: string) => `"${up}components/${name}/${name}"`,
      )
  );
}

/**
 * Prepends the generated-file header, keeping any leading directive first.
 *
 * `"use client"` must precede every other statement for a React Server
 * Components bundler to see it. Comments before a directive are legal in the
 * language, but bundler implementations disagree about it, and a directive that
 * is silently ignored turns a client component into a server one — which fails
 * at the first `useState`, far from the cause.
 *
 * The header is stated on the file itself because someone will find it through
 * a stack trace long before they find this script, and the failure mode that
 * matters is an edit made there vanishing on the next build.
 */
function withHeader(source: string, sourcePath: string): string {
  const head = `${banner()}
//
// Generated from ${sourcePath}. Edit that file, not this one.
`;

  const directive = source.match(/^\s*("use client"|'use client');?\s*\n/);
  if (!directive) return `${head}${source}`;

  return `${directive[0].trim()}\n\n${head}${source.slice(directive[0].length)}`;
}

export async function emitReactPackage(
  components: LoadedComponent[],
  emitter: Emitter,
): Promise<void> {
  // ---- shared library -------------------------------------------------
  for (const [file, target, depth] of [
    ["lib/utils.ts", "lib/utils.ts", 1],
    ["lib/loader.tsx", "lib/loader.tsx", 1],
    ["lib/accordion-core.tsx", "lib/accordion-core.tsx", 1],
  ] as const) {
    const source = await readFile(path.join(COMPONENTS_DIR, file), "utf8");
    await emitter.emit(
      path.join(PACKAGE_SRC, target),
      withHeader(rewriteImports(source, depth), `registry/oxygen/${file}`),
    );
  }

  // ---- stylesheets ----------------------------------------------------
  //
  // Copied verbatim — no specifiers to rewrite, and one file per concern means
  // a fix cannot land in one channel and not the other.
  //
  // Both a per-concern file and a combined bundle are emitted. The bundle is
  // the documented entry point and stays `@oxygenui-design/react/styles.css`;
  // the individual files exist so an application that installs only loaders
  // does not ship accordion CSS it never renders. Concatenated rather than
  // `@import`-ed, because a bare `@import "./styles/…"` inside a published
  // package resolves differently in every bundler, and the failure mode is a
  // component that renders unstyled in the customer's build and not in ours.
  const sheets: Array<[string, string]> = [];
  for (const [file, target] of [
    ["lib/loader.css", "styles/loader.css"],
    ["lib/accordion.css", "styles/accordion.css"],
  ] as const) {
    const css = await readFile(path.join(COMPONENTS_DIR, file), "utf8");
    await emitter.emit(path.join(PACKAGE_SRC, target), css);
    sheets.push([`registry/oxygen/${file}`, css]);
  }

  await emitter.emit(
    path.join(PACKAGE_SRC, "styles.css"),
    `${banner("/*")}\n\n${sheets
      .map(([source, css]) => `/* ---- ${source} ---- */\n${css.trim()}`)
      .join("\n\n")}\n`,
  );

  // ---- components -----------------------------------------------------
  for (const component of components) {
    const source = await readFile(component.sourceFile, "utf8");
    await emitter.emit(
      path.join(PACKAGE_SRC, "components", component.meta.name, `${component.meta.name}.tsx`),
      withHeader(rewriteImports(source, 2), component.sourcePath),
    );
  }

  // ---- barrel ---------------------------------------------------------
  //
  // Explicit re-exports rather than `export *`: a barrel that re-exports
  // everything makes every internal helper public API by accident, and
  // api-extractor cannot tell the difference.
  const exports = components
    .map((c) => `export * from "./components/${c.meta.name}/${c.meta.name}";`)
    .join("\n");

  await emitter.emit(
    path.join(PACKAGE_SRC, "index.ts"),
    `${banner()}
//
// Generated from the registry. Run \`pnpm gen\`.

export * from "./lib/loader";
export * from "./lib/accordion-core";
export { cn } from "./lib/utils";

${exports}
`,
  );

  // A component removed from the registry must stop being published.
  if (components.length > 0) {
    const keep = new Set(components.map((c) => c.meta.name));
    const componentsDir = path.join(PACKAGE_SRC, "components");
    await pruneComponentDirs(componentsDir, keep, emitter);
  }
}

/**
 * Deletes generated component directories that this run did not produce.
 *
 * Without it, a removed component keeps being published from npm — source
 * nobody maintains, reaching customers indefinitely. Deprecation is the
 * sequence in ADR 0006, not an orphaned directory.
 */
async function pruneComponentDirs(dir: string, keep: Set<string>, emitter: Emitter): Promise<void> {
  const { existsSync } = await import("node:fs");
  const { readdir } = await import("node:fs/promises");
  if (!existsSync(dir)) return;

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || keep.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (emitter.checkOnly) {
      emitter.results.push({ path: absolute, status: "orphaned" });
      continue;
    }
    await rm(absolute, { recursive: true, force: true });
    emitter.results.push({ path: absolute, status: "removed" });
  }
}

export async function ensureReactPackageDirs(): Promise<void> {
  await mkdir(path.join(PACKAGE_SRC, "components"), { recursive: true });
  await mkdir(path.join(PACKAGE_SRC, "lib"), { recursive: true });
}
