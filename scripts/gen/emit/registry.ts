/**
 * Emits the Oxygen registry: registry.json and one document per item under
 * apps/docs/public/r/, in the format @oxygenui-design/cli installs from.
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
import { ITEM_SCHEMA_URL, REGISTRY_SCHEMA_URL } from "@oxygenui-design/cli";
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
    type: "oxygen:lib",
    title: "Utils",
    description: "Class-name merge helper shared by every Oxygen component.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: [] as string[],
    files: [{ path: "registry/oxygen/lib/utils.ts", type: "oxygen:lib", target: "lib/utils.ts" }],
  },
  {
    name: "loader-core",
    type: "oxygen:lib",
    title: "Loader core",
    description:
      "Shared frame, timing gate, and stylesheet behind every Oxygen loader. Installed automatically with any loader.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "registry/oxygen/lib/loader.tsx",
        type: "oxygen:lib",
        target: "lib/oxygen-loader.tsx",
      },
      {
        path: "registry/oxygen/lib/loader.css",
        type: "oxygen:file",
        target: "styles/oxygen-loader.css",
      },
    ],
  },
  {
    name: "accordion-core",
    type: "oxygen:lib",
    title: "Accordion core",
    description:
      "Headless disclosure behaviour and stylesheet behind Accordion and Disclosure: the open-set policies, the ARIA wiring, the access model, and find-in-page support. Installed automatically with either.",
    dependencies: [] as string[],
    registryDependencies: ["utils"],
    files: [
      {
        path: "registry/oxygen/lib/accordion-core.tsx",
        type: "oxygen:hook",
        target: "lib/oxygen-accordion.tsx",
      },
      {
        path: "registry/oxygen/lib/accordion.css",
        type: "oxygen:file",
        target: "styles/oxygen-accordion.css",
      },
    ],
  },
  {
    name: "clinical-status-core",
    type: "oxygen:lib",
    title: "Clinical status core",
    description:
      "The closed status vocabulary: nine scales, forty steps, each carrying a tone, a CSS glyph and a word in both a clinician and a patient register — plus the FHIR adapters that map Observation, AllergyIntolerance, Encounter, Task, Consent and DetectedIssue onto them. Installed automatically with ClinicalStatus.",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      {
        path: "registry/oxygen/lib/clinical-status.ts",
        type: "oxygen:lib",
        target: "lib/oxygen-clinical-status.ts",
      },
      {
        path: "registry/oxygen/lib/clinical-status.css",
        type: "oxygen:style",
        target: "styles/oxygen-clinical-status.css",
      },
    ],
  },
  {
    name: "result-value-core",
    type: "oxygen:lib",
    title: "Result value core",
    description:
      "The seven absence reasons, the interpretation precedence rule, the delta suppression rule, and the sentence composer that turns an observation into one spoken clinical statement. Includes the FHIR Observation adapter. Installed automatically with ResultValue.",
    dependencies: [] as string[],
    registryDependencies: ["clinical-status-core"],
    files: [
      {
        path: "registry/oxygen/lib/result-value.ts",
        type: "oxygen:lib",
        target: "lib/oxygen-result-value.ts",
      },
      {
        path: "registry/oxygen/lib/result-value.css",
        type: "oxygen:style",
        target: "styles/oxygen-result-value.css",
      },
    ],
  },
  {
    name: "allergy-core",
    type: "oxygen:lib",
    title: "Allergy core",
    description:
      "The distinction between criticality (risk of a future reaction) and reaction severity (how bad a past one was), six verification states, four kinds, and the rule that a no-known-allergies assertion without an asserter and a date is not an assertion. Includes the FHIR AllergyIntolerance adapter. Installed automatically with AllergyChip.",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      {
        path: "registry/oxygen/lib/allergy.ts",
        type: "oxygen:lib",
        target: "lib/oxygen-allergy.ts",
      },
      {
        path: "registry/oxygen/lib/allergy.css",
        type: "oxygen:style",
        target: "styles/oxygen-allergy.css",
      },
    ],
  },
  {
    name: "risk-core",
    type: "oxygen:lib",
    title: "Risk core",
    description:
      "Five bands including one for a patient the model could not score, driver attribution with its concentration, and a validity window that turns an old score into an expired one. Includes the FHIR RiskAssessment adapter. Installed automatically with RiskIndicator.",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      { path: "registry/oxygen/lib/risk.ts", type: "oxygen:lib", target: "lib/oxygen-risk.ts" },
      {
        path: "registry/oxygen/lib/risk.css",
        type: "oxygen:style",
        target: "styles/oxygen-risk.css",
      },
    ],
  },
  {
    name: "provenance-core",
    type: "oxygen:lib",
    title: "Provenance core",
    description:
      "Six source classes with CSS glyphs rather than colours, observed-at kept separate from recorded-at, per-datum staleness policies, and the confirmation state of an AI-extracted value. Includes a ledger keyed by resource and version, and the FHIR Provenance adapter. Installed automatically with ProvenanceChip.",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      {
        path: "registry/oxygen/lib/provenance.ts",
        type: "oxygen:lib",
        target: "lib/oxygen-provenance.ts",
      },
      {
        path: "registry/oxygen/lib/provenance.css",
        type: "oxygen:style",
        target: "styles/oxygen-provenance.css",
      },
    ],
  },
  {
    name: "trend-core",
    type: "oxygen:lib",
    title: "Trend core",
    description:
      "Comparability segmentation across assay, method and unit changes, a minimum-points floor, the reliable-change threshold that renders noise as flat, and a required valence because half of clinical measures improve by falling. One SVG path per segment, no chart library. Installed automatically with TrendIndicator.",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      { path: "registry/oxygen/lib/trend.ts", type: "oxygen:lib", target: "lib/oxygen-trend.ts" },
      {
        path: "registry/oxygen/lib/trend.css",
        type: "oxygen:style",
        target: "styles/oxygen-trend.css",
      },
    ],
  },
  {
    name: "switch-core",
    type: "oxygen:lib",
    title: "Switch core",
    description:
      "The three-axis state model behind Oxygen's Switch: the commit phase machine, the state-label presets, and the absence vocabulary. Installed automatically with Switch.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "registry/oxygen/lib/switch.tsx",
        type: "oxygen:lib",
        target: "lib/oxygen-switch.tsx",
      },
      {
        path: "registry/oxygen/lib/switch.css",
        type: "oxygen:file",
        target: "styles/oxygen-switch.css",
      },
    ],
  },
  {
    name: "timeline-core",
    type: "oxygen:lib",
    title: "Timeline core",
    description:
      "The chronology engine behind Timeline and CareTimeline: precision-preserving time, the stable comparator, grouping, clustering with critical promotion, the coverage claim and its sentence. Installed automatically with either.",
    dependencies: [] as string[],
    registryDependencies: ["utils", "accordion-core"],
    files: [
      {
        path: "registry/oxygen/lib/timeline-core.ts",
        type: "oxygen:lib",
        target: "lib/timeline-core.ts",
      },
      {
        path: "registry/oxygen/lib/timeline.css",
        type: "oxygen:file",
        target: "styles/oxygen-timeline.css",
      },
    ],
  },
  {
    name: "timeline-fhir",
    type: "oxygen:lib",
    title: "Timeline FHIR adapters",
    description:
      "Thirteen FHIR R4 resource types read into timeline events, plus an honest report of everything that could not be mapped. Pure functions — no fetching. Installed automatically with CareTimeline.",
    dependencies: ["@oxygenui-design/fhir"],
    registryDependencies: ["utils", "timeline-core"],
    files: [
      {
        path: "registry/oxygen/lib/timeline-fhir.ts",
        type: "oxygen:lib",
        target: "lib/timeline-fhir.ts",
      },
    ],
  },
  {
    name: "clinical-note-core",
    type: "oxygen:lib",
    title: "Clinical note core",
    description:
      "The ProseMirror binding behind Clinical Note: the editor view, the provenance decorations, the toolbar commands, and the document builders. The clinical engine itself is the npm package; this is the part that needs a DOM. Installed automatically with Clinical Note.",
    dependencies: [
      "@oxygenui-design/clinical-note-core",
      "prosemirror-view",
      "prosemirror-state",
      "prosemirror-model",
      "prosemirror-keymap",
      "prosemirror-history",
      "prosemirror-commands",
    ],
    registryDependencies: ["utils"],
    files: [
      {
        path: "registry/oxygen/lib/clinical-note.tsx",
        type: "oxygen:hook",
        target: "lib/oxygen-clinical-note.tsx",
      },
      {
        path: "registry/oxygen/lib/clinical-note.css",
        type: "oxygen:file",
        target: "styles/oxygen-clinical-note.css",
      },
    ],
  },
  {
    name: "tokens",
    type: "oxygen:style",
    title: "Oxygen tokens",
    description:
      "Semantic clinical status tokens, three density modes, and light/dark themes. Required by every Oxygen component.",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      {
        path: "packages/tokens/src/oxygen-tokens.css",
        type: "oxygen:file",
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
 * slugs, which is what survives being put in a URL.
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
    // Deliberately not derived from `layer`. `oxygen:block` means a
    // multi-file composition installed as a unit; `layer` is our
    // dependency-direction concept. They are different axes that happen to
    // share a word, and conflating them would change install behaviour as a
    // side effect of an architectural label.
    type: "oxygen:component",
    title: meta.title,
    // The install-time blurb. The long form lives in `rationale`, on the docs
    // page, which is the only surface with room for it.
    description: meta.description,
    categories: meta.categories.map(slugifyCategory),
    dependencies: meta.dependencies,
    registryDependencies: meta.registryDependencies,
    files: meta.files ?? [
      { path: component.sourcePath, type: "oxygen:component", target: component.consumerTarget },
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

/**
 * Every `@/…` specifier in a published file must be installable.
 *
 * Registry source imports itself by the path it lands on in the consumer's
 * project — `@/lib/utils`, `@/components/oxygen/timeline`. Those specifiers
 * resolve inside this repository because tsconfig.generated.json maps them, so
 * nothing here fails when an item forgets to declare the dependency that
 * supplies one. The consumer is where it fails: the CLI writes exactly the
 * files the item asked for, the import resolves to nothing, and their build
 * breaks on source we told them was self-contained.
 *
 * `clinical-note` shipped in that state. It imports `@/lib/oxygen-clinical-note`
 * and declared only `utils` and `tokens`, so the file supplying it — the
 * `clinical-note-core` support item — was never installed. Typechecking passed
 * here on every run, because here the path is mapped.
 *
 * The check walks the transitive closure of `registryDependencies` and asks
 * what it provides, which is the same question the CLI answers at install time.
 */
