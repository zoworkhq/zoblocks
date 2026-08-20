/**
 * Brand artwork, checked before it is stored.
 *
 * A logo looks like the least dangerous thing a customer can upload and is
 * close to the most, for one reason: **an SVG is a document, not an image.** It
 * can carry `<script>`, event-handler attributes, `<foreignObject>` holding
 * arbitrary HTML, and external references that fire on load. Serving one from
 * the same origin as the console — which is what "host our customer's logo"
 * means — is stored cross-site scripting with a file picker in front of it.
 *
 * So the check here is not a formality around a size limit. It is the reason
 * this module exists, and it refuses rather than sanitises: a file that
 * contains a script is not artwork somebody trimmed carelessly, and quietly
 * stripping tags leaves a customer believing we accepted what they sent.
 *
 * Raster formats are accepted as bytes and never parsed. PNG and JPEG cannot
 * execute; the only questions are size and dimensions, and dimensions are the
 * browser's problem.
 */

import { createHash } from "node:crypto";
import { brandAsset, type BrandAssetRole } from "./assets";
import { imageSize, type Dimensions } from "./dimensions";

/** 512 KB. A logo is line art; anything larger is a photograph or a mistake. */
export const MAX_LOGO_BYTES = 512 * 1024;

export type LogoFormat = "svg" | "png" | "jpeg" | "webp";

/**
 * Where a piece of artwork is meant to be used.
 *
 * `light` and `dark` are separate uploads rather than one file the console
 * recolours, because a logo is not a token: a mark that reverses to white is a
 * design decision its owner has already made, and inverting it for them
 * produces something their brand guidelines forbid.
 *
 * `mono` is the one healthcare adds. A discharge letter goes out as toner on
 * paper and a referral still travels by fax in places; a single-colour mark is
 * what survives both, and asking for it up front is cheaper than discovering
 * at print time that the gradient went grey.
 */
export type LogoVariant = "light" | "dark" | "mono";

export const LOGO_VARIANTS: readonly LogoVariant[] = ["light", "dark", "mono"];

export interface LogoRejection {
  ok: false;
  reason: string;
  detail?: string;
}

export interface LogoAcceptance {
  ok: true;
  format: LogoFormat;
  bytes: number;
  /** Lowercase hex SHA-256 of exactly the bytes accepted. */
  sha256: string;
  /** Read from the file's header. Undefined when the format does not say. */
  size?: Dimensions;
  /**
   * Accepted, but not what was asked for.
   *
   * Kept separate from a refusal on purpose. A 900×470 link-preview card is
   * the wrong ratio and will be cropped by every service that renders it —
   * which the person uploading it should be told, and which is not a reason to
   * refuse the only artwork they have at four in the afternoon.
   */
  warnings?: readonly string[];
}

export type LogoCheck = LogoAcceptance | LogoRejection;

/**
 * Everything in an SVG that can execute, reach the network, or import a
 * document. Matched case-insensitively, because XML is not case-folded and
 * `<ScRiPt>` is the oldest trick there is.
 *
 * `on\w+\s*=` catches the whole event-handler family in one rule rather than
 * enumerating `onload`, `onerror`, `onclick` and whatever the platform adds
 * next — an allowlist of dangerous names is a list that goes out of date.
 */
