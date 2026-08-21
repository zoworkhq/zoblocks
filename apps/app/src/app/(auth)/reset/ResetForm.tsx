"use client";

import { resetPasswordAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { Field, Input, SubmitButton } from "@/components/ui";

export function ResetForm({ token }: { token: string }) {
  return (
    <ActionForm
      action={resetPasswordAction}
      className="mt-7 space-y-4"
      footer={
        <SubmitButton pendingLabel="Setting…" className="mt-5 w-full">
          Set password and sign out everywhere
        </SubmitButton>
      }
    >
      <input type="hidden" name="token" value={token} />

      <Field
        label="New password"
        required
        hint="At least 12 characters. Length beats punctuation — a passphrase is stronger than a short password with symbols in it."
      >
        {(props) => (
          <Input {...props} name="password" type="password" autoComplete="new-password" autoFocus />
        )}
      </Field>
    </ActionForm>
  );
}
