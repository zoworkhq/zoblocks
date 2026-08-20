/**
 * The colour maths, tested against values computed by hand from the WCAG 2.x
 * definitions rather than against our own output.
 *
 * This module had no direct test until now, which is the finding that matters:
 * it is the arithmetic every clinical colour decision in the library rests on,
 * and the only evidence it was right came from the palette happening to pass.
 */

import { describe, expect, it } from "vitest";
import {
  contrastBetween,
  contrastRatio,
  hue,
  hueDistance,
  luminance,
  parseHex,
} from "../src/validate/color";

describe("parseHex", () => {
  it("reads six digits", () => {
    expect(parseHex("#b91c1c")).toEqual({ r: 0xb9, g: 0x1c, b: 0x1c });
  });

  it("reads six digits without the hash", () => {
    expect(parseHex("b91c1c")).toEqual({ r: 0xb9, g: 0x1c, b: 0x1c });
  });

  it("expands three-digit shorthand", () => {
    expect(parseHex("#abc")).toEqual({ r: 0xaa, g: 0xbb, b: 0xcc });
  });

  it("is case-insensitive", () => {
    expect(parseHex("#B91C1C")).toEqual(parseHex("#b91c1c"));
  });

  it("tolerates surrounding whitespace", () => {
    expect(parseHex("  #ffffff  ")).toEqual({ r: 255, g: 255, b: 255 });
  });

  /**
   * The one that matters. Eight digits carry alpha, and a ratio against an
   * unknown backdrop is not a number we can honestly compute — so it must be
   * refused rather than guessed at. This is the shape of the bug that once
   * shipped a fully transparent overlay surface: `#1d263000` parsed as a
   * colour would have looked like a very dark grey.
   */
  it("refuses eight digits rather than dropping the alpha channel", () => {
    expect(parseHex("#1d263000")).toBeUndefined();
    expect(parseHex("#ffffffff")).toBeUndefined();
  });

  it("refuses anything that is not a hex colour", () => {
    for (const bad of ["", "#", "#12", "#12345", "#1234567", "rgb(0,0,0)", "red", "var(--x)"]) {
      expect(parseHex(bad), bad).toBeUndefined();
    }
  });
});

describe("luminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(luminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(luminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 10);
  });

  it("weights green most and blue least, per WCAG", () => {
    const g = luminance({ r: 0, g: 255, b: 0 });
    const r = luminance({ r: 255, g: 0, b: 0 });
    const b = luminance({ r: 0, g: 0, b: 255 });
    expect(g).toBeGreaterThan(r);
    expect(r).toBeGreaterThan(b);
    expect(g).toBeCloseTo(0.7152, 4);
    expect(r).toBeCloseTo(0.2126, 4);
    expect(b).toBeCloseTo(0.0722, 4);
  });

  it("uses the linear segment below the 0.04045 threshold", () => {
    // 10/255 = 0.0392 — under the knee, so the linear branch applies.
    const c = 10 / 255 / 12.92;
    expect(luminance({ r: 10, g: 10, b: 10 })).toBeCloseTo(c, 10);
  });
});

describe("contrastRatio", () => {
  it("is 21:1 for black on white", () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 6);
  });

  it("is 1:1 for a colour against itself", () => {
    expect(contrastRatio({ r: 87, g: 12, b: 200 }, { r: 87, g: 12, b: 200 })).toBeCloseTo(1, 10);
  });

  it("is symmetric — argument order carries no meaning", () => {
    const a = { r: 0xb9, g: 0x1c, b: 0x1c };
    const b = { r: 0xfd, g: 0xea, b: 0xea };
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
  });

  it("agrees with the published figure for the critical status pair", () => {
    // status.critical #b91c1c on status.critical-bg #fef2f2, published as 5.91.
    const ratio = contrastBetween("#b91c1c", "#fef2f2");
    expect(ratio).toBeDefined();
    expect(Math.round((ratio as number) * 100) / 100).toBe(5.91);
  });
});

describe("contrastBetween", () => {
  it("returns undefined when either side is not a computable colour", () => {
    expect(contrastBetween("#ffffff", "#12345678")).toBeUndefined();
    expect(contrastBetween("transparent", "#ffffff")).toBeUndefined();
  });
});

describe("hue", () => {
  it("places the primaries where they belong", () => {
    expect(hue({ r: 255, g: 0, b: 0 })).toBeCloseTo(0, 6);
    expect(hue({ r: 0, g: 255, b: 0 })).toBeCloseTo(120, 6);
    expect(hue({ r: 0, g: 0, b: 255 })).toBeCloseTo(240, 6);
  });

  it("returns 0 for greys, which have no hue", () => {
    expect(hue({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(hue({ r: 128, g: 128, b: 128 })).toBe(0);
    expect(hue({ r: 255, g: 255, b: 255 })).toBe(0);
  });

  it("never returns a negative angle", () => {
    // Magenta sits in the branch that can go negative before normalisation.
    expect(hue({ r: 255, g: 0, b: 128 })).toBeGreaterThanOrEqual(0);
    expect(hue({ r: 255, g: 0, b: 128 })).toBeLessThan(360);
  });
});

describe("hueDistance", () => {
  it("is the shortest way round the circle", () => {
    expect(hueDistance(10, 350)).toBe(20);
    expect(hueDistance(350, 10)).toBe(20);
  });

  it("never exceeds 180", () => {
    for (const [a, b] of [
      [0, 180],
      [0, 181],
      [0, 359],
      [90, 270],
    ]) {
      expect(hueDistance(a as number, b as number)).toBeLessThanOrEqual(180);
    }
  });

  it("separates the two abnormal directions in the shipped palette", () => {
    // status.high #b45309 (amber) against status.low #2563eb (blue). The 60°
    // floor is what keeps "above range" and "below range" distinguishable
    // without colour.
    const high = hue(parseHex("#b45309")!);
    const low = hue(parseHex("#2563eb")!);
    expect(hueDistance(high, low)).toBeGreaterThan(60);
  });
});
