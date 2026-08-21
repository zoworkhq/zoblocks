/**
 * The served stylesheet, and the escaping that makes it safe to serve.
 *
 * A token value arrives here from a text field a customer typed into. If it
 * were interpolated, `red; } body { display: none` would close the rule and
 * open another — CSS injection into a page that is, for a multi-tenant host,
 * somebody else's. The escaping tests are the ones that matter most in this
 * file.
 */

import { describe, expect, it } from "vitest";
import {
  brandAssetSchema,
  UnsafeTokenValueError,
  VALIDATOR_VERSION,
  emitThemeCss,
  themeCacheHeaders,
  themeHref,
} from "../src/index";
import { publishedTheme } from "./fixture";

describe("themeHref", () => {
  it("carries the version, which is what makes the payload immutable", () => {
    expect(themeHref("northwind", "northwind-clinical", 7)).toBe(
      "/t/northwind/northwind-clinical@7.css",
    );
  });
});

describe("emitThemeCss", () => {
  it("writes the primitive ramp as custom properties", () => {
    const css = emitThemeCss(publishedTheme());
    expect(css).toContain("--ox-ref-brand-600: #1d63c9;");
    expect(css).toContain("--ox-ref-brand-700: #1a53a8;");
  });

  /**
   * A clinical token is never emitted, in any tier.
   *
   * This assertion used to be "no semantic token is emitted at all", which was
   * the same guarantee expressed as a much wider ban — correct while a theme
   * could only carry a ramp, and wrong once it could carry semantic and
   * component overrides. The narrow rule is the one that was always the point:
   * a customer may move their accent, and may not redefine what critical means.
   */
  it("emits no clinical token, so a theme cannot redefine what critical means", () => {
    const theme = publishedTheme();
    theme.tokens.semantic.light["accent"] = "#0b6bcb";
    theme.tokens.component.dark["--ox-badge-accent-bg"] = "#123456";

    const css = emitThemeCss(theme);
    expect(css).not.toContain("--ox-status-");
    expect(css).not.toContain("--ox-flag-");
  });

  it("writes semantic overrides, scoped to the theme they belong to", () => {
    const theme = publishedTheme();
    theme.tokens.semantic.light["accent"] = "#0b6bcb";
    theme.tokens.semantic.dark["accent"] = "#7dd3fc";

    const css = emitThemeCss(theme, { header: false });

    // Light rides the bare scope: a page that sets no `data-ox-theme` is light.
    expect(css).toContain(":root {\n  --ox-accent: #0b6bcb;\n}");
    expect(css).toContain(':root[data-ox-theme="dark"] {\n  --ox-accent: #7dd3fc;\n}');
  });

  it("writes component overrides under the same theme scope", () => {
    const theme = publishedTheme();
    theme.tokens.component["high-contrast"]["--ox-badge-accent-bg"] = "#000000";

    expect(emitThemeCss(theme, { header: false })).toContain(
      ':root[data-ox-theme="high-contrast"] {\n  --ox-badge-accent-bg: #000000;\n}',
    );
  });

  /**
   * Themes stored before the two override tiers existed are `{ ref: … }`, and a
   * published version is immutable — so that shape is permanent, not
   * transitional, and the emitter meets it on the stylesheet route.
   */
  it("emits a theme stored before the override tiers existed", () => {
    const theme = publishedTheme();
    // Exactly what such a document looks like coming back out of Mongo.
    (theme as { tokens: unknown }).tokens = { ref: { brand: { "600": "#1d63c9" } } };

    expect(() => emitThemeCss(theme)).not.toThrow();
    expect(emitThemeCss(theme)).toContain("--ox-ref-brand-600: #1d63c9;");
  });

  it("scopes to :root by default and to a brand selector on request", () => {
    expect(emitThemeCss(publishedTheme())).toContain(":root {");
    expect(
      emitThemeCss(publishedTheme(), { scope: '[data-ox-brand="northwind-clinical"]' }),
    ).toContain('[data-ox-brand="northwind-clinical"] {');
  });

  /**
   * The defect recorded in ADR 0014, now closed.
   *
   * A `var()` resolves at the element that *declares* it, and the component
   * tier is declared once at `:root` — `--ox-switch-track-on-bg:
   * var(--ox-accent)`. Overriding `--ox-accent` on a subtree moved the accent
   * there and left every component token holding the value it had already
   * computed at the root, so a scoped payload produced a subtree with a new
   * brand and components that ignored it.
   *
   * Publishing was never affected, because `emitThemeCss` writes to `:root`
   * unless asked otherwise — which is exactly why it went unnoticed.
   */
  describe("a scoped payload", () => {
    const SCOPE = '[data-ox-brand="northwind-clinical"]';

    const withAccent = () => {
      const theme = publishedTheme();
      return {
        ...theme,
        tokens: {
          ...theme.tokens,
          semantic: { ...theme.tokens.semantic, light: { accent: "#1d63c9" } },
        },
      };
    };

    it("re-declares the component tokens that fall through to an overridden semantic", () => {
      const css = emitThemeCss(withAccent(), { header: false, scope: SCOPE });

      // Not merely present — resolved *inside* the scope, which is the only
      // place the local value exists.
      expect(css).toMatch(/--ox-[a-z0-9-]+:\s*var\(--ox-accent\);/);
      expect(css).toContain(SCOPE);
    });

    it("does not restate them at :root, where they already resolve", () => {
      const css = emitThemeCss(withAccent(), { header: false });

      // Doubling the payload to redeclare what the base stylesheet already
      // says would cost every customer bytes for nothing.
      expect(css).not.toMatch(/--ox-[a-z0-9-]+:\s*var\(--ox-accent\);/);
    });

    it("leaves an explicit component override alone", () => {
      const theme = publishedTheme();
      const [first] = Object.keys(theme.tokens.component?.light ?? {});
      const scoped = {
        ...theme,
        tokens: {
          ...theme.tokens,
          semantic: { ...theme.tokens.semantic, light: { accent: "#1d63c9" } },
        },
      };
      const css = emitThemeCss(scoped, { header: false, scope: SCOPE });

      // A customer who set a component token explicitly must not have it
      // overwritten by the fallthrough that token exists to escape.
      if (first) {
        const explicit = new RegExp(`${first}:\\s*var\\(`);
        expect(css).not.toMatch(explicit);
      }
    });
  });

  it("sorts declarations, so a version diff is a diff in values not in order", () => {
    const css = emitThemeCss(publishedTheme(), { header: false });
    const lines = css.split("\n").filter((l) => l.includes("--ox-"));
    expect(lines).toEqual([...lines].sort());
  });

  it("states the version and the validator in the header", () => {
    const css = emitThemeCss(publishedTheme());
    expect(css).toContain("northwind-clinical@7");
    // The current validator, not a literal — the point of the assertion is that
    // the header names whichever validator passed the theme, so that a served
    // file answers "what checked this" without a database lookup.
    expect(css).toContain(`validator ${VALIDATOR_VERSION}`);
  });

  it("emits a font face with swap, so a slow font never blanks a value", () => {
    const theme = publishedTheme();
    theme.assets.fonts = [
      {
        family: "Northwind Sans",
        src: "https://cdn.example.test/nw.woff2",
        weight: "400 700",
        style: "normal",
      },
    ];
    const css = emitThemeCss(theme);
    expect(css).toContain("@font-face");
    expect(css).toContain('font-family: "Northwind Sans"');
    expect(css).toContain("font-display: swap");
    expect(css).toContain("--ox-font-sans:");
  });

  /**
   * The reversed mark has to land under the ground it is for.
   *
   * Emitting both at `:root` would make whichever came last win in both
   * themes, which is the failure the whole per-theme shape exists to prevent —
   * and it fails silently, as a dark logo that looks fine on the light page it
   * was tested on.
   */
  it("switches the brand mark with the theme, without the host writing a rule", () => {
    const theme = publishedTheme();
    theme.assets.brand = [
      {
        role: "mark-light",
        sha256: "a".repeat(64),
        format: "svg",
        src: "/f/northwind/" + "a".repeat(64) + ".svg",
        alt: "Northwind Health",
        uploadedAt: "2026-08-20T00:00:00.000Z",
      },
      {
        role: "mark-dark",
        sha256: "b".repeat(64),
        format: "svg",
        src: "/f/northwind/" + "b".repeat(64) + ".svg",
        alt: "Northwind Health",
        uploadedAt: "2026-08-20T00:00:00.000Z",
      },
    ];

    const css = emitThemeCss(theme);
    const root = css.slice(css.indexOf(":root {"), css.indexOf('[data-ox-theme="dark"]'));
    const dark = css.slice(css.indexOf('[data-ox-theme="dark"]'));

    // The light mark is the default, and both are addressable by name.
    expect(root).toContain(`--ox-logo: url("/f/northwind/${"a".repeat(64)}.svg")`);
    expect(root).toContain("--ox-logo-light:");
    expect(root).toContain("--ox-logo-dark:");

    // The reversed one only applies where the dark ground does.
    expect(dark).toContain(`--ox-logo: url("/f/northwind/${"b".repeat(64)}.svg")`);
    expect(root).not.toContain(`--ox-logo: url("/f/northwind/${"b".repeat(64)}.svg")`);

    /*
     * High-contrast gets no rule on purpose. Its `bg` is `ref.white`, so the
     * light mark is already correct there and inherits; substituting the mono
     * mark would be a guess wearing a feature's clothes.
     */
    const hc = css.slice(css.indexOf('[data-ox-theme="high-contrast"]'));
    expect(hc).not.toContain("--ox-logo:");
  });

  /**
   * A replaced glyph reaches the stylesheet a customer's application fetches.
   *
   * The whole mechanism is one `var()` fallback — `mask-image: var(--ox-icon-send,
   * <built-in>)` — so the only thing this end has to do is declare the property.
   * If it does not, every part of the feature still works: the upload succeeds,
   * the file is stored, the app grid shows the new glyph, and the customer's
   * toolbar never changes.
   */
  it("declares a replaced glyph, so the override actually reaches a host", () => {
    const theme = publishedTheme();
    theme.assets.icons = [
      {
        slot: "send",
        sha256: "d".repeat(64),
        src: `/f/northwind/${"d".repeat(64)}.svg`,
        uploadedAt: "2026-08-20T00:00:00.000Z",
      },
    ] as typeof theme.assets.icons;

    const css = emitThemeCss(theme);
    expect(css).toContain(`--ox-icon-send: url("/f/northwind/${"d".repeat(64)}.svg")`);

    // At the root and once: a glyph is a shape, and a shape does not change
    // between light and dark — only the colour does, and that is currentColor.
    expect(css.match(/--ox-icon-send:/g)).toHaveLength(1);
  });

  /**
   * An illustration is declared once and never overridden per theme.
   *
   * There is no second file to switch to — that is the whole reason the app
   * previews it on both grounds — so emitting a dark override would invent an
   * asset nobody uploaded.
   */
  it("declares an illustration once, for every theme", () => {
    const theme = publishedTheme();
    theme.assets.brand = [
      {
        role: "illustration-empty",
        sha256: "c".repeat(64),
        format: "svg",
        src: "/f/northwind/" + "c".repeat(64) + ".svg",
        alt: "An empty filing tray",
        uploadedAt: "2026-08-20T00:00:00.000Z",
      },
    ];

    const css = emitThemeCss(theme);
    expect(css.match(/--ox-illustration-empty:/g)).toHaveLength(1);

    const root = css.slice(css.indexOf(":root {"), css.indexOf('[data-ox-theme="dark"]'));
    expect(root).toContain("--ox-illustration-empty:");
  });
});

