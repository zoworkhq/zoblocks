/**
 * @oxygenui-design/theme — customer themes at runtime.
 *
 * A customer theme is a built-in brand with an envelope: the same primitive
 * overrides, held to the same gate, delivered as an immutable version-pinned
 * stylesheet instead of compiled into the build. That equivalence is the point
 * — a theme authored in the app can be committed as a brand, and a brand
 * can be imported into the app, because there is one format.
 *
 * The React provider lives at `@oxygenui-design/theme/react` so a server that
 * only validates and serves never resolves React.
 *
 * See content/decisions/0012-token-surface-is-a-contract.md.
 */

export {
  BRAND_ASSETS,
  BRAND_ASSET_GROUPS,
  BRAND_ASSET_ROLES,
  brandAsset,
  type BrandAssetRole,
  type BrandAssetSpec,
} from "./assets";

export { ICON_SLOTS, REPLACEABLE_SLOTS, iconSlot, iconVar, type IconSlot } from "./icons";

/*
 * `imageSize` sits at `@oxygenui-design/theme/logo` with the checker that calls
 * it. It reads a width and a height out of the first few hundred bytes of an
 * upload, which is a thing you do on a server holding an upload — and it is
 * 6 kB of PNG, JPEG, WebP and SVG header parsing that no browser consumer has
 * ever imported.
 */
export type { Dimensions } from "./dimensions";

export { brandManifest, type ManifestAsset, type ThemeManifest } from "./manifest";

export {
  fontFaceSchema,
  brandAssetSchema,
  emptyAssets,
  iconOverrideSchema,
  THEME_NAMES,
  hexSchema,
  slugSchema,
  themeAssetsSchema,
  themeDocumentSchema,
  themeStatusSchema,
  themeTokensSchema,
  validationRecordSchema,
  withTierDefaults,
  type FontFace,
  type BrandAssetFile,
  type IconOverride,
  type ThemeAssets,
  type ThemeDocument,
  type ThemeName,
  type ThemeStatus,
  type ThemeTokens,
  type ThemeTokensInput,
  type ValidationRecord,
} from "./document";

export {
  VISION_KINDS,
  VISION_LABELS,
  simulateAll,
  simulateVision,
  type VisionKind,
} from "./vision";

/**
 * The ramp moved to `@oxygenui-design/tokens/validate` so a Figma plugin
 * sandbox can offer "nearest passing" without pulling in zod and both
 * framework bridges. Re-exported here because it has been part of this
 * package's public surface since the app was written, and a move is not a
 * reason to break a caller.
 */
export {
  ANCHOR_STEP,
  RAMP_STEPS,
  generateRamp,
  hslToHex,
  nearestPassing,
  rgbToHsl,
  type RampStep,
} from "@oxygenui-design/tokens/validate";

export {
  UnsafeTokenValueError,
  emitThemeCss,
  themeCacheHeaders,
  themeHref,
  type EmitOptions,
} from "./emit";

export {
  VALIDATOR_VERSION,
  componentProblems,
  isServable,
  needsRevalidation,
  sourceWithOverrides,
  themeAsBrand,
  validateTheme,
  type ThemeValidation,
} from "./validate";

export {
  exportTheme,
  importDtcg,
  importFrameworkTheme,
  type ExportFormat,
  type ExportResult,
  type ImportReport,
} from "./export";

/*
 * `checkLogo` and its neighbours are at `@oxygenui-design/theme/logo`, not here.
 *
 * They hash uploaded bytes with `node:crypto`, which is correct — the digest is
 * how an upload becomes an addressable asset — and it means the module cannot
 * be bundled for a browser. Re-exported from this barrel it dragged
 * `node:crypto` into every consumer of `@oxygenui-design/theme` and broke the
 * bundle budget, which is exactly what that budget is for.
 *
 * The type is still here because it is data about an image rather than code
 * that reads one, and a caller describing a format should not have to import a
 * server module to name it.
 */
export type { LogoFormat } from "./assets";

export {
  MAX_FONT_BYTES,
  checkFont,
  fontHeaders,
  type FontAcceptance,
  type FontCheck,
  type FontFormat,
  type FontRejection,
} from "./font";
