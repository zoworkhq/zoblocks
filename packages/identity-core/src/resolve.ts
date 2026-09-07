/**
 * `resolveIdentity` — one FHIR `Patient` in, one renderable identity out.
 *
 * Every component in `@zoblocks/identity` is a renderer of this
 * function's output. Nothing downstream reads FHIR, which is what makes the
 * renderers small and this file the one worth reviewing carefully.
 */

import type { Extension, HumanName, Patient } from "@zoblocks/fhir";
import { codeableText } from "@zoblocks/fhir";
import { precise, resolveAge } from "./dates.js";
import { resolveIdentifiers, DEFAULT_IDENTIFIER_SYSTEMS } from "./identifiers.js";
import { identityInitials, isFamilyFirstLocale } from "./initials.js";
import { graphemes } from "./text.js";
import { substituteForDemo } from "./demo.js";
import { identitySwatch, DEFAULT_SWATCH_COUNT } from "./swatch.js";
import type {
  CodedValue,
  DisclosureAllowance,
  DisclosureLevel,
  Identity,
  IdentityPolicy,
  IdentityState,
  NameUse,
  PhotoState,
  ResolvedName,
  SensitivityCode,
} from "./types.js";

// ---------------------------------------------------------------------------
// Extension URLs
// ---------------------------------------------------------------------------

export const EXT_PRONOUNS = "http://hl7.org/fhir/StructureDefinition/individual-pronouns";
export const EXT_GENDER_IDENTITY =
  "http://hl7.org/fhir/StructureDefinition/individual-genderIdentity";
export const EXT_RECORDED_SEX_OR_GENDER =
  "http://hl7.org/fhir/StructureDefinition/individual-recordedSexOrGender";
export const EXT_SPCU =
  "http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse";

const SECURITY_SYSTEMS = new Set([
  "http://terminology.hl7.org/CodeSystem/v3-ActCode",
  "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
  "http://terminology.hl7.org/CodeSystem/v3-ObservationValue",
]);

const KNOWN_SENSITIVITY = new Set<string>(["PSY", "ETH", "HIV", "SDV", "R", "V", "HTEST"]);

// ---------------------------------------------------------------------------
// Policy
// ---------------------------------------------------------------------------

export const DEFAULT_POLICY: IdentityPolicy = {
  locale: "en",
  disclosure: "clinical",
  photos: "deny",
  nameContext: "display",
  identifierSystems: DEFAULT_IDENTIFIER_SYSTEMS,
  swatchCount: DEFAULT_SWATCH_COUNT,
  now: new Date(0),
  demoMode: false,
  version: "default",
};

/**
 * Merge a partial policy over the defaults.
 *
 * `photos` defaults to `"deny"`, not `"allow"`. A cached portrait is PHI at
 * rest in a browser the site may not control, and an intake photograph taken
 * during an involuntary admission was not meaningfully consented to. Opting
 * *in* to photographs is a decision someone should have to make on purpose.
 */
export function policy(overrides: Partial<IdentityPolicy> = {}): IdentityPolicy {
  // A factory, not a render path, and a policy has to carry a clock. Every
  // caller that cares about determinism — every test in this package, every
  // server render, every visual-regression run — passes `now` and overrides it.
  // eslint-disable-next-line no-restricted-syntax
  return { ...DEFAULT_POLICY, now: new Date(), ...overrides };
}

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------

/**
 * Display order for `HumanName.use`.
 *
 * `usual` and `nickname` come before `official` because the name a person uses
 * is the one a banner should carry. Russell et al. (2018) found chosen-name use
 * across contexts associated with 71% fewer severe depressive symptoms and 65%
 * fewer suicide attempts among transgender young people; a patient banner is a
 * context, and `name[0]` is not a neutral default.
 */
const DISPLAY_ORDER: NameUse[] = ["usual", "nickname", "official", "temp", "maiden", "anonymous"];
const LEGAL_ORDER: NameUse[] = ["official", "usual", "maiden", "nickname", "temp", "anonymous"];

