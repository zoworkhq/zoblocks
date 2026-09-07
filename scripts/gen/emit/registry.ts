/**
 * Emits the ZoBlocks registry: registry.json and one document per item under
 * apps/docs/public/r/, in the format @zoblocks/cli installs from.
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
import { ITEM_SCHEMA_URL, REGISTRY_SCHEMA_URL } from "@zoblocks/cli";
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
    type: "zoblocks:lib",
    title: "Utils",
    description: "Class-name merge helper shared by every ZoBlocks component.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: [] as string[],
    files: [
      { path: "registry/zoblocks/lib/utils.ts", type: "zoblocks:lib", target: "lib/utils.ts" },
    ],
  },
  {
    name: "recorder-core",
    type: "zoblocks:lib",
    title: "Recorder core",
    description:
      "Signal path, peak buffer, capture machine and the thirteen fault detectors behind Recorder. Installed automatically with the recorder.",
    dependencies: ["clsx", "tailwind-merge", "@zoblocks/recorder-core"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "registry/zoblocks/lib/recorder.tsx",
        type: "zoblocks:lib",
        target: "lib/zoblocks-recorder.tsx",
      },
      {
        path: "registry/zoblocks/lib/recorder.css",
        type: "zoblocks:file",
        target: "styles/zoblocks-recorder.css",
      },
    ],
  },
  {
    name: "loader-core",
    type: "zoblocks:lib",
    title: "Loader core",
    description:
      "Shared frame, timing gate, and stylesheet behind every ZoBlocks loader. Installed automatically with any loader.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "registry/zoblocks/lib/loader.tsx",
        type: "zoblocks:lib",
        target: "lib/zoblocks-loader.tsx",
      },
      {
        path: "registry/zoblocks/lib/loader.css",
        type: "zoblocks:file",
        target: "styles/zoblocks-loader.css",
      },
    ],
  },
  {
    name: "accordion-core",
    type: "zoblocks:lib",
    title: "Accordion core",
    description:
      "Headless disclosure behaviour and stylesheet behind Accordion and Disclosure: the open-set policies, the ARIA wiring, the access model, and find-in-page support. Installed automatically with either.",
    dependencies: [] as string[],
    registryDependencies: ["utils"],
    files: [
      {
        path: "registry/zoblocks/lib/accordion-core.tsx",
        type: "zoblocks:hook",
        target: "lib/zoblocks-accordion.tsx",
      },
      {
        path: "registry/zoblocks/lib/accordion.css",
        type: "zoblocks:file",
        target: "styles/zoblocks-accordion.css",
      },
    ],
  },
  {
    name: "clinical-status-core",
    type: "zoblocks:lib",
    title: "Clinical status core",
    description:
      "The closed status vocabulary: nine scales, forty steps, each carrying a tone, a CSS glyph and a word in both a clinician and a patient register — plus the FHIR adapters that map Observation, AllergyIntolerance, Encounter, Task, Consent and DetectedIssue onto them. Installed automatically with ClinicalStatus.",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      {
        path: "registry/zoblocks/lib/clinical-status.ts",
        type: "zoblocks:lib",
        target: "lib/zoblocks-clinical-status.ts",
      },
      {
        path: "registry/zoblocks/lib/clinical-status.css",
        type: "zoblocks:style",
        target: "styles/zoblocks-clinical-status.css",
      },
    ],
  },
  {
    name: "result-value-core",
    type: "zoblocks:lib",
    title: "Result value core",
    description:
      "The seven absence reasons, the interpretation precedence rule, the delta suppression rule, and the sentence composer that turns an observation into one spoken clinical statement. Includes the FHIR Observation adapter. Installed automatically with ResultValue.",
    dependencies: [] as string[],
    registryDependencies: ["clinical-status-core"],
    files: [
      {
        path: "registry/zoblocks/lib/result-value.ts",
        type: "zoblocks:lib",
        target: "lib/zoblocks-result-value.ts",
      },
      {
        path: "registry/zoblocks/lib/result-value.css",
        type: "zoblocks:style",
        target: "styles/zoblocks-result-value.css",
      },
    ],
  },
  {
    name: "allergy-core",
    type: "zoblocks:lib",
    title: "Allergy core",
    description:
      "The distinction between criticality (risk of a future reaction) and reaction severity (how bad a past one was), six verification states, four kinds, and the rule that a no-known-allergies assertion without an asserter and a date is not an assertion. Includes the FHIR AllergyIntolerance adapter. Installed automatically with AllergyChip.",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      {
        path: "registry/zoblocks/lib/allergy.ts",
        type: "zoblocks:lib",
        target: "lib/zoblocks-allergy.ts",
      },
      {
        path: "registry/zoblocks/lib/allergy.css",
        type: "zoblocks:style",
        target: "styles/zoblocks-allergy.css",
      },
    ],
  },
  {
    name: "risk-core",
    type: "zoblocks:lib",
    title: "Risk core",
    description:
      "Five bands including one for a patient the model could not score, driver attribution with its concentration, and a validity window that turns an old score into an expired one. Includes the FHIR RiskAssessment adapter. Installed automatically with RiskIndicator.",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      {
        path: "registry/zoblocks/lib/risk.ts",
        type: "zoblocks:lib",
        target: "lib/zoblocks-risk.ts",
      },
      {
        path: "registry/zoblocks/lib/risk.css",
        type: "zoblocks:style",
        target: "styles/zoblocks-risk.css",
      },
    ],
  },
  {
    name: "provenance-core",
    type: "zoblocks:lib",
    title: "Provenance core",
    description:
      "Six source classes with CSS glyphs rather than colours, observed-at kept separate from recorded-at, per-datum staleness policies, and the confirmation state of an AI-extracted value. Includes a ledger keyed by resource and version, and the FHIR Provenance adapter. Installed automatically with ProvenanceChip.",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      {
        path: "registry/zoblocks/lib/provenance.ts",
        type: "zoblocks:lib",
        target: "lib/zoblocks-provenance.ts",
      },
      {
        path: "registry/zoblocks/lib/provenance.css",
        type: "zoblocks:style",
        target: "styles/zoblocks-provenance.css",
      },
    ],
  },
  {
    name: "trend-core",
    type: "zoblocks:lib",
    title: "Trend core",
    description:
      "Comparability segmentation across assay, method and unit changes, a minimum-points floor, the reliable-change threshold that renders noise as flat, and a required valence because half of clinical measures improve by falling. One SVG path per segment, no chart library. Installed automatically with TrendIndicator.",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      {
        path: "registry/zoblocks/lib/trend.ts",
        type: "zoblocks:lib",
        target: "lib/zoblocks-trend.ts",
      },
      {
        path: "registry/zoblocks/lib/trend.css",
        type: "zoblocks:style",
        target: "styles/zoblocks-trend.css",
      },
    ],
  },
  {
    name: "datetime-core",
    type: "zoblocks:lib",
    title: "Date & time core",
    description:
      "The temporal engine and the behaviour every date, time and session control shares. Plain serialisable value types that carry their own precision — a birth date has no time member and cannot become midnight UTC — integer calendar arithmetic, a keyboard-first segmented field, an accessible month grid, and the session algebra whose driver is explicit state rather than an inference. Reads IANA zone data through Intl rather than shipping an offset table, and never reads the wall clock. Installed automatically with DateField, Calendar, DatePicker, BirthDateField, TimeField, SessionTimeField and ClinicalDateTime.",
    dependencies: ["clsx", "tailwind-merge"] as string[],
    registryDependencies: ["utils"] as string[],
    files: [
      {
        path: "registry/zoblocks/lib/datetime.ts",
        type: "zoblocks:lib",
        target: "lib/zoblocks-datetime.ts",
      },
      {
        path: "registry/zoblocks/lib/datetime-field.tsx",
        type: "zoblocks:lib",
        target: "lib/zoblocks-datetime-field.tsx",
      },
      {
        path: "registry/zoblocks/lib/availability.ts",
        type: "zoblocks:lib",
        target: "lib/zoblocks-availability.ts",
      },
      {
        path: "registry/zoblocks/lib/recurrence.ts",
        type: "zoblocks:lib",
        target: "lib/zoblocks-recurrence.ts",
      },
      {
        path: "registry/zoblocks/lib/datetime-parts.tsx",
        type: "zoblocks:lib",
        target: "lib/zoblocks-datetime-parts.tsx",
      },
      {
        path: "registry/zoblocks/lib/datetime.css",
        type: "zoblocks:style",
        target: "styles/zoblocks-datetime.css",
      },
    ],
  },
  {
    name: "clock-core",
    type: "zoblocks:lib",
    title: "Clock",
    description:
      'One date format shared by the components that have to say "until when": an ISO timestamp read as the wall-clock time it was written in, rather than re-zoned through the reader\'s browser. Its own item rather than part of `utils`, because inside an application `@/lib/utils` is a name the application usually already owns.',
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      {
        path: "registry/zoblocks/lib/clock.ts",
        type: "zoblocks:lib",
        target: "lib/zoblocks-clock.ts",
      },
    ],
  },
  {
    name: "presence-core",
    type: "zoblocks:lib",
    title: "Presence core",
    description:
      "Nine clinical presence states rather than a green dot, ring geometry that survives a colour deficiency, rota resolution that returns a gap instead of the nearest plausible name, chart co-presence conflict detection, and escalation routing that offers the covering clinician before it offers an override. Installed automatically with CareTeamPresence.",
    dependencies: [] as string[],
    registryDependencies: ["clock-core"],
    files: [
      {
        path: "registry/zoblocks/lib/presence.ts",
        type: "zoblocks:lib",
        target: "lib/zoblocks-presence.ts",
      },
      {
        path: "registry/zoblocks/lib/presence.css",
        type: "zoblocks:style",
        target: "styles/zoblocks-presence.css",
      },
    ],
  },
  {
    name: "chart-header-core",
    type: "zoblocks:lib",
    title: "Chart header core",
    description:
      'The Sex Parameter for Clinical Use resolved against what is on screen rather than read as a demographic, a safety strip whose absences are named rather than omitted, encounter context that will sit in "none selected" rather than pick one for you, and EpisodeOfCare into a program and a week. Installed automatically with ChartHeader.',
    dependencies: [] as string[],
    registryDependencies: ["clock-core"],
    files: [
      {
        path: "registry/zoblocks/lib/chart-header.ts",
        type: "zoblocks:lib",
        target: "lib/zoblocks-chart-header.ts",
      },
      {
        path: "registry/zoblocks/lib/chart-header.css",
        type: "zoblocks:style",
        target: "styles/zoblocks-chart-header.css",
      },
    ],
  },
  {
    name: "workspace-core",
    type: "zoblocks:lib",
    title: "Workspace core",
    description:
      "The multi-chart workspace rules: a per-chart accent derived from the chart id so it is the same hue in every session, automatic disambiguation when two open charts look alike, a graded close verdict that asks about an unsigned note and refuses a draft order, and the fifteen-minute rule for re-asserting identity on return. Installed automatically with RecentPatientStack.",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      {
        path: "registry/zoblocks/lib/workspace.ts",
        type: "zoblocks:lib",
        target: "lib/zoblocks-workspace.ts",
      },
      {
        path: "registry/zoblocks/lib/workspace.css",
        type: "zoblocks:style",
        target: "styles/zoblocks-workspace.css",
      },
    ],
  },
  {
    name: "palette-core",
    type: "zoblocks:lib",
    title: "Command palette core",
    description:
      "Verb-first ranking with a sixty-line fuzzy matcher, treatment-relationship scoping that counts out-of-scope patients rather than naming them, an audit record for every patient search including the empty ones, and the second-Enter rule for a clinically significant action. Installed automatically with ChartCommandPalette.",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      {
        path: "registry/zoblocks/lib/palette.ts",
        type: "zoblocks:lib",
        target: "lib/zoblocks-palette.ts",
      },
      {
        path: "registry/zoblocks/lib/palette.css",
        type: "zoblocks:style",
        target: "styles/zoblocks-palette.css",
      },
    ],
  },
  {
    name: "menu-core",
    type: "zoblocks:lib",
    title: "Context menu core",
    description:
      "The resolver behind ChartContextMenu: the subject line a masked row may not exceed, four consequence tiers with the field each one makes mandatory, availability that distinguishes pending from refused from withheld, the withheld count, the bulk demotion, and the disclosure record produced on every path including the abandoned one. Installed automatically with ChartContextMenu.",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      {
        path: "registry/zoblocks/lib/menu.ts",
        type: "zoblocks:lib",
        target: "lib/zoblocks-menu.ts",
      },
      {
        path: "registry/zoblocks/lib/menu.css",
        type: "zoblocks:style",
        target: "styles/zoblocks-menu.css",
      },
    ],
  },
  {
    name: "grid-core",
    type: "zoblocks:lib",
    title: "Data grid core",
    description:
      'The engine behind DataGrid: a cell value type with no null member so an absence has to say which kind it is, coverage that admits a total of "unknown" because a FHIR server often will not say, comparison that keeps absent values at the bottom in both directions, two-dimensional cursor arithmetic for role="grid", a measured row ceiling the grid refuses past rather than degrading, and a CSV writer that neutralises formula injection with no way to switch it off. Installed automatically with DataGrid.',
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      {
        path: "registry/zoblocks/lib/grid.ts",
        type: "zoblocks:lib",
        target: "lib/zoblocks-grid.ts",
      },
      {
        path: "registry/zoblocks/lib/grid.css",
        type: "zoblocks:style",
        target: "styles/zoblocks-grid.css",
      },
    ],
  },
  {
    name: "switch-core",
    type: "zoblocks:lib",
    title: "Switch core",
    description:
      "The three-axis state model behind ZoBlocks's Switch: the commit phase machine, the state-label presets, and the absence vocabulary. Installed automatically with Switch.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: ["utils"],
    files: [
      {
        path: "registry/zoblocks/lib/switch.tsx",
        type: "zoblocks:lib",
        target: "lib/zoblocks-switch.tsx",
      },
      {
        path: "registry/zoblocks/lib/switch.css",
        type: "zoblocks:file",
        target: "styles/zoblocks-switch.css",
      },
    ],
  },
  {
    name: "timeline-core",
    type: "zoblocks:lib",
    title: "Timeline core",
    description:
      "The chronology engine behind Timeline and CareTimeline: precision-preserving time, the stable comparator, grouping, clustering with critical promotion, the coverage claim and its sentence. Installed automatically with either.",
    dependencies: [] as string[],
    registryDependencies: ["utils", "accordion-core"],
    files: [
      {
        path: "registry/zoblocks/lib/timeline-core.ts",
        type: "zoblocks:lib",
        target: "lib/timeline-core.ts",
      },
      {
        path: "registry/zoblocks/lib/timeline.css",
        type: "zoblocks:file",
        target: "styles/zoblocks-timeline.css",
      },
    ],
  },
  {
    name: "timeline-fhir",
    type: "zoblocks:lib",
    title: "Timeline FHIR adapters",
    description:
      "Thirteen FHIR R4 resource types read into timeline events, plus an honest report of everything that could not be mapped. Pure functions — no fetching. Installed automatically with CareTimeline.",
    dependencies: ["@zoblocks/fhir"],
    registryDependencies: ["utils", "timeline-core"],
    files: [
      {
        path: "registry/zoblocks/lib/timeline-fhir.ts",
        type: "zoblocks:lib",
        target: "lib/timeline-fhir.ts",
      },
    ],
  },
  {
    name: "clinical-note-core",
    type: "zoblocks:lib",
    title: "Clinical note core",
    description:
      "The ProseMirror binding behind Clinical Note: the editor view, the provenance decorations, the toolbar commands, and the document builders. The clinical engine itself is the npm package; this is the part that needs a DOM. Installed automatically with Clinical Note.",
    dependencies: [
      "@zoblocks/clinical-note-core",
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
        path: "registry/zoblocks/lib/clinical-note.tsx",
        type: "zoblocks:hook",
        target: "lib/zoblocks-clinical-note.tsx",
      },
      {
        path: "registry/zoblocks/lib/clinical-note.css",
        type: "zoblocks:file",
        target: "styles/zoblocks-clinical-note.css",
      },
    ],
  },
  {
    name: "tokens",
    type: "zoblocks:style",
    title: "ZoBlocks tokens",
    description:
      "Semantic clinical status tokens, three density modes, and light/dark themes. Required by every ZoBlocks component.",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
    files: [
      {
        path: "packages/tokens/src/zoblocks-tokens.css",
        type: "zoblocks:file",
        target: "styles/zoblocks-tokens.css",
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
    // Deliberately not derived from `layer`. `zoblocks:block` means a
    // multi-file composition installed as a unit; `layer` is our
    // dependency-direction concept. They are different axes that happen to
    // share a word, and conflating them would change install behaviour as a
    // side effect of an architectural label.
    type: "zoblocks:component",
    title: meta.title,
    // The install-time blurb. The long form lives in `rationale`, on the docs
    // page, which is the only surface with room for it.
    description: meta.description,
    categories: meta.categories.map(slugifyCategory),
    dependencies: meta.dependencies,
    registryDependencies: meta.registryDependencies,
    files: meta.files ?? [
      { path: component.sourcePath, type: "zoblocks:component", target: component.consumerTarget },
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
 * project — `@/lib/utils`, `@/components/zoblocks/timeline`. Those specifiers
 * resolve inside this repository because tsconfig.generated.json maps them, so
 * nothing here fails when an item forgets to declare the dependency that
 * supplies one. The consumer is where it fails: the CLI writes exactly the
 * files the item asked for, the import resolves to nothing, and their build
 * breaks on source we told them was self-contained.
 *
 * `clinical-note` shipped in that state. It imports `@/lib/zoblocks-clinical-note`
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

      /*
       * Relative imports, which this check used to ignore entirely.
       *
       * The registry renames files as it installs them — `lib/result-value.ts`
       * lands as `lib/zoblocks-result-value.ts` — so a relative specifier that
       * resolves in this monorepo can resolve to nothing in a consumer's
       * project. That is exactly what shipped: `result-value` imported
       * `./clinical-status`, whose file installs as `zoblocks-clinical-status`,
       * and `zoblocks add result-value` produced a tree that did not compile.
       *
       * Every sibling in `registry/zoblocks/lib` is already imported by its
       * installed name through `@/lib/zoblocks-*`. One file was not, the check
       * only looked at `@/` specifiers, and nothing caught it. This closes
       * that: inside the registry, a relative import across files is refused
       * outright, because the installed layout is flat and renamed and there
       * is no relative path that survives it.
       */
      for (const match of file.content.matchAll(/from "(\.\.?\/[^"]+)"/g)) {
        const specifier = match[1] as string;
        if (reported.has(specifier)) continue;
        reported.add(specifier);
        problems.push(
          `${name}: ${file.target} imports "${specifier}" relatively. ` +
            `Files are renamed on install, so a relative path resolves here and not in a ` +
            `consumer's project — import it by its installed name instead, as "@/lib/zoblocks-…".`,
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
             * They used to be expanded to absolute `zoblocks.design` URLs. That
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
