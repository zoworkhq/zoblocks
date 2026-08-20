/**
 * @oxygenui-design/tokens/validate — the accessibility gate, as a module.
 *
 *     import { validateTokens } from "@oxygenui-design/tokens/validate";
 *
 * Why this is a package rather than a build script: the same rules have to run
 * in three places, and three implementations would be three answers.
 *
 *   1. `pnpm gen`         — the build, over the DTCG source on disk
 *   2. the theme console  — live, in a browser, as a customer types a colour
 *   3. the publish gate   — server-side and authoritative, before a theme ships
 *
 * A customer whose palette passed in the browser and failed in CI has been
 * told two different things about the same colour. Nothing here imports
 * `node:*`, so all three call the identical code.
 *
 * See content/decisions/0012-token-surface-is-a-contract.md.
 */

export {
  THEMES,
  DENSITIES,
  DEFAULT_DENSITY,
  cssVar,
  referenceTarget,
  toCssValue,
  flattenDtcg,
  type Theme,
  type DensityName,
  type Token,
  type TokenMap,
  type Brand,
  type TokenSource,
  type DtcgNode,
} from "./model";

export {
  fromDtcg,
  toDtcg,
  parseCubicBezier,
  parseDimension,
  parseDuration,
  parseShadow,
  type DtcgCubicBezier,
  type DtcgDimension,
  type DtcgDuration,
  type DtcgShadow,
  type DtcgValue,
} from "./dtcg";

export {
  parseHex,
  luminance,
  contrastRatio,
  contrastBetween,
  hue,
  hueDistance,
  type Rgb,
} from "./color";

export {
  STATUS_PAIRS,
  CONTRAST_PAIRS,
  HUE_SEPARATION_FLOOR,
  floorFor,
  floorForPair,
  type StatusName,
  type ContrastPair,
} from "./pairs";

export {
  resolveLiteral,
  brandedPrimitive,
  themeLookup,
  statusHues,
  resolveTheme,
  resolveFlat,
  measureContrast,
  type ContrastReading,
} from "./resolve";

export {
  ANCHOR_STEP,
  RAMP_STEPS,
  generateRamp,
  hslToHex,
  nearestPassing,
  rgbToHsl,
  type RampStep,
} from "./ramp";

export {
  validateTokens,
  checkStatusContrast,
  checkTextContrast,
  type TokenProblem,
} from "./checks";