function nameText(n: HumanName, locale: string): string {
  if (n.text?.trim()) return n.text.trim();
  const given = (n.given ?? []).filter((g) => g.trim());
  const family = n.family?.trim();
  const parts = isFamilyFirstLocale(locale) ? [family, ...given] : [...given, family];
  const core = parts.filter(Boolean).join(" ");
  const suffix = (n.suffix ?? []).join(" ").trim();
  return suffix ? `${core} ${suffix}`.trim() : core;
}

function pick(names: HumanName[], order: NameUse[]): HumanName | undefined {
  for (const use of order) {
    const hit = names.find((n) => (n.use ?? "official") === use);
    if (hit && (hit.text?.trim() || hit.family?.trim() || hit.given?.some((g) => g.trim()))) {
      return hit;
    }
  }
  return names.find((n) => n.text?.trim() || n.family?.trim() || n.given?.some((g) => g.trim()));
}

export function resolveName(patient: Patient, p: IdentityPolicy): ResolvedName {
  const names = (patient.name ?? []).filter(Boolean);
  const wantLegal = p.nameContext === "legal";
  const chosen = pick(names, wantLegal ? LEGAL_ORDER : DISPLAY_ORDER);
  const official = pick(names, LEGAL_ORDER);

  if (!chosen) {
    // A record with no name at all is a real state — unidentified admissions
    // happen. It is stated, not left blank, because a blank claims there was
    // nothing to say.
    return { text: "Name not recorded", given: [], use: "anonymous", isChosen: false };
  }

  const use = (chosen.use ?? "official") as NameUse;
  const text = nameText(chosen, p.locale);
  const legalText = official && official !== chosen ? nameText(official, p.locale) : undefined;

  const out: ResolvedName = {
    text,
    given: (chosen.given ?? []).filter((g) => g.trim()),
    use,
    isChosen: !wantLegal && use !== "official",
  };
  if (chosen.family?.trim()) out.family = chosen.family.trim();
  if (chosen.prefix?.length) out.prefix = chosen.prefix.join(" ");
  if (chosen.suffix?.length) out.suffix = chosen.suffix.join(" ");
  if (legalText && legalText !== text) out.legalText = legalText;
  return out;
}

// ---------------------------------------------------------------------------
// Extensions
// ---------------------------------------------------------------------------

function findExt(exts: Extension[] | undefined, url: string): Extension | undefined {
  return exts?.find((e) => e.url === url);
}

function codedFrom(ext: Extension | undefined, nested?: string): CodedValue | undefined {
  if (!ext) return undefined;
  const target = nested ? (findExt(ext.extension, nested) ?? ext) : ext;
  const cc = target.valueCodeableConcept;
  const coding = cc?.coding?.[0] ?? target.valueCoding;
  const label = codeableText(cc) ?? coding?.display ?? target.valueString ?? target.valueCode;
  const code = coding?.code ?? target.valueCode ?? label;
  if (!label || !code) return undefined;
  const out: CodedValue = { code, label };
  if (coding?.system) out.system = coding.system;
  return out;
}

/**
 * Pronouns from the R5 `individual-pronouns` extension.
 *
 * The extension is complex — `value` sits in a nested extension — but plenty of
 * servers populate the simple form, so both shapes are read.
 */
export function resolvePronouns(patient: Patient): string | undefined {
  const ext = findExt(patient.extension, EXT_PRONOUNS);
  if (!ext) return undefined;
  return codedFrom(ext, "value")?.label ?? codedFrom(ext)?.label;
}

// ---------------------------------------------------------------------------
// Sensitivity and state
// ---------------------------------------------------------------------------

export function resolveSensitivity(patient: Patient): SensitivityCode[] {
  const codes = new Set<SensitivityCode>();
  for (const coding of patient.meta?.security ?? []) {
    const code = coding.code?.toUpperCase();
    if (!code) continue;
    // An unrecognised code from an unrecognised system is not silently
    // upgraded into a restriction — but a known code is honoured even if the
    // system URI is one we do not have on the list, because a server that
    // mislabels the system is likelier than one that invents `SDV`.
    if (
      KNOWN_SENSITIVITY.has(code) &&
      (!coding.system || SECURITY_SYSTEMS.has(coding.system) || true)
    ) {
      codes.add(code as SensitivityCode);
    }
  }
  for (const tag of patient.meta?.tag ?? []) {
    if (tag.code?.toUpperCase() === "HTEST") codes.add("HTEST");
  }
  return [...codes];
}

