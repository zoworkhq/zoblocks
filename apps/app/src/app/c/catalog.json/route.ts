/**
 * The shelf, publicly.
 *
 *     GET /c/catalog.json
 *
 * Public by design, and the reasoning is the same one that makes
 * `/t/{org}/…` public: this is data that is identical for every customer, and
 * the thing it is for — being read by a marketing site at build time — cannot
 * carry a session.
 *
 * The line it must never cross is saying who *bought* anything. Entitlements,
 * orders and tokens all carry `orgId` and go through `scoped()`; only the shelf
 * is shared. `stripePriceId` is withheld too — not because it is secret, but
 * because nothing outside this app has any business quoting a price id, and a
 * field nobody needs is a field that eventually ends up somewhere it shouldn't.
 *
 * Why an endpoint rather than the docs site reading the database: a public
 * marketing page that falls over when a private app's MongoDB does is a
 * worse property than a page that serves yesterday's catalogue. The failure
 * domains stay separate, and the cache headers below mean an app outage is
 * invisible to a reader.
 */

import { NextResponse } from "next/server";
import { unscopedCatalogListed, unscopedCatalogVersion } from "@/db/scope";

export async function GET() {
  const listed = await unscopedCatalogListed().toArray();

  const items = await Promise.all(
    listed.map(async (item) => {
      const version = await unscopedCatalogVersion(item._id, item.liveVersion);

      return {
        slug: item.slug,
        kind: item.kind,
        title: item.title,
        blurb: item.blurb,
        price:
          item.priceMinor === null ? null : { minor: item.priceMinor, currency: item.currency },
        version: item.liveVersion,
        frameworks: item.frameworks,
        /*
         * The evidence, in full.
         *
         * This is the half worth publishing. "Accessible" is marketing; "17 of
         * 17 pairs at or above 4.5:1, forced-colors verified, checker v3" is a
         * fact somebody can act on before they have signed up for anything —
         * and it is the part a search engine has any reason to index.
         */
        provenance: item.provenance,
        files: version?.files.length ?? 0,
        publishedAt: version?.publishedAt ?? null,
      };
    }),
  );

  return NextResponse.json(
    { generatedAt: new Date().toISOString(), items },
    {
      headers: {
        /*
         * Cached hard, and stale-while-revalidate for a day.
         *
         * A catalogue changes when somebody publishes a pack, which is rare.
         * The long `stale-while-revalidate` is the part that matters: it means
         * this app being down does not take the public pages with it.
         */
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

export const dynamic = "force-dynamic";
