/**
 * Purchased bytes.
 *
 *     GET /m/empty-state-system/pack.zip
 *     GET /m/clinical-icons/icons/route-iv.svg
 *
 * The one route in this application that is **not** public, and the reason is
 * worth stating beside the two that are. `/t/{org}/…` serves a stylesheet and
 * `/f/{org}/…` serves a font: both are fetched by a browser with no
 * credentials, so both must be safe without a session, and they are — the
 * digest is the secret and the content is something the customer chose to
 * publish.
 *
 * Paid content inverts that. A pack served from an unauthenticated URL is a
 * pack that is one shared link away from being free, so this route resolves a
 * session, resolves the organisation from it, and checks an entitlement before
 * it looks at a file at all.
 *
 * A miss is a flat 404 in every case — wrong item, no entitlement, revoked,
 * unknown path. "That item exists and you have not bought it" is not a fact
 * this route needs to volunteer, and a 403 would confirm the catalogue to
 * somebody enumerating names.
 */

import { NextResponse } from "next/server";
import { unscopedMarketAsset } from "@/db/scope";
import { currentMember } from "@/lib/auth";
import { itemBySlug, versionFor } from "@/lib/market/catalogue";
import { entitlementFor } from "@/lib/market/entitlements";
import { zip } from "@/lib/market/zip";

const notFound = () => new NextResponse("Not found", { status: 404 });

/**
 * Never cached by a shared cache.
 *
 * The URL does not carry the identity that made it servable — the session
 * cookie does — so a CDN that keyed on the path alone would hand one
 * customer's purchase to the next request for the same path.
 */
const headers = (contentType: string, filename: string) => ({
  "Content-Type": contentType,
  "Content-Disposition": `attachment; filename="${filename}"`,
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  // An SVG is a document, and one served from this origin would run with the
  // app's privileges. `attachment` above already prevents rendering; this
  // is the belt to that pair of braces.
  "Content-Security-Policy": "default-src 'none'; sandbox",
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ item: string; file: string[] }> },
) {
  const { item: slug, file } = await params;

  const member = await currentMember();
  if (!member || member.status !== "active") return notFound();

  const item = await itemBySlug(slug).catch(() => undefined);
  if (!item) return notFound();

  const entitlement = await entitlementFor(member.orgId, item._id);
  if (!entitlement) return notFound();

  const version = await versionFor(item, entitlement.versionLine).catch(() => undefined);
  if (!version) return notFound();

  const path = file.join("/");

  /*
   * The whole pack, assembled per request rather than stored.
   *
   * Storing a zip would mean a second copy of every byte and a second thing to
   * keep in step with the version it claims to be. The packs are small — a few
   * hundred kilobytes of SVG — and the archive is deterministic, so two
   * downloads of the same version are byte-identical.
   */
  if (path === "pack.zip") {
    const entries = [];
    for (const entry of version.files) {
      const asset = await unscopedMarketAsset(entry.sha256);
      if (!asset) continue;
      entries.push({ path: entry.path, bytes: new Uint8Array(asset.bytes.buffer) });
    }
    if (entries.length === 0) return notFound();

    const archive = zip(entries, version.publishedAt);
    return new NextResponse(archive as unknown as BodyInit, {
      headers: headers("application/zip", `${item.slug}-v${version.version}.zip`),
    });
  }

  const entry = version.files.find((candidate) => candidate.path === path);
  if (!entry) return notFound();

  const asset = await unscopedMarketAsset(entry.sha256);
  if (!asset) return notFound();

  return new NextResponse(new Uint8Array(asset.bytes.buffer) as unknown as BodyInit, {
    headers: headers(entry.contentType, entry.path.split("/").at(-1) ?? entry.path),
  });
}

export const dynamic = "force-dynamic";
