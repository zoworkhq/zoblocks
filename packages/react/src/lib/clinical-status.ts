// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/zoblocks/lib/clinical-status.ts. Edit that file, not this one.
/**
 * The clinical status vocabulary — nine scales, closed.
 *
 * Every healthcare product invents its own status colours, six times, in six
 * teams, and the results disagree: amber means *pending* in the lab module and
 * *abnormal* in the vitals module, and a clinician who learns one is actively
 * misled by the other. The usual fix is a nicer palette, which does not help,
 * because the encoding is still colour plus a word in a colour-matched hue —
 * and that collapses in forced-colors, in monochrome print, and for the
 * roughly 8% of male clinicians with a red–green deficiency.
 *
 * So the vocabulary is closed. There is no free-text status. A step exists
 * here or it cannot be rendered, and every step carries three channels chosen
 * together:
 *
 *   tone    the hue family, resolved through semantic tokens
 *   glyph   a CSS shape, drawn in currentColor, carrying the same bit
 *   word    what it is called, in both a clinician and a patient register
 *
 * The three are emitted together or not at all. That is the whole component:
 * a state that cannot be rendered without colour cannot be rendered.
 *
 * No React, no DOM, no dependencies. The adapters at the bottom map FHIR onto
 * the scales so a host never has to invent the mapping — and inventing it is
 * exactly where two modules in one product start disagreeing again.
 */

/* ------------------------------------------------------------------ */
/* Channels                                                            */
/* ------------------------------------------------------------------ */

/**
 * The hue families, which are token names rather than colours.
 *
 * Seven, not nine: `moderate` shares `high`, and several scales share
 * `unknown`. That is deliberate and it is the point — the hue is the coarse
 * channel and the shape and word are the precise ones, so two steps may look
 * similar at a glance and can never be confused once read.
 */
export type StatusTone =
  "critical" | "high" | "low" | "normal" | "unknown" | "restricted" | "provisional";

/**
 * The shapes, all drawable in CSS.
 *
 * No icon library and no SVG sprite: a chip that costs a network request is a
 * chip that renders late, and a status that renders late is one a clinician
 * reads before it arrives. Every glyph here is a `clip-path`, a border, or a
 * gradient, so it paints with the first frame and inherits `currentColor` —
 * which is what makes it survive Windows high-contrast, where the background
 * is stripped and the glyph is all that is left.
 */
export type StatusGlyph =
  /** Filled triangle. Act now. */
  | "alert"
  /** Hollow triangle. Outside the range, not immediately dangerous. */
  | "caution"
  /** Filled disc. Settled, final, in range. */
  | "solid"
  /** Hollow ring. In flight — not yet final, not yet verified. */
  | "pending"
  /** Square with a hatch. Absent, and the absence is the fact. */
  | "unknown"
  /** Padlock. Present, gated, and the gate is deliberate. */
  | "locked"
  /** Padlock with the shackle open. Gated, and someone opened it. */
  | "unlocked"
  /** Struck-through disc. Withdrawn, cancelled, refused, in error. */
  | "void"
  /** Diamond. Between two named states — moderate, at risk, uncertain. */
  | "watch"
  /** Half-filled disc. Reported, but not by the system of record. */
  | "reported"
  /** Clock face. True once, and old enough that it may not be now. */
  | "stale";

/** Which register a word is written in. See `@zoblocks/intl`. */
export type StatusAudience = "clinician" | "patient";

/** One step of one scale: the three channels, plus what to show when narrow. */
export interface StatusStep {
  /** Stable key. Never the index — a scale may gain a step between them. */
  readonly id: string;
  readonly tone: StatusTone;
  readonly glyph: StatusGlyph;
  /** What a clinician calls it. */
  readonly clinician: string;
  /**
   * What a patient calls it.
   *
   * Required, not optional. "Entered in error" and "Recorded by mistake" are
   * different sentences, and a portal that ships the first has not translated
   * anything — it has published an internal state to the person it is about.
   */
  readonly patient: string;
  /** Four to six characters, for a grid affix. Upper case at the call site. */
  readonly short: string;
}

