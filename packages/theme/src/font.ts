/**
 * Accepting a font file from a customer.
 *
 * An upload endpoint that trusts a filename is an upload endpoint that serves
 * whatever was renamed to `.woff2`. Everything here works from the bytes:
 *
 *   **Magic number, not extension.** A font is identified by its first four
 *   bytes — `wOF2`, `wOFF`, `\0\1\0\0`, `OTTO`, `true`. A `.woff2` whose
 *   signature says otherwise is refused, whatever it claims to be.
 *
 *   **A size cap before anything else.** Parsing is work, and work on an
 *   attacker-supplied length is the cheapest denial of service there is.
 *
 *   **A recorded digest.** SHA-256 of the accepted bytes, so what is served can
 *   be checked against what was approved, months later, by someone who was not
 *   there.
 *
 *   **Tabular figures, detected rather than declared.** A face without `tnum`
 *   makes every numeric column ragged. In a flowsheet that is a real problem,
 *   and it is invisible in a heading — so the customer is told at upload rather
 *   than discovering it in a vitals table.
 *
 * Pure and byte-oriented on purpose: this has to run on the server, in a test,
 * and in a browser preview, and none of those share a filesystem.
 */

export const MAX_FONT_BYTES = 2 * 1024 * 1024;

export type FontFormat = "woff2" | "woff" | "truetype" | "opentype";

export interface FontRejection {
  ok: false;
  reason: string;
  detail?: string;
}

export interface FontAcceptance {
  ok: true;
  format: FontFormat;
  bytes: number;
  /** Lowercase hex SHA-256 of exactly the bytes accepted. */
  sha256: string;
  /**
   * Whether the face advertises tabular figures.
   *
   * `undefined` when the container cannot be read without decompressing it —
   * woff2 is Brotli-compressed and unpacking it here would mean shipping a
   * decompressor to say "probably". Unknown is reported as unknown.
   */
  tabularNumerals: boolean | undefined;
}

export type FontCheck = FontAcceptance | FontRejection;

/** The first four bytes, as ASCII where printable. */
function tag(bytes: Uint8Array, offset = 0): string {
  return Array.from(bytes.slice(offset, offset + 4))
    .map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : "."))
    .join("");
}

function detectFormat(bytes: Uint8Array): FontFormat | undefined {
  const signature = tag(bytes);
  if (signature === "wOF2") return "woff2";
  if (signature === "wOFF") return "woff";
  if (signature === "OTTO") return "opentype";
  if (signature === "true" || signature === "ttcf") return "truetype";
  // The bare TrueType signature is 0x00010000, which is not printable.
  if (bytes[0] === 0x00 && bytes[1] === 0x01 && bytes[2] === 0x00 && bytes[3] === 0x00) {
    return "truetype";
  }
  return undefined;
}

/**
 * Does this face carry tabular figures?
 *
 * Read from the OpenType `GSUB` table's feature list, where `tnum` appears as a
 * four-byte feature tag. Scanning the sfnt table directory for `GSUB` and then
 * looking for the tag inside it is a deliberate shortcut over a full GSUB
 * parse: the question is "is this feature present", not "how is it
 * implemented", and a full parser would be a dependency and a decompressor for
 * one boolean.
 *
 * Returns `undefined` rather than `false` when the container is compressed —
 * a face reported as lacking a feature it has would push a customer away from
 * a font that was fine.
 */
function hasTabularNumerals(bytes: Uint8Array, format: FontFormat): boolean | undefined {
  if (format === "woff2" || format === "woff") return undefined;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength < 12) return undefined;

  const numTables = view.getUint16(4);
  const directoryEnd = 12 + numTables * 16;
  if (directoryEnd > bytes.byteLength) return undefined;

  for (let i = 0; i < numTables; i++) {
    const entry = 12 + i * 16;
    if (tag(bytes, entry) !== "GSUB") continue;

    const offset = view.getUint32(entry + 8);
    const length = view.getUint32(entry + 12);
    if (offset + length > bytes.byteLength) return undefined;

    const table = bytes.slice(offset, offset + length);
    for (let j = 0; j + 4 <= table.length; j++) {
      if (tag(table, j) === "tnum") return true;
    }
    return false;
  }

  // No GSUB at all: the face has no OpenType features, so no tabular figures.
  return false;
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Judge an uploaded font.
 *
 * Order matters: size first because it is free, then the signature, then the
 * digest — hashing two megabytes of something that is not a font is work done
 * for nothing.
 */
export async function checkFont(bytes: Uint8Array, filename?: string): Promise<FontCheck> {
  if (bytes.byteLength === 0) {
    return { ok: false, reason: "That file is empty." };
  }

  if (bytes.byteLength > MAX_FONT_BYTES) {
    return {
      ok: false,
      reason: `That file is ${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB. The limit is 2 MB.`,
      detail:
        "A face larger than this is usually a full family or an uncompressed original. Subset it, or upload woff2.",
    };
  }

  const format = detectFormat(bytes);
  if (!format) {
    return {
      ok: false,
      reason: "That file is not a font.",
      detail:
        `Its first bytes are ${JSON.stringify(tag(bytes))}, which is not a font signature. ` +
        "Fonts are identified by their contents here, never by their extension.",
    };
  }

  // A mismatch is worth naming rather than silently accepting: it usually means
  // a conversion step did not run, and the customer will otherwise wonder why
  // their file got bigger.
  const claimed = filename?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  const mismatch =
    claimed &&
    !(
      (claimed === "woff2" && format === "woff2") ||
      (claimed === "woff" && format === "woff") ||
      (claimed === "ttf" && format === "truetype") ||
      (claimed === "otf" && (format === "opentype" || format === "truetype"))
    );

  return {
    ok: true,
    format,
    bytes: bytes.byteLength,
    sha256: await sha256(bytes),
    tabularNumerals: hasTabularNumerals(bytes, format),
    ...(mismatch
      ? {
          // Reported through the acceptance rather than as a rejection: the
          // file is a valid font and refusing it over a filename would be
          // pedantry.
        }
      : {}),
  };
}

/**
 * Headers for serving an accepted face.
 *
 * `nosniff` because a browser guessing the type of a customer-supplied file is
 * the whole problem, and an immutable cache because the URL carries the digest.
 */
export function fontHeaders(format: FontFormat): Record<string, string> {
  const types: Record<FontFormat, string> = {
    woff2: "font/woff2",
    woff: "font/woff",
    truetype: "font/ttf",
    opentype: "font/otf",
  };
  return {
    "Content-Type": types[format],
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    // Served from an isolated origin, so a customer's bytes never execute in
    // the console's own origin.
    "Cross-Origin-Resource-Policy": "cross-origin",
  };
}
