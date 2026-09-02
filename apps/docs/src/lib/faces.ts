/**
 * One cohort of faces, shared by every demo on this site.
 *
 * The data grid already showed portraits and everything else showed a
 * monogram, so the same product appeared to have two ideas about what a
 * patient looks like — and the surface with the photographs read as the
 * mock-up. This is the other half of that fix: one set of faces, assigned by
 * name, so a given name is the same person wherever it appears.
 *
 * Assignment is a hash of the name rather than a position in a list. A list
 * index moves the moment a demo gains a row, which would silently reshuffle
 * every face on the site; a hash means the only thing that changes a face is
 * changing the name it belongs to.
 *
 * The photographs are generated, of nobody, and are served from
 * `/fixtures/patients/` — this site's own origin. That is the rule
 * `packages/identity` states for a patient photograph and it holds for a demo
 * too: a face does not travel through a third-party image CDN to reach a
 * screen that claims to be clinical software.
 */

import { CASELOAD, CASELOAD_TAIL } from "@/registry/oxygen/data-grid/data-grid.fixtures";

/** Every distinct portrait the caseload fixtures reference, in a stable order. */
const FACES: readonly string[] = [
  ...new Set([...CASELOAD, ...CASELOAD_TAIL].map((row) => row.photo)),
];

/**
 * Surname and first initial, however the name was written.
 *
 * The site writes the same patient three ways — "Okonkwo, Rachel" in the
 * record header, "R. Okonkwo" in the dashboard and the note, "Adeyemi, R." in
 * the worklist. Hashing the raw string would give one person three faces on
 * three pages, which is the exact defect this module exists to remove. The
 * surname is taken as the longest word rather than the first or the last,
 * because those disagree between the two orderings.
 */
function key(name: string): string {
  const words = name
    .replace(/[.,]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toUpperCase());

  if (words.length === 0) return "";

  let surname = words[0]!;
  for (const word of words) if (word.length > surname.length) surname = word;

  const initial = words.find((word) => word !== surname)?.charAt(0) ?? "";
  return `${surname}:${initial}`;
}

/** FNV-1a, 32-bit — the same hash the chart stack uses to pick an accent. */
function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * The face for a name.
 *
 * Deterministic, so the same name is the same person on the home page, in the
 * catalogue card, and in the state browser — and so a screenshot taken today
 * still matches the site tomorrow.
 */
export function faceFor(name: string): string {
  return FACES[hash(key(name)) % FACES.length]!;
}

/**
 * Faces for a list, with no two people sharing one.
 *
 * `faceFor` alone is not enough for a list. Twenty-eight portraits and six
 * names collide about half the time — the first caseload table built this way
 * gave T. Almeida and S. Ferreira the same face two rows apart, which a reader
 * notices immediately and reads as a bug in the data rather than in the demo.
 *
 * So: start each name at the face its own hash chose, and walk forward until
 * an unclaimed one. Names that do not collide keep the face they have
 * everywhere else on the site; only the loser of a collision moves, and only
 * on the surface where the collision happens. Assignment is by position in the
 * list rather than by arrival, so it does not depend on render order.
 */
export function facesFor(names: readonly string[]): (name: string) => string {
  const taken = new Set<string>();
  const chosen = new Map<string, string>();

  for (const name of names) {
    const id = key(name);
    if (chosen.has(id)) continue;

    const start = hash(id) % FACES.length;
    let face = FACES[start]!;
    for (let step = 1; taken.has(face) && step < FACES.length; step += 1) {
      face = FACES[(start + step) % FACES.length]!;
    }
    taken.add(face);
    chosen.set(id, face);
  }

  return (name) => chosen.get(key(name)) ?? faceFor(name);
}
