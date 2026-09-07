/**
 * `<zb-pulse-loader>` — an open heart with a rhythm line running through it.
 *
 * Importing this module defines the element. That is a side effect on purpose,
 * and it is why `sideEffects` in package.json lists these files: a bundler that
 * tree-shook this import away would leave a page full of undefined elements.
 *
 *   import "@zoblocks/loaders/pulse";
 *   <zb-pulse-loader label="Loading your records"></zb-pulse-loader>
 */

import { LOADER_ART, LOADER_VIEWBOX, PULSE_MIN_SIZE_PX } from "./art.js";
import { ZbLoaderElement, beatMs, cycleMs, define, strokePx } from "./base.js";
import { rhythmArt } from "./rhythm.js";

export class ZbPulseLoader extends ZbLoaderElement {
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "bpm"];
  }

  protected override defaultSize = "xl" as const;

  protected override get variant(): string {
    // Below 40px the heart's detail collapses into a smudge, so the element
    // reports what it is actually rendering rather than what was asked for.
    return this.sizePx < PULSE_MIN_SIZE_PX ? "rhythm" : "pulse";
  }

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

  protected override renderArt(sizePx: number): string {
    if (sizePx < PULSE_MIN_SIZE_PX) return rhythmArt();
    return `<svg viewBox="${LOADER_VIEWBOX.pulse}" focusable="false">
      <g class="beat">
        <path class="stroke draw" pathLength="100" d="${LOADER_ART.heartTop}"/>
        <path class="stroke draw" pathLength="100" d="${LOADER_ART.heartBottom}"/>
      </g>
      <path class="stroke track" d="${LOADER_ART.heartLine}"/>
      <path class="stroke tail" pathLength="100" d="${LOADER_ART.heartLine}"/>
      <path class="stroke head" pathLength="100" d="${LOADER_ART.heartLine}"/>
    </svg>`;
  }
}

define("zb-pulse-loader", ZbPulseLoader);

declare global {
  interface HTMLElementTagNameMap {
    "zb-pulse-loader": ZbPulseLoader;
  }
}