export interface StatusScale {
  readonly id: string;
  /**
   * What the scale is *of*, for the accessible name.
   *
   * The name is composed as "<scale>: <step>" rather than just the step,
   * because "Preliminary" alone does not say preliminary *what*, and a screen
   * reader user meeting a chip in a table cell has no column header in scope.
   */
  readonly label: string;
  readonly steps: readonly StatusStep[];
}

/* ------------------------------------------------------------------ */
/* The nine scales                                                     */
/* ------------------------------------------------------------------ */

function scale(id: string, label: string, steps: readonly StatusStep[]): StatusScale {
  return { id, label, steps };
}

export const SCALES = {
  /** How dangerous the value is. The one every product gets wrong first. */
  criticality: scale("criticality", "Criticality", [
    {
      id: "critical",
      tone: "critical",
      glyph: "alert",
      clinician: "Critical",
      patient: "Needs urgent attention",
      short: "CRIT",
    },
    {
      id: "high",
      tone: "high",
      glyph: "caution",
      clinician: "High",
      patient: "Above the usual range",
      short: "HIGH",
    },
    {
      id: "moderate",
      tone: "high",
      glyph: "watch",
      clinician: "Moderate",
      patient: "Slightly outside the usual range",
      short: "MOD",
    },
    {
      id: "normal",
      tone: "normal",
      glyph: "solid",
      clinician: "Normal",
      patient: "Within the usual range",
      short: "NORM",
    },
    {
      id: "not-assessed",
      tone: "unknown",
      glyph: "unknown",
      clinician: "Not assessed",
      patient: "Not checked",
      short: "N/A",
    },
  ]),

  /** Where the result is in its own lifecycle. */
  "result-status": scale("result-status", "Result status", [
    {
      id: "final",
      tone: "normal",
      glyph: "solid",
      clinician: "Final",
      patient: "Confirmed",
      short: "FIN",
    },
    {
      id: "preliminary",
      tone: "provisional",
      glyph: "pending",
      clinician: "Preliminary",
      patient: "Not confirmed yet",
      short: "PREL",
    },
    {
      id: "corrected",
      tone: "high",
      glyph: "watch",
      clinician: "Corrected",
      patient: "Updated since first reported",
      short: "CORR",
    },
    {
      id: "cancelled",
      tone: "unknown",
      glyph: "void",
      clinician: "Cancelled",
      patient: "Not carried out",
      short: "CANC",
    },
    {
      id: "entered-in-error",
      tone: "critical",
      glyph: "void",
      clinician: "Entered in error",
      patient: "Recorded by mistake",
      short: "ERR",
    },
  ]),

  /** How much the record itself can be trusted, which is not the same thing. */
  "data-quality": scale("data-quality", "Data quality", [
    {
      id: "verified",
      tone: "normal",
      glyph: "solid",
      clinician: "Verified",
      patient: "Checked by your care team",
      short: "VERF",
    },
    {
      id: "unverified",
      tone: "provisional",
      glyph: "pending",
      clinician: "Unverified",
      patient: "Not checked yet",
      short: "UNVF",
    },
    {
      id: "self-reported",
      tone: "low",
      glyph: "reported",
      clinician: "Self-reported",
      patient: "You told us this",
      short: "SELF",
    },
    {
      id: "stale",
      tone: "high",
      glyph: "stale",
      clinician: "Stale",
      patient: "May be out of date",
      short: "OLD",
    },
  ]),

  /**
   * Who may see it.
   *
   * `part-2` is its own step rather than a flavour of `restricted` because
   * 42 CFR Part 2 is a different legal regime from HIPAA minimum-necessary,
   * with a different re-disclosure rule — and a UI that renders them the same
   * teaches staff that they are the same.
   */
  access: scale("access", "Access", [
    {
      id: "open",
      tone: "normal",
      glyph: "solid",
      clinician: "Open",
      patient: "Visible to your care team",
      short: "OPEN",
    },
    {
      id: "restricted",
      tone: "restricted",
      glyph: "locked",
      clinician: "Restricted",
      patient: "Limited access",
      short: "RSTR",
    },
    {
      id: "part-2",
      tone: "restricted",
      glyph: "locked",
      clinician: "Part 2 segmented",
      patient: "Protected substance-use record",
      short: "PT2",
    },
    {
      id: "break-glass",
      tone: "critical",
      glyph: "unlocked",
      clinician: "Break-glass open",
      patient: "Opened in an emergency",
      short: "BG",
    },
  ]),

  /** Whether a human has stood behind what a model produced. */
  "ai-verification": scale("ai-verification", "AI verification", [
    {
      id: "ai-draft",
      tone: "provisional",
      glyph: "pending",
      clinician: "AI draft",
      patient: "Drafted automatically",
      short: "DRFT",
    },
    {
      id: "ai-uncertain",
      tone: "high",
      glyph: "watch",
      clinician: "AI uncertain",
      patient: "Needs a person to check",
      short: "UNC",
    },
    {
      id: "clinician-verified",
      tone: "normal",
      glyph: "solid",
      clinician: "Clinician verified",
      patient: "Checked by a clinician",
      short: "VERF",
    },
    {
      id: "rejected",
      tone: "unknown",
      glyph: "void",
      clinician: "Rejected",
      patient: "Not accepted",
      short: "REJ",
    },
  ]),

  /** Behavioral health. No generic library ships this, and it drives outreach. */
  engagement: scale("engagement", "Engagement", [
    {
      id: "engaged",
      tone: "normal",
      glyph: "solid",
      clinician: "Engaged",
      patient: "Attending as planned",
      short: "ENG",
    },
    {
      id: "at-risk",
      tone: "high",
      glyph: "watch",
      clinician: "At risk",
      patient: "Missed some appointments",
      short: "RISK",
    },
    {
      id: "disengaged",
      tone: "critical",
      glyph: "alert",
      clinician: "Disengaged",
      patient: "Not attending",
      short: "DISE",
    },
    {
      id: "lost-to-contact",
      tone: "unknown",
      glyph: "unknown",
      clinician: "Lost to contact",
      patient: "We cannot reach you",
      short: "LOST",
    },
  ]),

  /** Where the visit is. */
  encounter: scale("encounter", "Encounter", [
    {
      id: "planned",
      tone: "low",
      glyph: "pending",
      clinician: "Planned",
      patient: "Booked",
      short: "PLAN",
    },
    {
      id: "arrived",
      tone: "low",
      glyph: "solid",
      clinician: "Arrived",
      patient: "Checked in",
      short: "ARR",
    },
    {
      id: "in-progress",
      tone: "high",
      glyph: "watch",
      clinician: "In progress",
      patient: "Happening now",
      short: "PROG",
    },
    {
      id: "finished",
      tone: "normal",
      glyph: "solid",
      clinician: "Finished",
      patient: "Completed",
      short: "FIN",
    },
    {
      id: "cancelled",
      tone: "unknown",
      glyph: "void",
      clinician: "Cancelled",
      patient: "Cancelled",
      short: "CANC",
    },
  ]),

  /** How soon. Mirrors FHIR request priority, which most products flatten. */
  urgency: scale("urgency", "Urgency", [
    {
      id: "routine",
      tone: "normal",
      glyph: "solid",
      clinician: "Routine",
      patient: "No rush",
      short: "RTN",
    },
    {
      id: "urgent",
      tone: "high",
      glyph: "caution",
      clinician: "Urgent",
      patient: "Soon",
      short: "URG",
    },
    {
      id: "asap",
      tone: "high",
      glyph: "alert",
      clinician: "ASAP",
      patient: "As soon as possible",
      short: "ASAP",
    },
    {
      id: "stat",
      tone: "critical",
      glyph: "alert",
      clinician: "STAT",
      patient: "Immediately",
      short: "STAT",
    },
  ]),

  /**
   * Behavioral health. Screener-derived, and the reason the scale is separate
   * from `criticality`: a PHQ-9 risk band is a clinical judgement about a
   * person, not an observation about a specimen, and the words differ.
   */
  risk: scale("risk", "Risk", [
    {
      id: "none",
      tone: "normal",
      glyph: "solid",
      clinician: "No risk identified",
      patient: "Nothing of concern",
      short: "NONE",
    },
    { id: "low", tone: "low", glyph: "solid", clinician: "Low", patient: "Low", short: "LOW" },
    {
      id: "moderate",
      tone: "high",
      glyph: "watch",
      clinician: "Moderate",
      patient: "Moderate",
      short: "MOD",
    },
    {
      id: "high",
      tone: "critical",
      glyph: "caution",
      clinician: "High",
      patient: "High",
      short: "HIGH",
    },
    {
      id: "imminent",
      tone: "critical",
      glyph: "alert",
      clinician: "Imminent",
      patient: "Needs help right now",
      short: "IMM",
    },
  ]),
} as const satisfies Record<string, StatusScale>;

