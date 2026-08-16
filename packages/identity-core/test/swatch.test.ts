import { describe, expect, it } from "vitest";
import {
  DEFAULT_SWATCH_COUNT,
  collisionProbability,
  fnv1a,
  identitySwatch,
} from "../src/swatch.js";

describe("fnv1a", () => {
  it("matches the published FNV-1a 32-bit vectors", () => {
    // From the reference implementation's test vectors.
    expect(fnv1a("")).toBe(0x811c9dc5);
    expect(fnv1a("a")).toBe(0xe40c292c);
    expect(fnv1a("foobar")).toBe(0xbf9cf968);
  });

  it("stays inside 32 unsigned bits for long input", () => {
    const h = fnv1a("x".repeat(10_000));
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });

  it("hashes bytes, not UTF-16 code units", () => {
    // A surrogate pair must hash as its four UTF-8 bytes. If this were
    // charCodeAt-based the two halves would be hashed separately and the value
    // would differ between runtimes that normalise differently.
    expect(fnv1a("𝔄")).toBe(fnv1a("\u{1D504}"));
    expect(fnv1a("陳")).not.toBe(fnv1a("美"));
  });

  it("is deterministic across calls", () => {
    const a = fnv1a("pat-4471");
    for (let i = 0; i < 100; i++) expect(fnv1a("pat-4471")).toBe(a);
  });
});

describe("identitySwatch", () => {
  it("returns an index inside the bucket range", () => {
    for (let i = 0; i < 500; i++) {
      const idx = identitySwatch(`pat-${i}`, DEFAULT_SWATCH_COUNT);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(DEFAULT_SWATCH_COUNT);
    }
  });

  it("clamps a zero or negative bucket count rather than returning NaN", () => {
    // NaN would render as no class at all, which looks like a loading state.
    expect(identitySwatch("pat-1", 0)).toBe(0);
    expect(identitySwatch("pat-1", -3)).toBe(0);
  });

  it("distributes acceptably over six buckets", () => {
    const counts = new Array<number>(6).fill(0);
    for (let i = 0; i < 6000; i++) {
      const idx = identitySwatch(`pat-${i}`);
      counts[idx] = (counts[idx] ?? 0) + 1;
    }
    // A uniform hash puts 1000 in each. Anything outside ±20% would mean the
    // 32-bit multiply had lost its low bits, which is the classic silent
    // failure this test exists to catch.
    for (const c of counts) {
      expect(c).toBeGreaterThan(800);
      expect(c).toBeLessThan(1200);
    }
  });

  it("gives different keys different swatches often enough to be useful", () => {
    const seen = new Set<number>();
    for (const k of ["pat-4471", "pat-9038", "pat-2210", "pat-6650", "pat-1180", "pat-7734"]) {
      seen.add(identitySwatch(k));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("collisionProbability", () => {
  it("is zero below two identities", () => {
    expect(collisionProbability(0)).toBe(0);
    expect(collisionProbability(1)).toBe(0);
  });

  it("is certain once identities exceed buckets — pigeonhole", () => {
    expect(collisionProbability(7, 6)).toBe(1);
    expect(collisionProbability(9, 8)).toBe(1);
  });

  it("crosses one half at four identities with six swatches", () => {
    // The number the brief quotes. If this moves, §2 is wrong.
    expect(collisionProbability(3, 6)).toBeCloseTo(0.4444, 3);
    expect(collisionProbability(4, 6)).toBeCloseTo(0.7222, 3);
  });

  it("is lower with eight swatches, but not by much", () => {
    const six = collisionProbability(4, 6);
    const eight = collisionProbability(4, 8);
    expect(eight).toBeLessThan(six);
    // The recommendation in §15 rests on this gap being small.
    expect(six - eight).toBeLessThan(0.2);
  });
});
