/**
 * `<zb-helix-loader>` — two strands of dots turning on a slow sine.
 *
 * For laboratory surfaces: genomics, pathology, diagnostics. Depth is faked
 * with scale and opacity rather than a 3D transform, so the strands cross
 * convincingly while staying compositor-cheap and identical across browsers.
 *
 *   import "@zoblocks/loaders/helix";
 *   <zb-helix-loader label="Running the panel"></zb-helix-loader>
 */

import { HELIX_COLUMNS, LOADER_VIEWBOX } from "./art.js";
import { ZbLoaderElement, define } from "./base.js";

const DOTS = Array.from({ length: HELIX_COLUMNS }, (_, index) => ({
  x: 12 + index * 17,
  phaseA: -(index / HELIX_COLUMNS),
  /** Strand B trails strand A by half a turn — that is what crosses them. */
  phaseB: -(index / HELIX_COLUMNS) - 0.5,
}));

export class ZbHelixLoader extends ZbLoaderElement {
  protected override defaultSize = "xl" as const;
  protected override variant = "helix";

  protected override vars(sizePx: number): Array<[string, string]> {
    return [...super.vars(sizePx), ["--zb-loader-stroke", "1.5px"]];
  }

  protected override renderArt(): string {
    const strand = (phase: (dot: (typeof DOTS)[number]) => number) =>
      DOTS.map(
        (dot) =>
          `<circle class="fill dot" style="--zb-loader-phase:${phase(dot)}" cx="${dot.x}" cy="30" r="4.2"/>`,
      ).join("");

    return `<svg viewBox="${LOADER_VIEWBOX.helix}" focusable="false">
      <line class="stroke track" x1="8" y1="30" x2="152" y2="30"/>
      ${strand((dot) => dot.phaseA)}
      ${strand((dot) => dot.phaseB)}
    </svg>`;
  }
}

define("zb-helix-loader", ZbHelixLoader);

declare global {
  interface HTMLElementTagNameMap {
    "zb-helix-loader": ZbHelixLoader;
  }
}
