import Link from "next/link";
import { Callout } from "@/components/ui";
import { SignUpForm } from "./SignUpForm";

export const metadata = { title: "Request access" };

/**
 * Sign-up, which grants nothing.
 *
 * Saying so on the form rather than after it is the whole design. A sign-up
 * that appears to succeed and then shows an empty app reads as a broken
 * product; one that says "an administrator will approve this" reads as a
 * careful one — and it is the same flow.
 */
export default function SignUpPage() {
  return (
    <>
      <h1 className="display-sm">Request access</h1>
      <p className="body-sm mt-1.5 text-graphite">
        Join an organisation that already uses the ZoBlocks console.
      </p>

      <div className="mt-7">
        <SignUpForm />
      </div>

      <Callout tone="info" title="An administrator approves this" className="mt-6">
        Creating an account does not grant access. Somebody in your organisation chooses your role
        first, because a role decides whether you can publish a theme to production applications.
      </Callout>

      {/*
        The other half of the flow, which was missing.

        This form needs an organisation address, and an organisation is created
        by us rather than by the person filling the form in — so somebody
        arriving from the site's primary button met a required field they had
        no way to complete, and a failure message telling them to ask an
        administrator they do not have. Naming the second path here is cheaper
        than a self-serve provisioning flow and honest about how it works.
      */}
      <p className="body-sm mt-5 text-graphite">
        Starting a new organisation?{" "}
        <a href="mailto:hello@zowork.com?subject=New%20ZoBlocks%20workspace" className="link">
          Ask us to set one up
        </a>
        . We create the organisation and make you its first administrator.
      </p>

      <p className="body-sm mt-3 text-graphite">
        Already have an account?{" "}
        <Link href="/login" className="link">
          Sign in
        </Link>
        .
      </p>
    </>
  );
}
