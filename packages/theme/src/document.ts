/**
 * The customer theme document.
 *
 * Deliberately the same shape a built-in brand already has. A brand today is
 * `packages/tokens/tokens/brands/<name>.json`: primitive overrides, validated
 * by the token gate, compiled into `[data-ox-brand="…"]` blocks at build time.
 * A customer theme is that file plus an envelope — who owns it, which version
 * it is, and what the validator said when it was published.
 *
 * Keeping the `tokens` body byte-compatible is what makes the two channels one
 * system: a theme authored in the app can be exported and committed as a
 * built-in brand, and a built-in brand can be imported into the app. If the
 * app had invented its own format, "bring your own design system" would
 * have meant two formats to support and one of them would rot.
 *
 * See content/decisions/0012-token-surface-is-a-contract.md.
 */

import { z } from "zod";
import { BRAND_ASSET_ROLES, type BrandAssetRole } from "./assets";
import { REPLACEABLE_SLOTS } from "./icons";
import { CLINICAL_SEMANTIC, NOT_BRIDGEABLE } from "@oxygenui-design/tokens/surface";

/**
 * A hex colour, six digits or three.
 *
 * Eight digits carry alpha and are refused for the same reason the token gate
 * refuses them: a contrast ratio against an unknown backdrop is not a number we
 * can honestly compute, and an unverifiable clinical colour is not shippable.
 */
export const hexSchema = z
  .string()
  .regex(
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    "must be a three- or six-digit hex colour. Eight digits carry alpha, and contrast against an unknown backdrop cannot be verified.",
  );

/**
 * The `[data-ox-brand]` value, and part of the stylesheet URL.
 *
 * Kebab-case because it becomes a CSS attribute selector — the same constraint
 * `loadBrands()` already enforces on built-in brands, for the same reason.
 */
export const slugSchema = z
  .string()
  .min(1)
  .max(48)
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "must be kebab-case — it becomes a [data-ox-brand] value, a CSS attribute selector, and part of the stylesheet URL",
  );

/**
 * A semantic or component token a customer may not touch, in either tier.
 *
 * Generated from the token source rather than listed here — `CLINICAL_SEMANTIC`
 * is every `status.*` and `flag.*`, `NOT_BRIDGEABLE` is every component token
 * that falls through to one. The same two constants a theme bridge is refused
 * by, so a customer and a host framework are held to one rule rather than two
 * that can drift apart.
 */
const CLINICAL_PATHS = new Set(CLINICAL_SEMANTIC.map((name) => name.replace(/^--ox-/, "")));
const CLINICAL_COMPONENT = new Set<string>(NOT_BRIDGEABLE);

/** `status.critical`, `flag.deceased` — the paths, as the source spells them. */
function isClinicalPath(path: string): boolean {
  return /^(status|flag)[.-]/.test(path) || CLINICAL_PATHS.has(path.replace(/\./g, "-"));
}

/**
 * Overrides for one tier, in one theme.
 *
 * **Per theme, and that is the point.** The semantic tier exists precisely
 * because one literal cannot serve a light and a dark ground: a saturated brand
 * accent that clears 4.5:1 on white is nowhere near it on near-black. A
 * theme-invariant override would therefore fail the gate for most real brands,
 * and the only way out would be to weaken the gate.
 */
const overrideLayer = <T extends z.ZodTypeAny>(value: T) =>
  z.object({
    light: z.record(z.string(), value).default({}),
    dark: z.record(z.string(), value).default({}),
    "high-contrast": z.record(z.string(), value).default({}),
  });

const EMPTY_LAYER = { light: {}, dark: {}, "high-contrast": {} };

/**
 * A component-tier value.
 *
 * Not `hexSchema`: the surface carries dimensions, durations and shadows as
 * well as colours, and refusing `--ox-switch-focus-width: 3px` because it is
 * not a colour would be the wrong rule. Colour-ness is checked per token
 * against the manifest's `kind` in `validateTheme`, where the manifest is in
 * hand; the length cap and the escape check in `emit.ts` are what keep any
 * value safe to write into a stylesheet.
 */
