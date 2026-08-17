/**
 * Every exchange produces a provenance record whether or not anyone looks at it.
 *
 * Mapped onto FHIR rather than an invented format, following the precedent
 * `signature-core` set: a customer already has somewhere to put an `AuditEvent`,
 * and does not have somewhere to put an `OxygenCopilotLogEntry`.
 *
 * Two things in here are worth arguing about, so both are stated plainly.
 *
 * **The agent is the human. Always.** `Provenance.agent.who` is the clinician;
 * the model is recorded as `onBehalfOf`. Never the reverse. A record that
 * attributes a clinical act to software is a record that cannot be used to hold
 * anyone to account, and the entire propose/confirm design in `actions.ts` is
 * pointless if the audit trail undoes it.
 *
 * **What was withheld is audited alongside what was read.** An audit log that
 * records only what the model saw cannot answer the question a Part 2 complaint
 * actually asks, which is whether anything protected reached it. Recording the
 * withheld counts — not the content, never the content — is what makes the
 * negative answerable.
 *
 * This package emits objects. It writes nothing, stores nothing, and holds no
 * network configuration; the host's sink decides where they go. That is a
 * liability position as much as an architectural one — Oxygen should not become
 * a processor of clinical interaction data.
 */

import type { AuditEvent, Provenance, Reference } from "./fhir-types.js";
import type { ConfirmedProposal } from "./actions.js";
import type { CopilotMode } from "./modes.js";
import type { Withheld } from "./context.js";
import type { SafetyVerdict } from "./safety/index.js";

export type AuditSink = (event: AuditEvent) => void | Promise<void>;

export type ExchangeOutcomeCode = "answered" | "refused" | "crisis" | "blocked" | "failed";

export interface AuditExchangeInput {
  readonly exchangeId: string;
  readonly mode: CopilotMode;
  /** ISO 8601 — when the exchange began. */
  readonly startedAt: string;
  /** ISO 8601 — when this record was created. */
  readonly recorded?: string;
  readonly outcome: ExchangeOutcomeCode;
  readonly safety: SafetyVerdict;
  readonly withheld: readonly Withheld[];
  readonly sourceCount?: number;
  readonly blockedTools?: readonly string[];
  readonly neutralised?: number;
  readonly actor?: { display: string; reference?: string };
  readonly subject?: Reference;
  readonly modelId?: string;
}

/** DICOM audit message codes, which FHIR reuses for AuditEvent.type. */
const DCM = "http://dicom.nema.org/resources/ontology/DCM";
const COPILOT_SYSTEM = "https://oxygenui.design/fhir/CodeSystem/copilot-audit";

/**
 * `outcome` uses FHIR's own coarse scale: 0 success, 4 minor failure, 8 serious,
 * 12 major. A refusal is a *success* — the system did what it was designed to
 * do — which is why only genuine failures score above zero.
 */
function outcomeCode(outcome: ExchangeOutcomeCode): "0" | "4" | "8" {
  switch (outcome) {
    case "answered":
    case "refused":
    case "crisis":
      return "0";
    case "blocked":
      return "4";
    case "failed":
      return "8";
  }
}

