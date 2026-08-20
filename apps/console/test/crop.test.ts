/**
 * Which rectangle of a wordmark becomes a favicon.
 *
 * The canvas is not the part that can be wrong — rasterising is the browser's
 * job. Choosing the source rectangle is arithmetic across three modes, two
 * orientations and a letterbox, and that is where a centre crop that is not
 * centred, or a letterbox that stretches, would live. A browser test would
 * catch neither: both produce a plausible-looking 16-pixel square.
 */

import { describe, expect, it } from "vitest";
import { cropGeometry } from "@/lib/crop";

describe("the leading crop", () => {
  /**
   * The left-hand square, because in most wordmarks that is the symbol — and
   * the symbol is the only part still legible at sixteen pixels.
   */
  it("takes the left-hand square of a wide mark", () => {
    const { source } = cropGeometry(320, 80, "leading", 64);
    expect(source).toEqual({ x: 0, y: 0, width: 80, height: 80 });
  });

  it("fills the destination square exactly", () => {
    const { dest } = cropGeometry(320, 80, "leading", 64);
    expect(dest).toEqual({ x: 0, y: 0, width: 64, height: 64 });
  });

  /**
   * Vertically centred even at the leading edge.
   *
   * A tall mark cropped from the top clips whatever hangs below the midline. A
   * designer does not lay a mark against the top of its own bounding box, so
   * the top is never the right guess.
   */
  it("centres vertically on a tall mark rather than taking the top", () => {
    const { source } = cropGeometry(80, 320, "leading", 64);
    expect(source).toEqual({ x: 0, y: 120, width: 80, height: 80 });
  });

  it("changes nothing about a mark that is already square", () => {
    const { source } = cropGeometry(120, 120, "leading", 32);
    expect(source).toEqual({ x: 0, y: 0, width: 120, height: 120 });
  });
});

describe("the centre crop", () => {
  it("takes the middle square of a wide mark", () => {
    const { source } = cropGeometry(320, 80, "centre", 64);
    expect(source).toEqual({ x: 120, y: 0, width: 80, height: 80 });
  });

  it("takes the middle square of a tall mark", () => {
    const { source } = cropGeometry(80, 320, "centre", 64);
    expect(source).toEqual({ x: 0, y: 120, width: 80, height: 80 });
  });

  /**
   * The two crops differ only where there is room for them to.
   *
   * On a square source, leading and centre are the same rectangle — and a
   * version that offered a different answer for each would be inventing a
   * distinction the artwork does not contain.
   */
  it("agrees with the leading crop when the mark is square", () => {
    expect(cropGeometry(200, 200, "centre", 64)).toEqual(cropGeometry(200, 200, "leading", 64));
  });

  it("stays inside the source, never off its edge", () => {
    const shapes: readonly [number, number][] = [
      [320, 80],
      [80, 320],
      [17, 5],
      [1000, 999],
    ];
    for (const [w, h] of shapes) {
      const { source } = cropGeometry(w, h, "centre", 64);
      expect(source.x, `${w}×${h}`).toBeGreaterThanOrEqual(0);
      expect(source.y, `${w}×${h}`).toBeGreaterThanOrEqual(0);
      expect(source.x + source.width, `${w}×${h}`).toBeLessThanOrEqual(w);
      expect(source.y + source.height, `${w}×${h}`).toBeLessThanOrEqual(h);
    }
  });
});

describe("the whole mark, letterboxed", () => {
  it("takes the entire source", () => {
    const { source } = cropGeometry(320, 80, "whole", 64);
    expect(source).toEqual({ x: 0, y: 0, width: 320, height: 80 });
  });

  /**
   * One scale for both axes.
   *
   * Scaling each independently would fill the square — and is how a wordmark
   * arrives squashed, which reads as "something looks off" long before anybody
   * works out that the aspect ratio moved.
   */
  it("preserves the aspect ratio", () => {
    const { source, dest } = cropGeometry(320, 80, "whole", 64);
    expect(dest.width / dest.height).toBeCloseTo(source.width / source.height, 6);
  });

  it("centres the letterbox in the square", () => {
    const { dest } = cropGeometry(320, 80, "whole", 64);
    expect(dest).toEqual({ x: 0, y: 24, width: 64, height: 16 });
  });

  it("letterboxes a tall mark on the other axis", () => {
    const { dest } = cropGeometry(80, 320, "whole", 64);
    expect(dest).toEqual({ x: 24, y: 0, width: 16, height: 64 });
  });

  it("fills the square exactly when the mark is already square", () => {
    const { dest } = cropGeometry(200, 200, "whole", 64);
    expect(dest).toEqual({ x: 0, y: 0, width: 64, height: 64 });
  });

  it("never draws outside the square", () => {
    const shapes: readonly [number, number][] = [
      [320, 80],
      [80, 320],
      [3, 200],
      [200, 3],
    ];
    for (const [w, h] of shapes) {
      const { dest } = cropGeometry(w, h, "whole", 64);
      expect(dest.x, `${w}×${h}`).toBeGreaterThanOrEqual(0);
      expect(dest.y, `${w}×${h}`).toBeGreaterThanOrEqual(0);
      expect(dest.x + dest.width, `${w}×${h}`).toBeLessThanOrEqual(64.0001);
      expect(dest.y + dest.height, `${w}×${h}`).toBeLessThanOrEqual(64.0001);
    }
  });
});

describe("artwork that states no size", () => {
  /**
   * An SVG with neither a size nor a viewBox is unusual and legal, and reaches
   * this as 0×0. `drawImage` throws on a zero-width source rather than drawing
   * nothing, so this cannot be left to fall through.
   */
  it("returns an empty rectangle rather than something that would throw", () => {
    for (const crop of ["leading", "centre", "whole"] as const) {
      const { source, dest } = cropGeometry(0, 0, crop, 64);
      expect(source.width, crop).toBe(0);
      expect(dest.width, crop).toBe(0);
    }
  });

  it("treats a negative dimension the same way rather than inverting", () => {
    const { source } = cropGeometry(-320, 80, "leading", 64);
    expect(source.width).toBe(0);
  });
});

describe("the preview sizes the screen actually renders", () => {
  /**
   * Sixteen is the size that decides whether a wordmark works as a favicon, so
   * the geometry has to be right at sixteen specifically — not merely
   * proportional at sixty-four and rounded into place later.
   */
  it.each([16, 32, 64, 256])("fills a %spx square from a wide mark", (size) => {
    const { dest } = cropGeometry(320, 80, "leading", size);
    expect(dest).toEqual({ x: 0, y: 0, width: size, height: size });
  });
});
