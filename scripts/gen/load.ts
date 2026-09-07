/**
 * Discovers and validates every component's metadata.
 *
 * Validation happens once, here, before anything is generated. A metadata error
 * must fail the whole run rather than produce a partial catalog — a registry
 * missing one item is a broken install for whoever wanted that item, and it is
 * not obvious from the output that anything went wrong.
 */

import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { componentMetaSchema, type ComponentMeta } from "@zoblocks/component-meta";
import {
  COMPONENTS_DIR,
  CONSUMER_COMPONENT_DIR,
  NON_COMPONENT_DIRS,
  ROOT,
  SUPPORT_ITEM_NAMES,
  rel,
} from "./config";

export interface LoadedComponent {
  meta: ComponentMeta;
  /** Absolute path to the component's directory. */
  dir: string;
  /**
   * Absolute path to the implementation file.
   *
   * Empty for a `package` component: its source lives in its own package and is
   * never copied into a consumer's repository, so there is nothing here for the
   * registry to read.
   */
  sourceFile: string;
  /** Repo-relative path to the implementation file. Empty for a package component. */
  sourcePath: string;
  /**
   * The file whose exported types document the public API.
   *
   * The same as `sourceFile` for a registry component. A package component has
   * no registry source but still has props — and props are most of what the
   * docs page is *for*, so reading them from the package is the difference
   * between a props table and an empty one with three headings.
   */
  propsFile: string;
  /**
   * Further files whose exported components are part of the same public API.
   *
   * Empty for almost everything. A component whose surface is a `variant`
   * union over parts kept in a support module names them in
   * `extraPropsSources`, or its props table documents the intersection of
   * every variant — which is a handful of props and no help at all.
   */
  extraPropsFiles: string[];
  /** Import specifier a consumer uses after installing, e.g. "@/components/zoblocks/vitals-panel". */
  consumerSpecifier: string;
  /** Where the Zoblocks CLI writes it, e.g. "components/zoblocks/vitals-panel.tsx". */
  consumerTarget: string;
  hasStory: boolean;
  hasTest: boolean;
  /**
   * The relationship graph, derived rather than declared.
   *
   * `builtWith` and `usedIn` are the two facts on a component page that an
   * author has no way to keep true: the first drifts the moment a dependency
   * is added, and the second cannot be known from inside the component at all.
   * The schema rejects them in hand-written metadata for that reason, and they
   * are computed here from what each component actually depends on.
   */
  derived: { builtWith: string[]; usedIn: string[] };
}

export class MetaError extends Error {
  constructor(readonly problems: string[]) {
    super(`${problems.length} metadata problem${problems.length === 1 ? "" : "s"}`);
    this.name = "MetaError";
  }
}

async function listComponentDirs(): Promise<string[]> {
  const entries = await readdir(COMPONENTS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !NON_COMPONENT_DIRS.has(e.name))
    .map((e) => e.name)
    .sort();
}

/**
 * Package components, discovered by their metadata file.
 *
 * A package keeps its own `component.meta.ts` beside its source rather than
 * putting a stub in `registry/zoblocks`. The metadata belongs with the thing it
 * describes, and a registry directory containing no source would be a
 * standing invitation to `zoblocks add` something that ships on npm.
 */
async function listPackageMetaFiles(): Promise<string[]> {
  const packagesDir = path.join(ROOT, "packages");
  if (!existsSync(packagesDir)) return [];

  const entries = await readdir(packagesDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => path.join(packagesDir, e.name, "component.meta.ts"))
    .filter((file) => existsSync(file))
    .sort();
}