export type ScaleName = keyof typeof SCALES;

/** Every step id of a given scale, as a union. */
export type StepOf<S extends ScaleName> = (typeof SCALES)[S]["steps"][number]["id"];

export const SCALE_NAMES = Object.keys(SCALES) as ScaleName[];

/** Forty steps across nine scales, counted rather than asserted. */
export const STEP_COUNT = SCALE_NAMES.reduce((n, s) => n + SCALES[s].steps.length, 0);

/* ------------------------------------------------------------------ */
/* Resolution                                                          */
/* ------------------------------------------------------------------ */

export class UnknownStatusError extends Error {
  constructor(scale: string, step: string) {
    const known = scale in SCALES ? SCALES[scale as ScaleName].steps.map((s) => s.id) : SCALE_NAMES;
    super(
      scale in SCALES
        ? `ClinicalStatus: "${scale}" has no step "${step}". The vocabulary is closed — one of: ${known.join(", ")}.`
        : `ClinicalStatus: there is no scale called "${scale}". One of: ${SCALE_NAMES.join(", ")}.`,
    );
    this.name = "UnknownStatusError";
  }
}

/**
 * The step, or a throw.
 *
 * Deliberately not a fallback. A chip that silently renders "unknown" when the
 * host passes a typo is a chip that will one day render "unknown" for a
 * critical potassium, and nobody will notice because it looks like a real
 * state. Failing loudly at the call site is the only safe behaviour, and it
 * happens in development because the union makes it unreachable in production.
 */
