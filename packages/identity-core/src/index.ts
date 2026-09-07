/**
 * @zoblocks/identity-core — the engine behind Zoblocks's patient identity
 * components.
 *
 * No React, no Ant Design, no DOM. It accepts a FHIR `Patient` and returns a
 * value a renderer can walk without knowing any FHIR — which is what lets the
 * same logic serve a React banner, a print stylesheet, a PDF, and a server.
 *
 *     import { resolveIdentity, policy, disambiguate } from "@zoblocks/identity-core";
 *
 *     const p = policy({ locale: "en-GB", disclosure: "clinical" });
 *     const me = resolveIdentity(patient, p);
 *
 *     me.name.text;      // the name the person uses, not name[0]
 *     me.birthDate.text; // "08 Mar 1985" — never "08/03/1985"
 *     me.states;         // deceased | inactive | merged | test | restricted
 *     me.photo.kind;     // five-valued: absence is a fact, not a gap
 *
 *     disambiguate([me, other]).plan; // what to add so a reader can tell them apart
 *
 * `Patient.gender` is deliberately never resolved. See `resolve.ts`.
 */

export type {
  Age,
  CodedValue,
  DisclosureAllowance,
  DisclosureLevel,
  Identity,
  IdentifierSystemSpec,
  IdentityPolicy,
  IdentityState,
  LegalNameReason,
  NameUse,
  PhotoPolicy,
  PhotoState,
  PreciseDate,
  ResolvedIdentifier,
  ResolvedName,
  SensitivityCode,
} from "./types.js";
export { SENSITIVITY_LABEL } from "./types.js";

export { DEFAULT_SWATCH_COUNT, collisionProbability, fnv1a, identitySwatch } from "./swatch.js";

export {
  fold,
  graphemes,
  isCaseless,
  isIdeographic,
  isParticle,
  isSuffix,
  isTitle,
  nameWords,
} from "./text.js";

export { identityInitials, initialsFromText, isFamilyFirstLocale } from "./initials.js";

export { isFuture, precise, resolveAge, yearsBetween } from "./dates.js";

export {
  DEFAULT_IDENTIFIER_SYSTEMS,
  group,
  isLocationLike,
  luhn,
  mask,
  nhsCheckDigit,
  resolveIdentifiers,
  verhoeff,
  verhoeffCheckDigit,
  verhoeffValid,
} from "./identifiers.js";

export {
  SIMILARITY_THRESHOLD,
  jaro,
  jaroWinkler,
  looksAlike,
  looksAlikeFolded,
  metaphone,
  similarityReason,
} from "./similarity.js";

export {
  DEFAULT_POLICY,
  EXT_GENDER_IDENTITY,
  EXT_PRONOUNS,
  EXT_RECORDED_SEX_OR_GENDER,
  EXT_SPCU,
  IdentityCache,
  identityKey,
  disclosureAllows,
  policy,
  resolveIdentity,
  resolveName,
  resolvePhoto,
  resolvePronouns,
  resolveSensitivity,
  resolveStates,
  shortName,
  type ResolveOptions,
} from "./resolve.js";

export {
  identityLabel,
  spellDigits,
  spellOut,
  switchAnnouncement,
  type LabelOptions,
} from "./label.js";

export {
  disambiguate,
  disambiguationNotice,
  type DisambiguationResult,
  type Escalation,
  type EscalationField,
  type EscalationReason,
} from "./disambiguate.js";

export { substituteForDemo } from "./demo.js";
