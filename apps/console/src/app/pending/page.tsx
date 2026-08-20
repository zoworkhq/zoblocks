import Link from "next/link";
import { OxygenMark } from "@/components/Rail";
import { Callout, buttonClasses } from "@/components/ui";

export const metadata = { title: "Awaiting approval" };

/**
 * An account exists and grants nothing yet.
 *
 * hq's rule, carried over: signing up creates a person, an administrator
 * decides what they may do. Saying so plainly is better than a sign-in that
 * appears to work and then shows an empty console.
 *
 * Deliberately outside the `(auth)` group even though it looks like it belongs
 * there: this is reached by a member who *is* signed in, and the sign-out
 * control below is the only exit. A dead-end page with no way off it is how
 * somebody ends up sharing a browser profile.
 */
export default function PendingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[30rem] flex-col justify-center px-6 py-16">
      <span className="mb-7 inline-flex items-center gap-2.5 text-ink">
        <OxygenMark className="h-4 w-7" />
        <span className="font-display text-[0.9375rem] font-semibold tracking-[-0.02em]">
          Oxygen
        </span>
        <span className="eyebrow text-[0.5625rem] text-graphite-soft">Console</span>
      </span>

      <h1 className="display-sm">Awaiting approval</h1>
      <p className="lede mt-2.5">
        Your account exists. An administrator in your organisation needs to approve it and choose a
        role before you can see any themes.
      </p>

      <Callout tone="info" title="Why it works this way" className="mt-6">
        A role decides whether someone can publish a theme to your production applications, so it is
        granted by a person rather than assumed at sign-up.
      </Callout>

      <div className="mt-7">
        <Link href="/login" className={buttonClasses({ variant: "secondary" })}>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
