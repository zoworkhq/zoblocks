"use client";

import Link from "next/link";
import { signInAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { Field, Input, SubmitButton } from "@/components/ui";
import { SocialSignIn } from "../SocialSignIn";

/**
 * A client component for a form with no client state, which looks redundant
 * and is not.
 *
 * `Field` takes a render callback so it can hand its child the `id` and the
 * `aria-describedby` it generated — that binding is the whole reason the
 * component exists, and getting it wrong is the most common accessibility
 * failure in a form. A callback is a function, and a function cannot cross the
 * server/client boundary, so anything using `Field` is a client component.
 */
export function LoginForm() {
  return (
    <div className="space-y-5">
      <SocialSignIn />

      <ActionForm
        action={signInAction}
        className="space-y-4"
        footer={
          <SubmitButton pendingLabel="Signing in…" className="mt-5 w-full">
            Sign in
          </SubmitButton>
        }
      >
        <Field label="Email" required>
          {(props) => (
            <Input {...props} name="email" type="email" autoComplete="username" autoFocus />
          )}
        </Field>

        <Field label="Password" required>
          {(props) => (
            <Input {...props} name="password" type="password" autoComplete="current-password" />
          )}
        </Field>

        {/*
          Beneath the password and above the button, which is where somebody who
          has just failed to remember it is already looking.

          `inline-flex` with a 24px minimum height, not a bare inline link.
          WCAG 2.2 SC 2.5.8 wants a 24×24 target, and it exempts links sitting
          inside a sentence because their size is set by the surrounding text —
          this one is alone in its own paragraph, so the exemption does not
          apply and at 12px type it was a 15px-tall target. The axe sweep caught
          it; a person with an unsteady hand would have caught it sooner.
        */}
        <p className="text-[0.75rem]">
          <Link href="/forgot" className="link inline-flex min-h-[24px] items-center">
            Forgotten your password?
          </Link>
        </p>
      </ActionForm>
    </div>
  );
}
