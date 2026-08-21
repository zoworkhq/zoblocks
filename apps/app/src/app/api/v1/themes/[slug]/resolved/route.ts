/**
 * GET /api/v1/themes/{slug}/resolved?version=6
 *
 * A theme in the shape a variable plan is built from: the brand ramp, the
 * semantic tier resolved for all three themes, the clinical tokens with the
 * reason they are fixed, and the validation record of the version this
 * describes.
 *
 * Without `version` it serves the live one, falling back to the draft when
 * nothing has been published. Naming a version that does not exist is a 404
 * rather than a silent fall back to the draft — a file pinned to v6 that
 * receives v7's colours under v6's number is something a designer finds out
 * about from a stakeholder.
 *
 * The validation record travels with the colours deliberately. It is what lets
 * the plugin say *this version passed, on this date, against this validator*
 * rather than implying it by having served the file at all.
 */

import { NextResponse } from "next/server";
import { NO_STORE, apiError, bearer } from "@/lib/api/bearer";
import { resolvedTheme } from "@/lib/api/themes";
import { baseTokens } from "@/lib/base-tokens";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await bearer(request, "theme.read");
  if (!auth.ok) return auth.response;

  const { slug } = await params;
  const raw = new URL(request.url).searchParams.get("version");

  let version: number | undefined;
  if (raw !== null) {
    const parsed = Number(raw);
    // A non-integer is a client bug, and answering it with the draft would hide
    // that bug behind data that looks right.
    if (!Number.isInteger(parsed) || parsed < 1) {
      return apiError(400, "`version` must be a positive integer.");
    }
    version = parsed;
  }

  const payload = await resolvedTheme(auth.auth, await baseTokens(), slug, version);
  if (!payload) return apiError(404, "Not found.");

  return NextResponse.json(payload, { headers: NO_STORE });
}

export const dynamic = "force-dynamic";
