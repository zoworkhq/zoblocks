/**
 * @zoblocks/loaders — healthcare loaders as custom elements.
 *
 * Importing this module defines all five elements. To ship only the one you
 * use, import its subpath instead:
 *
 *   import "@zoblocks/loaders/pulse";     // ~1 kB
 *   import "@zoblocks/loaders";           // all five
 *
 * React users should prefer the ZoBlocks registry components, which are copied
 * into the project as readable source:
 *
 *   npx @zoblocks/cli add pulse-loader
 */

import "./pulse.js";
import "./rhythm.js";
import "./breath.js";
import "./helix.js";
import "./infusion.js";

export { ZbPulseLoader } from "./pulse.js";
export { ZbRhythmLoader, rhythmArt } from "./rhythm.js";
export { ZbBreathLoader } from "./breath.js";
export { ZbHelixLoader } from "./helix.js";
export { ZbInfusionLoader, slugWidth } from "./infusion.js";

export {
  LOADER_EVENTS,
  ZbLoaderElement,
  beatMs,
  clamp,
  cycleMs,
  define,
  resolveSize,
  strokePx,
  type LoaderAnnounce,
  type LoaderEvent,
  type LoaderMode,
  type LoaderMotion,
} from "./base.js";

export {
  DEFAULT_SLOW_HINT,
  HELIX_COLUMNS,
  INFUSION,
  LOADER_ART,
  LOADER_SIZE_PX,
  LOADER_VIEWBOX,
  PULSE_MIN_SIZE_PX,
  type LoaderSize,
} from "./art.js";

export { LOADER_CSS } from "./css.js";
