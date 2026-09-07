/**
 * The published stylesheet.
 *
 *     GET /t/northwind/northwind-clinical@7.css
 *     GET /t/northwind/northwind-clinical@7.json
 *
 * The stylesheet carries the tokens. The manifest carries what a stylesheet
 * cannot: alternative text, the favicon and link-preview card that CSS never
 * draws, and absolute URLs. Both at the same pinned version, because artwork
 * and tokens disagreeing about which version they are is the bug the pinning
 * exists to prevent.
 *
 * Public by design — a browser fetches it without credentials — and immutable,
 * because the version is in the path. Those two together are what make runtime
 * theme delivery safe: a customer's application pins a version, so an edit in
 * the app cannot change a running application until somebody moves the pin.
 * A "latest wins" endpoint would be worse than requiring a deploy.
 *
 * Three refusals worth naming:
 *
 *   - **Drafts are never served.** Only a `themeVersions` document, which is
 *     written by publish and never updated.
 *   - **A theme validated by an older validator is not served.** Tightening a
 *     rule must not leave older palettes live, which is what `isServable`
 *     checks and why `validatorVersion` is on the document.
 *   - **A miss is a 404 with no detail.** The org slug is not a secret, but
 *     "that organisation exists and that theme does not" is a fact this route
 *     has no reason to hand out.
 */

import { NextResponse } from "next/server";
import {
  brandManifest,
  emitThemeCss,
  emptyAssets,
  isServable,
  themeCacheHeaders,
} from "@zoblocks/theme";
import { unscopedPublishedVersion } from "@/db/scope";

/** `northwind-clinical@7.css` → slug, version and which representation. */
function parseFile(
  file: string,
): { slug: string; version: number; kind: "css" | "json" } | undefined {
  const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)@(\d{1,6})\.(css|json)$/.exec(file);
  if (!match?.[1] || !match[2] || !match[3]) return undefined;
  return { slug: match[1], version: Number(match[2]), kind: match[3] as "css" | "json" };
}

const notFound = () => new NextResponse("Not found", { status: 404 });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ org: string; file: string }> },
) {
  const { org: orgSlug, file } = await params;

  const parsed = parseFile(file);
  if (!parsed) return notFound();

  // One helper rather than three finds with an orgId threaded by hand: the
  // organisation is resolved first and every filter under it carries that id,
  // so `/t/southmere/clinical@1.css` cannot return Northwind's palette even
  // though the theme slug matches.
  const found = await unscopedPublishedVersion(orgSlug, parsed.slug, parsed.version);
  if (!found) return notFound();
  const { organisation: org, theme, version } = found;

  const document = {
    id: theme._id.toHexString(),
    orgId: org._id.toHexString(),
    name: theme.name,
    slug: theme.slug,
    version: version.version,
    status: "published" as const,
    tokens: version.tokens,
    /*
      The version's own assets, not an empty set.
      
      This was hardcoded empty, which silently dropped every `@font-face` block
      from the stylesheet actually served to customers — a font uploaded through
      the app reached the database, reached the snapshot taken at publish,
      and then never reached the browser. The unit tests missed it because they
      exercise `versionCss`, which reads `doc.assets` correctly; the production
      path and its test seam had diverged.
      
      A published version snapshots its assets precisely so this is stable, so
      the fallback is only for versions minted before the field existed.
    */
    assets: version.assets ?? emptyAssets(),
    validation: version.validation,
    audit: {
      createdBy: theme.createdBy.toHexString(),
      createdAt: theme.createdAt.toISOString(),
      publishedBy: version.publishedBy.toHexString(),
      publishedAt: version.publishedAt.toISOString(),
    },
  };

  // The guard on serve. A stored verdict from an older validator is not a
  // verdict under today's rules.
  const servable = isServable(document);
  if (!servable.ok) return notFound();

  if (parsed.kind === "json") {
    /*
     * The origin comes from the request that asked, not from configuration.
     *
     * An app reachable on two hostnames — a vanity domain and the one the
     * platform assigns — must not hand out the other one's URLs, because the
     * caller already proved which one resolves for them by reaching this line.
     */
    const origin = new URL(request.url).origin;
    return NextResponse.json(brandManifest(document, { origin, orgSlug }), {
      headers: themeCacheHeaders(),
    });
  }

  return new NextResponse(emitThemeCss(document), { headers: themeCacheHeaders() });
}

/** Immutable content, so a HEAD is worth answering cheaply. */
export const dynamic = "force-dynamic";
