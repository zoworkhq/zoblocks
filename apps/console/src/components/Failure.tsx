"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { buttonClasses } from "@/components/ui";

/**
 * What a reader sees when something threw.
 *
 * Until this existed the console had no error boundary at all — a database
 * connection closing rendered a raw stack trace in development and Next's
 * unstyled default in production, with no branding, no explanation and no way
 * back. That is the difference between a product and a demo, and it cost one
 * component.
 *
 * Three things it must do, in order of how much they matter:
 *
 *   1. **Offer a retry.** Most failures here are a request that did not land —
 *      a connection blip, a cold start, a timeout. Re-running the segment fixes
 *      those, and asking somebody to reload the whole application to find that
 *      out is asking them to lose their place.
 *   2. **Offer a way out.** If the retry does not work, the reader needs a link
 *      that is not the one that just failed.
 *   3. **Show the digest.** Next hashes each server error into a `digest` that
 *      appears in the server log. A reader who quotes it in a support ticket
 *      turns "the theme page broke" into one grep. Without it the number exists
 *      and only we can see it.
 *
 * Deliberately not showing `error.message` in production. It is written for a
 * developer, frequently names internals, and occasionally carries a connection
 * string. The digest is the safe half of the same information.
 */
export function Failure({
  error,
  retry,
  title,
  children,
  back,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  title: string;
  children: React.ReactNode;
  back: { href: string; label: string };
}) {
  useEffect(() => {
    // The boundary is the last place this is visible in the client. A reporting
    // service would be wired here; until there is one, the console is better
    // than silence.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-[34rem] py-10">
      <p className="eyebrow mb-2 text-[0.625rem] text-fail">Something went wrong</p>
      <h1 className="display-sm">{title}</h1>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-graphite">{children}</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => retry()} className={buttonClasses()}>
          <RotateCw aria-hidden="true" strokeWidth={2} className="size-3.5" />
          Try again
        </button>
        <Link href={back.href} className={buttonClasses({ variant: "secondary" })}>
          {back.label}
        </Link>
      </div>

      {error.digest && (
        <p className="tabular mt-6 border-t border-rule pt-4 font-mono text-[0.6875rem] text-graphite-soft">
          Reference {error.digest}
        </p>
      )}
    </div>
  );
}
