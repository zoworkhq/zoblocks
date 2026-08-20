"use client";

import { signUpAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { Field, Input, SubmitButton } from "@/components/ui";
import { SocialSignIn } from "../SocialSignIn";

/**
 * Joining an organisation that already exists.
 *
 * There is deliberately no "create an organisation" here. A tenant is created
 * by us, with a slug that becomes part of every published stylesheet URL and is
 * frozen at the first publish — that is a conversation, not a form field.
 */
export function SignUpForm() {
  return (
    <div className="space-y-5">
      <SocialSignIn verb="Continue" />

      <ActionForm
        action={signUpAction}
        className="mt-7 space-y-4"
        footer={
          <SubmitButton pendingLabel="Creating…" className="mt-5 w-full">
            Request access
          </SubmitButton>
        }
      >
        <Field label="Your name" required>
          {(props) => <Input {...props} name="name" autoComplete="name" />}
        </Field>

        <Field label="Email" required>
          {(props) => <Input {...props} name="email" type="email" autoComplete="username" />}
        </Field>

        <Field
          label="Password"
          required
          hint="At least 12 characters. Length beats punctuation — a passphrase is stronger than a short password with symbols in it."
        >
          {(props) => (
            <Input {...props} name="password" type="password" autoComplete="new-password" />
          )}
        </Field>

        <Field
          label="Organisation address"
          required
          hint="The short name in your console URLs — ask your administrator if you are not sure."
        >
          {(props) => <Input {...props} name="organisation" mono placeholder="northwind" />}
        </Field>
      </ActionForm>
    </div>
  );
}
