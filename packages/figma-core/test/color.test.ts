/**
 * The conversion that is quietly wrong at the edges.
 *
 * Figma stores each channel as a float from 0 to 1; Oxygen stores hex. Four
 * lines, and the failure mode is one value off in a file somebody has already
 * built on — invisible in review, invisible on screen, and only findable by
 * comparing two hex codes nobody has side by side.
 */

import { describe, expect, it } from "vitest";
import { figmaRgbToHex, hexToFigmaRgb } from "../src/color";
import { RAMP } from "./fixture";

describe("hex to Figma and back is identity", () => {
  /**
   * Every step of a real ramp, not a sample.
   *
   * The plan's acceptance criterion, and the reason it is stated that way: a
   * conversion that is right in the middle of the range and wrong at the ends
   * passes any spot check. `#ffffff` is the one `Math.floor` loses.
   */
  it.each(Object.entries(RAMP))("round-trips step %s (%s) byte-exactly", (_step, hex) => {
    const rgb = hexToFigmaRgb(hex)!;
    expect(figmaRgbToHex(rgb)).toBe(hex);
  });

  it.each([
    ["black", "#000000"],
    ["white", "#ffffff"],
    ["pure red", "#ff0000"],
    ["one below white", "#fefefe"],
    ["one above black", "#010101"],
  ])("round-trips %s, where rounding decides", (_name, hex) => {
    expect(figmaRgbToHex(hexToFigmaRgb(hex)!)).toBe(hex);
  });

  it("accepts a hex without the hash, because half the world writes it that way", () => {
    expect(hexToFigmaRgb("1d63c9")).toEqual(hexToFigmaRgb("#1d63c9"));
  });

  it("is case-insensitive on the way in and lowercase on the way out", () => {
    expect(figmaRgbToHex(hexToFigmaRgb("#1D63C9")!)).toBe("#1d63c9");
  });

  it("returns nothing for something that is not a colour, rather than throwing", () => {
    for (const bad of ["", "#fff", "#12345", "rgb(1,2,3)", "#gggggg"]) {
      expect(hexToFigmaRgb(bad), bad).toBeUndefined();
    }
  });

  /**
   * Figma hands back values fractionally outside the range after its own
   * arithmetic, and `(-0.0001 * 255).toString(16)` is not a colour.
   */
  it("clamps a channel that has drifted outside the range", () => {
    expect(figmaRgbToHex({ r: -0.0001, g: 1.0001, b: 0.5 })).toBe("#00ff80");
  });
});
