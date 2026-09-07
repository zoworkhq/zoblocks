/**
 * Identifier systems, grouping, masking, and check digits.
 *
 * Two things this file insists on:
 *
 *   - **An identifier travels with its issuer.** Pew found patient match rates
 *     fall to roughly 50% once records move between organisations, which makes
 *     "MRN 4471" a question rather than an answer. The system label is not
 *     decoration.
 *   - **A structurally invalid identifier is reported, not hidden.** If the NHS
 *     number in the banner fails its check digit, a matching failure has
 *     already happened somewhere upstream and the person reading the screen is
 *     the last one who can catch it.
 */

import type { Identifier } from "@zoblocks/fhir";
import type { DisclosureLevel, IdentifierSystemSpec, ResolvedIdentifier } from "./types.js";

// ---------------------------------------------------------------------------
// Check digits
// ---------------------------------------------------------------------------

/**
 * NHS number, modulus 11.
 *
 * Ten digits. The first nine are weighted 10..2, summed, and the remainder from
 * 11 gives the check digit; a remainder of 10 means the number is invalid
 * outright, which is a real state and not an error in this function.
 */
export function nhsCheckDigit(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 10) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * (10 - i);
  const remainder = sum % 11;
  const check = 11 - remainder;
  if (check === 10) return false;
  return (check === 11 ? 0 : check) === Number(d[9]);
}

// Verhoeff tables. Used by Aadhaar and therefore by ABHA numbers.
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/** The Verhoeff accumulator over a digit string. Shared by check and generate. */
function verhoeffSum(digits: string): number | null {
  let c = 0;
  const reversed = digits.split("").reverse();
  for (let i = 0; i < reversed.length; i++) {
    const row = VERHOEFF_D[c];
    const perm = VERHOEFF_P[i % 8];
    if (!row || !perm) return null;
    const next = row[perm[Number(reversed[i])] ?? 0];
    if (next === undefined) return null;
    c = next;
  }
  return c;
}

/**
 * Verhoeff validation over any length. Catches every single-digit error and
 * every adjacent transposition, which is why Aadhaar uses it — those are the
 * two ways a human mistypes a long number.
 */
export function verhoeffValid(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  if (d.length < 2) return false;
  return verhoeffSum(d) === 0;
}

/** The check digit that would make `base` valid. Used by fixtures and tests. */
export function verhoeffCheckDigit(base: string): number | null {
  const d = base.replace(/\D/g, "");
  const c = verhoeffSum(`${d}0`);
  return c === null ? null : (VERHOEFF_INV[c] ?? null);
}

/** Verhoeff, as used by Aadhaar and ABHA. Rejects anything but 12 digits. */
export function verhoeff(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 12) return false;
  return verhoeffValid(d);
}

