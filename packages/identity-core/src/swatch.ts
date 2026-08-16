/**
 * Deterministic decorative swatch selection.
 *
 * Three properties matter, and each of them is a bug that only ever shows up as
 * a colour — which is to say, a bug nobody files:
 *
 *   1. **Keyed on the record, not the name.** A patient who marries or
 *      transitions must not change colour, and a banner showing the chosen name
 *      must not disagree with a worklist showing the legal one.
 *   2. **Identical on server and client.** Anything seeded produces a hue flip
 *      on hydration — a patient's avatar visibly changing colour half a second
 *      after paint, which is precisely the signal we are trying not to send.
 *   3. **Uniform.** 32-bit multiplication overflows a double and silently loses
 *      the low bits, which is the classic way a hash stops being uniform
 *      without anyone noticing. `Math.imul` is the fix.
 *
 * The output is decoration. It carries no clinical meaning, it is `aria-hidden`
 * wherever it renders, and collisions are expected rather than avoided — see
 * `disambiguate`.
 */

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

const encoder = new TextEncoder();

/**
 * FNV-1a over the UTF-8 bytes of `key`.
 *
 * Bytes rather than `charCodeAt` so a name in any script hashes identically
 * everywhere; UTF-16 code units would make an emoji or a surrogate pair hash
 * differently depending on how the runtime handed us the string.
 */
export function fnv1a(key: string): number {
  let h = FNV_OFFSET_BASIS;
  const bytes = encoder.encode(key);
  for (let i = 0; i < bytes.length; i++) {
    // Guarded by the loop bound; written without a non-null assertion because
    // `noUncheckedIndexedAccess` is on for a reason and this is published code.
    h ^= bytes[i] ?? 0;
    h = Math.imul(h, FNV_PRIME) >>> 0;
  }
  return h >>> 0;
}

/** The six swatches the token layer ships. See §2 of the identity brief. */
export const DEFAULT_SWATCH_COUNT = 6;

/**
 * 0-based swatch index for a stable identity key.
 *
 * `buckets` is clamped to at least 1: a caller passing 0 would otherwise get
 * `NaN`, which renders as no class at all and produces an untinted avatar that
 * looks like a loading state.
 */
export function identitySwatch(key: string, buckets: number = DEFAULT_SWATCH_COUNT): number {
  const n = Math.max(1, Math.floor(buckets));
  return fnv1a(key) % n;
}

/**
 * Probability that at least two of `n` identities share a swatch.
 *
 * Exported because it is the argument for the disambiguation pass, and an
 * argument that can be run is more persuasive than one that is asserted: with
 * six swatches a collision is more likely than not from four patients onward,
 * and certain at seven.
 */
export function collisionProbability(n: number, buckets: number = DEFAULT_SWATCH_COUNT): number {
  if (n < 2) return 0;
  if (n > buckets) return 1;
  let p = 1;
  for (let i = 0; i < n; i++) p *= (buckets - i) / buckets;
  return 1 - p;
}
