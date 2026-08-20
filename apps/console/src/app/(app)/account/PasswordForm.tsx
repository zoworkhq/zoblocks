"use client";

import { changePasswordAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { Field, Input, SubmitButton } from "@/components/ui";

/**
 * Change your own password.
 *
 * A client component because `Field` hands its child the `id` and
 * `aria-describedby` it generated through a callback, and a function cannot
 * cross the server/client boundary.
 *
 * `autoComplete` is spelled out on all three inputs. A password manager that
 * cannot tell the old field from the new one either fills the new one with the
 * old password or offers to save the wrong value — and the person who notices
 * is the one locked out tomorrow.
 */
export function PasswordForm() {
  return (
    <ActionForm
      action={changePasswordAction}
      className="max-w-[26rem] space-y-4"
      footer={
        <SubmitButton pendingLabel="Changing…" className="mt-5">
          Change password
        </SubmitButton>
      }
    >
      <Field label="Current password" required>
        {(props) => (
          <Input {...props} name="current" type="password" autoComplete="current-password" />
        )}
      </Field>

      <Field
        label="New password"
        required
        hint="At least 12 characters. Length beats punctuation — a passphrase is stronger than a short password with symbols in it."
      >
        {(props) => (
          <Input {...props} name="password" type="password" autoComplete="new-password" />
        )}
      </Field>
    </ActionForm>
  );
}
