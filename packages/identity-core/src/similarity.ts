/**
 * Name similarity, for the question "would a reader in a hurry tell these two
 * apart?"
 *
 * That is not the same question as "are these the same person", and this file
 * deliberately does not answer that one. Record matching is a different problem
 * with a different risk profile, it belongs to a master patient index, and a
 * component library that started guessing at it would be making a claim it
 * cannot support.
 *
 * Two algorithms, because they fail differently. Jaro–Winkler catches
 * transpositions and shared prefixes — *Okonkwo* against *Okonjo*. Double
 * Metaphone catches names that look different and sound identical — *Smyth*
 * against *Smith*. Either alone leaves a class of collision on the ward.
 */

import { fold } from "./text.js";

// ---------------------------------------------------------------------------
// Jaro–Winkler
// ---------------------------------------------------------------------------

/**
 * Scratch buffers, reused across calls.
 *
 * `disambiguate` calls this O(n²) times — roughly 45,000 times for a 300-row
 * worklist — and two fresh boolean arrays per call is 90,000 allocations that
 * the collector then has to walk. Module-level scratch is safe here because the
 * function is synchronous, single-pass, and never re-enters itself.
 */
let scratchA = new Uint8Array(64);
let scratchB = new Uint8Array(64);

function scratch(size: number, which: 0 | 1): Uint8Array {
  if (which === 0) {
    if (scratchA.length < size) scratchA = new Uint8Array(size * 2);
    scratchA.fill(0, 0, size);
    return scratchA;
  }
  if (scratchB.length < size) scratchB = new Uint8Array(size * 2);
  scratchB.fill(0, 0, size);
  return scratchB;
}

export function jaro(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const window = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aMatched = scratch(a.length, 0);
  const bMatched = scratch(b.length, 1);

  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - window);
    const end = Math.min(i + window + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatched[j] === 1 || a[i] !== b[j]) continue;
      aMatched[i] = 1;
      bMatched[j] = 1;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (aMatched[i] !== 1) continue;
    while (bMatched[k] !== 1) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  const m = matches;
  return (m / a.length + m / b.length + (m - transpositions / 2) / m) / 3;
}

/**
 * Jaro with the Winkler prefix bonus.
 *
 * The bonus is capped at four characters, which is the standard and also the
 * right call here: shared prefixes are exactly what makes two surnames hard to
 * separate at a glance on a worklist.
 */
export function jaroWinkler(a: string, b: string, scaling = 0.1): number {
  const j = jaro(a, b);
  if (j < 0.7) return j;
  let prefix = 0;
  const max = Math.min(4, a.length, b.length);
  while (prefix < max && a[prefix] === b[prefix]) prefix++;
  return j + prefix * scaling * (1 - j);
}

// ---------------------------------------------------------------------------
// Double Metaphone (primary code only)
// ---------------------------------------------------------------------------

const VOWELS = new Set(["A", "E", "I", "O", "U", "Y"]);

/**
 * A compact Double Metaphone producing the primary code.
 *
 * This is not the full Philips implementation — it omits the alternate code and
 * several of the Slavic and Germanic special cases. It is kept small on purpose:
 * the whole engine has a 4 kB budget, and the marginal names the full table
 * catches are ones where Jaro–Winkler already fires. Anything it misses fails
 * *safe*, in the sense that a missed similarity produces a normal row rather
 * than a wrong one.
 */
