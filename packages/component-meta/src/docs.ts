/**
 * The shape the docs site consumes.
 *
 * Deliberately separate from `ComponentMeta`: metadata is what an author
 * writes, this is what a page renders. Keeping them apart means the docs can
 * add a derived field — a resolved prop table, a related-component title —
 * without that field becoming something every component author must fill in.
 *
 * Produced by scripts/gen/emit/catalog.ts. Never written by hand.
 */

import type {
  A11yCheck,
  A11yNote,
  Control,
  Distribution,
  Domain,
  Example,
  FhirResource,
  FrameworkRelation,
  Layer,
  Relationships,
  Seo,
  Stability,
  Tag,
  Tier,
  Variant,
} from "./schema";

export interface PropDoc {
  name: string;
  /** Rendered TypeScript type, normalised for display. */
  type: string;
  /** Default value, read from the component's destructuring pattern or a `@default` tag. */
  default?: string;
  /** First paragraph of the prop's doc comment. */
  description: string;
  required: boolean;
}

export interface ComponentExportDoc {
  /** The exported identifier, e.g. "ProgressiveSection". */
  name: string;
  props: PropDoc[];
  extendsType?: string;
}

export type {
  A11yCheck,
  Alternative,
  Control,
  Domain,
  Example,
  Relationships,
  Seo,
  Tag,
  Variant,
} from "./schema.js";

export interface ComponentDoc {
  name: string;
  title: string;
  tier: Tier;
  status: Stability;
  since: string;
  layer: Layer;
  /**
   * How a consumer gets it. Drives the install command the docs page shows —
   * an `zoblocks add` line for a registry component, `npm install` for a package.
   */
  distribution: Distribution;
  /** npm package name. Present only for `package` components. */
  packageName?: string;
  /**
   * Relationship to each UI framework, keyed by npm package name. Present only
   * when the component has one — most do not, and that is the house default.
   *
   * The docs page renders this as the answer to the question a buyer on antd
   * actually asks: does adopting this component mean adopting a framework?
   */
  frameworks?: Record<string, FrameworkRelation>;
  deprecation?: {
    deprecatedIn: string;
    removeIn: string;
    replacement?: string;
    reason: string;
  };

  summary: string;
  /** The card line, 8–12 words. Falls back to `summary` when absent. */
  tagline?: string;
  description: string;
  rationale: string;
  categories: string[];

  fhir: FhirResource[];
  /** First FHIR resource, for surfaces that show a single one. */
  resource?: string;
  resourceUrl?: string;

  states: string[];
  /**
   * The component's own props, extracted from its TypeScript types.
   *
   * Inherited HTML attributes are deliberately excluded — a `span`-based
   * component structurally exposes about 280 of them, and listing every
   * `onAnimationIterationCapture` buries the six props that are actually the
   * component's design. What is inherited is stated once in `extendsType`.
   */
  props: PropDoc[];
  /** The interface the props extend, e.g. "React.HTMLAttributes<HTMLSpanElement>". */
  extendsType?: string;
  /**
   * Every exported component in the file, primary first.
   *
   * Several components ship more than one export — a skeleton beside its
   * component, a row beside its panel, a provider beside its status display.
   * The hand-written catalog merged their props into one table, which read as
   * though a single component accepted all of them. They are separate here
   * because they are separate components.
   */
  exports: ComponentExportDoc[];
  usage: string;
  guidance: { use: string[]; avoid: string[] };
  accessibility: A11yNote[];
  limitations: string[];
  related: string[];

  /** npm packages a consumer inherits by installing this component. */
  dependencies: string[];

  /* ---- the standard's second half; present once a component adopts it ---- */

  /** The React export, e.g. "Tabs". Derived from the title when unset. */
  technicalName?: string;
  /** What people search for that is not the title. Feeds search, never the URL. */
  aliases?: string[];
  tags?: Tag[];
  uxGuidelines?: { do: string[]; dont: string[] };
  domain?: Domain;
  variants?: Variant[];
  /** The playground schema — which props are knobbable and with what widget. */
  controls?: Control[];
  /** Accessibility claims, each citing the test that proves it. */
  a11yChecks?: A11yCheck[];
  examples?: Example[];
  fixtures?: string[];
  seo?: Seo;
  relationships?: Relationships;
  /** Registry install command, e.g. `npx @zoblocks/cli add vitals-panel`. */
  install: string;
}

