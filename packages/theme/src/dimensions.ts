/**
 * How big a piece of artwork actually is.
 *
 * Read from the file's own header rather than asked for on the form, because
 * the answer to "what size is this?" typed by a person is the size they
 * intended, and the whole class of bug here is artwork that is not the size
 * anybody intended. A 512×512 favicon and a square social card both pass every
 * validation ever written about file uploads and both look broken in front of
 * a customer.
 *
 * No decoding library. Every format here states its dimensions in the first
 * few dozen bytes, and pulling in an image decoder to read four integers would
 * mean running a parser over hostile input to avoid running a parser over
 * hostile input.
 */

export interface Dimensions {
  width: number;
  height: number;
  /** True when the artwork scales without loss, so a size floor is advice. */
  scalable: boolean;
}

/**
 * A bounds-checked reader.
 *
 * `DataView` rather than indexing the array, because every index into a
 * `Uint8Array` is `number | undefined` and the alternative is a non-null
 * assertion on each of the twenty-odd byte reads below — which is a promise
 * about hostile input that nobody can keep. Reads past the end throw, and
 * `size()` is the one place that catches.
 */
class Reader {
  private readonly view: DataView;

  constructor(private readonly bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  get length(): number {
    return this.bytes.byteLength;
  }

  u8(at: number): number {
    return this.view.getUint8(at);
  }

  be16(at: number): number {
    return this.view.getUint16(at, false);
  }

  be32(at: number): number {
    return this.view.getUint32(at, false);
  }

  le16(at: number): number {
    return this.view.getUint16(at, true);
  }

  le24(at: number): number {
    return this.u8(at) | (this.u8(at + 1) << 8) | (this.u8(at + 2) << 16);
  }

  le32(at: number): number {
    return this.view.getUint32(at, true);
  }

  ascii(at: number, length: number): string {
    let out = "";
    for (let i = 0; i < length; i++) out += String.fromCharCode(this.u8(at + i));
    return out;
  }
}

/** PNG states width and height in IHDR, which the spec fixes as the first chunk. */
function png(r: Reader): Dimensions | undefined {
  if (r.length < 24) return undefined;
  return { width: r.be32(16), height: r.be32(20), scalable: false };
}

/**
 * JPEG hides its dimensions behind a walk.
 *
 * The size lives in a start-of-frame segment that can sit after any number of
 * other segments, so the markers have to be stepped through. The walk is
 * bounded by the buffer and every step is length-prefixed, so a malformed file
 * ends the loop rather than running off the end.
 */
function jpeg(r: Reader): Dimensions | undefined {
  let at = 2;
  while (at + 9 < r.length) {
    if (r.u8(at) !== 0xff) {
      at++;
      continue;
    }
    const marker = r.u8(at + 1);
    // SOF0–SOF15 carry the frame header. C4, C8 and CC are Huffman and
    // arithmetic tables that happen to sit in the same numeric range.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: r.be16(at + 5), width: r.be16(at + 7), scalable: false };
    }
    const length = r.be16(at + 2);
    if (length < 2) return undefined;
    at += 2 + length;
  }
  return undefined;
}

/** WebP has three container layouts and states its size differently in each. */
function webp(r: Reader): Dimensions | undefined {
  if (r.length < 30) return undefined;

  switch (r.ascii(12, 4)) {
    case "VP8X":
      return { width: r.le24(24) + 1, height: r.le24(27) + 1, scalable: false };
    case "VP8 ":
      // The 14 low bits of each; the top two are the scaling hint.
      return {
        width: r.le16(26) & 0x3fff,
        height: r.le16(28) & 0x3fff,
        scalable: false,
      };
    case "VP8L": {
      const bits = r.le32(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
        scalable: false,
      };
    }
    default:
      return undefined;
  }
}

const LENGTH = /^\s*([0-9.]+)\s*(px)?\s*$/;

/**
 * SVG states its size twice and neither is required.
 *
 * `width`/`height` are what a browser lays out with; `viewBox` is the
 * coordinate system. A mark exported with only a viewBox is normal and fine —
 * it scales — so the viewBox is the fallback rather than an error, and the
 * numbers are only ever used for their *ratio*, which is the thing that is
 * actually wrong when a square logo lands in a link-preview slot.
 */
function svg(text: string): Dimensions | undefined {
  const head = text.slice(0, 4096);
  const attr = (name: string) =>
    new RegExp(`<svg[^>]*\\s${name}\\s*=\\s*["']([^"']+)["']`, "i").exec(head)?.[1];

  const w = attr("width");
  const h = attr("height");
  if (w && h) {
    const mw = LENGTH.exec(w);
    const mh = LENGTH.exec(h);
    if (mw && mh) {
      return { width: Number(mw[1]), height: Number(mh[1]), scalable: true };
    }
  }

  const box = attr("viewBox");
  if (box) {
    const parts = box
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    const [, , width, height] = parts;
    if (parts.length === 4 && width !== undefined && height !== undefined) {
      if (Number.isFinite(width) && Number.isFinite(height)) {
        return { width, height, scalable: true };
      }
    }
  }
  return undefined;
}

/**
 * The artwork's own idea of how big it is, or `undefined`.
 *
 * Undefined is a real answer and not a failure: an SVG with neither a size nor
 * a viewBox is unusual but legal, and refusing it would be refusing valid
 * artwork over a check that exists to give advice.
 */
export function imageSize(
  bytes: Uint8Array,
  format: string,
  text?: string,
): Dimensions | undefined {
  if (format === "svg") {
    return svg(text ?? new TextDecoder("utf-8", { fatal: false }).decode(bytes));
  }

  const r = new Reader(bytes);
  try {
    switch (format) {
      case "png":
        return png(r);
      case "jpeg":
        return jpeg(r);
      case "webp":
        return webp(r);
      default:
        return undefined;
    }
  } catch {
    /*
     * A truncated file has no size, and that is the answer rather than a
     * crash. The bytes reached here already passed `checkLogo`, so this is a
     * file whose header claims more than the file contains — malformed, not
     * malicious, and the caller treats an unknown size as "give no advice".
     */
    return undefined;
  }
}
