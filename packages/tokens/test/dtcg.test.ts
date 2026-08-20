/**
 * The W3C DTCG format, both directions.
 *
 * The audit's finding was that `dimension`, `duration`, `cubicBezier` and
 * `shadow` used raw CSS strings where the spec requires structured objects, and
 * that the loader coerced with `String($value)` — so a spec-compliant file
 * parsed to `"[object Object]"`, emitted a custom property with a meaningless
 * value, and rendered as nothing. No error, no warning.
 *
 * The last describe block is the one that matters: every token in the shipped
 * source, out to the spec form and back, must come back identical. That is what
 * "a customer's Tokens Studio export round-trips" means, checked rather than
 * asserted.
 */

import { describe, expect, it } from "vitest";
import {
  flattenDtcg,
  fromDtcg,
  parseCubicBezier,
  parseDimension,
  parseDuration,
  parseShadow,
  toDtcg,
} from "../src/validate";

describe("dimension", () => {
  it("reads px and rem", () => {
    expect(parseDimension("16px")).toEqual({ value: 16, unit: "px" });
    expect(parseDimension("0.875rem")).toEqual({ value: 0.875, unit: "rem" });
  });

  it("reads a negative value", () => {
    expect(parseDimension("-2px")).toEqual({ value: -2, unit: "px" });
  });

  it("refuses a unit the spec does not carry", () => {
    for (const bad of ["16", "16em", "100%", "16 px", "calc(1rem + 2px)"]) {
      expect(parseDimension(bad), bad).toBeUndefined();
    }
  });

  it("round-trips", () => {
    for (const css of ["16px", "0.875rem", "-2px", "0px"]) {
      expect(fromDtcg(toDtcg("dimension", css)), css).toBe(css);
    }
  });
});

describe("duration", () => {
  it("reads ms and s", () => {
    expect(parseDuration("120ms")).toEqual({ value: 120, unit: "ms" });
    expect(parseDuration("0.2s")).toEqual({ value: 0.2, unit: "s" });
  });

  it("refuses a bare number", () => {
    expect(parseDuration("120")).toBeUndefined();
  });

  it("round-trips", () => {
    for (const css of ["120ms", "0.2s", "0ms"]) {
      expect(fromDtcg(toDtcg("duration", css)), css).toBe(css);
    }
  });
});

describe("cubicBezier", () => {
  it("reads four numbers", () => {
    expect(parseCubicBezier("cubic-bezier(0.22, 1, 0.36, 1)")).toEqual([0.22, 1, 0.36, 1]);
  });

  it("reads negative control points, which are legal", () => {
    expect(parseCubicBezier("cubic-bezier(-0.1, 0, 0.2, 1)")).toEqual([-0.1, 0, 0.2, 1]);
  });

  it("refuses a keyword", () => {
    expect(parseCubicBezier("ease-in-out")).toBeUndefined();
  });

  it("round-trips", () => {
    const css = "cubic-bezier(0.22, 1, 0.36, 1)";
    expect(fromDtcg(toDtcg("cubicBezier", css))).toBe(css);
  });
});

describe("shadow", () => {
  it("reads offsets, blur, spread and colour", () => {
    expect(parseShadow("0px 1px 2px 0px rgb(8 17 15 / 0.05)")).toEqual({
      color: "rgb(8 17 15 / 0.05)",
      offsetX: { value: 0, unit: "px" },
      offsetY: { value: 1, unit: "px" },
      blur: { value: 2, unit: "px" },
      spread: { value: 0, unit: "px" },
    });
  });

  it("defaults blur and spread when they are omitted", () => {
    const shadow = parseShadow("0px 1px #000000");
    expect(shadow?.blur).toEqual({ value: 0, unit: "px" });
    expect(shadow?.spread).toEqual({ value: 0, unit: "px" });
  });

  it("carries inset", () => {
    expect(parseShadow("inset 0px 1px 2px 0px #000000")?.inset).toBe(true);
  });

  /**
   * A multi-layer shadow silently reduced to its first layer is worse than one
   * that admits it needs a person.
   */
  it("refuses a multi-layer shadow rather than dropping a layer", () => {
    expect(parseShadow("0px 1px 2px #000, 0px 4px 8px #111")).toBeUndefined();
  });

  it("refuses `none`", () => {
    expect(parseShadow("none")).toBeUndefined();
  });

  it("round-trips", () => {
    const css = "0px 1px 2px 0px rgb(8 17 15 / 0.05)";
    expect(fromDtcg(toDtcg("shadow", css))).toBe(css);
  });
});

