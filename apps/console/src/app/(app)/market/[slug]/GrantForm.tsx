"use client";

import { grantAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { Field, Input, SubmitButton } from "@/components/ui";

/**
 * Granting without charging.
 *
 * A client component rather than markup on the page, and the reason is written
 * on `Field` itself: its child is a render prop, and a function cannot cross
 * the server/client boundary. Every other form in this console is extracted for
 * the same reason — see `SettingsForm` and `PasswordForm`.
 *
 * Folded behind a disclosure rather than sitting beside Buy, because it is rare
 * and because a control that hands over a paid pack for nothing should take a
 * deliberate act to reach.
 */
export function GrantForm({ slug }: { slug: string }) {
  return (
    <details className="mt-4 border-t border-rule pt-3">
      <summary className="body-sm cursor-pointer text-graphite">
        Granted with a contract, or paid against an invoice?
      </summary>

      <ActionForm action={grantAction} className="mt-3">
        <input type="hidden" name="slug" value={slug} />
        <Field
          label="Reason"
          hint="It lands on the entitlement and in the audit trail, and it is all a reader in a year will have."
          required
        >
          {(props) => <Input {...props} name="reason" maxLength={120} placeholder="INV-2026-118" />}
        </Field>
        <div className="mt-3">
          <SubmitButton variant="secondary" size="sm" pendingLabel="Granting…">
            Grant without charging
          </SubmitButton>
        </div>
      </ActionForm>
    </details>
  );
}
