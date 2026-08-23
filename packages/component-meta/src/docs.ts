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
   * an `oxygen add` line for a registry component, `npm install` for a package.
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
  /** Registry install command, e.g. `npx @oxygenui-design/cli add vitals-panel`. */
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
  experimental: "API may change in any minor release. Imported from @oxygenui/react/experimental.",
  beta: "API may change in a minor release, with a migration note.",
  stable: "API changes only in a major release.",
  deprecated: "Scheduled for removal. A codemod is available.",
};
