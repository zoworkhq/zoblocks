/**
 * An uploaded asset — a font face, or a piece of brand artwork.
 *
 *     GET /f/northwind/3b1f…c2.woff2
 *     GET /f/northwind/9ac4…70.svg
 *
 * Public by necessity: a `@font-face` `src` and an `<img src>` are both fetched
 * by the browser with no credentials, so this route cannot sit behind a session
 * and must be safe without one. Three things make that true:
 *
 *   - **The path is the digest.** Guessing it means already having the bytes.
 *     Combined with the org slug, a request either names a real asset a
 *     customer published or it names nothing.
 *   - **Immutable cache headers.** The URL identifies the content, so the bytes
 *     at this path cannot change and a revalidation would only cost a round
 *     trip. Replacing a face or a mark is a new URL.
 *   - **`nosniff`, and for artwork a `sandbox` policy.** A customer's bytes are
 *     served as the kind they were checked as and never interpreted as
 *     anything else — which matters most for SVG, the one format here that is
 *     a document rather than a picture.
 *
 * A miss is a bare 404. "That organisation exists and that asset does not" is a
 * fact this route has no reason to hand out.
 */

import { NextResponse } from "next/server";
import { fontHeaders, type FontFormat, type LogoFormat } from "@zoblocks/theme";
import { logoHeaders } from "@zoblocks/theme/logo";
import { unscopedFontAsset } from "@/db/scope";

const FONTS = new Set(["woff2", "woff", "ttf", "otf"]);
const ARTWORK = new Set(["svg", "png", "jpeg", "webp"]);

/** `3b1f…c2.woff2` → digest and extension. */
function parseFile(file: string): { sha256: string; ext: string } | undefined {
  const match = /^([a-f0-9]{64})\.([a-z0-9]{2,5})$/.exec(file);
  if (!match) return undefined;
  return { sha256: match[1]!, ext: match[2]! };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ org: string; file: string }> },
) {
  const { org, file } = await params;

  const parsed = parseFile(file);
  if (!parsed) return new NextResponse("Not found", { status: 404 });

  const asset = await unscopedFontAsset(org, parsed.sha256);
  if (!asset) return new NextResponse("Not found", { status: 404 });

  /*
   * The extension in the URL has to agree with the format on record.
   *
   * Headers are then chosen from the stored format, never from the request, so
   * the URL cannot talk this route into labelling PNG bytes as a document.
   * `nosniff` would contain the damage either way; not lying in the first place
   * is cheaper than relying on the browser to disbelieve us.
   */
  const format = asset.format as string;
  if (parsed.ext !== format) return new NextResponse("Not found", { status: 404 });

  const headers = FONTS.has(format)
    ? fontHeaders(format as FontFormat)
    : ARTWORK.has(format)
      ? logoHeaders(format as LogoFormat)
      : undefined;

  if (!headers) return new NextResponse("Not found", { status: 404 });

  /*
   * The stored bytes, verbatim.
   *
   * `asset.bytes.buffer` is the driver's Binary payload; it is handed to the
   * response without re-encoding, so what is served is byte-identical to what
   * `checkFont` or `checkLogo` approved and what the recorded digest covers.
   */
  return new NextResponse(new Uint8Array(asset.bytes.buffer), { headers });
}
