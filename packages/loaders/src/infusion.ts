/**
 * `<ox-infusion-loader>` — a capsule with a soft slug.
 *
 * The only loader that can tell the truth about how much is left. Set
 * `progress` and it becomes a real 0–100 measurement with role="progressbar";
 * leave it off and the slug drifts as an honest unknown.
 *
 *   import "@oxygenui-design/loaders/infusion";
 *   <ox-infusion-loader progress="42" label="Importing records"></ox-infusion-loader>
 */

import { INFUSION, LOADER_VIEWBOX } from "./art.js";
import { OxLoaderElement, clamp, define } from "./base.js";

/**
 * Width of the determinate slug at a given percentage.
 *
 * Never zero: 0% still has to look like a bar someone is watching rather than
 * an empty track that failed to render.
 */
export function slugWidth(percent: number): number {
  return INFUSION.slugMin + (clamp(percent, 0, 100) / 100) * (INFUSION.slugMax - INFUSION.slugMin);
}

export class OxInfusionLoader extends OxLoaderElement {
  protected override defaultSize = "xl" as const;
  protected override variant = "infusion";

  protected override vars(sizePx: number): Array<[string, string]> {
    return [...super.vars(sizePx), ["--ox-loader-stroke", "2.4px"]];
  }

  protected override renderArt(): string {
    const progress = this.progress;
    const width = progress === null ? INFUSION.driftWidth : slugWidth(progress);

    return `<svg viewBox="${LOADER_VIEWBOX.infusion}" focusable="false">
      <rect class="stroke track" x="4" y="4" width="152" height="40" rx="20"/>
      <rect class="fill slug" x="12" y="9" width="${width}" height="30" rx="15" opacity="0.9"/>
    </svg>`;
  }
}

define("ox-infusion-loader", OxInfusionLoader);

declare global {
  interface HTMLElementTagNameMap {
    "ox-infusion-loader": OxInfusionLoader;
  }
}