describe("brand artwork cannot escape its url()", () => {
  /**
   * The one value in the document that is written into `url(...)` rather than
   * through `safeValue`, and it arrives from an imported file a customer
   * supplied. So the schema decides which schemes may appear, before the
   * emitter ever sees the string.
   */
  const logo = (src: string) =>
    brandAssetSchema.safeParse({
      role: "mark-light",
      sha256: "a".repeat(64),
      format: "svg",
      src,
      alt: "",
      uploadedAt: "2026-08-20T00:00:00.000Z",
    });

  it("takes a same-origin path and an https URL", () => {
    expect(logo("/f/northwind/" + "a".repeat(64) + ".svg").success).toBe(true);
    expect(logo("https://cdn.example.test/mark.svg").success).toBe(true);
  });

  for (const [what, src] of [
    ["a javascript: URL", "javascript:alert(1)"],
    [
      "a data: URL, which would smuggle a document past the upload check",
      "data:image/svg+xml,<svg/>",
    ],
    ["plain http, which would break the page on an https host", "http://cdn.example.test/m.svg"],
    ["a closing paren, which would end the url() early", "/f/x/a.svg)}body{display:none"],
    ["a quote, which would end the string early", '/f/x/a".svg'],
  ] as const) {
    it(`refuses ${what}`, () => {
      expect(logo(src).success).toBe(false);
    });
  }
});

