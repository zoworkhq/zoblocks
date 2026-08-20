"use client";

import { useState } from "react";
import { Undo2 } from "lucide-react";
import { rollbackThemeAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { Button, Field, Input, SubmitButton } from "@/components/ui";

/**
 * Restoring an earlier version.
 *
 * A rollback is a *forward* move: it publishes the old palette as a new version
 * rather than rewinding a pointer to the old one. That keeps every version
 * immutable and keeps "what was live on the 14th" answerable, which is the
 * property the whole versioning design exists for.
 *
 * The reason field has a ten-character floor, enforced on the server. "fix" is
 * not a reason, and a rollback with no reason is unreadable a year later by the
 * person who has to explain it.
 */
export function RestoreForm({
  themeId,
  version,
  reason,
}: {
  themeId: string;
  version: number;
  /** Why this restore is blocked — role, or a version that no longer passes. */
  reason?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
        reason={reason}
        size="sm"
      >
        <Undo2 aria-hidden="true" className="size-3.5" />
        Restore
      </Button>
    );
  }

  return (
    <ActionForm
      action={rollbackThemeAction}
      className="w-full max-w-[26rem] space-y-2"
      footer={
        <div className="mt-2 flex items-center gap-2">
          <SubmitButton reason={reason} pendingLabel="Restoring…">
            Restore v{version}
          </SubmitButton>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      }
    >
      <input type="hidden" name="themeId" value={themeId} />
      <input type="hidden" name="toVersion" value={version} />

      <Field
        label={`Why are you restoring v${version}?`}
        required
        hint="At least ten characters. This goes in the audit trail and on the version itself."
      >
        {(props) => (
          <Input
            {...props}
            name="reason"
            minLength={10}
            maxLength={280}
            placeholder="Contrast regression in the new accent"
          />
        )}
      </Field>
    </ActionForm>
  );
}
