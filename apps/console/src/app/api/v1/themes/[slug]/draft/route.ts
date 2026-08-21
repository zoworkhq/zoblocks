/**
 * POST /api/v1/themes/{slug}/draft
 *
 *     { "anchor": "#1d63c9" }
 *
 * The only thing the Figma plugin may write, and it writes a draft. One brand
 * colour goes in; the console derives the other ten steps, validates them, and
 * refuses the whole proposal if they do not pass. What comes back is a URL,
 * because publishing stays a console action by a person with the role for it.
 *
 * **There is no path from here to a published version.** That is enforced by
 * what this file can reach rather than by a check inside it: `publishTheme` is
 * not imported anywhere under `src/lib/api`, and a test asserts it stays that
 * way. A guard can be deleted by somebody who believes they are simplifying;
 * an absent import has to be added on purpose.
 *
 * `theme.write` rather than `theme.read`, so a key minted by a developer — who
 * holds `theme.read` and not `theme.write` — reads themes and is refused here.
 * The key never exceeds the person who minted it.
 */

import { NextResponse } from "next/server";
import { NO_STORE, apiError, bearer, requestOrigin } from "@/lib/api/bearer";
import { proposeBrand } from "@/lib/api/themes";
import { baseTokens } from "@/lib/base-tokens";
import { ThemeError } from "@/lib/themes";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await bearer(request, "theme.write");
  if (!auth.ok) return auth.response;

  const { slug } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Send a JSON body with an `anchor`.");
  }

  const anchor = (body as { anchor?: unknown } | null)?.anchor;

  try {
    const proposal = await proposeBrand(
      auth.auth,
      await baseTokens(),
      requestOrigin(request),
      slug,
      anchor,
    );
    return NextResponse.json(proposal, { status: 201, headers: NO_STORE });
  } catch (error) {
    if (error instanceof ThemeError) {
      /*
       * 422, not 400.
       *
       * The request was well formed and the colour was understood; it was
       * refused because it fails the contrast floors. A designer needs to be
       * able to tell "I sent nonsense" from "the gate said no", because only
       * one of those is answered by picking a different colour — and the
       * measured problems are in `detail` so they can see which.
       */
      return apiError(422, error.message, error.problems);
    }
    throw error;
  }
}

export const dynamic = "force-dynamic";