const componentValueSchema = z.string().min(1).max(120);

/**
 * What a customer theme may override.
 *
 * `ref` is unchanged and still byte-compatible with a built-in brand file — a
 * ramp-only theme exports as something that can be committed to
 * `packages/tokens/tokens/brands/` verbatim, which is the property that keeps
 * the app and the build one system rather than two.
 *
 * `semantic` and `component` are the extension. Without them the app can
 * only offer a brand ramp, and "customise the badge without forking the
 * component" — the reason the 282-token surface is published as a contract at
 * all — has no way to be expressed. The clinical refusal is what makes it safe
 * to open: a customer gets every token whose meaning is theirs to decide, and
 * none of the ones that carry a validated clinical signal.
 */
export const themeTokensSchema = z
  .object({
    ref: z.record(z.string(), z.record(z.string(), hexSchema)).default({}),
    semantic: overrideLayer(hexSchema).default(EMPTY_LAYER),
    component: overrideLayer(componentValueSchema).default(EMPTY_LAYER),
  })
  .superRefine((tokens, ctx) => {
    for (const [theme, entries] of Object.entries(tokens.semantic)) {
      for (const path of Object.keys(entries)) {
        if (!isClinicalPath(path)) continue;
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["semantic", theme, path],
          message:
            `${path} carries a clinical meaning and cannot be overridden. Status and identity ` +
            "colours hold a validated contrast floor and more than 60° of hue separation between " +
            "high and low, so the direction of an abnormal result survives colour-vision " +
            "deficiency. A theme may not redefine what critical means, and neither may a bridge.",
        });
      }
    }

    for (const [theme, entries] of Object.entries(tokens.component)) {
      for (const name of Object.keys(entries)) {
        if (!name.startsWith("--ox-")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["component", theme, name],
            message: `${name} is not an Oxygen custom property. Component overrides are keyed by the property exactly as the surface manifest declares it.`,
          });
          continue;
        }
        if (CLINICAL_COMPONENT.has(name)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["component", theme, name],
            message: `${name} resolves to clinical status or an identity flag and cannot be overridden.`,
          });
        }
      }
    }
  });

export const fontFaceSchema = z.object({
  family: z.string().min(1).max(64),
  /** Where the face is served from. Validated as a URL, never interpolated raw. */
  src: z.string().url(),
  weight: z.string().max(16).default("400"),
  style: z.enum(["normal", "italic"]).default("normal"),
  /** Recorded so the served bytes are verifiable after the fact. */
  sha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  /**
   * Whether the face carries tabular figures.
   *
   * Detected on upload rather than declared. A face without `tnum` makes every
   * numeric column ragged, which is a real problem in a flowsheet and is
   * invisible until you look at aligned digits — so it is recorded on the
   * document and surfaced as a warning rather than silently accepted.
   */
  tabularNumerals: z.boolean().optional(),
});

/**
 * One piece of brand artwork, whatever it is for.
 *
 * A wordmark, a favicon, a home-screen icon and the card that appears when
 * somebody pastes a link into Teams are one type with one `role`, not four
 * fields. What differs between them — accepted formats, required shape, where
 * it is delivered — lives in the `BRAND_ASSETS` registry, so adding the next
 * one is a row in a table rather than a fifth `…Url` on this object with its
 * own validation written by somebody else on a different afternoon.
 *
 * `alt` is required and not defaulted. A mark sits at the top of every screen
 * a customer's application renders, so an unnamed one is a WCAG 1.1.1 failure
 * repeated on every page — and this product refuses a colour that misses its
 * floor. Refusing artwork that cannot be announced is the same rule.
 *
 * The empty string is allowed, and means something specific: purely decorative,
 * announce nothing. That is a legitimate choice when the organisation's name is
 * already beside the mark in text, and it is a choice somebody has to make
 * rather than one they fall into by leaving a field blank.
 */
