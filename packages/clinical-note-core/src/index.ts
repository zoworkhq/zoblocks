/**
 * @zoblocks/clinical-note-core — the engine behind Zoblocks's ClinicalNote.
 *
 * No React, no Ant Design, no DOM. Coded sections, per-range provenance, a
 * composable sign gate, and deterministic serialization to FHIR, XHTML and
 * plain text.
 *
 *     import { emptyNote, runGate, DEFAULT_RULES, toFhirBundle } from
 *       "@zoblocks/clinical-note-core";
 *
 *     const doc = emptyNote("progress");
 *     const gate = runGate(doc, DEFAULT_RULES, {
 *       noteType: "progress",
 *       now: await serverTime(),   // there is no clock in this package
 *     });
 *     gate.canSign; // false — the assessment is empty
 *
 * The one idea everything else follows from: **every character knows where it
 * came from.** Note bloat, copy-paste error and AI attribution are the same
 * missing data structure seen three times, and storing origin per range is what
 * makes all three visible.
 *
 * The React surface, the Ant Design shell and the sign-gate dialog live in
 * `@zoblocks/clinical-note`. This package is what stays the same
 * whichever way that goes — and what a server can import to validate, render or
 * re-hash a note without a browser anywhere in the picture.
 *
 * Design reasoning: `zoblocks-clinical-note-brief.html` at the repository root.
 */

export {
  DEFAULT_PROVENANCE,
  ORIGINS,
  ageMs,
  isOrigin,
  originOf,
  provenance,
  provenanceMarkSpec,
  provenanceRanges,
  readProvenance,
  sameProvenance,
  type Origin,
  type ProvenanceAttrs,
  type ProvenanceRange,
} from "./provenance.js";

export {
  LOINC,
  NOTE_TYPES,
  SECTIONS,
  emptyNote,
  hasWildcard,
  isSectionEmpty,
  MARKS,
  NODES,
  noteSchema,
  noteType,
  sectionAttrs,
  sections,
  wildcardHint,
  type NoteTypeDef,
  type NoteTypeName,
  type SectionAttrs,
  type SectionDef,
} from "./schema.js";

export {
  composition,
  copiedRatio,
  diffLines,
  foreignContent,
  stalePulls,
  unreviewedAi,
  type Composition,
  type DiffLine,
  type ForeignRange,
  type StalePull,
  type UnreviewedPassage,
} from "./compose.js";

export {
  blanks,
  countBlanks,
  expand,
  expandPhrase,
  nextBlank,
  searchPhrases,
  tokenize,
  type Blank,
  type ExpandOptions,
  type Expansion,
  type Phrase,
  type Token,
} from "./expand.js";

export {
  DEFAULT_RULES,
  DO_NOT_USE,
  copyForward,
  formatDuration,
  freshPulls,
  lowConfidenceDictation,
  noDangerousAbbreviations,
  noForeignContent,
  noUnfilledBlanks,
  requiredSections,
  runGate,
  uneditedTemplate,
  unreviewedAiRule,
  type Abbreviation,
  type Finding,
  type GateContext,
  type GateResult,
  type GateRule,
  type Severity,
} from "./gate.js";

export { canonicallyEqual, stableStringify, toCanonical, type Json } from "./canonical.js";

export {
  XHTML_NS,
  escapeXml,
  sectionNarrative,
  toNarrative,
  type NarrativeOptions,
} from "./narrative.js";

export { toText, type TextOptions } from "./text.js";

export {
  AUTHORS_SIGNATURE,
  COAUTHORS_SIGNATURE,
  COMPOSITION_EXTENSION,
  SIGNATURE_TYPE_SYSTEM,
  base64,
  toComposition,
  toDocumentReference,
  toFhirBundle,
  toProvenance,
  withDigest,
  type Attestation,
  type FhirBundle,
  type FhirCodeableConcept,
  type FhirCoding,
  type FhirComposition,
  type FhirDocumentReference,
  type FhirExtension,
  type FhirNarrative,
  type FhirProvenance,
  type FhirReference,
  type FhirSignature,
  type ToFhirOptions,
} from "./fhir.js";