export function resolveStatus(scale: string, step: string): StatusStep {
  const found =
    scale in SCALES ? SCALES[scale as ScaleName].steps.find((s) => s.id === step) : undefined;
  if (!found) throw new UnknownStatusError(scale, step);
  return found;
}

/** The word, in the register the surface is written in. */
export function statusWord(step: StatusStep, audience: StatusAudience = "clinician"): string {
  return audience === "patient" ? step.patient : step.clinician;
}

/**
 * The accessible name: the scale, then the step, then any qualifier.
 *
 * "Criticality: Critical" rather than "Critical", because a chip in a table
 * cell has no column header in its accessible context, and "Critical" on its
 * own has been read out next to a medication name, a lab value and an
 * appointment in the same screen — meaning three different things each time.
 */
export function describeStatus(
  scale: ScaleName,
  step: StatusStep,
  options: { audience?: StatusAudience; qualifier?: string } = {},
): string {
  const word = statusWord(step, options.audience);
  const base = `${SCALES[scale].label}: ${word}`;
  return options.qualifier ? `${base}, ${options.qualifier}` : base;
}

/* ------------------------------------------------------------------ */
/* FHIR adapters                                                       */
/* ------------------------------------------------------------------ */

/**
 * One adapter per source field, rather than one clever one.
 *
 * The mapping from FHIR to a scale is a judgement, not a lookup — `amended`
 * and `corrected` are both R4 statuses and both mean the value changed, but
 * only one of them says so to a clinician. Keeping them separate and named
 * means the judgement is reviewable, and means a host that disagrees can
 * replace one without forking the vocabulary.
 *
 * Every adapter returns `null` for a value it does not recognise rather than
 * guessing. A caller that renders nothing has a visible gap; a caller that
 * renders a guess has a plausible lie.
 */

