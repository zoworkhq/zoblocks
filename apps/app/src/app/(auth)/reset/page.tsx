import Link from "next/link";
import { Callout } from "@/components/ui";
import { resolvePasswordReset } from "@/lib/auth";
import { ResetForm } from "./ResetForm";

export const metadata = { title: "Choose a new password" };

/**
 * Spending a reset grant.
 *
 * The token is checked *before* the form renders, so somebody holding a dead
 * link is told immediately rather than after typing a password. What they are
 * not told is which kind of dead: expired, already used and never-existed are
 * one message, because distinguishing them tells an attacker holding a guessed
 * token whether they were close.
 *
 * The name is shown when the grant is good. It is the one thing that confirms
 * the link is for the account the reader thinks it is.
 */
export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const grant = token ? await resolvePasswordReset(token) : null;

  if (!grant || !token) {
    return (
      <>
        <h1 className="display-sm">That link cannot be used</h1>
        <p className="body-sm mt-1.5 text-graphite">
          It may have expired, already been used, or been replaced by a newer one.
        </p>

        <Callout tone="info" title="Ask for another" className="mt-7">
          An administrator in your organisation can issue a fresh link from the members screen.
          Issuing one voids any earlier link on your account.
        </Callout>

        <p className="body-sm mt-6 text-graphite">
          <Link href="/login" className="link">
            Back to sign in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="display-sm">Choose a new password</h1>
      <p className="body-sm mt-1.5 text-graphite">
        For {grant.name}. Every session on this account signs out when you save.
      </p>

      <ResetForm token={token} />

      <p className="body-sm mt-6 text-graphite">
        <Link href="/login" className="link">
          Cancel and sign in
        </Link>
      </p>
    </>
  );
}
