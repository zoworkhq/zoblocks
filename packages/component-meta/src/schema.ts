/**
 * The component metadata schema.
 *
 * One `<component>.meta.ts` per component is the single source of truth for
 * everything the platform generates: the shadcn registry, the docs catalog,
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
 * customer's repository by the shadcn CLI, so it must be self-contained and
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

export const fhirResourceSchema = z.object({
  /** Resource type as spelled in the FHIR specification, e.g. "Observation". */
  name: nonEmpty("fhir resource name"),
  url: z.string().url(),
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
  type: z.enum([
    "registry:lib",
    "registry:component",
    "registry:ui",
    "registry:hook",
    "registry:block",
    "registry:page",
    "registry:file",
    "registry:style",
  ]),
  /** Where the shadcn CLI writes it in the consumer's project. */
  target: z.string().optional(),
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
     * A `package` component has no source in `registry/oxygen`, emits no
     * registry item, and shows an `npm install` command rather than a
     * `shadcn add` one. Its `packageName` is what a consumer installs.
     */
    distribution: distributionSchema.default("registry"),
    /** npm package name. Required when `distribution` is `package`. */
    packageName: z.string().optional(),

    /**
     * Three lengths for three surfaces. They are separate fields because each
     * is read in a different place, under different attention, and collapsing
     * them produces text that is wrong for at least two of the three.
     */

    /** One line. Catalog cards, search results, page metadata, llms.txt. */
    summary: z.string().min(20, "summary must be useful, not a placeholder"),
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
  })
  .strict()
  .superRefine((meta, ctx) => {
    // A package component that does not say what to install is undocumentable:
    // the docs page has no install command to render and the reader is told the
    // component exists with no way to get it.
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
    // someone to `shadcn add` a component that ships on npm.
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
  });

export type ComponentMeta = z.infer<typeof componentMetaSchema>;
export type ComponentMetaInput = z.input<typeof componentMetaSchema>;
export type Stability = z.infer<typeof stabilitySchema>;
export type Tier = z.infer<typeof tierSchema>;
export type Layer = z.infer<typeof layerSchema>;
export type Distribution = z.infer<typeof distributionSchema>;
export type A11yNote = z.infer<typeof a11yNoteSchema>;
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
