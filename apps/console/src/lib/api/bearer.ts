/**
 * The authorisation boundary for a request that carries a token, not a cookie.
 *
 * `authorize()` is the boundary for everything a person does in a browser.
 * This is its sibling for the Figma plugin, and it returns the same
 * `Authorized` — a member, a capability already checked, and a data view that
 * cannot express an unscoped query. Everything downstream is therefore the same
 * code the console runs, which is the property worth having: a second
 * authorisation path is a second place to get tenant isolation wrong, and the
 * way to avoid that is for there not to be a second one after the first line.
 *
 * Five refusals, in order, and each of them is a real failure that has to be
 * caught here rather than downstream:
 *
 *   1. **No bearer token** — a 401 with `WWW-Authenticate`, because a missing
 *      credential is a configuration mistake and the plugin should be told to
 *      look for one rather than told the theme does not exist.
 *   2. **Unknown, revoked or expired token** — 404. Expiry is compared here
 *      rather than left to the TTL index, which sweeps about once a minute:
 *      "briefly still valid" is not a phrase that belongs in an auth check.
 *   3. **Wrong scope** — 404. A registry key does not read themes.
 *   4. **The minting member is gone or disabled** — 404. A token acts as the
 *      person who minted it, so offboarding them stops it. This is the property
 *      that makes revocation a single act rather than a checklist.
 *   5. **The capability** — 403, because at this point the caller is known and
 *      telling them what they lack is useful rather than an oracle.
 */

import { NextResponse } from "next/server";
import type { MemberDoc } from "@/db/collections";
import { scoped, unscopedRegistryToken, unscopedTouchRegistryToken } from "@/db/scope";
import type { Authorized } from "@/lib/authorize";
import { can } from "@/lib/roles";
import type { Capability } from "@/lib/roles";
import { hashToken, scopeOf } from "@/lib/market/tokens";

/** Never a 403 for an unknown caller: it would confirm what exists. */
const notFound = () =>
  NextResponse.json({ error: "Not found." }, { status: 404, headers: NO_STORE });

export const NO_STORE = { "Cache-Control": "private, no-store" } as const;

export function apiError(status: number, error: string, detail?: string[]): NextResponse {
  return NextResponse.json(
    { error, ...(detail && detail.length > 0 ? { detail } : {}) },
    { status, headers: NO_STORE },
  );
}

export type BearerResult = { ok: true; auth: Authorized } | { ok: false; response: NextResponse };

export async function bearer(request: Request, capability: Capability): Promise<BearerResult> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  if (!match?.[1]) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing bearer token." },
        {
          status: 401,
          headers: { ...NO_STORE, "WWW-Authenticate": 'Bearer realm="oxygen-figma"' },
        },
      ),
    };
  }

  const token = await unscopedRegistryToken(hashToken(match[1]));
  if (!token) return { ok: false, response: notFound() };
  if (scopeOf(token) !== "figma") return { ok: false, response: notFound() };

  /*
   * Resolved through `scoped()`, not through a raw find.
   *
   * The organisation comes from the token and the member is looked up inside
   * it, so a token whose `createdBy` somehow named a member of another customer
   * would return nothing rather than a session in the wrong tenant.
   */
  const data = scoped(token.orgId);
  const member = (await data.members.findOne({
    _id: token.createdBy,
    status: "active",
  })) as MemberDoc | null;
  if (!member) return { ok: false, response: notFound() };

  if (!can(member.role, capability)) {
    return {
      ok: false,
      response: apiError(403, `This key's role cannot ${capability}.`, [
        `It acts as ${member.email}, who is a ${member.role}.`,
      ]),
    };
  }

  // Best effort, and deliberately outside the failure path: a stamp that cannot
  // be written must not fail the request it was recording.
  await unscopedTouchRegistryToken(token._id).catch(() => {});

  return {
    ok: true,
    auth: {
      member: {
        id: member._id.toHexString(),
        orgId: member.orgId,
        email: member.email,
        name: member.name,
        role: member.role,
        status: member.status,
      },
      data,
      via: token.label,
    },
  };
}

/**
 * The origin this request arrived on.
 *
 * From the request rather than from configuration, and for the reason the
 * checkout return URLs already give: a console reachable on a vanity domain and
 * on the hostname the platform assigns must not send somebody to the other one,
 * and the caller has proved which resolves for them by reaching this line.
 */
export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  /*
   * Forwarded headers first, then `host`, then the URL.
   *
   * Behind a proxy the URL names the internal hostname, so the forwarded pair
   * is the only thing that knows what the caller typed. The URL is the last
   * resort rather than the first, and it is there because a `Request` built
   * directly — by a test, or by a runtime that does not synthesise a `host` —
   * still carries one.
   */
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : url.protocol.replace(":", ""));
  return `${proto}://${host}`;
}
