import { NextResponse } from "next/server";

/**
 * The Pro waitlist, such as it is.
 *
 * There is no waitlist backend. The console has a database; this site does not,
 * and standing one up to hold a list of email addresses is a larger decision
 * than a button on a holding page should make on its own.
 *
 * So this route is a *forwarder*. Point `NOTIFY_WEBHOOK_URL` at anything that
 * accepts a JSON POST — a form service, a Zapier hook, a Slack incoming
 * webhook, an inbox relay — and the address goes there. Leave it unset and the
 * route says so plainly, with `501`, and the dialog falls back to opening the
 * visitor's mail client at `hello@zowork.com` with the address filled in.
 *
 * **The one thing this must never do is accept an address and drop it.** A
 * form that swallows what somebody typed is worse than no form: they believe
 * they are on a list. Every path here either stores the address somewhere real
 * or tells the caller it did not.
 *
 * Not statically exported: this app has no `output: "export"`, so a route
 * handler is available. It is `force-dynamic` because a cached POST response
 * would be a cached *acknowledgement*, which is the same lie by another route.
 */
export const dynamic = "force-dynamic";

/**
 * Deliberately loose.
 *
 * Address validation is a famous way to reject real people — plus addresses,
 * new top-level domains, non-ASCII local parts. The only thing worth refusing
 * here is something that cannot be an address at all, and the length cap is
 * about the request body rather than about what an address may be.
 */
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTH = 254;

export async function POST(request: Request) {
  let email: unknown;
  try {
    ({ email } = (await request.json()) as { email?: unknown });
  } catch {
    return NextResponse.json({ ok: false, reason: "malformed" }, { status: 400 });
  }

  if (typeof email !== "string" || email.length > MAX_LENGTH || !LOOKS_LIKE_EMAIL.test(email)) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const webhook = process.env.NOTIFY_WEBHOOK_URL;
  if (!webhook) {
    /*
     * 501, not 200. The dialog reads this and falls back to a `mailto:` so the
     * person's request still reaches somebody — which is the whole reason this
     * is a distinct status rather than a generic failure.
     */
    return NextResponse.json({ ok: false, reason: "not-configured" }, { status: 501 });
  }

  try {
    const forwarded = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, source: "zoblocks.design/pro", at: new Date().toISOString() }),
    });
    if (!forwarded.ok) {
      return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