export const brandAssetSchema = z.object({
  /*
   * Taken from the registry rather than restated.
   *
   * Written out here as a literal it drifted within an hour of the registry
   * gaining four roles — the schema said seven, the screen offered eleven, and
   * only the compiler noticed. The registry is the one place a role is named.
   */
  role: z.enum(BRAND_ASSET_ROLES as [BrandAssetRole, ...BrandAssetRole[]]),
  /** Content-addressed: the SHA-256 that also serves it. */
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  format: z.enum(["svg", "png", "jpeg", "webp"]),
  /**
   * Where the artwork is fetched from, for the same reason a font carries one.
   *
   * A digest identifies bytes; it does not locate them. Without this, an
   * exported theme is a document that names artwork nobody outside this app
   * can resolve — and "the theme is portable" stops being true at exactly the
   * point somebody tries to use it. Written by the server on upload.
   *
   * Constrained to a same-origin path or an https URL. This value is emitted
   * into a stylesheet as `url(...)`, and an imported theme is a file a customer
   * supplied — so the set of schemes it may name is decided here rather than
   * left to whatever the browser happens to refuse.
   */
  src: z
    .string()
    .max(2048)
    .regex(/^(\/[^\s"'()\\]*|https:\/\/[^\s"'()\\]+)$/, {
      message: "A logo source must be a same-origin path or an https URL.",
    }),
  /** Announced by assistive technology. Empty means deliberately decorative. */
  alt: z.string().max(120),
  /**
   * Measured on upload, not asked for on the form.
   *
   * Carried so a host can set `width` and `height` on the `<img>` and stop the
   * header reflowing when the mark loads. Optional because an SVG with neither
   * a size nor a viewBox states no dimensions, and that is legal artwork.
   */
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  uploadedAt: z.string().datetime(),
});

/**
 * One replaced glyph.
 *
 * No `alt`, unlike brand artwork, and the difference is not an oversight: every
 * glyph in this system renders `aria-hidden` with the real accessible name on
 * the control that holds it. Giving an icon its own name would announce the
 * send button twice, so there is nothing here for a customer to write.
 *
 * The slot enum comes from the registry, and only the replaceable ones are in
 * it — a payload naming `switch-unknown` fails to parse rather than being
 * accepted and ignored somewhere further down.
 */
export const iconOverrideSchema = z.object({
  slot: z.enum(REPLACEABLE_SLOTS as [string, ...string[]]),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  /** Same constraint as brand artwork: it is emitted into a `url()`. */
  src: z
    .string()
    .max(2048)
    .regex(/^(\/[^\s"'()\\]*|https:\/\/[^\s"'()\\]+)$/, {
      message: "An icon source must be a same-origin path or an https URL.",
    }),
  uploadedAt: z.string().datetime(),
});

export const themeAssetsSchema = z.object({
  fonts: z.array(fontFaceSchema).max(8).default([]),
  /** At most one per role; the upload replaces rather than appends. */
  brand: z.array(brandAssetSchema).max(BRAND_ASSET_ROLES.length).default([]),
  /** At most one per slot, and only slots the registry says are replaceable. */
  icons: z.array(iconOverrideSchema).max(REPLACEABLE_SLOTS.length).default([]),
});

/**
 * A theme carrying no assets at all.
 *
 * Exported rather than written inline, because it was written inline in six
 * places and adding one field to `themeAssetsSchema` therefore meant six edits
 * — five of which the compiler catches and one of which, in a `?? {}` fallback,
 * it would not have.
 */
export function emptyAssets(): z.infer<typeof themeAssetsSchema> {
  return { fonts: [], brand: [], icons: [] };
}

/** Written by the server, never by a client. */
export const validationRecordSchema = z.object({
  validatedAt: z.string().datetime(),
  /**
   * Which validator passed it.
   *
   * Load-bearing: tightening a rule must not leave older themes live, and
   * restoring an old version must re-check it. Without this the guard cannot
   * tell a theme validated yesterday from one validated before the rule
   * existed.
   */
  validatorVersion: z.string().min(1),
  contrastPairs: z.object({ checked: z.number().int().min(0), failed: z.number().int().min(0) }),
  themes: z.array(z.enum(["light", "dark", "high-contrast"])).min(1),
});

export const themeStatusSchema = z.enum(["draft", "published", "archived"]);

export const themeDocumentSchema = z
  .object({
    id: z.string().min(1),
    orgId: z.string().min(1),
    name: z.string().min(1).max(60),
    slug: slugSchema,
    /**
     * Monotonic integer, not semver. A theme is data, and "is this newer" is
     * the only ordering question anyone asks of it.
     */
    version: z.number().int().min(1),
    status: themeStatusSchema,
    tokens: themeTokensSchema,
    assets: themeAssetsSchema.default({ fonts: [], brand: [] }),
    validation: validationRecordSchema.optional(),
    audit: z.object({
      createdBy: z.string().min(1),
      createdAt: z.string().datetime(),
      publishedBy: z.string().optional(),
      publishedAt: z.string().datetime().optional(),
      /** Why a rollback happened. Ten characters because "fix" is not a reason. */
      reason: z.string().min(10).max(280).optional(),
    }),
  })
  .superRefine((theme, ctx) => {
    // A published theme without a validation record would be a theme nothing
    // ever checked, which is the whole failure this system exists to prevent.
    if (theme.status === "published" && !theme.validation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["validation"],
        message:
          "a published theme must carry the validation record that let it publish. Without it there is no evidence the palette was ever checked.",
      });
    }
    if (
      theme.status === "published" &&
      theme.validation &&
      theme.validation.contrastPairs.failed > 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message: `cannot publish with ${theme.validation.contrastPairs.failed} failing contrast pair(s).`,
      });
    }
    if (theme.audit.publishedAt && !theme.audit.publishedBy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["audit", "publishedBy"],
        message: "a publish is attributable or it is not a publish.",
      });
    }
  });