const DANGEROUS: readonly { pattern: RegExp; what: string }[] = [
  { pattern: /<\s*script[\s>]/i, what: "a <script> element" },
  { pattern: /<\s*foreignObject[\s>]/i, what: "a <foreignObject> element" },
  { pattern: /<\s*(iframe|embed|object)[\s>]/i, what: "an embedded document" },
  { pattern: /<\s*use[^>]+href\s*=\s*["']?\s*(https?:)?\/\//i, what: "a remote <use> reference" },
  { pattern: /\son\w+\s*=/i, what: "an event-handler attribute" },
  { pattern: /(href|xlink:href)\s*=\s*["']?\s*javascript:/i, what: "a javascript: URL" },
  { pattern: /<!ENTITY/i, what: "an XML entity declaration" },
  { pattern: /<\s*!\s*DOCTYPE[^>]+\[/i, what: "an internal DTD subset" },
];

/** Magic numbers. A declared content type is a claim; these are evidence. */
function sniff(bytes: Uint8Array, text: string): LogoFormat | undefined {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return "png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  // SVG has no magic number — it is text. Look for the root element rather than
  // trusting the extension, and only within the opening stretch of the file.
  if (/<\s*svg[\s>]/i.test(text.slice(0, 2048))) return "svg";
  return undefined;
}

/**
 * Accept or refuse a piece of brand artwork.
 *
 * Refusals name what was found. "Invalid file" tells a designer nothing; "this
 * SVG contains an event-handler attribute" tells them their export settings
 * are wrong, which is almost always the actual cause — design tools emit
 * interactivity nobody asked for.
 */
export function checkLogo(bytes: Uint8Array): LogoCheck {
  if (bytes.byteLength === 0) return { ok: false, reason: "That file is empty." };

  if (bytes.byteLength > MAX_LOGO_BYTES) {
    return {
      ok: false,
      reason: `That file is ${Math.round(bytes.byteLength / 1024)} KB; the limit is ${MAX_LOGO_BYTES / 1024} KB.`,
      detail:
        "A logo is line art. If this is a photograph or an export at print resolution, the vector original will be far smaller and will scale better.",
    };
  }

  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const format = sniff(bytes, text);

  if (!format) {
    return {
      ok: false,
      reason: "That is not an SVG, PNG, JPEG or WebP.",
      detail:
        "The file's own bytes were checked rather than its name, so renaming it will not help.",
    };
  }

  if (format === "svg") {
    for (const { pattern, what } of DANGEROUS) {
      if (pattern.test(text)) {
        return {
          ok: false,
          reason: `This SVG contains ${what}, so it cannot be hosted.`,
          detail:
            "An SVG is a document rather than a picture: served from this origin it would run with the console's privileges. Re-export it as plain artwork — most design tools have an option to omit interactivity and metadata — or upload a PNG.",
        };
      }
    }
  }

  return {
    ok: true,
    format,
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

/** Content type for serving. Charset only matters for the one text format. */
export function logoContentType(format: LogoFormat): string {
  return format === "svg" ? "image/svg+xml; charset=utf-8" : `image/${format}`;
}

/**
 * Headers for a stored logo.
 *
 * `nosniff` and a restrictive `Content-Security-Policy` are belt and braces
 * over the refusal above: even for artwork that passed, the browser is told
 * this document may not run anything and may not fetch anything. A single
 * check that has to be right forever is a check that will eventually be wrong.
 */
export function logoHeaders(format: LogoFormat): Record<string, string> {
  return {
    "Content-Type": logoContentType(format),
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  };
}

/**
 * The same artwork, checked against the role it is being uploaded for.
 *
 * Everything dangerous is still decided by `checkLogo`; this only adds the
 * rules that are specific to where the file is going — which formats that slot
 * accepts and what shape it has to be. Those are two genuinely different kinds
 * of rule and they fail differently: a script in an SVG is a refusal, and a
 * favicon that is not square is a warning, because the second one is a
 * judgement about how it will look and the person uploading it can see it.
 */
export function checkBrandAsset(bytes: Uint8Array, role: BrandAssetRole): LogoCheck {
  const base = checkLogo(bytes);
  if (!base.ok) return base;

  const spec = brandAsset(role);

  if (!spec.formats.includes(base.format)) {
    const list = spec.formats.map((f) => f.toUpperCase()).join(", ");
    return {
      ok: false,
      reason: `${spec.label} does not take ${base.format.toUpperCase()}.`,
      detail: `This slot is delivered as ${spec.delivery}, which accepts ${list}.`,
    };
  }

  const size = imageSize(bytes, base.format);
  const warnings: string[] = [];

  if (spec.shape && size) {
    const { width, height, exact, ratio } = spec.shape;

    if (exact && !size.scalable && (size.width !== width || size.height !== height)) {
      return {
        ok: false,
        reason: `${spec.label} must be exactly ${width}×${height}; this is ${size.width}×${size.height}.`,
        detail:
          "The platform fixes this size rather than scaling to it, so anything else is resampled and arrives blurred.",
      };
    }

    if (ratio && size.width > 0 && size.height > 0) {
      const actual = size.width / size.height;
      // A tenth is the point at which a crop starts being visible rather than
      // being a rounding difference between export tools.
      if (Math.abs(actual - ratio) / ratio > 0.1) {
        warnings.push(
          ratio === 1
            ? `This is ${size.width}×${size.height}, which is not square. It will be cropped or letterboxed.`
            : `This is ${size.width}×${size.height}; the slot is ${width}×${height}. Expect it to be cropped.`,
        );
      }
    }

    if (!size.scalable && !exact && (size.width < width || size.height < height)) {
      warnings.push(
        `This is ${size.width}×${size.height}, below the ${width}×${height} this slot renders at. It will be upscaled and look soft.`,
      );
    }
  }

  return { ...base, size, ...(warnings.length > 0 ? { warnings } : {}) };
}