describe("values cannot escape their declaration", () => {
  const hostile = (value: string) => {
    const theme = publishedTheme();
    theme.tokens.ref.brand = { "600": value };
    return () => emitThemeCss(theme);
  };

  it("refuses a value that closes the declaration", () => {
    expect(hostile("red; } body { display: none")).toThrow(UnsafeTokenValueError);
  });

  it("refuses a value that opens a comment", () => {
    expect(hostile("red /* swallow the rest")).toThrow(UnsafeTokenValueError);
  });

  it("refuses url(), which can fetch from a third party", () => {
    expect(hostile("url(https://evil.test/x)")).toThrow(UnsafeTokenValueError);
  });

  it("refuses @import", () => {
    expect(hostile('@import "https://evil.test/x.css"')).toThrow(UnsafeTokenValueError);
  });

  it("refuses a javascript: scheme and legacy expression()", () => {
    expect(hostile("javascript:alert(1)")).toThrow(UnsafeTokenValueError);
    expect(hostile("expression(alert(1))")).toThrow(UnsafeTokenValueError);
  });

  it("refuses angle brackets, which can break out of a <style> element", () => {
    expect(hostile("</style><script>alert(1)</script>")).toThrow(UnsafeTokenValueError);
  });

  it("names the token and the value, so the report is actionable", () => {
    try {
      hostile("red; }")();
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as UnsafeTokenValueError).token).toBe("--ox-ref-brand-600");
      expect((error as Error).message).toContain("escape its declaration");
    }
  });

  it("still allows the ordinary values a palette contains", () => {
    const theme = publishedTheme();
    theme.tokens.ref.brand = { "600": "#1d63c9", "700": "  #1a53a8  " };
    expect(() => emitThemeCss(theme)).not.toThrow();
    expect(emitThemeCss(theme)).toContain("--ox-ref-brand-700: #1a53a8;");
  });
});

describe("cache headers", () => {
  /**
   * A year and `immutable` because the version is in the URL: the bytes cannot
   * change, so a revalidation would never do anything but cost a round trip.
   */
  it("are immutable, typed, and refuse sniffing", () => {
    const headers = themeCacheHeaders();
    expect(headers["Cache-Control"]).toContain("immutable");
    expect(headers["Cache-Control"]).toContain("max-age=31536000");
    expect(headers["Content-Type"]).toBe("text/css; charset=utf-8");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });
});