/** `Observation.status` → result-status. */
export function fromObservationStatus(status: string | undefined): StepOf<"result-status"> | null {
  switch (status) {
    case "final":
      return "final";
    case "registered":
    case "preliminary":
      return "preliminary";
    case "amended":
    case "corrected":
      return "corrected";
    case "cancelled":
      return "cancelled";
    case "entered-in-error":
      return "entered-in-error";
    default:
      return null;
  }
}

/**
 * `Observation.interpretation` → criticality.
 *
 * HL7 v3 ObservationInterpretation codes. `HH`/`LL` are the panic values and
 * are the only ones that map to critical; `H`/`L` are simply outside the
 * range, and conflating the two is how an alert list becomes noise nobody
 * reads.
 */
export function fromInterpretation(code: string | undefined): StepOf<"criticality"> | null {
  switch (code) {
    case "HH":
    case "LL":
    case "AA":
      return "critical";
    case "H":
    case "L":
    case "A":
      return "high";
    case "N":
      return "normal";
    default:
      return null;
  }
}

/** `AllergyIntolerance.criticality` → criticality. */
export function fromAllergyCriticality(value: string | undefined): StepOf<"criticality"> | null {
  switch (value) {
    case "high":
      return "critical";
    case "low":
      return "moderate";
    case "unable-to-assess":
      return "not-assessed";
    default:
      return null;
  }
}

/** `Encounter.status` → encounter. */
export function fromEncounterStatus(status: string | undefined): StepOf<"encounter"> | null {
  switch (status) {
    case "planned":
      return "planned";
    case "arrived":
    case "triaged":
      return "arrived";
    case "in-progress":
    case "onleave":
      return "in-progress";
    case "finished":
      return "finished";
    case "cancelled":
    case "entered-in-error":
      return "cancelled";
    default:
      return null;
  }
}

/** `Task.status` and `ServiceRequest.status` → result-status-shaped lifecycle. */
export function fromRequestStatus(status: string | undefined): StepOf<"result-status"> | null {
  switch (status) {
    case "completed":
      return "final";
    case "draft":
    case "requested":
    case "received":
    case "accepted":
    case "ready":
    case "in-progress":
    case "active":
    case "on-hold":
      return "preliminary";
    case "cancelled":
    case "rejected":
    case "revoked":
      return "cancelled";
    case "entered-in-error":
      return "entered-in-error";
    default:
      return null;
  }
}

/**
 * `Consent.provision.type` plus a Part 2 security label → access.
 *
 * The label is checked first: a Part 2 record that also permits access is
 * still Part 2, and rendering it as plain "open" is the disclosure the
 * regulation exists to prevent.
 */
export function fromConsent(
  provision: string | undefined,
  securityLabels: readonly string[] = [],
): StepOf<"access"> | null {
  if (securityLabels.some((l) => l === "42CFRPart2" || l === "ETH" || l === "SUD")) return "part-2";
  if (securityLabels.includes("R") || securityLabels.includes("V")) return "restricted";
  if (provision === "permit") return "open";
  if (provision === "deny") return "restricted";
  return null;
}

/** `DetectedIssue.severity` → criticality. */
export function fromIssueSeverity(severity: string | undefined): StepOf<"criticality"> | null {
  switch (severity) {
    case "high":
      return "critical";
    case "moderate":
      return "moderate";
    case "low":
      return "normal";
    default:
      return null;
  }
}
