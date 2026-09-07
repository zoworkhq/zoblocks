/**
 * `<zb-breath-loader>` — three rings expanding and fading from a soft core,
 * paced at a resting breath rather than a spinner's tempo.
 *
 *   import "@zoblocks/loaders/breath";
 *   <zb-breath-loader mode="page" label="Loading your information"></zb-breath-loader>
 */

import { LOADER_VIEWBOX } from "./art.js";
import { ZbLoaderElement, define } from "./base.js";

export class ZbBreathLoader extends ZbLoaderElement {
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

define("zb-breath-loader", ZbBreathLoader);

declare global {
  interface HTMLElementTagNameMap {
    "zb-breath-loader": ZbBreathLoader;
  }
}
