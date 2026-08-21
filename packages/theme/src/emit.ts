/**
 * A published theme, as the stylesheet a customer's application links.
 *
 *     <link rel="stylesheet" href="/t/northwind/northwind-clinical@7.css">
 *
 * Version-pinned and immutable, which is what makes runtime delivery safe: a
 * theme edit cannot change a running application until somebody moves the pin.
 * That is the property the build-time channel has for free and the reason a
 * naive "latest wins" endpoint would be worse than requiring a deploy.
 *
 * Everything here is string construction over already-validated input, and the
 * escaping is not a formality. A token value reaches this function from a text
 * field, and `--x: red; } body { display: none` in a value would close the rule
 * and open another. Values are parsed and re-serialised, never interpolated.
 */

import { cssVar } from "@oxygenui-design/tokens/validate";
import { TOKEN_SURFACE } from "@oxygenui-design/tokens/surface";
import { iconVar } from "./icons";
import {
  withTierDefaults,
  type BrandAssetFile,
  type FontFace,
  type ThemeDocument,
} from "./document";

/**
 * Characters that can end a declaration or open a new context.
 *
 * A denylist rather than an allowlist because the value space is genuinely
 * open — a font stack contains quotes and commas, a shadow contains parens —
 * so the rule is "may not escape", not "must look like a colour".
 */
