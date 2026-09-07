/**
 * The component metadata schema.
 *
 * One `<component>.meta.ts` per component is the single source of truth for
 * everything the platform generates: the Zoblocks registry, the docs catalog,
 * TypeScript path mappings, Tailwind source globs, package barrels, the agent
 * manifest, and the CI coverage gate.
 *
 * Two rules govern what belongs here.
 *
 *   1. Nothing derivable from the code. Props are extracted from the component's
 *      TypeScript types (see scripts/gen/props.ts). A prop table restated by
 *      hand is read as a contract and drifts silently, which is worse than no
 *      prop table at all.
 *
 *   2. Everything NOT derivable from the code. Guidance, limitations, and
 *      clinical rationale carry this product's actual value. They cannot be
 *      inferred from a type and must be reviewable as structured data rather
 *      than buried in JSDoc.
 *
 * See content/decisions/0004-generated-component-metadata.md.
 */

import { z } from "zod";

/**
 * Stability tier. This is a semver contract with consumers, not a label —
 * it determines which export path the component ships on and what a minor
 * release is allowed to do to it.
 *
 * See content/decisions/0006-stability-tiers-and-deprecation.md.
 */
export const stabilitySchema = z.enum(["experimental", "beta", "stable", "deprecated"]);

/** Commercial channel. Drives npm scope and whether the item reaches the public CDN. */
export const tierSchema = z.enum(["free", "pro"]);

/**
 * Architectural layer. Enforced as a dependency direction: a module may import
 * from its own layer or below, never above.
 */
export const layerSchema = z.enum(["primitive", "clinical", "pattern", "block"]);

/**
 * How a consumer gets this component.
 *
 * `registry` is the default and the house style: the source is copied into the
 * customer's repository by the Zoblocks CLI, so it must be self-contained and
 * readable on its own.
 *
 * `package` is for components that cannot satisfy that constraint. Signature is
 * the first: it wraps Ant Design, and a component that copies antd's Modal,
 * Tabs and Form into someone's repo is not "source you own", it is a fork of a
 * framework. So it ships as an npm package with antd as a peer dependency.
 *
 * The axis exists because without it a package component is simply *invisible*.
 * The catalog is generated from the registry directory, so Signature was built,
 * tested, merged and documented, and still did not appear at /components — a
 * component nobody can find is a component that does not exist.
 */
export const distributionSchema = z.enum(["registry", "package"]);

const nonEmpty = (label: string) => z.string().min(1, `${label} must not be empty`);

/**
 * A component's relationship to a UI framework, per ADR 0010.
 *
 * The ADR draws the line in prose — "primitives match Ant Design's public API
 * exactly and take no dependency on it; compound clinical organisms may wrap
 * antd, and each one must name the expensive behaviour it is inheriting". This
 * is that rule as data, so the answer is machine-readable rather than a matter
 * of reading imports, and so the docs can state it per component without
 * anybody remembering to.
 */
export const frameworkPolicySchema = z.enum([
  /** Matches the framework's public API and imports nothing from it. */
  "compatible",
  /** Wraps it for behaviour worth inheriting. `inherits` must say what. */
  "wrapping",
  /** No relationship. Themed only through the component token surface. */
  "neutral",
]);

export const frameworkRelationSchema = z.object({
  policy: frameworkPolicySchema,
  /**
   * The specific behaviour being inherited, required when wrapping.
   *
   * ADR 0010 is explicit that "it is consistent" is not a reason and
   * "Modal's focus trap and Tabs' `aria-controls` wiring" is. Making it a
   * required field is what stops the first kind of answer being written.
   */
  inherits: z.array(nonEmpty("inherits item")).optional(),
  /** Whether a theme bridge exists for this framework. */
  bridge: z.boolean().default(false),
  /** Divergences from the framework's API, each one deliberate. */
  divergences: z.array(nonEmpty("divergence")).default([]),
});