export function metaphone(input: string): string {
  const s = fold(input)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  if (!s) return "";

  let out = "";
  let i = 0;

  // Silent leading clusters.
  if (/^(GN|KN|PN|WR|PS)/.test(s)) i = 1;
  if (s.startsWith("X")) {
    out += "S";
    i = 1;
  }

  while (i < s.length && out.length < 6) {
    const c = s[i] ?? "";
    const next = s[i + 1] ?? "";
    const prev = s[i - 1] ?? "";

    if (c === prev && c !== "C") {
      i++;
      continue;
    }

    switch (c) {
      // "Y" is deliberately not here. It is a semi-vowel: pronounced when it
      // leads or when a vowel follows, silent otherwise, and it is handled with
      // "W" below. Listing it in both places made the second branch dead code.
      case "A":
      case "E":
      case "I":
      case "O":
      case "U":
        if (i === 0) out += "A";
        i++;
        break;
      case "B":
        out += "P";
        i += next === "B" ? 2 : 1;
        break;
      case "C":
        if (next === "H") {
          out += "X";
          i += 2;
        } else if (next === "I" && (s[i + 2] ?? "") === "A") {
          out += "X";
          i += 3;
        } else if (next === "E" || next === "I" || next === "Y") {
          out += "S";
          i += 2;
        } else {
          out += "K";
          i++;
        }
        break;
      case "D":
        if (
          next === "G" &&
          VOWELS.has(s[i + 2] ?? "") &&
          (s[i + 2] === "E" || s[i + 2] === "I" || s[i + 2] === "Y")
        ) {
          out += "J";
          i += 3;
        } else {
          out += "T";
          i += next === "T" ? 2 : 1;
        }
        break;
      case "G":
        if (next === "H") {
          out += "K";
          i += 2;
        } else if (next === "N") {
          i += 2;
        } else if (next === "E" || next === "I" || next === "Y") {
          out += "J";
          i += 2;
        } else {
          out += "K";
          i++;
        }
        break;
      case "H":
        // Only pronounced between a vowel and a vowel, or word-initial.
        if ((i === 0 || VOWELS.has(prev)) && VOWELS.has(next)) out += "H";
        i++;
        break;
      case "K":
        if (prev !== "C") out += "K";
        i++;
        break;
      case "P":
        out += next === "H" ? "F" : "P";
        i += next === "H" ? 2 : 1;
        break;
      case "Q":
        out += "K";
        i++;
        break;
      case "S": {
        /**
         * A doubled S still palatalises before "IO" or "IA".
         *
         * The generic doubled-consonant skip above runs first, so the second S
         * of "Mission" was consumed before this branch could look past it —
         * which meant "Mission" and "Mishon" did not collapse, and the whole
         * point of the sound-alike pass is that they should.
         */
        const doubled = next === "S";
        const after = doubled ? i + 2 : i + 1;
        const a = s[after] ?? "";
        const b = s[after + 1] ?? "";
        if (a === "H") {
          out += "X";
          i = after + 1;
        } else if (a === "I" && (b === "O" || b === "A")) {
          out += "X";
          i = after + 2;
        } else {
          out += "S";
          i = after;
        }
        break;
      }
      case "T":
        if (next === "H") {
          out += "0";
          i += 2;
        } else if (next === "I" && ((s[i + 2] ?? "") === "O" || (s[i + 2] ?? "") === "A")) {
          out += "X";
          i += 3;
        } else {
          out += "T";
          i++;
        }
        break;
      case "V":
        out += "F";
        i++;
        break;
      case "W":
      case "Y":
        if (i === 0 || VOWELS.has(next)) out += c;
        i++;
        break;
      case "X":
        out += "KS";
        i++;
        break;
      case "Z":
        out += "S";
        i++;
        break;
      case "F":
      case "J":
      case "L":
      case "M":
      case "N":
      case "R":
        out += c;
        i++;
        break;
      default:
        i++;
    }
  }
  return out.slice(0, 6);
}

// ---------------------------------------------------------------------------
// The question the components ask
// ---------------------------------------------------------------------------

/**
 * Threshold for "close enough to be confused".
 *
 * 0.92 rather than 0.90. At 0.90, "Ahmed" against "Ahmad" and "Singh" against
 * "Sinha" behave — and so does half the surname distribution on a South Asian
 * ward, which turns
 * every row into an escalated row. A list where everything is flagged is a list
 * where nothing is read, which is `CONTENT.md` §3's interruption budget applied
 * to density.
 */
export const SIMILARITY_THRESHOLD = 0.92;

/**
 * A sound length prefilter.
 *
 * Jaro is bounded above by `(2 + min/max) / 3`, and Jaro–Winkler by
 * `0.6 j + 0.4`. Reaching 0.92 therefore needs `min/max >= 0.6` — so anything
 * shorter than that cannot possibly match and does not need the O(mn) inner
 * loop. This is an exact bound, not a heuristic: no pair that would have
 * matched is skipped.
 */
function couldMatch(a: string, b: string, threshold: number): boolean {
  const min = Math.min(a.length, b.length);
  const max = Math.max(a.length, b.length);
  if (max === 0) return false;
  const requiredJaro = Math.max(0, (threshold - 0.4) / 0.6);
  return (2 + min / max) / 3 >= requiredJaro;
}

/**
 * `looksAlike` for inputs that are already folded.
 *
 * The pairwise loop in `disambiguate` folds once per identity and then compares
 * O(n^2) times; re-folding inside the comparison undoes that entirely. This is
 * the variant that loop calls.
 */
export function looksAlikeFolded(
  na: string,
  nb: string,
  threshold = SIMILARITY_THRESHOLD,
): boolean {
  if (!na || !nb) return false;
  if (na === nb) return true;
  return couldMatch(na, nb, threshold) && jaroWinkler(na, nb) >= threshold;
}

export function looksAlike(a: string, b: string, threshold = SIMILARITY_THRESHOLD): boolean {
  const na = fold(a);
  const nb = fold(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (couldMatch(na, nb, threshold) && jaroWinkler(na, nb) >= threshold) return true;
  const ma = metaphone(na);
  const mb = metaphone(nb);
  return ma.length > 1 && ma === mb;
}

/** Why two names read as similar. Surfaced so the escalation can explain itself. */
export function similarityReason(
  a: string,
  b: string,
): "identical-folded" | "similar-spelling" | "sounds-alike" | null {
  const na = fold(a);
  const nb = fold(b);
  if (!na || !nb) return null;
  if (na === nb) return "identical-folded";
  if (jaroWinkler(na, nb) >= SIMILARITY_THRESHOLD) return "similar-spelling";
  const ma = metaphone(na);
  return ma.length > 1 && ma === metaphone(nb) ? "sounds-alike" : null;
}