export type ThemeDocument = z.infer<typeof themeDocumentSchema>;
export type ThemeTokens = z.infer<typeof themeTokensSchema>;

/** The three themes every tier is keyed by. */
export type ThemeName = "light" | "dark" | "high-contrast";
export const THEME_NAMES: readonly ThemeName[] = ["light", "dark", "high-contrast"];

/**
 * A token set as it arrives, which is not always as it is stored.
 *
 * Two callers legitimately supply less than the full shape, and neither is a
 * mistake to be typed away:
 *
 *   - **Documents written before the override tiers existed.** They are
 *     `{ ref: … }`, nothing rewrites them, and a published version is
 *     *immutable* by design — so that shape is permanent rather than
 *     transitional.
 *   - **Anything constructing a ramp-only theme**, which is most of them.
 *     Making every call site spell out six empty objects to say "no overrides"
 *     is noise that hides the one call site where the objects are not empty.
 */
export interface ThemeTokensInput {
  ref?: Record<string, Record<string, string>>;
  semantic?: Partial<Record<ThemeName, Record<string, string>>>;
  component?: Partial<Record<ThemeName, Record<string, string>>>;
}

/**
 * A token set with every tier present, whatever it arrived without.
 *
 * The boundary every consumer crosses. Zod's defaults apply on *parse*, and a
 * document coming back out of Mongo is never re-parsed — so reaching into
 * `tokens.semantic.light` without this throws, and it throws in the publish
 * path and the stylesheet route, the two places an exception is least
 * affordable.
 */
export function withTierDefaults(tokens: ThemeTokensInput): ThemeTokens {
  const layer = (value: Partial<Record<ThemeName, Record<string, string>>> | undefined) => ({
    light: value?.light ?? {},
    dark: value?.dark ?? {},
    "high-contrast": value?.["high-contrast"] ?? {},
  });

  return {
    ref: tokens.ref ?? {},
    semantic: layer(tokens.semantic),
    component: layer(tokens.component),
  };
}
export type ThemeStatus = z.infer<typeof themeStatusSchema>;
export type FontFace = z.infer<typeof fontFaceSchema>;
export type ThemeAssets = z.infer<typeof themeAssetsSchema>;
export type BrandAssetFile = z.infer<typeof brandAssetSchema>;
export type IconOverride = z.infer<typeof iconOverrideSchema>;
export type ValidationRecord = z.infer<typeof validationRecordSchema>;