/** Luhn, for the systems that use it. */
export function luhn(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  if (d.length < 2) return false;
  let sum = 0;
  let double = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

// ---------------------------------------------------------------------------
// System registry
// ---------------------------------------------------------------------------

/**
 * The systems shipped by default.
 *
 * Deliberately data rather than code. The moment a jurisdiction becomes an
 * `if` inside a render path, the component is jurisdiction-specific and the
 * next market is a fork.
 */
export const DEFAULT_IDENTIFIER_SYSTEMS: IdentifierSystemSpec[] = [
  {
    kind: "mrn",
    label: "MRN",
    systems: ["urn:oid:2.16.840.1.113883.4.1", "http://hospital.example.org/mrn"],
    maskVisible: 3,
    group: [3, 3, 3],
    weight: 100,
  },
  {
    kind: "nhs",
    label: "NHS number",
    systems: ["https://fhir.nhs.uk/Id/nhs-number", "http://fhir.nhs.uk/Id/nhs-number"],
    maskVisible: 3,
    group: [3, 3, 4],
    checkDigit: nhsCheckDigit,
    weight: 90,
  },
  {
    kind: "abha",
    label: "ABHA number",
    systems: ["https://healthid.ndhm.gov.in/", "https://abdm.gov.in/Id/abha-number"],
    maskVisible: 4,
    group: [2, 4, 4, 2],
    checkDigit: verhoeff,
    weight: 90,
  },
  {
    kind: "medicare",
    label: "Medicare",
    systems: ["http://hl7.org/fhir/sid/us-medicare"],
    maskVisible: 4,
    weight: 60,
  },
  {
    kind: "ssn",
    label: "SSN",
    systems: ["http://hl7.org/fhir/sid/us-ssn"],
    // Never shown in full on any surface. A banner has no business rendering a
    // social security number, and the disclosure ladder does not have a rung
    // that unmasks it.
    maskVisible: 0,
    weight: 10,
  },
];

/**
 * A room or bed number is not an identifier.
 *
 * NPSG.01.01.01 says so explicitly, and it says so because location is the
 * fastest thing to be wrong about on a ward. Values matching this are dropped
 * from the identifier list rather than rendered with a warning — a warning next
 * to a plausible-looking identifier still gets read as an identifier.
 */
const LOCATION_LIKE = /^(room|bed|bay|ward|cubicle|chair|trolley|slot)\b/i;

export function isLocationLike(value: string | undefined): boolean {
  return !!value && LOCATION_LIKE.test(value.trim());
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * Group digits for reading. `123456789` with `[3,3,3]` becomes `123 456 789`.
 *
 * Grouping changes nothing about the value — the raw form is kept alongside for
 * matching — and it measurably reduces transcription errors when someone reads
 * nine digits aloud.
 */
export function group(value: string, sizes?: number[]): string {
  if (!sizes || sizes.length === 0) return value;
  const total = sizes.reduce((a, b) => a + b, 0);
  if (value.replace(/\s/g, "").length !== total) return value;
  const compact = value.replace(/\s/g, "");
  const out: string[] = [];
  let i = 0;
  for (const size of sizes) {
    out.push(compact.slice(i, i + size));
    i += size;
  }
  return out.join(" ");
}

/**
 * Mask all but the trailing `visible` characters.
 *
 * Bullets rather than asterisks: an asterisk reads as a footnote marker and has
 * been mistaken for one on a printed banner.
 */
export function mask(value: string, visible: number): string {
  const compact = value.replace(/\s/g, "");
  if (visible <= 0) return "•".repeat(Math.min(compact.length, 9));
  if (compact.length <= visible) return compact;
  const tail = compact.slice(-visible);
  const head = "•".repeat(Math.max(0, compact.length - visible));
  return `${head}${tail}`;
}

/** How much of an identifier each disclosure level may show. */
function maskingFor(level: DisclosureLevel, spec: IdentifierSystemSpec): number | null {
  switch (level) {
    case "public":
      return 0; // Nothing. A waiting-room screen shows no identifier at all.
    case "reception":
      return spec.maskVisible ?? 3;
    case "clinical":
    case "full":
      // SSN stays masked at every level. There is no rung that unmasks it.
      return spec.maskVisible === 0 ? 0 : null;
    default:
      return null;
  }
}

export function resolveIdentifiers(
  identifiers: Identifier[] | undefined,
  systems: IdentifierSystemSpec[],
  disclosure: DisclosureLevel,
): ResolvedIdentifier[] {
  if (!identifiers?.length) return [];
  const byUri = new Map<string, IdentifierSystemSpec>();
  for (const spec of systems) for (const uri of spec.systems) byUri.set(uri, spec);

  const out: ResolvedIdentifier[] = [];
  for (const id of identifiers) {
    const raw = id.value?.trim();
    if (!raw) continue;
    // A location in the identifier slot is dropped, not rendered.
    if (isLocationLike(raw)) continue;
    // `old` identifiers are historical. Showing one beside a current one gives
    // a reader two answers to a question that has one.
    if (id.use === "old") continue;

    const spec =
      (id.system ? byUri.get(id.system) : undefined) ??
      // An unrecognised system is rendered as unrecognised rather than
      // silently relabelled "MRN" — the mapping problem is the finding.
      ({
        kind: "unknown",
        label: id.system ? "Identifier" : "Unlabelled identifier",
        systems: [],
        maskVisible: 3,
        weight: 0,
      } satisfies IdentifierSystemSpec);

    const visible = maskingFor(disclosure, spec);
    const masked = visible !== null;
    const shown = masked ? mask(raw, visible) : group(raw, spec.group);

    const resolved: ResolvedIdentifier = {
      kind: spec.kind,
      label: spec.label,
      text: shown,
      raw,
      masked,
    };
    if (id.system) resolved.system = id.system;
    const assigner = id.assigner?.display;
    if (assigner) resolved.assigner = assigner;
    if (spec.checkDigit) resolved.checkDigitValid = spec.checkDigit(raw);

    out.push(resolved);
  }

  const weightOf = (r: ResolvedIdentifier): number =>
    systems.find((s) => s.kind === r.kind)?.weight ?? 0;
  return out.sort((a, b) => weightOf(b) - weightOf(a));
}
