/**
 * `<ox-rhythm-loader>` — one rhythm strip, swept like a monitor.
 *
 *   import "@oxygenui-design/loaders/rhythm";
 *   <ox-rhythm-loader size="sm" label="Loading results"></ox-rhythm-loader>
 */

import { LOADER_ART, LOADER_VIEWBOX } from "./art.js";
import { OxLoaderElement, beatMs, cycleMs, define, strokePx } from "./base.js";

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

export class OxRhythmLoader extends OxLoaderElement {
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
      ["--ox-loader-size", `${sizePx}px`],
      ["--ox-loader-beat", `${beatMs(this.bpm, this.speed)}ms`],
      ["--ox-loader-cycle", `${cycleMs(4000, this.speed)}ms`],
      ["--ox-loader-stroke", `${strokePx(sizePx)}px`],
    ];
  }

  protected override renderArt(): string {
    return rhythmArt();
  }
}

define("ox-rhythm-loader", OxRhythmLoader);

declare global {
  interface HTMLElementTagNameMap {
    "ox-rhythm-loader": OxRhythmLoader;
  }
}
