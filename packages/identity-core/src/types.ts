/**
 * The value types the identity engine produces and consumes.
 *
 * The organising idea is that **a rendered identity is a value, not a set of
 * booleans**. Every flag a patient banner could carry already exists somewhere
 * in the `Patient` resource; the engine's job is to read it into one shape that
 * a renderer can walk without knowing any FHIR.
 */

import type { Reference } from "@oxygenui-design/fhir";

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/**
 * A FHIR date keeps the precision it was recorded at, and widening it invents
 * a fact. `1985` means "some time in 1985", not "1 January 1985".
 */
export interface PreciseDate {
  /** The raw FHIR value, unmodified. */
  value: string;
  precision: "year" | "month" | "day" | "time";
  /**
   * Rendered unambiguously — `08 Mar 1985`, never `08/03/1985`. A date of
   * birth is one of two identifiers used to confirm a human being, and it
   * cannot be rendered in a format whose meaning depends on the reader.
   */
  text: string;
  /**
   * The same date spelled for speech: `8 March 1985`. Screen readers announce
   * an abbreviated month inconsistently, and a clinician verifying a date by
   * ear needs the whole word.
   */
  spoken: string;
}

/**
 * Age is derived, so it carries the moment it was derived at. A printed banner
 * without an as-of date is a stale-record hazard on a ward trolley.
 */
export interface Age {
  text: string;
  /** ISO instant the age was computed against. */
  asOf: string;
  /**
   * True when the subject is deceased: the value is age at death and does not
   * advance. A live-updating age for someone who stopped having birthdays is a
   * false statement that the interface refreshes every midnight.
   */
  atDeath: boolean;
}

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------

export type NameUse = "usual" | "nickname" | "official" | "anonymous" | "maiden" | "old" | "temp";

/**
 * The name to display and the name on the paperwork, kept apart on purpose.
 *
 * Which one a surface shows is a clinical decision with published outcome data
 * behind it, not a formatting preference. See `resolveIdentity` and
 * `IdentityPolicy.nameContext`.
 */
export interface ResolvedName {
  /** Whole name, ordered for the policy locale. */
  text: string;
  /** Given names in recorded order. Empty for a mononym-only record. */
  given: string[];
  /** Family name, if the record has one. Mononyms legitimately do not. */
  family?: string;
  prefix?: string;
  suffix?: string;
  /** Which `HumanName.use` this was taken from. */
  use: NameUse;
  /**
   * True when the displayed name is not the legal one — the surface is showing
   * a chosen or usual name. Renderers use this to decide whether a "legal name
   * on file" affordance is meaningful.
   */
  isChosen: boolean;
  /** The legal name, when one is recorded and differs from `text`. */
  legalText?: string;
}

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

export interface ResolvedIdentifier {
  /** Stable key for the identifier system, e.g. `"mrn"`, `"nhs"`, `"abha"`. */
  kind: string;
  /** Short label a clinician reads: `MRN`, `NHS number`, `ABHA number`. */
  label: string;
  /** The value as it should be displayed — grouped, never truncated. */
  text: string;
  /** The raw value, ungrouped and unmasked. Used for matching, never shown. */
  raw: string;
  /** The FHIR `Identifier.system` URI, when the record carried one. */
  system?: string;
  /**
   * Assigning organisation. Pew found match rates fall to roughly 50% between
   * organisations, which makes a bare number close to meaningless once records
   * move — so the issuer travels with the value.
   */
  assigner?: string;
  /** True when this value has been reduced for the current disclosure level. */
  masked: boolean;
  /**
   * Set when the identifier fails its system's check digit. A structurally
   * invalid identifier in a banner is a matching failure that has already
   * happened, and hiding it does not un-happen it.
   */
  checkDigitValid?: boolean;
}

// ---------------------------------------------------------------------------
// States and sensitivity
// ---------------------------------------------------------------------------

/**
 * Four unrelated facts that live in four unrelated places in FHIR, and which
 * every design system collapses into one grey "Inactive" pill.
 *
 * Collapsing them is how an appointment reminder reaches a bereaved family.
 */
export type IdentityState =
  | { kind: "inactive"; since?: PreciseDate }
  | { kind: "deceased"; date?: PreciseDate }
  | { kind: "merged"; into: Reference; on?: PreciseDate }
  | { kind: "test" }
  | { kind: "restricted"; codes: SensitivityCode[] };