export async function loadComponents(): Promise<LoadedComponent[]> {
  const problems: string[] = [];
  const loaded: LoadedComponent[] = [];

  for (const name of await listComponentDirs()) {
    const dir = path.join(COMPONENTS_DIR, name);
    const metaFile = path.join(dir, `${name}.meta.ts`);
    const sourceFile = path.join(dir, `${name}.tsx`);

    if (!existsSync(sourceFile)) {
      problems.push(`${name}: no implementation at ${rel(sourceFile)}`);
      continue;
    }
    if (!existsSync(metaFile)) {
      problems.push(
        `${name}: no metadata at ${rel(metaFile)} — run \`pnpm gen:component ${name}\` or add it by hand`,
      );
      continue;
    }

    // tsx resolves the TypeScript import; a cache-busting query is unnecessary
    // because the generator is a one-shot process.
    const module = (await import(pathToFileURL(metaFile).href)) as { default?: unknown };

    if (module.default === undefined) {
      problems.push(
        `${rel(metaFile)}: no default export — use \`export default defineComponentMeta({...})\``,
      );
      continue;
    }

    const parsed = componentMetaSchema.safeParse(module.default);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const where = issue.path.length ? issue.path.join(".") : "(root)";
        problems.push(`${rel(metaFile)} → ${where}: ${issue.message}`);
      }
      continue;
    }

    if (parsed.data.name !== name) {
      problems.push(
        `${rel(metaFile)}: name is "${parsed.data.name}" but the directory is "${name}". They must match — the name is the directory, the URL slug, and the registry item.`,
      );
      continue;
    }

    // A missing extra source extracts nothing and reports nothing — the props
    // table would just be short, which is exactly how it looked before anyone
    // noticed it was wrong.
    const extraPropsFiles = parsed.data.extraPropsSources.map((source) =>
      path.resolve(dir, source),
    );
    const missingExtra = parsed.data.extraPropsSources.filter(
      (source) => !existsSync(path.resolve(dir, source)),
    );
    if (missingExtra.length > 0) {
      problems.push(
        `${rel(metaFile)}: extraPropsSources names ${missingExtra.join(", ")}, which ${
          missingExtra.length === 1 ? "does" : "do"
        } not exist relative to ${name}/`,
      );
      continue;
    }

    loaded.push({
      meta: parsed.data,
      dir,
      sourceFile,
      sourcePath: path.relative(ROOT, sourceFile),
      // One and the same for a registry component: the file is the API.
      propsFile: sourceFile,
      extraPropsFiles,
      consumerSpecifier: `@/${CONSUMER_COMPONENT_DIR}/${name}`,
      consumerTarget: `${CONSUMER_COMPONENT_DIR}/${name}.tsx`,
      hasStory: existsSync(path.join(dir, `${name}.stories.tsx`)),
      hasTest: existsSync(path.join(dir, `${name}.test.tsx`)),
      derived: { builtWith: [], usedIn: [] },
    });
  }

  /* ------------------------------------------------------------------ */
  /* Package components                                                  */
  /* ------------------------------------------------------------------ */

  for (const metaFile of await listPackageMetaFiles()) {
    const dir = path.dirname(metaFile);

    const module = (await import(pathToFileURL(metaFile).href)) as { default?: unknown };
    if (module.default === undefined) {
      problems.push(
        `${rel(metaFile)}: no default export — use \`export default defineComponentMeta({...})\``,
      );
      continue;
    }

    const parsed = componentMetaSchema.safeParse(module.default);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const where = issue.path.length ? issue.path.join(".") : "(root)";
        problems.push(`${rel(metaFile)} → ${where}: ${issue.message}`);
      }
      continue;
    }

    // The file is only read because it sits in a package, so declaring
    // `registry` here would produce a component the registry cannot build and
    // the docs would offer a `zoblocks add` command for something on npm.
    if (parsed.data.distribution !== "package") {
      problems.push(
        `${rel(metaFile)}: a component.meta.ts inside packages/ must set distribution: "package". Registry components live in registry/zoblocks.`,
      );
      continue;
    }

    /*
     * Where this package declares its public component.
     *
     * `<title>.tsx` is the convention across this workspace — `Signature` in
     * `Signature.tsx`. The barrel is not usable for extraction: it re-exports,
     * so its statements are export declarations rather than the interface the
     * props live on, and reading it yields nothing at all.
     */
    const candidates = parsed.data.propsSource
      ? [path.join(dir, "src", parsed.data.propsSource)]
      : [
          path.join(dir, "src", `${parsed.data.title}.tsx`),
          path.join(dir, "src", `${parsed.data.name}.tsx`),
        ];
    const propsFile = candidates.find(existsSync) ?? "";

    if (!propsFile) {
      problems.push(
        parsed.data.propsSource
          ? `${rel(metaFile)}: propsSource points at src/${parsed.data.propsSource}, which does not exist`
          : `${rel(metaFile)}: no props source found — expected src/${parsed.data.title}.tsx. A package whose public surface is several components can name one explicitly with propsSource.`,
      );
      continue;
    }

    loaded.push({
      meta: parsed.data,
      dir,
      // No registry source: nothing here is copied into a consumer's project.
      sourceFile: "",
      sourcePath: "",
      propsFile,
      // A package names its one entry point with `propsSource` instead.
      extraPropsFiles: [],
      consumerSpecifier: parsed.data.packageName ?? "",
      consumerTarget: "",
      hasStory: existsSync(path.join(dir, "src", `${parsed.data.name}.stories.tsx`)),
      // A package owns its own suite; `test/` is the convention across this
      // workspace, so its presence is the honest signal for the coverage gate.
      hasTest: existsSync(path.join(dir, "test")) || existsSync(path.join(dir, "src", "__tests__")),
      derived: { builtWith: [], usedIn: [] },
    });
  }

  // Two components cannot share a name: the name is the URL slug, and a
  // collision would make one of them unreachable in the docs.
  const seen = new Map<string, string>();
  for (const component of loaded) {
    const previous = seen.get(component.meta.name);
    if (previous) {
      problems.push(
        `duplicate component name "${component.meta.name}" — declared in both ${previous} and ${rel(component.dir)}`,
      );
    }
    seen.set(component.meta.name, rel(component.dir));
  }

  /*
   * The fixtures package's public exports, read from its source rather than
   * imported.
   *
   * Importing it would pull a React-adjacent module into a generator that runs
   * in plain Node before anything is built, for the sake of a list of names.
   * Reading the barrel is enough: a fixture that is not re-exported there is
   * not reachable by the example that names it either.
   */
  const fixtureExports = new Set<string>();
  const fixturesBarrel = path.join(ROOT, "packages/fixtures/src/index.ts");
  if (existsSync(fixturesBarrel)) {
    const source = await readFile(fixturesBarrel, "utf8");
    for (const match of source.matchAll(/^export const (\w+)/gm)) {
      if (match[1]) fixtureExports.add(match[1]);
    }
  } else {
    problems.push(
      `cannot verify fixtures: ${rel(fixturesBarrel)} is missing. Every fixture named in metadata is unverifiable without it.`,
    );
  }

  // Cross-references are validated only once every component has loaded,
  // so a typo in `related` names the component it could not find rather than
  // failing on ordering.
  const names = new Set(loaded.map((c) => c.meta.name));
  for (const component of loaded) {
    for (const related of component.meta.related) {
      if (!names.has(related)) {
        problems.push(`${component.meta.name}: related component "${related}" does not exist`);
      }
    }
    for (const dep of component.meta.registryDependencies) {
      // Bare names refer to items in this registry; anything else is external.
      // Support items (utils, tokens, loader-core) are registry items without
      // component metadata, so they are named rather than discovered.
      if (!dep.includes("/") && !names.has(dep) && !SUPPORT_ITEM_NAMES.has(dep)) {
        problems.push(
          `${component.meta.name}: registryDependency "${dep}" does not exist in this registry`,
        );
      }
    }
    if (component.meta.related.includes(component.meta.name)) {
      problems.push(`${component.meta.name}: lists itself in related`);
    }

    /*
     * `related` must be reciprocal.
     *
     * A one-way edge is not a small inconsistency: the graph is what generates
     * navigation, discovery and every internal link, so a component that
     * claims a neighbour which does not claim it back produces a page you can
     * leave and cannot return to. Enforced here rather than trusted, because
     * the reverse edge is exactly the thing an author forgets.
     */
    for (const related of component.meta.related) {
      const other = loaded.find((c) => c.meta.name === related);
      if (other && !other.meta.related.includes(component.meta.name)) {
        problems.push(
          `${component.meta.name}: related "${related}" is one-way — add "${component.meta.name}" to ${related}'s related, or drop the edge`,
        );
      }
    }

    /*
     * A named fixture must be a real export of the fixtures package.
     *
     * The standard bans lorem ipsum and requires realistic data; a fixture name
     * that resolves to nothing is the same defect wearing a better disguise,
     * because the example reads as though it were backed by data and is not.
     */
    for (const fixture of component.meta.fixtures) {
      if (fixtureExports.size && !fixtureExports.has(fixture)) {
        problems.push(
          `${component.meta.name}: fixture "${fixture}" is not exported by @zoblocks/fixtures`,
        );
      }
    }
  }

  /*
   * The relationship graph.
   *
   * `builtWith` is a component's registry dependencies, minus the support
   * items (utils, tokens, the headless cores) — those are infrastructure, and
   * listing them under "built with" on every page says nothing. `usedIn` is
   * the inverse edge, which no component can know about itself.
   */
  const byName = new Map(loaded.map((c) => [c.meta.name, c]));
  for (const component of loaded) {
    component.derived.builtWith = component.meta.registryDependencies
      .filter((dep) => byName.has(dep))
      .sort();
  }
  for (const component of loaded) {
    for (const dep of component.derived.builtWith) {
      byName.get(dep)?.derived.usedIn.push(component.meta.name);
    }
  }
  for (const component of loaded) component.derived.usedIn.sort();

  /*
   * Two components must not claim the same primary keyword.
   *
   * They would compete with each other for it, and the search engine would
   * pick — usually the older page, which is rarely the better answer. The
   * whole point of declaring one is that it is the term this page intends to
   * be the best result for.
   */
  const byKeyword = new Map<string, string>();
  for (const component of loaded) {
    const keyword = component.meta.seo.primaryKeyword?.trim().toLowerCase();
    if (!keyword) continue;
    const owner = byKeyword.get(keyword);
    if (owner) {
      problems.push(
        `${component.meta.name}: primary keyword "${keyword}" is already claimed by ${owner} — two pages competing for one term means neither wins it`,
      );
    }
    byKeyword.set(keyword, component.meta.name);
  }

  /*
   * One spelling per category.
   *
   * Categories are free text, and "Data display" and "Data Display" both
   * existed for months — which produced two facets on the catalogue page, each
   * holding half the components that belong in one. Nothing failed: both are
   * valid strings, both render, and the split is invisible until somebody
   * filters by one and wonders where the rest went.
   *
   * The rule is one spelling rather than a fixed vocabulary: a closed list
   * would have to be edited before a genuinely new category could be used, and
   * that is a gate on writing rather than on drift.
   */
  const byCategory = new Map<string, { spelling: string; owner: string }>();
  for (const component of loaded) {
    for (const category of component.meta.categories) {
      const key = category.trim().toLowerCase();
      const seen = byCategory.get(key);
      if (seen && seen.spelling !== category) {
        problems.push(
          `${component.meta.name}: category "${category}" is spelled "${seen.spelling}" on ${seen.owner} — one spelling per category, or the catalogue grows two facets for one thing`,
        );
      }
      if (!seen) byCategory.set(key, { spelling: category, owner: component.meta.name });
    }
  }

  if (problems.length) throw new MetaError(problems);

  return loaded;
}
