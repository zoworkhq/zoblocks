/**
 * Which part of a wordmark becomes a favicon.
 *
 * Separated from the canvas because the canvas is not the part that can be
 * wrong. Rasterising is the browser's job and it does it correctly; choosing
 * *which rectangle of the source* to take is arithmetic, and arithmetic with
 * three modes, two orientations and a letterbox is where an off-by-a-half lives
 * — a centre crop that is not centred, or a letterbox that stretches.
 *
 * Pure, so it can be checked against every shape a customer might upload rather
 * than against whatever file happened to be in the test.
 */

export type Crop = "leading" | "centre" | "whole";

export interface CropGeometry {
  /** The rectangle taken from the source. */
  source: { x: number; y: number; width: number; height: number };
  /** Where it lands on the square canvas. */
  dest: { x: number; y: number; width: number; height: number };
}

/**
 * `size` is the square being drawn into. The result always fills or is centred
 * within it — never off the edge, and never scaled unevenly.
 */
export function cropGeometry(
  width: number,
  height: number,
  crop: Crop,
  size: number,
): CropGeometry {
  /*
   * A source with no area has no rectangle to take.
   *
   * `drawImage` throws on a zero-width source rather than drawing nothing, and
   * an SVG that states no size reaches here as 0×0 — which is legal artwork, so
   * this cannot be an error.
   */
  if (width <= 0 || height <= 0) {
    return {
      source: { x: 0, y: 0, width: 0, height: 0 },
      dest: { x: 0, y: 0, width: 0, height: 0 },
    };
  }

  if (crop === "whole") {
    /*
     * Everything, letterboxed. One scale factor for both axes — the smaller —
     * because scaling each independently is how a wordmark arrives squashed
     * into a square and nobody can say quite what looks wrong about it.
     */
    const scale = Math.min(size / width, size / height);
    const w = width * scale;
    const h = height * scale;
    return {
      source: { x: 0, y: 0, width, height },
      dest: { x: (size - w) / 2, y: (size - h) / 2, width: w, height: h },
    };
  }

  // The largest square the source contains, which is what a favicon slot is.
  const side = Math.min(width, height);

  return {
    source: {
      // Leading takes the left edge — in most wordmarks that is the symbol,
      // which is the thing worth keeping at sixteen pixels.
      x: crop === "leading" ? 0 : (width - side) / 2,
      // Vertically centred in both modes: a mark sitting against the top of its
      // own bounding box is not a thing designers do, and cropping from the top
      // would clip the descenders of one that does.
      y: (height - side) / 2,
      width: side,
      height: side,
    },
    dest: { x: 0, y: 0, width: size, height: size },
  };
}
