/**
 * Modes as scope contracts.
 *
 * This is the most important idea in the package, and it is worth more than
 * the rest of the UI combined.
 *
 * The obvious implementation of a mode chip is that it swaps a system prompt.
 * That is how almost everyone builds it, and it is wrong in a way that only
 * surfaces in the security review, eighteen months in, when someone asks which
 * data a given mode can reach and the honest answer is "whatever the prompt
 * happened to say".
 *
 * A mode here is instead a declarative contract with four enforced parts —
 * what it may **read**, what **tools** it may call, what it may **output**, and
 * what **risk** it carries. The prompt is a fifth, subordinate field. With that
 * shape, "can Look up see the problem list?" has an answer you read off a
 * config object and hand to a compliance officer, rather than one you infer
 * from English.
 *
 * The built-in modes at the bottom are ordered by how much they can hurt
 * someone, and that ordering is also the recommended ship order.
 */

import type { ClinicalResourceType } from "./fhir-types.js";

/* ------------------------------------------------------------------ */
/* Exclusions                                                          */
/* ------------------------------------------------------------------ */

/**
 * Categories of record that a mode declines to receive even when the host
 * could supply them.
 *
 * These are not access controls — the host's resolver decides access. They are
 * a second, independent statement of intent, so that a resolver which is too
 * permissive (or a customer who commingles data, which 42 CFR Part 2 expressly
 * permits since segmentation is not required) does not silently widen what the
 * model sees.
 */
export type ExclusionCategory =
  /** 42 CFR Part 2 substance use disorder records. */
  | "part2"
  /** SUD counselling notes — a distinct Part 2 category needing specific consent. */
  | "sud-counseling-notes"
  /** HIPAA psychotherapy notes. */
  | "psychotherapy-notes"
  /** Genetic and genomic results. */
  | "genetic"
  /** Sexual and reproductive health. */
  | "reproductive"
  /** HIV status and related results. */
  | "hiv"
  /** Records a minor may keep from a guardian. */
  | "minor-confidential"
  /** Anything the patient has specifically restricted. */
  | "patient-restricted";

/* ------------------------------------------------------------------ */
/* Output contract                                                     */
/* ------------------------------------------------------------------ */

export interface OutputContract {
  /**
   * Every clinical claim must carry a citation. Violations are downgraded to
   * the "general" register after the stream — never silently rewritten, because
   * rewriting a clinical answer to make it pass a check is the worst option in
   * the space.
   */
  readonly requireCitations: boolean;
  /**
   * Cap on distinct claims. The FDA's 2026 revision explicitly asks that
   * decision-relevant detail be prioritised and information overload avoided;
   * an answer with twenty claims has prioritised nothing.
   */
  readonly maxClaims?: number;
  /** Reject any output containing a dose, strength, or frequency. */
  readonly forbidDosing: boolean;
  /**
   * Reject output that reads as a definitive diagnosis rather than support for
   * one. Set on every mode that is not explicitly a differential mode.
   */
  readonly forbidDiagnosis: boolean;
}

/* ------------------------------------------------------------------ */
/* The mode                                                            */
/* ------------------------------------------------------------------ */

export type ModeRisk =
  /** No patient data, no recommendation. Retrieval and restatement only. */
  | "reference"
  /** Reads patient data, but restates rather than recommends. */
  | "summary"
  /** Generates novel clinical recommendations. The dangerous class. */
  | "clinical";

export interface ConsultSuggestion {
  readonly id: string;
  readonly label: string;
  /**
   * What this suggestion will read, in words, shown under the label.
   *
   * Rendering the scope at the point of choice is both honest and nearly free,
   * and it is the cheapest trust-building move available to the component.
   */
  readonly reads?: string;
  /** Text placed in the field. Absent means the label is the question. */
  readonly question?: string;
}

export interface ConsultMode {
  readonly id: string;
  readonly label: string;
  /** Short description for the tray and the mode picker. */
  readonly description?: string;

  /**
   * Resource types this mode may be shown. Empty means no patient context at
   * all — which is what makes a mode safe to run against a provider with no
   * BAA, and why `Look up` ships first.
   */
  readonly reads: readonly ClinicalResourceType[];
  readonly excludes: readonly ExclusionCategory[];

  /** Empty by default. A mode with no tools cannot act on the world. */
  readonly tools: readonly string[];

  readonly output: OutputContract;
  readonly risk: ModeRisk;

  /** Reference to a registered, versioned prompt template, e.g. "work-up@3". */
  readonly promptRef: string;

  readonly suggestions: readonly ConsultSuggestion[];

  /**
   * How many prior turns to send. Small on purpose: a long window is the main
   * driver of guardrail decay, and behavioral health evaluations have measured
   * safety behaviour degrading materially over extended conversations.
   */
  readonly historyTurns: number;

  /**
   * Whether this mode may run at all when the host has flagged the surface as
   * patient-facing. Every built-in mode sets this false. See `behavioral.ts`
   * for why the patient-facing configuration does not exist.
   */
  readonly patientFacing: boolean;
}

/** Does this mode need patient data? Drives the `phiPermitted` guard. */
export function readsPatientData(mode: ConsultMode): boolean {
  return mode.reads.length > 0;
}

/**
 * Build a mode, with the safe defaults filled in.
 *
 * Defaults matter more than usual here. Every unspecified field resolves to the
 * more restrictive option: no tools, no dosing, no diagnosis, citations
 * required, not patient-facing. A mode author who wants a capability has to ask
 * for it in writing, which is the property that makes the config reviewable.
 */