export const fhirResourceSchema = z.object({
  /** Resource type as spelled in the FHIR specification, e.g. "Observation". */
  name: nonEmpty("fhir resource name"),
  url: z.string().url(),
  /**
   * Which elements the component actually reads, and what it does with them.
   *
   * Optional, and the difference between "this touches Observation" and
   * something a reader can check their own feed against — `method` and
   * `valueQuantity.unit` decide comparability, `participant[].period` becomes
   * a coverage window. Six components were already writing this before the
   * schema had a home for it: zod dropped it silently and TypeScript rejected
   * it, so the note existed in the source and reached neither the catalog nor
   * the page.
   */
  note: nonEmpty("fhir resource note").optional(),
});

export const a11yNoteSchema = z.object({
  label: nonEmpty("a11y note label"),
  /**
   * What the component actually does, in terms a reviewer can verify against
   * the rendered output. Not a restatement of a WCAG success criterion.
   */
  detail: nonEmpty("a11y note detail"),
});

export const propOverrideSchema = z.object({
  name: nonEmpty("prop name"),
  /**
   * Hide a prop from public documentation. For internals that are structurally
   * public because of a spread, never for a prop consumers are expected to use.
   */
  hidden: z.boolean().optional(),
  /** Ordering hint. Lower sorts first; unset sorts after all hinted props. */
  order: z.number().int().optional(),
});

export const deprecationSchema = z.object({
  deprecatedIn: nonEmpty("deprecatedIn"),
  /** The major in which this component is removed. Required — a deprecation without an end date never ends. */
  removeIn: nonEmpty("removeIn"),
  /** Registry name of the replacement, if there is one. */
  replacement: z.string().optional(),
  reason: nonEmpty("deprecation reason"),
});

export const registryFileSchema = z.object({
  /** Path relative to the repository root. */
  path: nonEmpty("file path"),
  /**
   * What the file is, which decides where the CLI puts it. The vocabulary is
   * Zoblocks's own — `@zoblocks/cli` maps each kind to an alias root in
   * the consumer's `zoblocks.json`, so adding a kind here means deciding where
   * it lands there.
   */
  type: z.enum([
    "zoblocks:lib",
    "zoblocks:component",
    "zoblocks:ui",
    "zoblocks:hook",
    "zoblocks:block",
    "zoblocks:page",
    "zoblocks:file",
    "zoblocks:style",
  ]),
  /** Where the CLI writes it in the consumer's project. */
  target: z.string().optional(),
});

/* =========================================================================
 * The standard's second half.
 *
 * Everything below is optional on the object and *required by
 * `superRefine` once `status` is `"stable"`. That is deliberate and it is the
 * maturity model expressed as code rather than as a checklist: a component may
 * ship at experimental or beta with none of this, and cannot be promoted
 * without all of it. Making the fields unconditionally required would have
 * invalidated fourteen shipping components on the day the schema landed, which
 * is how a standard gets reverted instead of adopted.
 * ====================================================================== */

/** Closed vocabulary. A free-text industry is how a Button acquires a FHIR paragraph. */
export const industrySchema = z.enum([
  "general",
  "healthcare",
  "behavioral-health",
  "payer",
  "human-services",
]);

/** Closed vocabulary. Drives the pattern hubs and the workflow search facet. */
export const workflowSchema = z.enum([
  "intake",
  "assessment",
  "documentation",
  "treatment-planning",
  "medication",
  "scheduling",
  "billing",
  "telehealth",
  "care-coordination",
]);

/** Closed vocabulary. Rendered as a chip row and indexed for search. */
export const codeSystemSchema = z.enum([
  "LOINC",
  "SNOMED CT",
  "RxNorm",
  "ICD-10-CM",
  "CPT",
  "HL7 v2",
  "FHIR",
]);

/**
 * Multi-axis tags describing what a component *does*, not what it is called.
 * This is what answers "table with filtering", which name-only search cannot.
 */
