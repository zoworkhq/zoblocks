import Link from "next/link";
import { Callout } from "@/components/ui";
import { SignUpForm } from "./SignUpForm";

export const metadata = { title: "Request access" };

/**
 * Sign-up, which grants nothing.
 *
 * Saying so on the form rather than after it is the whole design. A sign-up
 * that appears to succeed and then shows an empty console reads as a broken
 * product; one that says "an administrator will approve this" reads as a
 * careful one — and it is the same flow.
 */
export default function SignUpPage() {
  return (
    <>
      <h1 className="display-sm">Request access</h1>
      <p className="body-sm mt-1.5 text-graphite">
        Join an organisation that already uses the Oxygen console.
      </p>

      <div className="mt-7">
        <SignUpForm />
      </div>

      <Callout tone="info" title="An administrator approves this" className="mt-6">
        Creating an account does not grant access. Somebody in your organisation chooses your role
        first, because a role decides whether you can publish a theme to production applications.
      </Callout>

      <p className="body-sm mt-5 text-graphite">
        Already have an account?{" "}
        <Link href="/login" className="link">
          Sign in
        </Link>
        .
      </p>
    </>
  );
}
