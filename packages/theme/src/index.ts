/**
 * @oxygenui-design/theme — customer themes at runtime.
 *
 * A customer theme is a built-in brand with an envelope: the same primitive
 * overrides, held to the same gate, delivered as an immutable version-pinned
 * stylesheet instead of compiled into the build. That equivalence is the point
 * — a theme authored in the console can be committed as a brand, and a brand
 * can be imported into the console, because there is one format.
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

export { imageSize, type Dimensions } from "./dimensions";

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

export {
  LOGO_VARIANTS,
  MAX_LOGO_BYTES,
  checkBrandAsset,
  checkLogo,
  logoContentType,
  logoHeaders,
  type LogoAcceptance,
  type LogoCheck,
  type LogoFormat,
  type LogoRejection,
  type LogoVariant,
} from "./logo";

export {
  MAX_FONT_BYTES,
  checkFont,
  fontHeaders,
  type FontAcceptance,
  type FontCheck,
  type FontFormat,
  type FontRejection,
} from "./font";