export const tagSchema = z.enum([
  "virtualised",
  "filterable",
  "sortable",
  "streaming",
  "keyboard-first",
  "offline-capable",
  "form-control",
  "overlay",
  "navigation",
  "data-entry",
  "data-display",
  "feedback",
  "layout",
  "disclosure",
  "headless",
  "animated",
  "themeable",
  "print-safe",
]);

export const searchIntentSchema = z.enum([
  "informational",
  "navigational",
  "commercial",
  "transactional",
]);

/** A named appearance variant, with the args that demonstrate it. */
export const variantSchema = z.object({
  id: nonEmpty("variant id"),
  label: nonEmpty("variant label"),
  description: nonEmpty("variant description"),
  args: z.record(z.string(), z.unknown()).default({}),
});

/**
 * The playground schema.
 *
 * Controls are data rather than markup so coverage is uniform. Mantine's
 * playground is the pattern to beat and its weakness is that each demo declares
 * its own knobs by hand — some components get twelve and some get none, which
 * is the inconsistency this whole schema exists to prevent.
 */
export const controlSchema = z.object({
  prop: nonEmpty("control prop"),
  /** Widget. Chosen from the prop's type, not from taste — see the standard §6. */
  control: z.enum(["switch", "segmented", "select", "slider", "text", "token", "fixture", "event"]),
  label: z.string().optional(),
  options: z.array(z.string()).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  defaultValue: z.unknown().optional(),
});

/**
 * A machine-checkable accessibility claim.
 *
 * `evidence` is a test id, and it is required: a claim with no test behind it
 * is prose, and prose in an accessibility panel is how a library ends up
 * asserting conformance it has never measured.
 */
export const a11yCheckSchema = z.object({
  /** WCAG success criterion, e.g. "2.1.1". */
  wcag: nonEmpty("wcag criterion").regex(/^\d+\.\d+\.\d+$/, "must be a WCAG SC number like 2.1.1"),
  name: nonEmpty("criterion name"),
  status: z.enum(["pass", "fail", "not-applicable"]),
  /** How it is met, in one sentence. */
  how: nonEmpty("how the criterion is met"),
  /** The test file or gate that proves it. Required unless the status is not-applicable. */
  evidence: z.string().optional(),
});

/** A realistic, copyable example. Prose usage is not an example — nothing renders it. */
export const exampleSchema = z.object({
  id: nonEmpty("example id"),
  title: nonEmpty("example title"),
  description: nonEmpty("example description"),
  /** Named dataset from @zoblocks/fixtures. Lorem ipsum is a build error. */
  fixture: z.string().optional(),
  code: nonEmpty("example code"),
});

export const alternativeSchema = z.object({
  ref: nonEmpty("alternative ref"),
  /** "…instead when X." The single strongest trust signal on a component page. */
  when: nonEmpty("alternative when"),
});

export const domainSchema = z.object({
  industries: z.array(industrySchema).default([]),
  /** Rendered only when industries contains a clinical value. */
  clinicalContext: z.string().optional(),
  workflows: z.array(workflowSchema).default([]),
  phi: z
    .object({
      handles: z.boolean(),
      notes: nonEmpty("phi notes"),
    })
    .optional(),
  /** Whether the component emits AuditEvent. Drives a badge and an audit section. */
  auditable: z.boolean().optional(),
  permissions: z.array(nonEmpty("permission")).default([]),
  terminology: z.array(codeSystemSchema).default([]),
});

export const relationshipsSchema = z.object({
  /**
   * Derived from imports by the generator, not authored. Present on the schema
   * so a hand-written value can be rejected rather than silently trusted.
   */
  builtWith: z.array(nonEmpty("builtWith")).default([]),
  /** The inverse edge, computed. A primitive discovers its own consumers. */
  usedIn: z.array(nonEmpty("usedIn")).default([]),
  patterns: z.array(nonEmpty("pattern")).default([]),
  alternatives: z.array(alternativeSchema).default([]),
});

