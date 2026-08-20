/**
 * The W3C DTCG format, at the boundary.
 *
 * The spec does not want `"120ms"`. It wants `{ "value": 120, "unit": "ms" }`,
 * and it wants a cubic-bezier as four numbers and a shadow as an object with
 * named offsets. Our source has always used CSS strings, which is why
 * `packages/tokens/tokens/` parses to `"[object Object]"` under a
 * spec-compliant reader and why Tokens Studio, Style Dictionary v4 and Figma
 * Variables would mangle an export.
 *
 * The fix is deliberately at the edges rather than in the middle. Internally a
 * token value stays a CSS string, because that is what the CSS emitters need
 * and rewriting 543 values to carry a unit they immediately re-concatenate
 * would buy nothing. What changes is that **export serialises to the spec form
 * and import reads it**, so a customer's file round-trips through Tokens Studio
 * and comes back meaning the same thing.
 *
 * `color` and `fontFamily` already round-trip: the spec accepts a hex string
 * for the first, and an array or a comma-separated string for the second.
 */

/** A DTCG `dimension`: a number and a unit, never a string. */
export interface DtcgDimension {
  value: number;
  unit: "px" | "rem";
}

/** A DTCG `duration`. */
export interface DtcgDuration {
  value: number;
  unit: "ms" | "s";
}

/** A DTCG `cubicBezier`: exactly four numbers. */
export type DtcgCubicBezier = [number, number, number, number];

/** A DTCG `shadow`. `color` stays a hex string, which the spec allows. */
export interface DtcgShadow {
  color: string;
  offsetX: DtcgDimension;
  offsetY: DtcgDimension;
  blur: DtcgDimension;
  spread: DtcgDimension;
  inset?: boolean;
}

export type DtcgValue =
  string | number | DtcgDimension | DtcgDuration | DtcgCubicBezier | DtcgShadow | readonly string[];

const DIMENSION = /^(-?[\d.]+)(px|rem)$/;
const DURATION = /^(-?[\d.]+)(ms|s)$/;
const BEZIER = /^cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)$/;

export function parseDimension(css: string): DtcgDimension | undefined {
  const match = DIMENSION.exec(css.trim());
  if (!match?.[1] || !match[2]) return undefined;
  return { value: Number(match[1]), unit: match[2] as DtcgDimension["unit"] };
}

export function parseDuration(css: string): DtcgDuration | undefined {
  const match = DURATION.exec(css.trim());
  if (!match?.[1] || !match[2]) return undefined;
  return { value: Number(match[1]), unit: match[2] as DtcgDuration["unit"] };
}

export function parseCubicBezier(css: string): DtcgCubicBezier | undefined {
  const match = BEZIER.exec(css.trim());
  if (!match) return undefined;
  const numbers = match.slice(1, 5).map(Number);
  if (numbers.some(Number.isNaN)) return undefined;
  return numbers as DtcgCubicBezier;
}

const ZERO: DtcgDimension = { value: 0, unit: "px" };

/**
 * `0 1px 2px 0 rgb(8 17 15 / 0.05)` → the structured form.
 *
 * Only a single-layer shadow with a trailing colour is handled, which is every
 * shadow the palette actually contains. A multi-layer value returns undefined
 * rather than a wrong answer — a shadow silently reduced to its first layer is
 * worse than one that admits it needs a person.
 */
export function parseShadow(css: string): DtcgShadow | undefined {
  const trimmed = css.trim();
  if (trimmed === "none" || trimmed.includes("),")) return undefined;

  const inset = /^inset\s+/.test(trimmed);
  const body = trimmed.replace(/^inset\s+/, "");

  // The colour is whatever follows the last dimension: either a function call
  // or a hex literal.
  const colourMatch = /((?:rgba?|hsla?|oklch|color-mix)\([^)]*\)|#[0-9a-fA-F]{3,8})\s*$/.exec(body);
  if (!colourMatch?.[1]) return undefined;

  const lengths = body.slice(0, colourMatch.index).trim().split(/\s+/).filter(Boolean);
  if (lengths.length < 2 || lengths.length > 4) return undefined;

  const parsed = lengths.map(parseDimension);
  if (parsed.some((d) => d === undefined)) return undefined;

  const [offsetX, offsetY, blur = ZERO, spread = ZERO] = parsed as DtcgDimension[];
  return {
    color: colourMatch[1],
    offsetX: offsetX as DtcgDimension,
    offsetY: offsetY as DtcgDimension,
    blur,
    spread,
    ...(inset ? { inset: true } : {}),
  };
}

/**
 * A CSS value to its spec form, for export.
 *
 * Returns the string unchanged when the type does not call for a structured
 * value, or when the value is an alias — `{status.critical}` is a reference and
 * stays one, because resolving it at export would flatten exactly the
 * indirection that makes a token system worth having.
 */
export function toDtcg(type: string | undefined, css: string): DtcgValue {
  if (/^\{[^}]+\}$/.test(css.trim())) return css;

  switch (type) {
    case "dimension":
      return parseDimension(css) ?? css;
    case "duration":
      return parseDuration(css) ?? css;
    case "cubicBezier":
      return parseCubicBezier(css) ?? css;
    case "shadow":
      return parseShadow(css) ?? css;
    case "fontFamily":
      // The spec's array form. A comma-separated string is also legal, but the
      // array is what a tool round-trips without re-splitting on a comma that
      // might sit inside a quoted family name.
      return css.split(",").map((family) => family.trim().replace(/^["']|["']$/g, ""));
    default:
      return css;
  }
}

/**
 * The spec form back to a CSS value, for import.
 *
 * The inverse of `toDtcg`, and the half that matters more: a customer's file
 * arrives from Tokens Studio in structured form, and everything downstream —
 * the gate, the emitters, the bridges — speaks CSS.
 */
export function fromDtcg(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);

  if (Array.isArray(value)) {
    // cubicBezier is four numbers; fontFamily is a list of names.
    if (value.length === 4 && value.every((v) => typeof v === "number")) {
      return `cubic-bezier(${value.join(", ")})`;
    }
    return value
      .map((family) => (/\s/.test(String(family)) ? `"${family}"` : String(family)))
      .join(", ");
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (typeof record.value === "number" && typeof record.unit === "string") {
      return `${record.value}${record.unit}`;
    }

    if (record.color && record.offsetX) {
      const length = (d: unknown) => {
        const dim = d as DtcgDimension | undefined;
        return dim ? `${dim.value}${dim.unit}` : "0px";
      };
      const parts = [
        length(record.offsetX),
        length(record.offsetY),
        length(record.blur),
        length(record.spread),
        String(record.color),
      ];
      return `${record.inset ? "inset " : ""}${parts.join(" ")}`;
    }
  }

  // Anything else is returned as JSON rather than as `[object Object]`, which
  // is what the old `String($value)` produced — a value that looked like a
  // token and rendered as nothing.
  return JSON.stringify(value);
}