describe("fontFamily", () => {
  it("becomes the spec's array form", () => {
    expect(toDtcg("fontFamily", 'ui-sans-serif, "Segoe UI", sans-serif')).toEqual([
      "ui-sans-serif",
      "Segoe UI",
      "sans-serif",
    ]);
  });

  it("re-quotes a family whose name contains a space", () => {
    expect(fromDtcg(["ui-sans-serif", "Segoe UI"])).toBe('ui-sans-serif, "Segoe UI"');
  });
});

describe("aliases", () => {
  /**
   * Resolving a reference at export would flatten exactly the indirection that
   * makes a token system worth having — the customer would receive literals
   * where they authored a semantic link.
   */
  it("stay references, whatever the type says", () => {
    expect(toDtcg("shadow", "{shadow-sm}")).toBe("{shadow-sm}");
    expect(toDtcg("dimension", "{ref.size.md}")).toBe("{ref.size.md}");
  });
});

describe("the loader reads the spec form", () => {
  /** The bug: `String({value:120,unit:"ms"})` is `"[object Object]"`. */
  it("reads a structured duration rather than stringifying the object", () => {
    const out = flattenDtcg(
      { motion: { $type: "duration", fast: { $value: { value: 120, unit: "ms" } } } } as never,
      "import.json",
    );
    expect(out.get("motion.fast")?.value).toBe("120ms");
  });

  it("reads a structured dimension", () => {
    const out = flattenDtcg(
      { size: { $type: "dimension", md: { $value: { value: 1, unit: "rem" } } } } as never,
      "import.json",
    );
    expect(out.get("size.md")?.value).toBe("1rem");
  });

  it("reads a cubic-bezier as four numbers", () => {
    const out = flattenDtcg(
      { ease: { $type: "cubicBezier", $value: [0.22, 1, 0.36, 1] } } as never,
      "import.json",
    );
    expect(out.get("ease")?.value).toBe("cubic-bezier(0.22, 1, 0.36, 1)");
  });

  it("reads a structured shadow", () => {
    const out = flattenDtcg(
      {
        sm: {
          $type: "shadow",
          $value: {
            color: "#00000010",
            offsetX: { value: 0, unit: "px" },
            offsetY: { value: 1, unit: "px" },
            blur: { value: 2, unit: "px" },
            spread: { value: 0, unit: "px" },
          },
        },
      } as never,
      "import.json",
    );
    expect(out.get("sm")?.value).toBe("0px 1px 2px 0px #00000010");
  });

  it("still reads the CSS-string form the repository authors today", () => {
    const out = flattenDtcg(
      { motion: { $type: "duration", fast: { $value: "120ms" } } } as never,
      "source.json",
    );
    expect(out.get("motion.fast")?.value).toBe("120ms");
  });

  it("never produces the string that used to ship", () => {
    const out = flattenDtcg(
      { a: { $type: "duration", $value: { value: 1, unit: "s" } } } as never,
      "f",
    );
    expect(out.get("a")?.value).not.toContain("[object Object]");
  });
});

describe("the shipped source round-trips", () => {
  /**
   * The claim, over every token that actually exists. Out to the spec form and
   * back must be identical, or a customer's export and re-import silently
   * changes their palette.
   */
  it("returns every value unchanged", async () => {
    const { loadTokenSource } = await import("../../../scripts/gen/tokens/load");
    const source = await loadTokenSource();

    const maps = [
      source.primitive,
      source.shared,
      source.component,
      source.semantic.light,
      source.semantic.dark,
      source.semantic["high-contrast"],
      ...Object.values(source.density),
    ];

    const damaged: string[] = [];
    let checked = 0;

    for (const map of maps) {
      for (const token of map.values()) {
        checked++;
        const round = fromDtcg(toDtcg(token.type, token.value));
        if (round !== token.value) damaged.push(`${token.path}: ${token.value} → ${round}`);
      }
    }

    expect(checked).toBeGreaterThan(500);
    expect(damaged).toEqual([]);
  });
});