export const seoSchema = z.object({
  /** Defaults to `name`. Changing it requires a redirect entry in the same commit. */
  slug: z.string().optional(),
  title: z.string().max(60, "SEO title must be 60 characters or fewer").optional(),
  description: z
    .string()
    .min(120, "meta description under 120 characters wastes the slot")
    .max(158, "meta description over 158 characters is truncated in results")
    .optional(),
  /** Exactly one. Two components may not claim the same one — checked across the catalogue. */
  primaryKeyword: z.string().optional(),
  secondaryKeywords: z.array(nonEmpty("secondary keyword")).max(5).default([]),
  searchIntent: searchIntentSchema.optional(),
  /** "generated" renders from the component's own preview at build time. */
  ogImage: z.union([z.literal("generated"), z.string().url()]).default("generated"),
  noindex: z.boolean().optional(),
});

export const componentMetaSchema = z
  .object({
    /** Registry name, URL slug, and directory name. All three are the same string. */
    name: nonEmpty("name").regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "must be kebab-case"),
    title: nonEmpty("title"),

    tier: tierSchema.default("free"),
    status: stabilitySchema,
    /** Version this component first shipped in. */
    since: nonEmpty("since"),
    deprecation: deprecationSchema.optional(),

    layer: layerSchema,

    /**
     * How the component is delivered. Defaults to `registry`.
     *
     * A `package` component has no source in `registry/zoblocks`, emits no
     * registry item, and shows an `npm install` command rather than an
     * `zoblocks add` one. Its `packageName` is what a consumer installs.
     */
    /**
     * Per-framework relationship, keyed by npm package name — `antd`,
     * `@mui/material`. Absent means the component has no relationship with any
     * UI framework, which is the common case and the house default.
     */
    frameworks: z.record(z.string(), frameworkRelationSchema).default({}),

    distribution: distributionSchema.default("registry"),
    /** npm package name. Required when `distribution` is `package`. */
    packageName: z.string().optional(),
    /**
     * File under `src/` to extract the prop table from, when it is not named
     * after the title.
     *
     * The convention — `Signature` in `Signature.tsx` — assumes a package has
     * one public component. A package whose surface is several of them has no
     * file to name after itself, and contorting the catalog title into a
     * filename would put the filename in front of the reader instead. Name the
     * component whose props a consumer configures.
     */
    propsSource: z.string().optional(),

    /**
     * Extra files to extract a public API from, relative to the component
     * directory.
     *
     * The default assumption — one file, one API — stops holding the moment a
     * component's surface is a `variant` union over parts that live elsewhere.
     * `DatePicker` is a dispatch: the type checker sees the intersection of
     * fourteen prop interfaces, which is three props, and a reader learns
     * nothing about the thirteen variants they came for. Naming the parts file
     * here documents each part as its own export rather than flattening them
     * into a table that would mean nothing.
     *
     * Registry components only — a package names one entry point with
     * `propsSource` instead.
     */
    extraPropsSources: z.array(nonEmpty("extraPropsSources")).default([]),

    /**
     * Three lengths for three surfaces. They are separate fields because each
     * is read in a different place, under different attention, and collapsing
     * them produces text that is wrong for at least two of the three.
     */

    /** One line. Search results, page metadata, llms.txt. */
    summary: z.string().min(20, "summary must be useful, not a placeholder"),
    /**
     * The card line. Eight to twelve words.
     *
     * Split out of `summary` because the comment above this block was right and
     * the schema was not yet acting on it: `summary` is capped at 160 characters
     * *because* it doubles as the meta description, which makes it a good
     * description and a poor card. Twenty-seven of them at a 21-word median
     * turned the catalogue into a wall of grey, and a card is a decision aid —
     * enough to choose a link, not enough to explain the component.
     *
     * Optional, so a component without one falls back to `summary` and the
     * catalogue never renders a blank cell. Capped rather than floored: the
     * failure mode here is length, not brevity.
     */
    tagline: z.string().max(75, "tagline is the card line; keep it under 75 characters").optional(),
    /** Two sentences. The registry manifest — what a developer reads at install time. */
    description: z
      .string()
      .min(60, "description must be useful, not a placeholder")
      .max(400, "description is the install-time blurb; put the reasoning in rationale"),
    /**
     * The long form. Why this component exists and what failure it prevents.
     * Rendered on the docs detail page — the only surface with room for it.
     */
    rationale: z.string().min(60, "rationale must be useful, not a placeholder"),

    categories: z.array(nonEmpty("category")).min(1, "at least one category"),

    /** FHIR resources this component reads. Empty for components with no clinical payload. */
    fhir: z.array(fhirResourceSchema).default([]),

    /**
     * The states this component renders explicitly. Absence, error, restricted,
     * and degraded states are the product; listing them is how the docs stay
     * honest about which ones are handled.
     */
    states: z.array(nonEmpty("state")).min(1, "list the states this component renders"),

    a11y: z.array(a11yNoteSchema).min(1, "at least one accessibility note"),

    guidance: z.object({
      use: z.array(nonEmpty("guidance.use item")).min(1),
      avoid: z.array(nonEmpty("guidance.avoid item")).min(1),
    }),

    /** Known gaps, stated plainly. An undocumented limitation is a bug report. */
    limitations: z.array(nonEmpty("limitation")),

    /** Registry names of related components. Validated to exist at generation time. */
    related: z.array(nonEmpty("related")),

    /** Runnable usage example. Rendered in docs and used as the registry item's snippet. */
    usage: nonEmpty("usage"),

    /** npm packages the component imports. Written into the registry item. */
    dependencies: z.array(nonEmpty("dependency")).default([]),
    /** Registry names this component requires. Resolved to full URLs at generation time. */
    registryDependencies: z.array(nonEmpty("registryDependency")).default([]),

    /**
     * Files shipped through the registry. Defaults to the component's own
     * source file; set explicitly only for multi-file components.
     */
    files: z.array(registryFileSchema).optional(),

    /** Curation for the generated prop table. Never changes the contract, only its presentation. */
    props: z.array(propOverrideSchema).default([]),

    /* ---- the standard's second half; required at `stable` ---------------- */

    /** The React export. Derived from `title` when absent. */
    technicalName: z.string().optional(),
    /**
     * What people type that is not the title — "patient switcher", "chart
     * picker", a creative internal name. Feeds search and the keyword set,
     * never the URL.
     */
    aliases: z.array(nonEmpty("alias")).default([]),
    tags: z.array(tagSchema).default([]),
    /** Rendered as a paired do/don't grid. */
    uxGuidelines: z
      .object({
        do: z.array(nonEmpty("uxGuidelines.do item")).default([]),
        dont: z.array(nonEmpty("uxGuidelines.dont item")).default([]),
      })
      .optional(),
    domain: domainSchema.default({
      industries: [],
      workflows: [],
      permissions: [],
      terminology: [],
    }),
    variants: z.array(variantSchema).default([]),
    controls: z.array(controlSchema).default([]),
    a11yChecks: z.array(a11yCheckSchema).default([]),
    relationships: relationshipsSchema.default({
      builtWith: [],
      usedIn: [],
      patterns: [],
      alternatives: [],
    }),
    examples: z.array(exampleSchema).default([]),
    /** Named synthetic datasets. Lorem ipsum is a build error. */
    fixtures: z.array(nonEmpty("fixture")).default([]),
    seo: seoSchema.default({ secondaryKeywords: [], ogImage: "generated" }),
  })
  .strict()
  .superRefine((meta, ctx) => {
    // A package component that does not say what to install is undocumentable:
    // the docs page has no install command to render and the reader is told the
    // component exists with no way to get it.
    for (const [framework, relation] of Object.entries(meta.frameworks)) {
      if (relation.policy === "wrapping" && !relation.inherits?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["frameworks", framework, "inherits"],
          message:
            `policy is "wrapping" for ${framework}, so inherits must name the behaviour being inherited. ` +
            'ADR 0010: "It is consistent" is not that reason; "Modal\'s focus trap and Tabs\' aria-controls wiring" is.',
        });
      }
      if (relation.policy !== "wrapping" && relation.inherits?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["frameworks", framework, "policy"],
          message: `inherits is set for ${framework} but the policy is "${relation.policy}". Only a wrapping component inherits behaviour.`,
        });
      }
    }

    if (meta.distribution === "package" && !meta.packageName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["packageName"],
        message:
          'distribution is "package", so packageName is required — it is what a consumer installs',
      });
    }
    if (meta.distribution === "registry" && meta.packageName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["packageName"],
        message:
          'packageName is only meaningful when distribution is "package"; a registry component is copied as source, not installed',
      });
    }
    // Registry dependencies are resolved to registry URLs, which a package
    // component has none of. Left unchecked this produces a docs page telling
    // someone to `zoblocks add` a component that ships on npm.
    if (meta.distribution === "package" && meta.registryDependencies.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["registryDependencies"],
        message:
          "a package component cannot have registry dependencies — express them as npm `dependencies` instead",
      });
    }

    // Scaffolded placeholders must be replaced before a component generates.
    // Checked structurally rather than left to review, because unfilled
    // guidance is the field most likely to survive a rushed pull request —
    // and guidance is the part of this product that carries the value.
    const walk = (value: unknown, at: (string | number)[]) => {
      if (typeof value === "string") {
        if (value.startsWith("TODO")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: at,
            message: "still a scaffolded placeholder — replace it or remove the field",
          });
        }
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item, i) => walk(item, [...at, i]));
        return;
      }
      if (value && typeof value === "object") {
        for (const [key, nested] of Object.entries(value)) walk(nested, [...at, key]);
      }
    };
    walk(meta, []);

    if (meta.status === "deprecated" && !meta.deprecation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deprecation"],
        message:
          'status is "deprecated" but no deprecation block is present. A deprecation needs a removeIn version and a reason, or consumers cannot plan.',
      });
    }
    if (meta.status !== "deprecated" && meta.deprecation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message: 'a deprecation block is present but status is not "deprecated".',
      });
    }
    /* ---------------------------------------------------------------------
     * The promotion gate.
     *
     * "Stable" is a semver promise to consumers, and the standard's position is
     * that promotion is a CI result rather than a reviewer's judgement. So the
     * whole second half of the schema becomes required here, and nowhere else.
     * A component sitting at experimental or beta is untouched by any of it.
     * ------------------------------------------------------------------ */
    if (meta.status !== "stable") return;

    const require = (ok: boolean, path: (string | number)[], message: string) => {
      if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    };
    const at = (label: string) => `${label} — required to be stable`;

    require(!!meta.technicalName?.trim(), ["technicalName"], at("the React export name"));
    require((meta.tags ?? []).length > 0, ["tags"], at("at least one capability tag"));
    require((meta.domain?.industries ?? []).length > 0, ["domain", "industries"], at(
      "at least one industry — use ['general'] for a non-clinical component",
    ));
    require(meta.summary.length <= 160, [
      "summary",
    ], `summary is ${meta.summary.length} characters; it doubles as the meta description, so 160 is the ceiling`);
    require(meta.guidance.use.length >= 3, ["guidance", "use"], at(
      "three or more useWhen entries",
    ));
    require((meta.related ?? []).length > 0, ["related"], at(
      "at least one related component — an orphan page does not rank and cannot be navigated to",
    ));
    require((meta.examples ?? []).length >= 3, ["examples"], at(
      "three examples (one is enough for beta, three for stable)",
    ));
    require((meta.fixtures ?? []).length > 0, ["fixtures"], at("a named fixture"));
    require((meta.a11yChecks ?? []).length > 0, ["a11yChecks"], at(
      "machine-checkable accessibility claims",
    ));
    require(!!meta.seo?.primaryKeyword?.trim(), ["seo", "primaryKeyword"], at(
      "exactly one primary keyword",
    ));
    require(!!meta.seo?.searchIntent, ["seo", "searchIntent"], at("a search intent"));

    // An accessibility claim that passes must name the test that proves it.
    // Without this the panel is prose wearing a table's clothes.
    (meta.a11yChecks ?? []).forEach((check, i) => {
      if (check.status !== "not-applicable" && !check.evidence?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["a11yChecks", i, "evidence"],
          message: `${check.wcag} claims "${check.status}" with no evidence. Cite the test id, or mark it not-applicable.`,
        });
      }
    });

    // Every example must name a fixture, and that fixture must be declared.
    (meta.examples ?? []).forEach((example, i) => {
      if (example.fixture && !(meta.fixtures ?? []).includes(example.fixture)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["examples", i, "fixture"],
          message: `fixture "${example.fixture}" is not declared in fixtures[]`,
        });
      }
    });

    // FHIR is conditional, not universal. A loader consumes no resource and
    // forcing one on it produces the "FHIR undefined React component" title the
    // docs site already guards against. Required only where it is meaningful.
    const clinical = (meta.domain?.industries ?? []).some((i) =>
      ["healthcare", "behavioral-health", "payer", "human-services"].includes(i),
    );
    if (clinical && meta.fhir.length === 0 && !meta.domain?.clinicalContext?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["domain", "clinicalContext"],
        message:
          "a clinical component must declare either the FHIR resources it reads or a clinicalContext explaining why it reads none",
      });
    }

    // Derived edges are computed by the generator from imports. A hand-written
    // value is not a shortcut, it is a second source of truth that will drift.
    for (const key of ["builtWith", "usedIn"] as const) {
      if ((meta.relationships?.[key] ?? []).length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["relationships", key],
          message: `relationships.${key} is derived from imports by the generator and must not be authored by hand`,
        });
      }
    }
  });

