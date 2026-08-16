/**
 * Emits the shadcn registry: registry.json and one document per item under
 * apps/docs/public/r/.
 *
 * Two guarantees this build makes that a hand-written registry cannot:
 *
 *   1. Every published item's source is read from disk at build time, so the
 *      documented source and the shipped source cannot diverge.
 *   2. `tier: "pro"` never reaches public output. Commercial source leaking onto
 *      the CDN is a one-line mistake in a hand-maintained file and an
 *      impossibility here.
 *
 * See content/decisions/0002-dual-channel-distribution.md.
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { HOMEPAGE, REGISTRY_NAME, ROOT, SUPPORT_ITEM_NAMES, paths } from "../config";
import type { LoadedComponent } from "../load";
import type { Emitter } from "../write";

/**
 * Registry items that are not components: shared modules and stylesheets. They
 * have no props, no states, and no docs page, so they do not carry component
 * metadata.
 *
 * Adding one here is also what makes it nameable in a component's
 * `registryDependencies` — see SUPPORT_ITEM_NAMES in ../load.ts, which reads
 * this list so the two cannot disagree.
 */
const SUPPORT_ITEMS: BuildableItem[] = [
  {
    name: "utils",
    type: "registry:lib",
    title: "Utils",
    description: "Class-name merge helper shared by every Oxygen component.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: [] as string[],
    files: [{ path: "registry/oxygen/lib/utils.ts", type: "registry:lib", target: "lib/utils.ts" }],
  },
  {
    name: "loader-core",
    type: "registry:lib",
    title: "Loader core",
    description:
      "Shared frame, timing gate, and stylesheet behind every Oxygen loader. Installed automatically with any loader.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "registry/oxygen/lib/loader.tsx",
        type: "registry:lib",
        target: "lib/oxygen-loader.tsx",
      },
      {
        path: "registry/oxygen/lib/loader.css",
        type: "registry:file",
        target: "styles/oxygen-loader.css",
      },
    ],
  },
  {
    name: "switch-core",
    type: "registry:lib",
    title: "Switch core",
    description:
      "The three-axis state model behind Oxygen's Switch: the commit phase machine, the state-label presets, and the absence vocabulary. Installed automatically with Switch.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "registry/oxygen/lib/switch.tsx",
        type: "registry:lib",
        target: "lib/oxygen-switch.tsx",
      },
      {
        path: "registry/oxygen/lib/switch.css",
        type: "registry:file",
        target: "styles/oxygen-switch.css",
      },
    ],
  },
  {
    name: "tokens",
    type: "registry:style",
    title: "Oxygen tokens",
    description:
      "Semantic clinical status tokens, three density modes, and light/dark themes. Required by every Oxygen component.",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      {
        path: "packages/tokens/src/oxygen-tokens.css",
        type: "registry:file",
        target: "styles/oxygen-tokens.css",
      },
    ],
  },
];

interface BuildableItem {
  name: string;
  type: string;
  title: string;
  description: string;
  categories?: string[];
  dependencies: string[];
  registryDependencies: string[];
  files: Array<{ path: string; type: string; target?: string }>;
}

/**
 * Registry categories are identifiers used for filtering, not display text.
 * The catalog carries them in sentence case for the docs; the registry gets
 * slugs, which is what the shadcn ecosystem expects and what survives being
 * put in a URL.
 */
function slugifyCategory(category: string): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toBuildable(component: LoadedComponent): BuildableItem {
  const { meta } = component;
  return {
    name: meta.name,
    // Deliberately not derived from `layer`. In shadcn's vocabulary
    // `registry:block` means a multi-file composition installed as a unit;
    // `layer` is our dependency-direction concept. They are different axes that
    // happen to share a word, and conflating them would change install
    // behaviour as a side effect of an architectural label.
    type: "registry:component",
    title: meta.title,
    // The install-time blurb. The long form lives in `rationale`, on the docs
    // page, which is the only surface with room for it.
    description: meta.description,
    categories: meta.categories.map(slugifyCategory),
    dependencies: meta.dependencies,
    registryDependencies: meta.registryDependencies,
    files: meta.files ?? [
      { path: component.sourcePath, type: "registry:component", target: component.consumerTarget },
    ],
  };
}

/**
 * Constraints on anything copied into a customer's repository.
 *
 * These are the subset of content/decisions/0009 that can be checked on file
 * text; the rest are lint rules. Both exist because a component that reaches the
 * environment, the network, or the console behaves differently in the customer's
 * build than in ours, and the failure surfaces in their CI rather than ours.
 */