export function resolveStates(patient: Patient, p: IdentityPolicy): IdentityState[] {
  const states: IdentityState[] = [];

  const deceasedOn = patient.deceasedDateTime;
  if (deceasedOn || patient.deceasedBoolean) {
    const date = precise(deceasedOn);
    states.push(date ? { kind: "deceased", date } : { kind: "deceased" });
  }

  const replacedBy = patient.link?.find((l) => l.type === "replaced-by");
  if (replacedBy) states.push({ kind: "merged", into: replacedBy.other });

  if (patient.active === false) states.push({ kind: "inactive" });

  const sensitivity = resolveSensitivity(patient);
  if (sensitivity.includes("HTEST")) states.push({ kind: "test" });

  const restricting = sensitivity.filter((c) => c !== "HTEST");
  if (restricting.length > 0) states.push({ kind: "restricted", codes: restricting });

  void p;
  return states;
}

// ---------------------------------------------------------------------------
// Photo
// ---------------------------------------------------------------------------

/**
 * Photo state, from the resource and the site policy.
 *
 * Presence of `Patient.photo` is not consent to display it — the FHIR type in
 * this repo already carries that comment — so the policy gate comes first and
 * an unset policy denies.
 */
export function resolvePhoto(patient: Patient, p: IdentityPolicy): PhotoState {
  const attachment = patient.photo?.find((a) => a.url || a.data);

  // Nothing on the record. Nothing was withheld, because there was nothing
  // there — and those are different facts.
  if (!attachment) return { kind: "none-on-file" };

  if (p.photos === "deny") {
    return { kind: "withheld", reason: "Photographs are not shown on this surface" };
  }

  /**
   * `consent-required` withholds. It used to fall through and render the photo,
   * which made the value indistinguishable from `"allow"` — a policy setting
   * that reads as a safeguard and does nothing is worse than not having it.
   *
   * There is no consent record in `Patient.photo` to copilot, so the honest
   * contract is: the application asserts consent by switching this to
   * `"allow"`, and until it does the photograph stays behind the same withheld
   * state a site-wide denial produces.
   */
  if (p.photos === "consent-required") {
    return { kind: "withheld", reason: "Consent to display this photograph is not recorded" };
  }

  // `find` already required a url or inline data, so one of these is present.
  const src =
    attachment.url ?? `data:${attachment.contentType ?? "image/jpeg"};base64,${attachment.data}`;
  const out: PhotoState = { kind: "present", src };
  if (attachment.contentType) out.contentType = attachment.contentType;
  return out;
}

// ---------------------------------------------------------------------------
// The whole thing
// ---------------------------------------------------------------------------

/**
 * The key the swatch hashes.
 *
 * `Patient.id` first, then the highest-weighted identifier, then the name as a
 * last resort — and the last resort is genuinely bad (a rename repaints the
 * person), which is why `identityKey` exists as an escape hatch and why the
 * lint rule flags callers who reach for a name.
 */
export function identityKey(patient: Patient, override?: string): string {
  if (override) return override;
  if (patient.id) return patient.id;
  const id = patient.identifier?.find((i) => i.value)?.value;
  if (id) return id;
  return patient.name?.[0]?.text ?? patient.name?.[0]?.family ?? "unknown";
}

export interface ResolveOptions {
  /** Overrides the swatch key. Use when the app has something more stable. */
  key?: string;
}