export function auditExchange(input: AuditExchangeInput): AuditEvent {
  const {
    exchangeId,
    mode,
    startedAt,
    recorded = startedAt,
    outcome,
    safety,
    withheld,
    sourceCount,
    blockedTools = [],
    neutralised = 0,
    actor,
    subject,
    modelId,
  } = input;

  const detail: Array<{ type: string; valueString?: string }> = [
    { type: "exchangeId", valueString: exchangeId },
    { type: "modeId", valueString: mode.id },
    { type: "modeRisk", valueString: mode.risk },
    { type: "promptRef", valueString: mode.promptRef },
    { type: "startedAt", valueString: startedAt },
    { type: "outcome", valueString: outcome },
    // The categories the mode was permitted to read, not the data itself.
    { type: "readsDeclared", valueString: mode.reads.join(",") || "(none)" },
    { type: "excludesDeclared", valueString: mode.excludes.join(",") },
  ];

  if (modelId) detail.push({ type: "modelId", valueString: modelId });
  if (sourceCount !== undefined) {
    detail.push({ type: "sourceCount", valueString: String(sourceCount) });
  }
  if (neutralised > 0) {
    detail.push({ type: "instructionShapesNeutralised", valueString: String(neutralised) });
  }
  if (blockedTools.length > 0) {
    detail.push({ type: "toolsBlocked", valueString: blockedTools.join(",") });
  }

  // Counts and reasons only. The content of a withheld record must never reach
  // an audit log — that would defeat the withholding.
  for (const item of withheld) {
    detail.push({
      type: `withheld.${item.reason}`,
      valueString: `${item.count}${item.disclosable ? "" : " (not disclosable)"}`,
    });
  }

  if (safety.crisis.severity !== "none") {
    detail.push({ type: "crisisSeverity", valueString: safety.crisis.severity });
    detail.push({ type: "crisisAudience", valueString: safety.crisis.audience });
    // Rule names, never the matched text.
    detail.push({ type: "crisisRules", valueString: safety.crisis.rules.join(",") });
  }
  if (safety.injection && safety.injection.severity !== "none") {
    detail.push({ type: "injectionSeverity", valueString: safety.injection.severity });
    detail.push({ type: "injectionRules", valueString: safety.injection.rules.join(",") });
  }

  return {
    resourceType: "AuditEvent",
    type: { system: DCM, code: "110100", display: "Application Activity" },
    subtype: [
      { system: COPILOT_SYSTEM, code: `copilot-${outcome}`, display: `Copilot ${outcome}` },
    ],
    action: "E",
    recorded,
    outcome: outcomeCode(outcome),
    outcomeDesc: outcome,
    agent: [
      {
        who: actor
          ? { display: actor.display, ...(actor.reference ? { reference: actor.reference } : {}) }
          : { display: "unknown" },
        requestor: true,
        purposeOfEvent: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ActReason",
                code: "TREAT",
                display: "treatment",
              },
            ],
          },
        ],
      },
    ],
    source: {
      observer: { display: "Oxygen Copilot" },
      type: [{ system: DCM, code: "110153", display: "Source Role ID" }],
    },
    entity: [
      {
        ...(subject ? { what: subject } : {}),
        type: { system: DCM, code: "110150", display: "Application" },
        name: "copilot-exchange",
        detail,
      },
    ],
  };
}

/**
 * Provenance for something the clinician inserted into the record.
 *
 * The shape carries the argument: `agent.who` is the person, `onBehalfOf` is
 * the model. A reader of this resource in five years should be able to see both
 * that software was involved and that a named human took responsibility, and
 * should not have to infer either.
 */
export function provenanceForInsertion(input: {
  readonly confirmed: ConfirmedProposal;
  readonly target: Reference;
  readonly modelId: string;
  readonly sourceIds?: readonly string[];
}): Provenance {
  const { confirmed, target, modelId, sourceIds = [] } = input;
  const { actor, confirmedAt } = confirmed;

  return {
    resourceType: "Provenance",
    target: [target],
    recorded: confirmedAt,
    activity: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
          code: "CREATE",
          display: "create",
        },
      ],
      text: confirmed.proposal.summary,
    },
    agent: [
      {
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
              code: "author",
              display: "Author",
            },
          ],
        },
        who: {
          display: actor.credential ? `${actor.display}, ${actor.credential}` : actor.display,
          ...(actor.reference ? { reference: actor.reference } : {}),
        },
        // The model assisted. It did not author, and it is not accountable.
        onBehalfOf: { display: `Oxygen Copilot (${modelId})` },
      },
    ],
    entity: sourceIds.map((id) => ({
      role: "source" as const,
      what: { display: id },
    })),
  };
}
