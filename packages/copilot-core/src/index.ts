/**
 * @oxygenui-design/copilot-core — the engine behind Oxygen's clinical copilot.
 *
 * No React, no DOM, no dependencies. The whole package is importable in a Node
 * handler, an edge worker, or a test runner with no environment, which is the
 * property that lets a host run the same safety pipeline server-side that the
 * browser runs client-side. A client classifier stops mistakes; a server one
 * stops attacks; a product with only one of them has chosen which to tolerate.
 *
 *     import { runExchange, lookUp, reduce, initialState } from "@oxygenui-design/copilot-core";
 *
 * The four ideas worth reading first:
 *
 *   `modes.ts`    — a mode is a scope contract, not a prompt preset.
 *   `context.ts`  — the one place the instruction and data channels meet.
 *   `session.ts`  — crisis is terminal; committed is reachable only via confirm.
 *   `actions.ts`  — propose, confirm, attribute. No exceptions.
 */

export {
  classifyProposal,
  confirmProposal,
  containsDosing,
  decideTool,
  isReflexive,
  ProposalProhibitedError,
  type Actor,
  type ActionProposal,
  type ConfirmedProposal,
  type ProposalKind,
  type ProposalRisk,
  type ToolCall,
  type ToolDecision,
} from "./actions.js";

export {
  citationCoverage,
  deriveRegister,
  EMPTY_ANSWER,
  uncitedSpans,
  type Answer,
  type AnswerRegister,
} from "./answer.js";

export {
  auditExchange,
  provenanceForInsertion,
  type AuditExchangeInput,
  type AuditSink,
  type ExchangeOutcomeCode,
} from "./audit.js";

export {
  assertClinicianFacing,
  AUDITC,
  bandFor,
  behavioralModes,
  betweenVisits,
  computeTrend,
  describeTrend,
  findInstrument,
  formulate,
  GAD7,
  INSTRUMENTS,
  PatientFacingNotSupportedError,
  PCL5,
  PHQ9,
  type Instrument,
  type InstrumentScore,
  type InstrumentTrend,
  type SeverityBand,
  type TrendDirection,
} from "./behavioral.js";

export {
  runChecks,
  type CheckCode,
  type CheckFinding,
  type CheckResult,
  type CheckSeverity,
  type RunChecksOptions,
} from "./checks.js";

export {
  assembleRequest,
  disclosableWithheldCount,
  EMPTY_CONTEXT,
  fenceText,
  hasDisclosableWithholding,
  resolveContext,
  toContextBlocks,
  type AssembledRequest,
  type AssembleOptions,
  type CopilotContextResolver,
  type ContextOutcome,
  type ContextRequest,
  type ResolvedContext,
  type Withheld,
  type WithheldReason,
} from "./context.js";

export {
  disclosureCompleteness,
  disclosureFields,
  DISCLOSURE_LABELS,
  DISCLOSURE_SECTIONS,
  minimalDisclosure,
  type DisclosureSection,
  type ModelDisclosure,
} from "./disclosure.js";

export {
  copilotError,
  PhiNotPermittedError,
  type CopilotError,
  type CopilotErrorCode,
} from "./errors.js";

export type {
  AuditEvent,
  ClinicalResourceType,
  CodeableConcept,
  Coding,
  FhirResource,
  Period,
  Provenance,
  Reference,
} from "./fhir-types.js";

export { findStigma, STIGMA_TERMS, type StigmaFinding, type StigmaTerm } from "./language.js";

export {
  DEFAULT_EXCLUSIONS,
  defaultModes,
  defineMode,
  lookUp,
  prepare,
  readsPatientData,
  requireMode,
  workUp,
  type CopilotMode,
  type CopilotSuggestion,
  type ExclusionCategory,
  type ModeRisk,
  type OutputContract,
} from "./modes.js";

export {
  runExchange,
  type ExchangeOutcome,
  type PipelineDeps,
  type RunExchangeOptions,
} from "./pipeline.js";

export {
  createStaticProvider,
  type Claim,
  type CopilotEvent,
  type CopilotProvider,
  type CopilotRequest,
  type CopilotTurn,
  type ContextBlock,
  type ProviderCapabilities,
  type Source,
  type SourceKind,
} from "./provider.js";

export {
  classifyCrisis,
  classifyBlocks,
  classifyInjection,
  classifyScope,
  defaultClassifiers,
  mergeVerdicts,
  NO_CRISIS,
  regionOf,
  resolveCrisisLines,
  SAFE_VERDICT,
  type CrisisAudience,
  type CrisisInput,
  type CrisisLine,
  type CrisisSeverity,
  type CrisisVerdict,
  type InjectionSeverity,
  type InjectionVerdict,
  type SafetyClassifiers,
  type SafetyVerdict,
  type ScopeInput,
  type ScopeOutcome,
  type ScopeRefusalReason,
} from "./safety/index.js";

export {
  canCompose,
  claimsOf,
  initialState,
  isBusy,
  reduce,
  sourcesOf,
  toHistoryText,
  toTurns,
  type CopilotMessage,
  type CopilotStatus,
  type SessionAction,
  type SessionState,
} from "./session.js";

export {
  summarise,
  type FeedbackReason,
  type TelemetryEvent,
  type TelemetrySink,
  type TelemetrySummary,
} from "./telemetry.js";