export type ComponentMeta = z.infer<typeof componentMetaSchema>;
export type ComponentMetaInput = z.input<typeof componentMetaSchema>;
export type Stability = z.infer<typeof stabilitySchema>;
export type Tier = z.infer<typeof tierSchema>;
export type Layer = z.infer<typeof layerSchema>;
export type Distribution = z.infer<typeof distributionSchema>;
export type FrameworkPolicy = z.infer<typeof frameworkPolicySchema>;
export type FrameworkRelation = z.infer<typeof frameworkRelationSchema>;
export type A11yNote = z.infer<typeof a11yNoteSchema>;
export type Tag = z.infer<typeof tagSchema>;
export type Industry = z.infer<typeof industrySchema>;
export type Workflow = z.infer<typeof workflowSchema>;
export type CodeSystem = z.infer<typeof codeSystemSchema>;
export type SearchIntent = z.infer<typeof searchIntentSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type Control = z.infer<typeof controlSchema>;
export type A11yCheck = z.infer<typeof a11yCheckSchema>;
export type Example = z.infer<typeof exampleSchema>;
export type Domain = z.infer<typeof domainSchema>;
export type Relationships = z.infer<typeof relationshipsSchema>;
export type Alternative = z.infer<typeof alternativeSchema>;
export type Seo = z.infer<typeof seoSchema>;
export type FhirResource = z.infer<typeof fhirResourceSchema>;

/**
 * Identity function with a type annotation, so `.meta.ts` files get full
 * IntelliSense while authoring. Validation runs in the generator, not here —
 * a schema parse at import time would make every meta file a runtime cost for
 * anything that imports the catalog.
 */
export function defineComponentMeta(meta: ComponentMetaInput): ComponentMetaInput {
  return meta;
}
