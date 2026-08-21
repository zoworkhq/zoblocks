"use client";

import { useState } from "react";
import { buttonClasses, Callout } from "@/components/ui";

/**
 * Single sign-on, present and not yet wired.
 *
 * These are real controls that do a real, honest thing: they say the provider
 * is not configured for this deployment. A button that silently does nothing is
 * worse than an absent one, and a fake success would be worse than both — this
 * is an app that publishes to production applications, and pretending an
 * identity provider verified somebody is not a demo, it is a lie with a login
 * form around it.
 *
 * The marks are inline SVG rather than image files. A strict CSP is the right
 * default for a screen that takes credentials, and a login that depends on a
 * third-party asset host is a login that breaks when that host does.
 */

const PROVIDERS = [
  { id: "google", label: "Google", mark: GoogleMark },
  { id: "microsoft", label: "Microsoft", mark: MicrosoftMark },
] as const;

export function SocialSignIn({ verb = "Sign in" }: { verb?: string }) {
  const [attempted, setAttempted] = useState<string>();

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {PROVIDERS.map(({ id, label, mark: Mark }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAttempted(label)}
            className={buttonClasses({ variant: "secondary", className: "w-full" })}
          >
            <Mark />
            {verb} with {label}
          </button>
        ))}
      </div>

      {attempted && (
        <Callout
          key={attempted}
          className="rise-in"
          tone="info"
          title={`${attempted} sign-in is not configured yet`}
        >
          This deployment has no identity provider connected. Use your email and password below — an
          administrator can enable {attempted} for your organisation.
        </Callout>
      )}

      {/*
        Decorative, and hidden from assistive technology entirely.

        This carried `role="separator"` with `aria-label="or use email"`, on the
        reasoning that a bare rule announces as a separator with no meaning.
        That was wrong twice. A separator does not need a name — "separator" is
        the announcement, and it is enough. And the name it was given contained
        the word "email", so `getByLabel("Email")` matched two nodes: this rule
        and the actual email field. An accessible name that collides with a form
        control is worse than no name at all, because now the control is
        ambiguous to anyone navigating by label.

        The buttons above say what they do and the fields below are labelled.
        The line between them is a picture of a choice that has already been
        made in words.
      */}
      <div aria-hidden="true" className="flex items-center gap-3 pt-1">
        <span className="h-px flex-1 bg-rule" />
        <span className="eyebrow text-[0.5625rem] text-graphite-soft">or</span>
        <span className="h-px flex-1 bg-rule" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Google's four-colour mark, at the size the brand guidelines permit. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="size-4 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

/** Microsoft's four squares. Equal quadrants, no rounding — as specified. */
function MicrosoftMark() {
  return (
    <svg viewBox="0 0 18 18" className="size-4 shrink-0" aria-hidden="true">
      <path fill="#F25022" d="M0 0h8.5v8.5H0z" />
      <path fill="#7FBA00" d="M9.5 0H18v8.5H9.5z" />
      <path fill="#00A4EF" d="M0 9.5h8.5V18H0z" />
      <path fill="#FFB900" d="M9.5 9.5H18V18H9.5z" />
    </svg>
  );
}