export function defineMode(
  init: Pick<ConsultMode, "id" | "label" | "promptRef" | "risk"> & Partial<ConsultMode>,
): ConsultMode {
  return {
    description: undefined,
    reads: [],
    excludes: DEFAULT_EXCLUSIONS,
    tools: [],
    suggestions: [],
    historyTurns: 6,
    patientFacing: false,
    ...init,
    output: {
      requireCitations: true,
      forbidDosing: true,
      forbidDiagnosis: true,
      ...init.output,
    },
  };
}

/**
 * Excluded unless a mode says otherwise.
 *
 * Every sensitive category is off by default. A mode that genuinely needs, say,
 * HIV status for an interaction check has to name it, and naming it is what
 * puts it in front of a reviewer.
 */
export const DEFAULT_EXCLUSIONS: readonly ExclusionCategory[] = [
  "part2",
  "sud-counseling-notes",
  "psychotherapy-notes",
  "genetic",
  "reproductive",
  "hiv",
  "minor-confidential",
  "patient-restricted",
];

/* ------------------------------------------------------------------ */
/* Built-in modes, ordered by risk                                     */
/* ------------------------------------------------------------------ */

/**
 * Look up — reference, no patient context.
 *
 * Nearly all the demonstrable value and almost none of the risk. Needs no BAA
 * covering patient data in the model call, no chart integration, and no
 * institutional review to pilot: a design partner can have it running in an
 * afternoon. Ship this first, always.
 */
export const lookUp: ConsultMode = defineMode({
  id: "look-up",
  label: "Look up",
  description: "Search guidelines, formulary and literature. No patient data is used.",
  promptRef: "look-up@1",
  risk: "reference",
  reads: [],
  historyTurns: 8,
  output: {
    requireCitations: true,
    forbidDiagnosis: true,
    // The one mode that permits dosing, because it is the formulary mode —
    // "titration schedule" and "interactions" are two of its three suggestions,
    // and a mode that refused to state a dose would be refusing its own job.
    //
    // Permitted is not unexamined: `runChecks` still flags every numeric dose
    // with "verify against your formulary", because a transcription error in a
    // dose is the classic harm and one extra glance is cheap. The modes that
    // forbid dosing outright are the ones where a dose has no business being
    // generated at all — a record summary, or a differential.
    forbidDosing: false,
  },
  suggestions: [
    { id: "interactions", label: "Interactions", reads: "Formulary only" },
    { id: "guideline", label: "Guideline summary", reads: "Guideline corpus only" },
    { id: "titration", label: "Titration schedule", reads: "Formulary only" },
  ],
});

/**
 * Prepare — summarisation of what is already documented.
 *
 * Reads PHI but produces no recommendation; it restates the record for a
 * clinician about to walk into a room. The failure mode is omission, which is
 * real and bounded — and which is exactly why the withheld-record disclosure in
 * `context.ts` is not optional.
 */
export const prepare: ConsultMode = defineMode({
  id: "prepare",
  label: "Prepare",
  description: "Summarise this patient's record before the encounter.",
  promptRef: "prepare@1",
  risk: "summary",
  reads: [
    "Condition",
    "MedicationRequest",
    "MedicationStatement",
    "AllergyIntolerance",
    "Observation",
    "DiagnosticReport",
    "Encounter",
  ],
  historyTurns: 4,
  suggestions: [
    {
      id: "history",
      label: "Patient history",
      reads: "Encounters, problem list, notes · last 24 months",
    },
    {
      id: "medications",
      label: "Current medications",
      reads: "Active MedicationRequest, allergies",
    },
    {
      id: "results",
      label: "Outstanding results",
      reads: "Unacknowledged Observation, DiagnosticReport",
    },
  ],
});

/**
 * Work up — differentials, investigations, referral thresholds.
 *
 * The one mode that generates novel clinical recommendations, and therefore the
 * one where a wrong answer produces the measured increase in commission errors
 * that decision-support research keeps finding. It is deliberately **not**
 * exported in `defaultModes`: a host has to reach for it by name, which is a
 * small speed bump placed exactly where a speed bump belongs.
 *
 * `forbidDiagnosis` stays true even here. A differential is support for a
 * diagnosis; it is not one.
 */
export const workUp: ConsultMode = defineMode({
  id: "work-up",
  label: "Work up",
  description: "Differentials and investigations to consider. Clinician-facing, unranked.",
  promptRef: "work-up@1",
  risk: "clinical",
  reads: ["Condition", "Observation", "MedicationRequest", "AllergyIntolerance"],
  historyTurns: 4,
  output: { requireCitations: true, maxClaims: 6, forbidDosing: true, forbidDiagnosis: true },
  suggestions: [
    { id: "differentials", label: "Differentials", reads: "Presenting problem, results" },
    {
      id: "investigations",
      label: "Investigations to consider",
      reads: "Guideline-linked · never auto-ordered",
    },
    { id: "referral", label: "Referral threshold", reads: "Local pathway, org formulary" },
  ],
});

/**
 * The modes a host gets if it asks for nothing.
 *
 * Look up and Prepare. Work up is available and documented, and a host that
 * wants it imports it explicitly — see `docs` in the registry meta for the
 * reasoning a customer should read before doing so.
 */
export const defaultModes: readonly ConsultMode[] = [lookUp, prepare];

/** Find a mode by id, or fail loudly. A missing mode is a config bug. */
export function requireMode(modes: readonly ConsultMode[], id: string): ConsultMode {
  const found = modes.find((m) => m.id === id);
  if (!found) {
    throw new Error(
      `Unknown mode "${id}". Registered modes: ${modes.map((m) => m.id).join(", ") || "(none)"}`,
    );
  }
  return found;
}
