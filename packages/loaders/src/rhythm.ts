/**
 * `<zb-rhythm-loader>` — one rhythm strip, swept like a monitor.
 *
 *   import "@zoblocks/loaders/rhythm";
 *   <zb-rhythm-loader size="sm" label="Loading results"></zb-rhythm-loader>
 */

import { LOADER_ART, LOADER_VIEWBOX } from "./art.js";
import { ZbLoaderElement, beatMs, cycleMs, define, strokePx } from "./base.js";

/**
 * Exported because Pulse renders it below 40px, where the heart stops being
 * legible. One function rather than two copies of the same three paths.
 */
export function rhythmArt(): string {
  return `<svg viewBox="${LOADER_VIEWBOX.rhythm}" focusable="false">
      <path class="stroke track" d="${LOADER_ART.strip}"/>
      <path class="stroke tail" pathLength="100" d="${LOADER_ART.strip}"/>
      <path class="stroke head" pathLength="100" d="${LOADER_ART.strip}"/>
    </svg>`;
}

export class ZbRhythmLoader extends ZbLoaderElement {
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "bpm"];
  }

  protected override defaultSize = "lg" as const;
  protected override variant = "rhythm";

  private get bpm(): number | undefined {
    const raw = this.getAttribute("bpm");
    if (raw === null || raw === "") return undefined;
    const parsed = Number.parseFloat(raw);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  protected override vars(sizePx: number): Array<[string, string]> {
    return [
      ["--zb-loader-size", `${sizePx}px`],
      ["--zb-loader-beat", `${beatMs(this.bpm, this.speed)}ms`],
      ["--zb-loader-cycle", `${cycleMs(4000, this.speed)}ms`],
      ["--zb-loader-stroke", `${strokePx(sizePx)}px`],
    ];
  }

  protected override renderArt(): string {
    return rhythmArt();
  }
}

define("zb-rhythm-loader", ZbRhythmLoader);

declare global {
  interface HTMLElementTagNameMap {
    "zb-rhythm-loader": ZbRhythmLoader;
  }
}
