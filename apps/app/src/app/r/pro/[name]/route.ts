/**
 * The private registry the Oxygen CLI installs paid components from.
 *
 *     GET /r/pro/vitals-flowsheet.json
 *     Authorization: Bearer oxy_live_…
 *
 * The customer's `oxygen.json` carries the namespace and the header, with the
 * token expanded from their environment so nothing secret is committed:
 *
 *     "registries": {
 *       "@oxygen-pro": {
 *         "url": "https://app.oxygenui.design/r/pro/{name}.json",
 *         "headers": { "Authorization": "Bearer ${OXYGEN_TOKEN}" }
 *       }
 *     }
 *
 *     npx @oxygenui-design/cli add @oxygen-pro/vitals-flowsheet
 *
 * Four steps, in order, refusing at the first failure:
 *
 *   1. **Hash the bearer token and look it up.** Only the digest is stored, so
 *      a database dump yields nothing installable.
 *   2. **Resolve the organisation from the token**, never from a parameter.
 *      The token is the identity; a caller naming an org would be a caller
 *      choosing one.
 *   3. **Check the entitlement**, and that it has not been revoked.
 *   4. **Serve the registry item** with file contents inlined.
 *
 * Everything else is a 404. A 403 would confirm which component names exist to
 * somebody guessing, and the CLI treats both the same way.
 *
 * On rate limiting: this route is protected by expiry, revocation, a cap on
 * live tokens per organisation, and a `lastUsedAt` stamp that makes a leaked
 * token visible. Per-request throttling belongs at the edge rather than as a
 * database write in front of every install — saying so here is better than a
 * token bucket in Mongo that looks like protection and costs a round trip.
 */

import { NextResponse } from "next/server";
import { ITEM_SCHEMA_URL } from "@oxygenui-design/cli";
import { unscopedMarketAsset, unscopedRegistryToken, unscopedTouchRegistryToken } from "@/db/scope";
import { itemBySlug, versionFor } from "@/lib/market/catalogue";
import { entitlementFor } from "@/lib/market/entitlements";
import { hashToken, scopeOf } from "@/lib/market/tokens";

const notFound = () => new NextResponse("Not found", { status: 404 });

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  if (!match?.[1]) {
    /*
     * The one place a 401 is right rather than a 404.
     *
     * Sending no credential at all is a configuration mistake, not an attempt
     * to enumerate the catalogue, and `WWW-Authenticate` is what tells the CLI
     * to look for a token rather than reporting the component as missing.
     */
    return new NextResponse("Missing bearer token.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Bearer realm="oxygen-pro"' },
    });
  }

  const token = await unscopedRegistryToken(hashToken(match[1]));
  if (!token) return notFound();

  /*
   * A Figma key does not install components.
   *
   * The plugin's credential reaches themes and nothing else; without this line
   * a designer's key would also pull down paid component source, which is the
   * whole reason tokens carry a scope. A 404 rather than a 403, like every
   * other refusal on this route.
   */
  if (scopeOf(token) !== "registry") return notFound();

  const slug = name.replace(/\.json$/, "");
  const item = await itemBySlug(slug).catch(() => undefined);
  if (!item || item.kind !== "component") return notFound();

  const entitlement = await entitlementFor(token.orgId, item._id);
  if (!entitlement) return notFound();

  const version = await versionFor(item, entitlement.versionLine).catch(() => undefined);
  if (!version?.registry) return notFound();

  /*
   * Contents inlined rather than linked.
   *
   * The registry schema allows a `content` field per file, and using it means
   * the CLI makes exactly one authenticated request. Linking to `/m/…` instead
   * would need the CLI to carry the bearer token onto a second host and a
   * second path, which it has no reason to do.
   */
  const files = [];
  for (const file of version.files) {
    const asset = await unscopedMarketAsset(file.sha256);
    if (!asset) continue;
    files.push({
      path: file.path,
      type: "oxygen:component",
      target: file.path,
      content: Buffer.from(asset.bytes.buffer).toString("utf8"),
    });
  }

  // Best-effort, and deliberately not awaited into the failure path: a stamp
  // that cannot be written must not fail the install it was recording.
  await unscopedTouchRegistryToken(token._id).catch(() => {});

  return NextResponse.json(
    {
      $schema: ITEM_SCHEMA_URL,
      name: item.slug,
      type: "oxygen:component",
      title: item.title,
      description: item.blurb,
      ...version.registry,
      files,
    },
    {
      headers: {
        // Entitlement-dependent, so no shared cache may keep it.
        "Cache-Control": "private, no-store",
      },
    },
  );
}

export const dynamic = "force-dynamic";
