/**
 * GET /api/v1/themes
 *
 * The picker in the Figma plugin. Names, slugs, and which version is live.
 *
 *     Authorization: Bearer zb_live_…
 *
 * Archived themes are absent: they are out of circulation and their stylesheets
 * still serve, so offering one in a picker would invite a designer to build a
 * file against a theme nobody is maintaining.
 */

import { NextResponse } from "next/server";
import { NO_STORE, bearer } from "@/lib/api/bearer";
import { listThemes } from "@/lib/api/themes";

export async function GET(request: Request) {
  const auth = await bearer(request, "theme.read");
  if (!auth.ok) return auth.response;

  return NextResponse.json({ themes: await listThemes(auth.auth) }, { headers: NO_STORE });
}

export const dynamic = "force-dynamic";
