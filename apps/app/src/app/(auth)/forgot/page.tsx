import Link from "next/link";
import { Callout } from "@/components/ui";

export const metadata = { title: "Reset your password" };

/**
 * How a password actually gets reset here, said plainly.
 *
 * There is no "we have emailed you a link", because this deployment sends no
 * email and a screen that claims otherwise is a screen that lies to somebody
 * already locked out. `createPasswordReset` takes an `adminId` — it was built
 * for an administrator to issue a single-use link — so this explains that route
 * rather than inventing a different one.
 *
 * The alternative was leaving no link on the sign-in form at all, which is what
 * the product did before and is the single most common support ticket in any
 * product.
 */
export default function ForgotPage() {
  return (
    <>
      <h1 className="display-sm">Reset your password</h1>
      <p className="body-sm mt-1.5 text-graphite">
        An administrator in your organisation issues the link.
      </p>

      <ol className="mt-7 space-y-4">
        {[
          {
            title: "Ask an administrator",
            body: "Anyone with the admin role in your organisation can issue you a reset link from the members screen.",
          },
          {
            title: "They send you a single-use link",
            body: "It expires shortly and can only be used once. Issuing a new one voids any earlier link.",
          },
          {
            title: "You choose a new password",
            body: "Every existing session on your account is signed out at that moment, on every device.",
          },
        ].map((step, index) => (
          <li key={step.title} className="flex gap-3.5">
            <span
              aria-hidden="true"
              className="tabular mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-rule bg-paper-sunk font-mono text-[0.6875rem] text-graphite"
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[0.8125rem] font-medium">{step.title}</p>
              <p className="body-sm mt-0.5 text-graphite">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <Callout tone="info" title="Why not an email link?" className="mt-7">
        A reset link is a temporary key to an account that can publish to production applications.
        Here it is handed over by somebody who can confirm who you are, rather than by whoever
        controls an inbox.
      </Callout>

      <p className="body-sm mt-6 text-graphite">
        <Link href="/login" className="link">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
