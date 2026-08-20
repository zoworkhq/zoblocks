/**
 * The simulation, held to the properties that make it useful rather than to a
 * table of expected pixels.
 *
 * A colour-by-colour fixture would lock in whichever constants happened to be
 * in the file when it was written, which is not the same as being right. What
 * matters is that the transform behaves the way dichromacy behaves — the axis a
 * cone cannot see collapses, and everything else survives.
 */

import { describe, expect, it } from "vitest";
import { contrastBetween, hue, hueDistance, parseHex } from "@oxygenui-design/tokens/validate";
import { VISION_KINDS, simulateAll, simulateVision } from "../src/vision";

/** `hueDistance` takes angles, not colours — this is the missing hop. */
const between = (a: string, b: string) => hueDistance(hue(parseHex(a)!), hue(parseHex(b)!));

describe("simulateVision", () => {
  it("returns a hex colour for every kind", () => {
    for (const kind of VISION_KINDS) {
      expect(simulateVision("#1d63c9", kind)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("refuses anything that is not a colour, rather than guessing", () => {
    expect(simulateVision("not a colour", "deuteranopia")).toBeUndefined();
    expect(simulateVision("#12345", "deuteranopia")).toBeUndefined();
    // Eight digits carry alpha, which this model has no opinion about.
    expect(simulateVision("#1d63c9ff", "deuteranopia")).toBeUndefined();
  });

  it("accepts the three-digit form", () => {
    expect(simulateVision("#abc", "protanopia")).toMatch(/^#[0-9a-f]{6}$/);
  });

  /** Neutrals have no chroma to lose, so every model leaves them alone. */
  it("leaves greys where they are", () => {
    for (const kind of VISION_KINDS) {
      expect(simulateVision("#808080", kind)).toBe("#808080");
      expect(simulateVision("#ffffff", kind)).toBe("#ffffff");
      expect(simulateVision("#000000", kind)).toBe("#000000");
    }
  });

  /**
   * The defining property: red and green become the same colour.
   *
   * This is what the whole 60°-hue-separation rule is defending against, so if
   * this assertion ever stops holding the simulation has stopped simulating.
   */
  it("collapses red and green under protanopia and deuteranopia", () => {
    for (const kind of ["protanopia", "deuteranopia"] as const) {
      const red = simulateVision("#d92626", kind)!;
      const green = simulateVision("#26d926", kind)!;
      // Not identical — they differ in lightness — but the hue axis is gone.
      expect(between(red, green)).toBeLessThan(30);
    }
  });

  it("keeps blue and yellow apart under protanopia, which does not touch that axis", () => {
    const blue = simulateVision("#1d63c9", "protanopia")!;
    const yellow = simulateVision("#c9a01d", "protanopia")!;
    expect(between(blue, yellow)).toBeGreaterThan(45);
  });

  it("collapses blue and green under tritanopia", () => {
    const blue = simulateVision("#1d63c9", "tritanopia")!;
    const green = simulateVision("#1dc963", "tritanopia")!;
    expect(between(blue, green)).toBeLessThan(40);
  });

  /**
   * Greyscale by luma, not by average.
   *
   * Averaging the channels makes a saturated blue and a saturated yellow of
   * equal luminance come out the same grey, which is the opposite of what this
   * view exists to reveal.
   */
  it("greys by luminance, so a yellow and a blue do not become the same grey", () => {
    const yellow = simulateVision("#ffff00", "achromatopsia")!;
    const blue = simulateVision("#0000ff", "achromatopsia")!;
    expect(yellow).not.toBe(blue);
    // Yellow is much the brighter of the two.
    expect(parseInt(yellow.slice(1, 3), 16)).toBeGreaterThan(parseInt(blue.slice(1, 3), 16));
  });

  /** Contrast is a luminance relationship, so it survives roughly intact. */
  it("roughly preserves contrast against white", () => {
    const original = contrastBetween("#1d63c9", "#ffffff")!;
    const simulated = contrastBetween(simulateVision("#1d63c9", "deuteranopia")!, "#ffffff")!;
    expect(Math.abs(original - simulated)).toBeLessThan(2);
  });

  it("stays inside the sRGB gamut", () => {
    for (const kind of VISION_KINDS) {
      for (const hex of ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff"]) {
        const out = simulateVision(hex, kind)!;
        const rgb = parseHex(out)!;
        for (const channel of [rgb.r, rgb.g, rgb.b]) {
          expect(channel).toBeGreaterThanOrEqual(0);
          expect(channel).toBeLessThanOrEqual(255);
        }
      }
    }
  });
});

describe("simulateAll", () => {
  it("returns every kind for a valid colour", () => {
    expect(Object.keys(simulateAll("#1d63c9")).sort()).toEqual([...VISION_KINDS].sort());
  });

  it("returns nothing for an invalid one", () => {
    expect(simulateAll("nope")).toEqual({});
  });
});
