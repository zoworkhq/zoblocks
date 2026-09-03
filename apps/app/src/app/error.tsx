"use client";

import { Failure } from "@/components/Failure";

/**
 * The boundary for everything outside the authenticated shell — sign-in,
 * sign-up, the reset screens.
 *
 * Separate from `(app)/error.tsx` for one reason: where it sends people. There
 * is no rail out here, and the useful destination is the sign-in form rather
 * than a screen that needs a session.
 *
 * Without this, a throw on the login page fell through to `global-error`, which
 * replaces the root layout and renders its own bare document. That is the right
 * treatment for a broken layout and much too harsh for a failed query behind a
 * password field.
 */
export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <Failure
      error={error}
      retry={retry}
      // "Something went wrong" is the first entry on CONTENT.md §5's list of
      // error copy that names nothing. The authenticated boundary two files
      // away already says "This screen did not load"; this is the same fact
      // about a page that has no shell around it yet.
      title="This page did not load"
      back={{ href: "/login", label: "Back to sign in" }}
    >
      You have not been signed out, and nothing was changed.
    </Failure>
  );
}