function unresolvedImports(
  built: Array<Record<string, unknown>>,
  items: BuildableItem[],
): string[] {
  const byName = new Map(items.map((i) => [i.name, i]));

  /** `@/`-specifiers each item writes into the consumer's project. */
  const provides = new Map<string, Set<string>>();
  for (const item of items) {
    provides.set(
      item.name,
      new Set(
        item.files
          .map((f) => f.target)
          .filter((t): t is string => Boolean(t))
          .map((t) => `@/${t.replace(/\.(tsx|ts)$/, "")}`),
      ),
    );
  }

  const closure = (name: string, seen = new Set<string>()): Set<string> => {
    if (seen.has(name)) return seen;
    seen.add(name);
    for (const dep of byName.get(name)?.registryDependencies ?? []) {
      // Anything with a slash is a cross-registry URL; we cannot see inside it
      // and do not guess at what it provides.
      if (!dep.includes("/")) closure(dep, seen);
    }
    return seen;
  };

  const problems: string[] = [];

  for (const entry of built) {
    const name = entry.name as string;
    const available = new Set<string>();
    for (const member of closure(name)) {
      for (const specifier of provides.get(member) ?? []) available.add(specifier);
    }

    const files = entry.files as Array<{ target: string; content: string }>;
    const reported = new Set<string>();

    for (const file of files) {
      for (const match of file.content.matchAll(/from "(@\/[^"]+)"/g)) {
        const specifier = match[1] as string;
        if (available.has(specifier) || reported.has(specifier)) continue;
        reported.add(specifier);
        problems.push(
          `${name}: ${file.target} imports ${specifier}, but nothing in its registryDependencies installs that file`,
        );
      }
    }
  }

  return problems;
}

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
  // Two exclusions, for different reasons. Pro items are commercial and must
  // never reach the public CDN. Package components have no source to copy —
  // they ship on npm — so an item for one would tell the CLI to fetch files
  // that do not exist.
  const publicComponents = components.filter(
    (c) => c.meta.tier === "free" && c.meta.distribution !== "package",
  );
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
      $schema: ITEM_SCHEMA_URL,
      name: item.name,
      type: item.type,
      title: item.title,
      description: item.description,
      ...(item.categories?.length ? { categories: item.categories } : {}),
      ...(item.dependencies.length ? { dependencies: item.dependencies } : {}),
      ...(item.registryDependencies.length
        ? {
            /*
             * Bare names are emitted as bare names.
             *
             * They used to be expanded to absolute `oxygenui.design` URLs. That
             * baked this registry's own domain into every document it serves,
             * which meant a copy of the registry — a mirror, an air-gapped
             * enterprise cache, a local build under test — resolved its
             * dependencies back to production and could never be self-contained.
             * A customer who is allowed to reach only their own mirror got a
             * component whose dependencies silently pointed somewhere else.
             *
             * The CLI reads a bare name as "the registry this item came from",
             * falling back to the public catalog, so the document now describes
             * a relationship rather than a location. Anything genuinely
             * cross-registry still carries a full URL and passes through here
             * untouched.
             */
            registryDependencies: item.registryDependencies,
          }
        : {}),
      files,
    });
  }

  problems.push(...unresolvedImports(built, items));

  if (problems.length) return problems;

  // registry.json — the manifest, now an output rather than a hand-edited input.
  await emitter.emit(
    paths.registryJson,
    JSON.stringify(
      {
        $schema: REGISTRY_SCHEMA_URL,
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
            ? { registryDependencies: item.registryDependencies }
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
  // would otherwise sit on the CDN and the CLI would keep installing source
  // nobody maintains.
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
