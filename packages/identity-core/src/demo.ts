/**
 * Demo mode — synthetic identities, deterministically substituted.
 *
 * The problem this solves is mundane and universal: somebody needs a screenshot
 * for a conference talk, a sales demo runs against a staging database seeded
 * from production, or a training environment was refreshed from live. In every
 * one of those cases the honest options today are "blur it in Photoshop" or
 * "hope".
 *
 * Substitution is keyed off the real identity key, so the *shape* of the data
 * survives — the same record is the same fake person on every screen, two
 * patients who collided still collide, and a name that was long is still long.
 * Nothing here is a de-identification guarantee: it replaces what the identity
 * components render, not what the rest of the application holds.
 */

import type { Patient } from "@oxygenui-design/fhir";
import { fnv1a } from "./swatch.js";

const GIVEN = [
  "Amara",
  "Devraj",
  "Halima",
  "Kofi",
  "Sofía",
  "Mei Lin",
  "Rasmus",
  "Nadia",
  "Tobias",
  "Priya",
  "Oluwaseun",
  "Ingrid",
  "Yusuf",
  "Beatriz",
  "Anh",
  "Lars",
];
const MIDDLE = [
  "Chinelo",
  "Anand",
  "Marie",
  "Kwabena",
  "Isabel",
  "Wei",
  "Erik",
  "Farah",
  "",
  "",
  "",
  "",
];
const FAMILY = [
  "Okonkwo",
  "Iyer",
  "Yusuf",
  "Mensah",
  "Ramírez Cruz",
  "Chen",
  "Lindqvist",
  "Haddad",
  "Berg",
  "Kulkarni",
  "Adeyemi",
  "Novak",
  "Ferreira",
  "Nguyen",
  "van der Meer",
  "Tashkandi",
];

function at<T>(list: readonly T[], seed: number, salt: number): T {
  const idx = (seed >>> salt) % list.length;
  return list[idx] as T;
}

/**
 * Replace every identifying field on a `Patient` with a synthetic one.
 *
 * Structure is preserved on purpose: a record with three identifiers gets three
 * identifiers, a record with no family name keeps no family name, and the
 * security labels and state flags are passed through untouched because those
 * are what the demo is usually trying to show.
 */
export function substituteForDemo(patient: Patient, key: string): Patient {
  const seed = fnv1a(`demo:${key}`);

  const given = at(GIVEN, seed, 0);
  const middle = at(MIDDLE, seed, 5);
  const family = at(FAMILY, seed, 11);

  // Keep the mononym shape if the record had one.
  const hadFamily = patient.name?.some((n) => !!n.family?.trim()) ?? true;
  const givenParts = middle ? [given, middle] : [given];

  const birth = patient.birthDate ? shiftBirthDate(patient.birthDate, (seed % 61) - 30) : undefined;

  const out: Patient = {
    ...patient,
    name: (patient.name ?? [{}]).map((n) => ({
      ...n,
      text: undefined,
      given: givenParts,
      family: hadFamily ? family : undefined,
    })),
    identifier: (patient.identifier ?? []).map((id, i) => ({
      ...id,
      value: id.value ? syntheticDigits(fnv1a(`${key}:${i}`), id.value.length) : id.value,
    })),
    // A synthetic person does not get a real face, and a demo is exactly where
    // a real face would end up in a slide deck.
    photo: undefined,
  };
  if (birth) out.birthDate = birth;
  return out;
}

function shiftBirthDate(value: string, days: number): string {
  const t = Date.parse(value.length <= 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(t)) return value;
  const shifted = new Date(t + days * 86_400_000);
  // Preserve the recorded precision: a year-only date stays year-only.
  if (value.length === 4) return String(shifted.getUTCFullYear());
  if (value.length === 7) return shifted.toISOString().slice(0, 7);
  return shifted.toISOString().slice(0, 10);
}

function syntheticDigits(seed: number, length: number): string {
  let out = "";
  let h = seed;
  while (out.length < length) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    out += String(h % 10);
  }
  return out.slice(0, length);
}