/**
 * HL7 `ActCode` sensitivity labels, plus the two general confidentiality
 * levels and the test-record tag.
 *
 * `ETH` is the one that carries 42 CFR Part 2 in the US: the fact that a person
 * is *in* a substance use programme is itself protected, which means the
 * programme name is the disclosure — not the diagnosis, which a banner never
 * shows anyway.
 */
export type SensitivityCode = "PSY" | "ETH" | "HIV" | "SDV" | "R" | "V" | "HTEST";

export const SENSITIVITY_LABEL: Record<SensitivityCode, string> = {
  PSY: "Psychiatry",
  ETH: "Substance use",
  HIV: "HIV",
  SDV: "Sexual or domestic violence",
  R: "Restricted",
  V: "Very restricted",
  HTEST: "Test record",
};

// ---------------------------------------------------------------------------
// Photo
// ---------------------------------------------------------------------------

/**
 * Five states, because these are five different facts and only one of them is
 * "there is nothing to show".
 *
 * A photograph in the banner measurably reduces wrong-patient orders, which
 * makes a silently missing photograph a silently degraded safety control.
 * `none-on-file` and `unavailable` differ by exactly the fact that matters:
 * whether a photo exists at all.
 */
export type PhotoState =
  | { kind: "present"; src: string; contentType?: string }
  | { kind: "none-on-file" }
  | { kind: "unavailable" }
  | { kind: "withheld"; reason: string }
  | { kind: "loading" };

// ---------------------------------------------------------------------------
// The resolved identity
// ---------------------------------------------------------------------------

export interface CodedValue {
  code: string;
  label: string;
  system?: string;
}

export interface Identity {
  /**
   * What the swatch hashes. Never the name — a patient who marries or
   * transitions would change colour, and the banner and the worklist can
   * show the same person in two different hues at the same moment.
   */
  key: string;
  name: ResolvedName;
  pronouns?: string;
  birthDate?: PreciseDate;
  age?: Age;
  identifiers: ResolvedIdentifier[];
  /**
   * Sex parameter for clinical use. The only sex field that belongs near a
   * prescribing surface, and it always renders with its own label.
   * `Patient.gender` is deliberately not resolved at all.
   */
  spcu?: CodedValue;
  genderIdentity?: CodedValue;
  recordedSexOrGender?: CodedValue;
  states: IdentityState[];
  sensitivity: SensitivityCode[];
  photo: PhotoState;
  /** 0-based index into the six decorative swatches. Carries no meaning. */
  swatch: number;
  /** Initials for the avatar, correct for the name's script. */
  initials: string;
}

// ---------------------------------------------------------------------------
// Policy
// ---------------------------------------------------------------------------

/**
 * Who is looking, and what the site allows. One object, set once on a provider,
 * honoured by every identity surface underneath it.
 */
export type DisclosureLevel = "public" | "reception" | "clinical" | "full";

export type PhotoPolicy = "allow" | "deny" | "consent-required";

export type LegalNameReason = "billing" | "wristband" | "identity-verification" | "legal-document";

export interface IdentifierSystemSpec {
  kind: string;
  label: string;
  /** FHIR `Identifier.system` URIs that map to this kind. */
  systems: string[];
  /** Digits kept visible when masked. */
  maskVisible?: number;
  /** Grouping for display, e.g. `[3, 3, 3]` renders `123 456 789`. */
  group?: number[];
  /** Optional structural validator. */
  checkDigit?: (raw: string) => boolean;
  /** Higher sorts first. The primary identifier of a site should be highest. */
  weight?: number;
}

export interface IdentityPolicy {
  locale: string;
  disclosure: DisclosureLevel;
  photos: PhotoPolicy;
  nameContext: "display" | "legal";
  /** Required when `nameContext` is `"legal"`. Enforced by the React types. */
  legalNameReason?: LegalNameReason;
  identifierSystems: IdentifierSystemSpec[];
  /** Number of decorative swatches. Six, and §2 of the brief argues why. */
  swatchCount: number;
  /**
   * Injected clock. Age is derived, and a derived value that reads the wall
   * clock during render is neither testable nor server-renderable.
   */
  now: Date;
  /**
   * Substitutes synthetic identities for real ones, deterministically keyed off
   * the real id so the shape of the data survives. For conference screenshots,
   * sales demos against a staging database, and training environments.
   */
  demoMode: boolean;
  /** Bumped whenever the policy changes; part of the resolution cache key. */
  version: string;
}