const FORBIDDEN: Array<{ pattern: RegExp; why: string }> = [
  { pattern: /process\.env\./, why: "reads process.env — registry files must be self-contained" },
  { pattern: /\bfetch\s*\(/, why: "makes a network call — components must not fetch" },
  { pattern: /dangerouslySetInnerHTML/, why: "uses dangerouslySetInnerHTML" },
  { pattern: /\bnew\s+WebSocket\b/, why: "opens a WebSocket" },
  { pattern: /\beval\s*\(/, why: "calls eval" },
];

export async function emitRegistry(
  components: LoadedComponent[],
  emitter: Emitter,
): Promise<string[]> {
  const problems: string[] = [];

  // The two lists must agree: config.ts names what a component may depend on,
  // this file builds what is actually published. A name in one and not the
  // other is either a dependency that resolves to nothing or an item nobody can
  // depend on.
  for (const item of SUPPORT_ITEMS) {
    if (!SUPPORT_ITEM_NAMES.has(item.name)) {
      problems.push(
        `support item "${item.name}" is built but not listed in SUPPORT_ITEM_NAMES (scripts/gen/config.ts), so no component may depend on it`,
      );
    }
  }
  for (const name of SUPPORT_ITEM_NAMES) {
    if (!SUPPORT_ITEMS.some((item) => item.name === name)) {
      problems.push(
        `SUPPORT_ITEM_NAMES lists "${name}" but no support item builds it — a component depending on it would resolve to nothing`,
      );
    }
  }

  // Pro items are excluded from public output entirely — not marked, not
  // stubbed. The registry served from the CDN is the free catalog.
  const publicComponents = components.filter((c) => c.meta.tier === "free");
  const items: BuildableItem[] = [
    ...SUPPORT_ITEMS.map((i) => ({ ...i })),
    ...publicComponents.map(toBuildable),
  ];

  const published = new Set(items.map((i) => i.name));
  const built: Array<Record<string, unknown>> = [];

  for (const item of items) {
    const files: Array<Record<string, string>> = [];

    for (const file of item.files) {
      const absolute = path.join(ROOT, file.path);

      if (!existsSync(absolute)) {
        problems.push(`${item.name}: file not found — ${file.path}`);
        continue;
      }

      const content = await readFile(absolute, "utf8");
      if (!content.trim()) {
        problems.push(`${item.name}: file is empty — ${file.path}`);
        continue;
      }

      for (const { pattern, why } of FORBIDDEN) {
        if (pattern.test(content)) problems.push(`${item.name}: ${file.path} ${why}`);
      }

      files.push({ path: file.path, type: file.type, target: file.target ?? "", content });
    }

    for (const dep of item.registryDependencies) {
      if (!dep.includes("/") && !published.has(dep)) {
        problems.push(
          `${item.name}: registryDependency "${dep}" is not published — it may be a Pro item referenced from a free one`,
        );
      }
    }

    built.push({
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: item.name,
      type: item.type,
      title: item.title,
      description: item.description,
      ...(item.categories?.length ? { categories: item.categories } : {}),
      ...(item.dependencies.length ? { dependencies: item.dependencies } : {}),
      ...(item.registryDependencies.length
        ? {
            // Bare names are expanded to absolute URLs here so authors never
            // write the homepage into metadata, and a domain change is one edit.
            registryDependencies: item.registryDependencies.map((d) =>
              d.includes("/") ? d : `${HOMEPAGE}/r/${d}.json`,
            ),
          }
        : {}),
      files,
    });
  }

  if (problems.length) return problems;

  // registry.json — the manifest, now an output rather than a hand-edited input.
  await emitter.emit(
    paths.registryJson,
    JSON.stringify(
      {
        $schema: "https://ui.shadcn.com/schema/registry.json",
        name: REGISTRY_NAME,
        homepage: HOMEPAGE,
        items: items.map((item) => ({
          name: item.name,
          type: item.type,
          title: item.title,
          description: item.description,
          ...(item.categories?.length ? { categories: item.categories } : {}),
          ...(item.dependencies.length ? { dependencies: item.dependencies } : {}),
          ...(item.registryDependencies.length
            ? {
                registryDependencies: item.registryDependencies.map((d) =>
                  d.includes("/") ? d : `${HOMEPAGE}/r/${d}.json`,
                ),
              }
            : {}),
          files: item.files.map((f) => ({ path: f.path, type: f.type, target: f.target ?? "" })),
        })),
      },
      null,
      2,
    ),
  );

  for (const item of built) {
    await emitter.emit(
      path.join(paths.registryOut, `${item.name as string}.json`),
      JSON.stringify(item, null, 2),
    );
  }

  // A component removed from the repository must stop being served. Its JSON
  // would otherwise sit on the CDN and the shadcn CLI would keep installing
  // source nobody maintains.
  await emitter.prune(
    paths.registryOut,
    new Set([...built.map((i) => `${i.name as string}.json`), "index.json", "coverage.json"]),
    ".json",
  );

  await emitter.emit(
    path.join(paths.registryOut, "index.json"),
    JSON.stringify(
      {
        name: REGISTRY_NAME,
        homepage: HOMEPAGE,
        items: items.map((item) => ({
          name: item.name,
          type: item.type,
          title: item.title,
          description: item.description,
          categories: item.categories ?? [],
          url: `${HOMEPAGE}/r/${item.name}.json`,
        })),
      },
      null,
      2,
    ),
  );

  return [];
}
