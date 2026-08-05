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
import { componentMetaSchema, type ComponentMeta } from "@oxygenui/component-meta";
import { COMPONENTS_DIR, CONSUMER_COMPONENT_DIR, NON_COMPONENT_DIRS, ROOT, rel } from "./config";

export interface LoadedComponent {
  meta: ComponentMeta;
  /** Absolute path to the component's directory. */
  dir: string;
  /** Absolute path to the implementation file. */
  sourceFile: string;
  /** Repo-relative path to the implementation file. */
  sourcePath: string;
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
      problems.push(`${rel(metaFile)}: no default export — use \`export default defineComponentMeta({...})\``);
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
      consumerSpecifier: `@/${CONSUMER_COMPONENT_DIR}/${name}`,
      consumerTarget: `${CONSUMER_COMPONENT_DIR}/${name}.tsx`,
      hasStory: existsSync(path.join(dir, `${name}.stories.tsx`)),
      hasTest: existsSync(path.join(dir, `${name}.test.tsx`)),
    });
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
      if (!dep.includes("/") && !names.has(dep) && !["utils", "tokens"].includes(dep)) {
        problems.push(`${component.meta.name}: registryDependency "${dep}" does not exist in this registry`);
      }
    }
    if (component.meta.related.includes(component.meta.name)) {
      problems.push(`${component.meta.name}: lists itself in related`);
    }
  }

  if (problems.length) throw new MetaError(problems);

  return loaded;
}
