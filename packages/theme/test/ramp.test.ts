/**
 * One colour in, eleven steps out.
 *
 * The console asks for a brand colour, not a ramp, because most of what the
 * contrast gate catches is a hand-picked step rather than the chosen colour.
 */

import { describe, expect, it } from "vitest";
import { contrastBetween, parseHex } from "@oxygenui-design/tokens/validate";
import {
  ANCHOR_STEP,
  RAMP_STEPS,
  generateRamp,
  hslToHex,
  nearestPassing,
  rgbToHsl,
} from "../src/index";

describe("generateRamp", () => {
  it("produces every step", () => {
    const ramp = generateRamp("#1d63c9");
    expect(ramp).toBeDefined();
    expect(
      Object.keys(ramp!)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual([...RAMP_STEPS]);
  });

  /**
   * A customer who typed their brand hex must find that exact string back. A
   * round trip through HSL loses a digit or two, and "we adjusted your brand
   * colour" is not a conversation worth having over rounding.
   */
  it("returns the chosen colour unchanged at the anchor step", () => {
    expect(generateRamp("#1d63c9")![ANCHOR_STEP]).toBe("#1d63c9");
    expect(generateRamp("#B91C1C")![ANCHOR_STEP]).toBe("#b91c1c");
  });

  it("gets darker as the step number rises", () => {
    const ramp = generateRamp("#1d63c9")!;
    const lightness = RAMP_STEPS.map((s) => rgbToHsl(parseHex(ramp[s])!).l);
    for (let i = 1; i < lightness.length; i++) {
      expect(lightness[i]!, `step ${RAMP_STEPS[i]}`).toBeLessThan(lightness[i - 1]!);
    }
  });

  it("holds the hue, so every step is recognisably the same colour", () => {
    const ramp = generateRamp("#1d63c9")!;
    const seedHue = rgbToHsl(parseHex("#1d63c9")!).h;
    for (const step of RAMP_STEPS) {
      const hue = rgbToHsl(parseHex(ramp[step])!).h;
      // 50 and 950 are near-white and near-black, where hue is unstable by
      // definition — a colour with almost no chroma has almost no hue.
      if (step === 50 || step === 950) continue;
      expect(Math.abs(hue - seedHue), `step ${step}`).toBeLessThan(6);
    }
  });

  it("handles a grey seed, which has no hue to hold", () => {
    const ramp = generateRamp("#808080");
    expect(ramp).toBeDefined();
    expect(ramp![ANCHOR_STEP]).toBe("#808080");
  });

  it("refuses a value that is not a colour", () => {
    expect(generateRamp("not-a-colour")).toBeUndefined();
    expect(generateRamp("#12345678")).toBeUndefined();
  });
});

describe("hslToHex", () => {
  it("round-trips the primaries", () => {
    expect(hslToHex({ h: 0, s: 1, l: 0.5 })).toBe("#ff0000");
    expect(hslToHex({ h: 120, s: 1, l: 0.5 })).toBe("#00ff00");
    expect(hslToHex({ h: 240, s: 1, l: 0.5 })).toBe("#0000ff");
  });

  it("covers every hue sextant", () => {
    for (const h of [30, 90, 150, 210, 270, 330]) {
      expect(hslToHex({ h, s: 1, l: 0.5 })).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("produces black and white at the extremes", () => {
    expect(hslToHex({ h: 0, s: 0, l: 0 })).toBe("#000000");
    expect(hslToHex({ h: 0, s: 0, l: 1 })).toBe("#ffffff");
  });
});

describe("nearestPassing", () => {
  /**
   * The console's "apply nearest passing". Customers reliably accept a shade
   * they did not choose; they do not reliably accept a rejection, and a
   * rejection with no route out is how a gate becomes something a team works
   * around rather than with.
   */
  it("returns the colour unchanged when it already passes", () => {
    expect(nearestPassing("#1a53a8", "#ffffff", 4.5)).toBe("#1a53a8");
  });

  it("darkens a pale colour until it clears the floor on white", () => {
    const fixed = nearestPassing("#8fb8f0", "#ffffff", 4.5);
    expect(fixed).toBeDefined();
    expect(contrastBetween(fixed!, "#ffffff")!).toBeGreaterThanOrEqual(4.5);
  });

  it("lightens rather than darkens when the ground is dark", () => {
    const fixed = nearestPassing("#334155", "#0f172a", 4.5);
    expect(fixed).toBeDefined();
    expect(contrastBetween(fixed!, "#0f172a")!).toBeGreaterThanOrEqual(4.5);
    expect(rgbToHsl(parseHex(fixed!)!).l).toBeGreaterThan(rgbToHsl(parseHex("#334155")!).l);
  });

  it("keeps the hue, so the result is still their colour", () => {
    const fixed = nearestPassing("#8fb8f0", "#ffffff", 4.5)!;
    const before = rgbToHsl(parseHex("#8fb8f0")!).h;
    const after = rgbToHsl(parseHex(fixed)!).h;
    expect(Math.abs(after - before)).toBeLessThan(3);
  });

  it("moves as little as it can", () => {
    const at45 = nearestPassing("#8fb8f0", "#ffffff", 4.5)!;
    const at7 = nearestPassing("#8fb8f0", "#ffffff", 7)!;
    // A stricter floor must not resolve to a *lighter* colour.
    expect(rgbToHsl(parseHex(at7)!).l).toBeLessThanOrEqual(rgbToHsl(parseHex(at45)!).l);
  });

  it("reaches the AAA floor too", () => {
    const fixed = nearestPassing("#8fb8f0", "#ffffff", 7)!;
    expect(contrastBetween(fixed, "#ffffff")!).toBeGreaterThanOrEqual(7);
  });

  it("returns undefined for an input it cannot parse", () => {
    expect(nearestPassing("nope", "#ffffff", 4.5)).toBeUndefined();
    expect(nearestPassing("#ffffff", "nope", 4.5)).toBeUndefined();
  });

  it("returns undefined when no shade of that hue can reach the floor", () => {
    // Nothing is 21:1 against mid-grey.
    expect(nearestPassing("#808080", "#808080", 21)).toBeUndefined();
  });
});