export function resolveIdentity(
  patientIn: Patient,
  p: IdentityPolicy = DEFAULT_POLICY,
  options: ResolveOptions = {},
): Identity {
  const key = identityKey(patientIn, options.key);
  const patient = p.demoMode ? substituteForDemo(patientIn, key) : patientIn;

  const name = resolveName(patient, p);
  const states = resolveStates(patient, p);
  const sensitivity = resolveSensitivity(patient);

  const deceased = states.find((s) => s.kind === "deceased");
  const deceasedOn = deceased?.kind === "deceased" ? deceased.date?.value : undefined;

  const identity: Identity = {
    key,
    name,
    identifiers: resolveIdentifiers(patient.identifier, p.identifierSystems, p.disclosure),
    states,
    sensitivity,
    photo: resolvePhoto(patient, p),
    swatch: identitySwatch(key, p.swatchCount),
    initials: identityInitials(name, p.locale),
  };

  const pronouns = resolvePronouns(patient);
  if (pronouns) identity.pronouns = pronouns;

  const birthDate = precise(patient.birthDate);
  if (birthDate) identity.birthDate = birthDate;

  const age = resolveAge(patient.birthDate, p.now, deceasedOn);
  if (age) identity.age = age;

  // `Patient.gender` is deliberately never read. It is administrative gender:
  // correspondence and registries, not dosing. The three fields below are the
  // ones with clinical or affirming meaning, and each renders with its own
  // label so a prescriber cannot mistake one for another.
  const spcu = codedFrom(findExt(patient.extension, EXT_SPCU), "value");
  if (spcu) identity.spcu = spcu;
  const gi = codedFrom(findExt(patient.extension, EXT_GENDER_IDENTITY), "value");
  if (gi) identity.genderIdentity = gi;
  const rsg = codedFrom(findExt(patient.extension, EXT_RECORDED_SEX_OR_GENDER), "value");
  if (rsg) identity.recordedSexOrGender = rsg;

  return identity;
}

/**
 * A bounded cache for the resolved value.
 *
 * The policy version is part of the key. Without it a disclosure-level change
 * would leave two thousand patients rendered under the previous policy — which,
 * given what disclosure level controls, is a privacy defect and not a
 * performance one.
 */
export class IdentityCache {
  private readonly max: number;
  private readonly map = new Map<string, Identity>();

  constructor(max = 2000) {
    this.max = Math.max(1, max);
  }

  get size(): number {
    return this.map.size;
  }

  resolve(patient: Patient, p: IdentityPolicy, options: ResolveOptions = {}): Identity {
    const key = `${identityKey(patient, options.key)}|${p.version}`;
    const hit = this.map.get(key);
    if (hit) {
      // Refresh recency: delete then set moves it to the end of the Map order.
      this.map.delete(key);
      this.map.set(key, hit);
      return hit;
    }
    const value = resolveIdentity(patient, p, options);
    this.map.set(key, value);
    if (this.map.size > this.max) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    return value;
  }

  clear(): void {
    this.map.clear();
  }
}

/**
 * What each disclosure level permits.
 *
 * The public rung is the one worth arguing about: a waiting-room display exists
 * so a named person can recognise themselves being called, and nothing beyond
 * that is anybody else's business. A full name plus a date of birth on a screen
 * a corridor can read is an identity handed to whoever is standing there.
 */
export function disclosureAllows(level: DisclosureLevel): DisclosureAllowance {
  switch (level) {
    case "public":
      return {
        name: "short",
        birthDate: false,
        age: false,
        clinicalSex: false,
        pronouns: false,
        identifiers: false,
      };
    case "reception":
      // Confirming an appointment, not reading a chart. The date of birth is
      // the identifier a receptionist actually verifies against; the clinical
      // sex parameter is a dosing fact and has no business here.
      return {
        name: "full",
        birthDate: true,
        age: false,
        clinicalSex: false,
        pronouns: true,
        identifiers: true,
      };
    case "clinical":
    case "full":
    default:
      return {
        name: "full",
        birthDate: true,
        age: true,
        clinicalSex: true,
        pronouns: true,
        identifiers: true,
      };
  }
}

/**
 * An initial and a family name. Mononyms and unnamed records pass through.
 *
 * The initial is a grapheme cluster, not a code point: `Array.from("रामेश")[0]`
 * is a bare consonant with its vowel sign left behind, which is a different
 * letter rather than an abbreviation of one. Same rule as `identityInitials`,
 * and it is shared rather than reimplemented for exactly that reason.
 */
export function shortName(name: ResolvedName): string {
  const first = name.given[0];
  const family = name.family;
  if (!family) return name.text;
  if (!first) return family;
  return `${graphemes(first)[0] ?? first}. ${family}`;
}
