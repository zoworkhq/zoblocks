/**
 * `<ox-breath-loader>` — three rings expanding and fading from a soft core,
 * paced at a resting breath rather than a spinner's tempo.
 *
 *   import "@oxygenui-design/loaders/breath";
 *   <ox-breath-loader mode="page" label="Loading your information"></ox-breath-loader>
 */

import { LOADER_VIEWBOX } from "./art.js";
import { OxLoaderElement, define } from "./base.js";

export class OxBreathLoader extends OxLoaderElement {
  protected override defaultSize = "lg" as const;
  protected override variant = "breath";

  protected override renderArt(): string {
    // Three rings on one cycle, a third apart, so the field never empties.
    // They must remain siblings: the stagger is applied with :nth-of-type.
    return `<svg viewBox="${LOADER_VIEWBOX.breath}" focusable="false">
      <circle class="stroke ring" cx="60" cy="60" r="54"/>
      <circle class="stroke ring" cx="60" cy="60" r="54"/>
      <circle class="stroke ring" cx="60" cy="60" r="54"/>
      <circle class="fill core" cx="60" cy="60" r="11"/>
    </svg>`;
  }
}

define("ox-breath-loader", OxBreathLoader);

declare global {
  interface HTMLElementTagNameMap {
    "ox-breath-loader": OxBreathLoader;
  }
}