export const STATUS_LABEL: Record<Stability, string> = {
  experimental: "Experimental",
  beta: "Beta",
  stable: "Stable",
  deprecated: "Deprecated",
};

/**
 * What each tier promises. Shown next to the badge, because "Beta" means
 * nothing to a reader deciding whether to depend on it.
 */
export const STATUS_CONTRACT: Record<Stability, string> = {
  experimental: "API may change in any minor release. Imported from @zoblocks/react/experimental.",
  beta: "API may change in a minor release, with a migration note.",
  stable: "API changes only in a major release.",
  deprecated: "Scheduled for removal. A codemod is available.",
};

/* -------------------------------------------------------------------------- */
/* Readiness                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * What has a documentation page, and in what order it leads the catalogue.
 *
 * This used to live in the docs app, where three readers could reach it: the
 * catalogue ordered and tagged from it, the card decided whether it was a link
 * from it, and the component route refused to render a page for anything not
 * on it. Two readers could not — the command palette and `llms.txt` both built
 * their lists from the whole catalogue and published URLs that 404.
 *
 * So it lives here, beside the metadata it qualifies, because the generator
 * needs it too and a second copy in `scripts/` would drift the first time a
 * component shipped its page.
 *
 * The five loaders are all here because they ship as a family — one core, five
 * faces, one shared reduced-motion contract — and each already carries its own
 * visual baselines. Marking four of the five unfinished would be a claim about
 * them that nothing in the repository supports.
 *
 * Absence from this list says *the page is not written*. It says nothing about
 * whether the component installs — most of the components below this line are
 * in the registry and install today. `distributionState` is what answers that.
 */
export const DOCUMENTED_ORDER: readonly string[] = [
  "signature",
  "pulse-loader",
  "breath-loader",
  "helix-loader",
  "infusion-loader",
  "rhythm-loader",
  "tabs",
  "switch",
  "date-picker",
  "clinical-status",
  "accordion",
  "recorder",
  "chart-context-menu",
  "data-grid",
];

const DOCUMENTED = new Set(DOCUMENTED_ORDER);

/** Whether a component has a page worth opening. */
export function isDocumented(name: string): boolean {
  return DOCUMENTED.has(name);
}

/**
 * Rank for sorting: documented components first in their declared order,
 * everything else after, in whatever order it arrived.
 */
export function documentedRank(name: string): number {
  const index = DOCUMENTED_ORDER.indexOf(name);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

/**
 * The three facts a card has to keep apart.
 *
 * One "Coming soon" label was carrying all of them, and was wrong in two: it
 * sat on fifteen components that install from the registry today, next to a
 * working install button, under a heading claiming they had no page yet.
 *
 *   `ready`      installs, and has a page.
 *   `installable` installs, page not written.
 *   `announced`  described, nothing to install.
 */
export type DistributionState = "ready" | "installable" | "announced";

/**
 * Components that are described but ship nothing yet.
 *
 * Kept as an explicit list rather than inferred, because "absent from the
 * registry" is also what a build failure looks like, and a build failure should
 * not quietly relabel the catalogue.
 */
export const ANNOUNCED: readonly string[] = ["identity"];

const ANNOUNCED_SET = new Set(ANNOUNCED);

export function distributionState(name: string): DistributionState {
  if (ANNOUNCED_SET.has(name)) return "announced";
  return DOCUMENTED.has(name) ? "ready" : "installable";
}

/**
 * What the badge says.
 *
 * Never "Coming soon" for something that installs. A reader who copies the
 * command beside the badge has to get a component.
 */
export const DISTRIBUTION_LABEL: Record<DistributionState, string> = {
  ready: "",
  installable: "Docs in progress",
  announced: "Not built",
};

export const DISTRIBUTION_CONTRACT: Record<DistributionState, string> = {
  ready: "",
  installable: "Installs from the registry today. Its documentation page is not written yet.",
  announced: "Announced so the shape of the library is honest. Nothing to install yet.",
};

/**
 * The install line, from the component's own distribution channel.
 *
 * A package component shown an `zoblocks add` line sends the reader to a registry
 * item that does not exist. The card learned this and computed the right line
 * locally; the generated metadata and `llms.txt` did not, so three components
 * carried two different commands depending on which surface you read.
 */
export function installCommandFor(meta: {
  name: string;
  distribution?: string;
  packageName?: string;
}): string {
  return meta.distribution === "package" && meta.packageName
    ? `pnpm add ${meta.packageName}`
    : `npx @zoblocks/cli add ${meta.name}`;
}
