/**
 * Scope classification: is this question in the mode's remit?
 *
 * The interesting design constraint here is that **over-refusal is a real
 * failure and is almost never measured.** A component that refuses too much
 * teaches clinicians it is unreliable and they stop reaching for it — which
 * looks, in the telemetry, exactly like a component nobody needed. So this
 * classifier is deliberately conservative: it refuses only where refusal is
 * clearly right, and it always names a mode that would have accepted the
 * question rather than leaving the user at a dead end.
 *
 * Two categories of refusal:
 *
 *   **Wrong mode** — the question is fine, it just needs different data. This
 *   is not really a refusal; it is a redirect, and it should feel like one.
 *
 *   **Out of remit** — the question is not clinical, or asks the component to
 *   do something its whole design forbids (act autonomously, give a definitive
 *   diagnosis, prescribe). These get a real refusal with a reason.
 */

import { readsPatientData, type ConsultMode } from "../modes.js";

export type ScopeOutcome =
  | { readonly inScope: true }
  | {
      readonly inScope: false;
      readonly reason: ScopeRefusalReason;
      /** A mode that would have taken it. Rendered as a one-tap redirect. */
      readonly suggestedModeId?: string;
      readonly rules: readonly string[];
    };

export type ScopeRefusalReason =
  /** Needs patient data; the active mode reads none. */
  | "needs-patient-context"
  /** Asks for a definitive diagnosis rather than support for one. */
  | "asks-for-diagnosis"
  /** Asks the component to take an action it may not take. */
  | "asks-for-autonomous-action"
  /** Not a clinical question at all. */
  | "not-clinical";

interface Rule {
  readonly name: string;
  readonly pattern: RegExp;
}

/**
 * Signals that a question is about the patient in front of the clinician.
 *
 * Only consulted when the active mode reads nothing — a reference-only mode
 * being asked "what should I do about her potassium" cannot answer well, and
 * answering badly is worse than redirecting.
 */
const NEEDS_PATIENT: readonly Rule[] = [
  { name: "patient.deictic", pattern: /\b(?:this|my|the)\s+(?:patient|client|pt|case)\b/i },
  {
    name: "patient.possessive-result",
    pattern:
      /\b(?:his|her|their|this\s+patient'?s)\s+(?:results?|labs?|bloods?|meds?|medications?|history|notes?)\b/i,
  },
  {
    name: "patient.chart-deixis",
    pattern:
      /\b(?:in\s+the\s+chart|on\s+the\s+problem\s+list|last\s+(?:visit|encounter|admission))\b/i,
  },
];

/** Requests for a definitive answer the component must not give. */
const ASKS_DIAGNOSIS: readonly Rule[] = [
  {
    name: "dx.definitive",
    pattern:
      /\b(?:what\s+(?:disease|condition)\s+does\s+(?:he|she|they|this\s+patient)\s+have|diagnose\s+(?:this|him|her|them)|what'?s\s+the\s+diagnosis)\b/i,
  },
  {
    name: "dx.confirm",
    pattern: /\b(?:confirm|rule\s+out)\s+(?:the\s+)?diagnosis\s+(?:of|for)\b.*\?/i,
  },
];

/** Requests for the component to act rather than advise. */
const ASKS_ACTION: readonly Rule[] = [
  {
    name: "action.order",
    pattern:
      /\b(?:place|submit|sign|send|file|put\s+in)\s+(?:the\s+|an?\s+)?(?:order|referral|prescription|script|message)\b/i,
  },
  {
    name: "action.prescribe",
    pattern: /\b(?:prescribe|write\s+(?:a\s+)?(?:script|prescription))\b/i,
  },
  {
    name: "action.message-patient",
    pattern: /\b(?:message|email|text|call)\s+(?:the\s+)?(?:patient|client|family)\b/i,
  },
  {
    name: "action.chart",
    pattern: /\b(?:update|amend|edit|sign\s+off)\s+(?:the\s+)?(?:chart|note|record)\b/i,
  },
];

/** Plainly non-clinical. Kept narrow — the cost of a false positive is high. */
const NOT_CLINICAL: readonly Rule[] = [
  {
    name: "off.code",
    // Optional article and one optional qualifier, so "write me a python
    // script" and "write a quick regex" both land.
    pattern:
      /\b(?:write|refactor|debug)\s+(?:me\s+)?(?:an?\s+|some\s+)?(?:\w+\s+)?(?:code|function|script|program|query|python|javascript|typescript|sql|regex)\b/i,
  },
  {
    name: "off.creative",
    pattern: /\b(?:write\s+(?:me\s+)?a\s+(?:poem|song|story|joke)|tell\s+me\s+a\s+joke)\b/i,
  },
  {
    name: "off.personal",
    pattern:
      /\b(?:what(?:'s| is)\s+the\s+weather|book\s+(?:me\s+)?a\s+(?:flight|table|holiday)|who\s+won\s+the)\b/i,
  },
];

function matched(rules: readonly Rule[], text: string): string[] {
  return rules.filter((r) => r.pattern.test(text)).map((r) => r.name);
}

export interface ScopeInput {
  readonly question: string;
  readonly mode: ConsultMode;
  /** All registered modes, so a redirect can name a real one. */
  readonly modes: readonly ConsultMode[];
}

export function classifyScope(input: ScopeInput): ScopeOutcome {
  const { question, mode, modes } = input;

  const action = matched(ASKS_ACTION, question);
  if (action.length > 0 && mode.tools.length === 0) {
    return { inScope: false, reason: "asks-for-autonomous-action", rules: action };
  }

  const diagnosis = matched(ASKS_DIAGNOSIS, question);
  if (diagnosis.length > 0 && mode.output.forbidDiagnosis) {
    return {
      inScope: false,
      reason: "asks-for-diagnosis",
      rules: diagnosis,
      suggestedModeId: modes.find((m) => m.risk === "clinical" && m.id !== mode.id)?.id,
    };
  }

  const offTopic = matched(NOT_CLINICAL, question);
  if (offTopic.length > 0) {
    return { inScope: false, reason: "not-clinical", rules: offTopic };
  }

  if (!readsPatientData(mode)) {
    const needsPatient = matched(NEEDS_PATIENT, question);
    if (needsPatient.length > 0) {
      const suggested = modes.find((m) => readsPatientData(m) && m.risk === "summary");
      return {
        inScope: false,
        reason: "needs-patient-context",
        rules: needsPatient,
        ...(suggested ? { suggestedModeId: suggested.id } : {}),
      };
    }
  }

  return { inScope: true };
}
