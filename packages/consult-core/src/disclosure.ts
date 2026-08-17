/**
 * Model disclosure, structured to ONC's HTI-1 source attributes.
 *
 * The Decision Support Interventions criterion at 45 CFR 170.315(b)(11)
 * requires certified health IT to surface 31 source attributes for a
 * *predictive* DSI — the "model card" set: what it was trained on, how it was
 * validated, how it performs, how fairness was assessed, how it is maintained.
 * Developers had to meet this by 31 December 2024 and maintain it from 1
 * January 2025.
 *
 * Consult is not certified health IT and neither, probably, is the customer.
 * The bet this file makes is that structuring the disclosure to that shape
 * anyway is worth more than a free-form "about this model" string: a customer
 * who later pursues certification gets most of a compliance artifact out of a
 * component they installed for the UI, and a customer who never does still
 * ends up answering questions their security review will ask.
 *
 * Every field is optional except `modelId`, `intendedUse` and `outOfScopeUse`.
 * That is deliberate. Requiring all 31 would produce a wall of empty strings
 * filled in to satisfy the type; leaving them optional and *rendering the gaps
 * visibly* produces a disclosure sheet that shows what nobody could answer,
 * which is the more useful artifact. `disclosureCompleteness` below is how a
 * host measures that.
 */

/** Grouping used by the disclosure sheet's headings. Mirrors HTI-1's own. */
export type DisclosureSection =
  "details" | "development" | "fairness" | "performance" | "maintenance";

export interface ModelDisclosure {
  /* --- Details (HTI-1 attributes 1–9) --------------------------------- */

  /** Name and version of the model actually serving requests. */
  readonly modelId: string;
  readonly developer?: string;
  readonly developerContact?: string;
  /** ISO 8601 date the model or its serving configuration was released. */
  readonly releaseDate?: string;
  /** Free text: what this is for. Required — an undeclared purpose is unreviewable. */
  readonly intendedUse: string;
  /**
   * What it must NOT be used for. Required, and the more useful half.
   * A tool with no stated boundary gets used at its edges by definition.
   */
  readonly outOfScopeUse: string;
  readonly intendedPatientPopulation?: string;
  readonly intendedUserPopulation?: string;
  /** Cautioned-out populations: where performance is known or suspected to differ. */
  readonly cautionedUse?: string;

  /* --- Development (attributes 10–17) --------------------------------- */

  readonly trainingDataSource?: string;
  /** e.g. "public web and licensed corpora to 2025-10". */
  readonly trainingDataRange?: string;
  readonly knowledgeCutoff?: string;
  readonly trainingDataDemographics?: string;
  readonly exclusionCriteria?: string;
  readonly outputType?: string;
  readonly variablesUsed?: string;
  /** Whether a human reviewed outputs during development. */
  readonly humanInTheLoopDevelopment?: string;

  /* --- Fairness (attributes 18–21) ------------------------------------ */

  readonly fairnessApproach?: string;
  readonly fairnessMetrics?: string;
  readonly knownBiases?: string;
  readonly biasMitigation?: string;

  /* --- Performance (attributes 22–27) --------------------------------- */

  readonly validationProcess?: string;
  readonly externalValidation?: string;
  readonly performanceMetrics?: string;
  readonly performanceByCohort?: string;
  readonly localValidation?: string;
  readonly uncertaintyQuantification?: string;

  /* --- Maintenance (attributes 28–31) --------------------------------- */

  readonly updateFrequency?: string;
  readonly monitoringApproach?: string;
  /** How the deploying organisation is told when the model changes underneath them. */
  readonly changeNotification?: string;
  readonly deprecationPolicy?: string;

  /* --- Beyond HTI-1 --------------------------------------------------- */

  /**
   * Whether the endpoint is covered by a business associate agreement, as
   * asserted by the customer. Rendered on the sheet because it is the first
   * question every security reviewer asks and the answer is usually buried.
   */
  readonly baaInPlace?: boolean;
  /** Where requests are processed. Drives the data-residency conversation. */
  readonly processingRegion?: string;
  /** Whether the vendor may retain or train on submitted content. */
  readonly dataRetention?: string;
}

/** Which attributes belong to which section, for rendering and for scoring. */
const SECTION_FIELDS: Record<DisclosureSection, readonly (keyof ModelDisclosure)[]> = {
  details: [
    "modelId",
    "developer",
    "developerContact",
    "releaseDate",
    "intendedUse",
    "outOfScopeUse",
    "intendedPatientPopulation",
    "intendedUserPopulation",
    "cautionedUse",
  ],
  development: [
    "trainingDataSource",
    "trainingDataRange",
    "knowledgeCutoff",
    "trainingDataDemographics",
    "exclusionCriteria",
    "outputType",
    "variablesUsed",
    "humanInTheLoopDevelopment",
  ],
  fairness: ["fairnessApproach", "fairnessMetrics", "knownBiases", "biasMitigation"],
  performance: [
    "validationProcess",
    "externalValidation",
    "performanceMetrics",
    "performanceByCohort",
    "localValidation",
    "uncertaintyQuantification",
  ],
  maintenance: ["updateFrequency", "monitoringApproach", "changeNotification", "deprecationPolicy"],
};

export const DISCLOSURE_SECTIONS = Object.keys(SECTION_FIELDS) as readonly DisclosureSection[];

/** Human-readable labels. Kept here so the skin does not invent its own. */
export const DISCLOSURE_LABELS: Record<DisclosureSection, string> = {
  details: "Details",
  development: "Development",
  fairness: "Fairness",
  performance: "Performance",
  maintenance: "Maintenance",
};

export function disclosureFields(section: DisclosureSection): readonly (keyof ModelDisclosure)[] {
  return SECTION_FIELDS[section];
}

/**
 * How much of the attribute set was actually answered.
 *
 * Rendered on the sheet as "18 of 31". The number matters less than the fact
 * that it is visible: a customer who sees 6 of 31 has learned something about
 * their vendor that no prose disclosure would have told them.
 */
export function disclosureCompleteness(disclosure: ModelDisclosure): {
  answered: number;
  total: number;
  missing: readonly (keyof ModelDisclosure)[];
} {
  const all = DISCLOSURE_SECTIONS.flatMap((s) => [...SECTION_FIELDS[s]]);
  const missing = all.filter((field) => {
    const value = disclosure[field];
    return value === undefined || value === null || value === "";
  });
  return { answered: all.length - missing.length, total: all.length, missing };
}

/**
 * A disclosure with only the mandatory fields, for tests and for a host that
 * genuinely has nothing else yet. Named so that its appearance in production
 * code is self-evidently a to-do.
 */
export function minimalDisclosure(
  modelId: string,
  overrides: Partial<ModelDisclosure> = {},
): ModelDisclosure {
  return {
    modelId,
    intendedUse:
      "Clinician-facing reference and summarisation support. Not for autonomous decision making.",
    outOfScopeUse:
      "Not for patient-facing use, not for diagnosis without independent review, " +
      "not for time-critical decisions, and not for use in behavioral health crisis situations.",
    ...overrides,
  };
}