const UNSAFE = /[;{}<>]|\/\*|\*\/|url\s*\(|expression\s*\(|@import|javascript:/i;

export class UnsafeTokenValueError extends Error {
  constructor(
    readonly token: string,
    readonly value: string,
  ) {
    super(
      `token "${token}" has a value that could escape its declaration: ${JSON.stringify(value)}. ` +
        "Values are re-serialised rather than interpolated, so anything able to close a rule is refused.",
    );
    this.name = "UnsafeTokenValueError";
  }
}

function safeValue(token: string, value: string): string {
  const trimmed = value.trim();
  if (UNSAFE.test(trimmed)) throw new UnsafeTokenValueError(token, value);
  return trimmed;
}

/** `northwind` + `northwind-clinical` + 7 → the immutable path. */
export function themeHref(orgSlug: string, slug: string, version: number): string {
  return `/t/${orgSlug}/${slug}@${version}.css`;
}

export interface EmitOptions {
  /**
   * The selector the declarations are scoped to.
   *
   * `:root` for a single-tenant application, which is the common case.
   * `[data-ox-brand="…"]` when one page renders two customers' branding, where
   * a root-scoped payload would make the last stylesheet loaded win.
   */
  scope?: string;
  /** Included so a served file says which version it is without a request. */
  header?: boolean;
}

function fontFace(face: FontFace): string {
  // `src` is validated as a URL by the schema; quoting it here is what keeps a
  // URL containing a paren from closing the `url()`.
  const family = safeValue("font-family", face.family);
  return [
    "@font-face {",
    `  font-family: ${JSON.stringify(family)};`,
    `  src: url(${JSON.stringify(face.src)});`,
    `  font-weight: ${safeValue("font-weight", face.weight)};`,
    `  font-style: ${face.style};`,
    // Swap rather than block: a slow font must not blank a clinical value.
    "  font-display: swap;",
    "}",
  ].join("\n");
}

/**
 * Brand artwork, as custom properties.
 *
 * Three named marks plus `--ox-logo`, which is the one a host actually uses:
 * it holds the light mark on the base scope and is redeclared to the dark one
 * under `[data-ox-theme="dark"]`, so a header that writes
 *
 *     background-image: var(--ox-logo);
 *
 * follows the theme without the host writing a single conditional.
 *
 * High-contrast deliberately gets no rule. Its ground is white — `bg` resolves
 * to `ref.white` — so the light mark is already the correct one and inherits.
 * Substituting the mono mark there would be a guess dressed as a feature.
 *
 * What CSS cannot carry is the alternative text, which is why `alt` lives on
 * the document and the JSON export rather than only here. A mark placed as a
 * background image announces nothing; a host that needs it announced has to
 * render an `<img>`, and the document is where it gets the words.
 */
function logoDeclarations(assets: readonly BrandAssetFile[]): {
  base: string[];
  dark: string[];
} {
  const base: string[] = [];
  const dark: string[] = [];

  for (const asset of assets) {
    // Quoted the way `fontFace` quotes `src`: it is what stops a URL containing
    // a paren from closing the `url()` and letting arbitrary CSS in after it.
    const url = `url(${JSON.stringify(asset.src)})`;

    /*
     * Only the three marks become custom properties.
     *
     * A favicon is placed by a `<link>` and a link-preview card by a `<meta>`;
     * neither is ever drawn by CSS, and emitting them as variables would put
     * two unusable declarations in every customer's stylesheet forever. They
     * are delivered by the JSON manifest instead, which is also the only place
     * their alternative text can travel.
     */
    if (asset.role === "mark-light") {
      base.push(`  --ox-logo-light: ${url};`, `  --ox-logo: ${url};`);
    } else if (asset.role === "mark-dark") {
      base.push(`  --ox-logo-dark: ${url};`);
      dark.push(`  --ox-logo: ${url};`);
    } else if (asset.role === "mark-mono") {
      base.push(`  --ox-logo-mono: ${url};`);
    } else if (asset.role === "letterhead" || asset.role === "watermark-draft") {
      /*
       * Declared like an illustration and used only by `@media print`.
       *
       * Emitted at the root rather than under a theme, because paper has one
       * ground: a customer working in the dark theme still prints on white,
       * and a letterhead that followed the screen theme would come out
       * reversed on the page.
       */
      base.push(`  --ox-${asset.role}: ${url};`);
    } else if (asset.role.startsWith("illustration-")) {
      /*
       * One declaration, at the root, for every theme.
       *
       * Unlike the mark there is no per-theme variant to switch to: an
       * illustration is a single file that has to work on both grounds, which
       * is exactly why the app previews it on both. Emitting a dark
       * override here would invent a second file nobody uploaded.
       */
      base.push(`  --ox-${asset.role}: ${url};`);
    }
  }

  return { base, dark };
}

/**
 * Where each theme's overrides are scoped.
 *
 * The shipped `oxygen-tokens.css` switches themes on `[data-ox-theme]`, and a
 * customer's overrides have to land in the same place or they would apply in
 * all three — which is exactly the failure the per-theme shape exists to
 * prevent, reintroduced at the last step.
 *
 * Light is written to the bare scope as well as its attribute, because light is
 * the default: a page that sets no `data-ox-theme` still gets it.
 */
const THEME_SELECTOR = {
  light: "",
  dark: '[data-ox-theme="dark"]',
  "high-contrast": '[data-ox-theme="high-contrast"]',
} as const;

/**
 * The stylesheet for one published theme.
 *
 * Three tiers now, and the order they are written in is the order the cascade
 * resolves them: the primitive ramp first, then semantic overrides, then
 * component ones. Each is more specific than the last in *meaning* rather than
 * in selector weight, so a customer who overrides both `accent` and
 * `--ox-badge-accent-bg` gets the badge value on the badge and the accent
 * everywhere else, which is what they asked for.
 *
 * What the emitter still cannot write is a clinical token, in any tier. That is
 * enforced twice before here — by the document schema and by `validateTheme` —
 * and remains true here by construction: nothing in this function can emit a
 * key the document does not carry.
 */
export function emitThemeCss(theme: ThemeDocument, options: EmitOptions = {}): string {
  const { scope = ":root", header = true } = options;
  const tokens = withTierDefaults(theme.tokens);
  const out: string[] = [];

  if (header) {
    out.push(
      "/*",
      ` * ${theme.name}`,
      ` * ${theme.slug}@${theme.version} · ${theme.status}`,
      theme.validation
        ? ` * validated ${theme.validation.validatedAt} by validator ${theme.validation.validatorVersion}` +
            ` · ${theme.validation.contrastPairs.checked} contrast pairs, ${theme.validation.contrastPairs.failed} failing`
        : " * not validated",
      " *",
      " * Immutable. Generated — edit the theme, publish, and link the new version.",
      " */",
      "",
    );
  }

  for (const face of theme.assets.fonts) out.push(fontFace(face), "");

  const declarations: string[] = [];
  for (const [group, steps] of Object.entries(tokens.ref)) {
    for (const [step, value] of Object.entries(steps)) {
      const token = cssVar(`ref.${group}.${step}`);
      declarations.push(`  ${token}: ${safeValue(token, value)};`);
    }
  }

  if (theme.assets.fonts.length > 0) {
    const family = theme.assets.fonts[0]?.family;
    if (family) {
      declarations.push(
        `  --ox-font-sans: ${JSON.stringify(safeValue("--ox-font-sans", family))}, ui-sans-serif, system-ui, sans-serif;`,
      );
    }
  }

  const logos = logoDeclarations(theme.assets.brand ?? []);
  declarations.push(...logos.base);

  /*
   * Replaced glyphs, as mask sources.
   *
   * One declaration per slot and nothing else: the component stylesheet reads
   * `mask-image: var(--ox-icon-send, <built-in>)`, so an unset property means
   * the shipped glyph and a set one means theirs. The switching is the same
   * `var()` fallback every token in this system already relies on, which is
   * why this needs no runtime and reaches the copied Tailwind skin and any
   * framework bridge without either of them knowing the feature exists.
   *
   * Not scoped per theme. A glyph is a shape, and the shape does not change
   * between light and dark — only its colour does, and that comes from
   * `currentColor` on the element rather than from here.
   */
  for (const icon of theme.assets.icons ?? []) {
    declarations.push(`  ${iconVar(icon.slot)}: url(${JSON.stringify(icon.src)});`);
  }

  // Sorted so a diff between two versions is a diff in values, never in order.
  declarations.sort();

  out.push(`${scope} {`, ...declarations, "}", "");

  /*
   * Semantic and component overrides, per theme.
   *
   * Emitted after the ramp block and scoped by `data-ox-theme`, so the light
   * set rides on the base scope and the other two only apply where the host has
   * actually selected them.
   */
  for (const [name, selector] of Object.entries(THEME_SELECTOR)) {
    const layer = name as keyof typeof THEME_SELECTOR;
    const scoped: string[] = [];

    // The reversed mark, where the ground it is for actually applies.
    if (layer === "dark") scoped.push(...logos.dark);

    for (const [path, value] of Object.entries(tokens.semantic[layer])) {
      const token = cssVar(path);
      scoped.push(`  ${token}: ${safeValue(token, value)};`);
    }
    // Keyed by the custom property already, because a component token declared
    // in a stylesheet has no DTCG path to convert from — the property name is
    // the only key both tiers share.
    for (const [token, value] of Object.entries(tokens.component[layer])) {
      scoped.push(`  ${token}: ${safeValue(token, value)};`);
    }

    /*
     * The dependent component tokens, but only when this is not the root.
     *
     * A `var()` resolves at the element that *declares* it, and the component
     * tier is declared once at `:root` — `--ox-switch-track-on-bg:
     * var(--ox-accent)`. Overriding `--ox-accent` on a subtree therefore
     * changes `--ox-accent` there and leaves every component token holding the
     * value it already computed at the root. The subtree gets a new accent and
     * components that ignore it.
     *
     * So a scoped payload re-declares the chain: for each semantic token this
     * theme overrides, every component token that falls through to it is
     * re-stated inside the scope, where it resolves against the local value.
     *
     * Skipped entirely at `:root`, where the original declarations already sit
     * and restating them would double the payload to no effect. That is why
     * publishing was never broken by this — `emitThemeCss` writes to `:root`
     * unless somebody asks otherwise, and until now asking otherwise quietly
     * produced a stylesheet that only half worked.
     */
    if (scope !== ":root") {
      const overridden = new Set(Object.keys(tokens.semantic[layer]).map((path) => cssVar(path)));
      const alreadySet = new Set(Object.keys(tokens.component[layer]));

      for (const entry of TOKEN_SURFACE) {
        if (!entry.semantic || !overridden.has(entry.semantic)) continue;
        // An explicit component override wins; re-stating the fallthrough would
        // overwrite the value the customer actually chose.
        if (alreadySet.has(entry.name)) continue;
        scoped.push(`  ${entry.name}: var(${entry.semantic});`);
      }
    }

    if (scoped.length === 0) continue;
    scoped.sort();
    out.push(`${scope}${selector} {`, ...scoped, "}", "");
  }

  return out.join("\n");
}

/**
 * Cache headers for an immutable, version-pinned payload.
 *
 * A year and `immutable` because the URL carries the version: the bytes at
 * this path cannot change, so a revalidation request would never do anything
 * but cost a round trip. Moving a customer to a new theme is a new URL.
 */
export function themeCacheHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/css; charset=utf-8",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
}
