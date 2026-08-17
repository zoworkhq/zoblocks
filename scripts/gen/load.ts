/**
 * Discovers and validates every component's metadata.
 *
 * Validation happens once, here, before anything is generated. A metadata error
 * must fail the whole run rather than produce a partial catalog — a registry
 * missing one item is a broken install for whoever wanted that item, and it is
 * not obvious from the output that anything went wrong.
 */

import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { componentMetaSchema, type ComponentMeta } from "@oxygenui-design/component-meta";
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
  /** Import specifier a consumer uses after installing, e.g. "@/components/oxygen/vitals-panel". */
  consumerSpecifier: string;
  /** Where the shadcn CLI writes it, e.g. "components/oxygen/vitals-panel.tsx". */
  consumerTarget: string;
  hasStory: boolean;
  hasTest: boolean;
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
 * putting a stub in `registry/oxygen`. The metadata belongs with the thing it
 * describes, and a registry directory containing no source would be a
 * standing invitation to `shadcn add` something that ships on npm.
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

    loaded.push({
      meta: parsed.data,
      dir,
      sourceFile,
      sourcePath: path.relative(ROOT, sourceFile),
      // One and the same for a registry component: the file is the API.
      propsFile: sourceFile,
      consumerSpecifier: `@/${CONSUMER_COMPONENT_DIR}/${name}`,
      consumerTarget: `${CONSUMER_COMPONENT_DIR}/${name}.tsx`,
      hasStory: existsSync(path.join(dir, `${name}.stories.tsx`)),
      hasTest: existsSync(path.join(dir, `${name}.test.tsx`)),
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
    // the docs would offer a `shadcn add` command for something on npm.
    if (parsed.data.distribution !== "package") {
      problems.push(
        `${rel(metaFile)}: a component.meta.ts inside packages/ must set distribution: "package". Registry components live in registry/oxygen.`,
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
      consumerSpecifier: parsed.data.packageName ?? "",
      consumerTarget: "",
      hasStory: existsSync(path.join(dir, "src", `${parsed.data.name}.stories.tsx`)),
      // A package owns its own suite; `test/` is the convention across this
      // workspace, so its presence is the honest signal for the coverage gate.
      hasTest: existsSync(path.join(dir, "test")) || existsSync(path.join(dir, "src", "__tests__")),
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
  }

  if (problems.length) throw new MetaError(problems);

  return loaded;
}
