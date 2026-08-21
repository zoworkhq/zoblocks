import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

/**
 * Sign-in.
 *
 * The session, throttling and timing-safe comparison are carried over from
 * `apps/hq/src/lib/auth.ts` unchanged — that app already solved them, and a
 * second implementation of a login is a second set of mistakes.
 *
 * One message for every failure. A form that says "no such account" for one
 * address and "wrong password" for another is an account enumerator.
 */
export default function LoginPage() {
  return (
    <>
      {/*
        No eyebrow above this, unlike `PageHeader` inside the app.

        It had one — "Oxygen app", matching the rest of the product. That
        earned its place when the wordmark sat in the far corner of a wide
        split. In a single centred column the wordmark is the line directly
        above, so the eyebrow said the same words twice in the space of an inch,
        and the other three screens in this group never had one.
      */}
      <h1 className="display-sm">Sign in</h1>
      <p className="body-sm mt-2 text-graphite">
        Author a design language, validate it against the same gate the build uses, publish it.
      </p>

      <div className="mt-7">
        <LoginForm />
      </div>

      <p className="body-sm mt-6 text-graphite">
        No account?{" "}
        <Link href="/signup" className="link">
          Request access
        </Link>
        .
      </p>
    </>
  );
}
