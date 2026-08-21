"use client";

import { Archive, ArchiveRestore } from "lucide-react";
import { archiveThemeAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/ui";

/**
 * Take a theme out of the list, or put it back.
 *
 * There was no way to remove a theme at all — `theme.archive` sat in the role
 * table with nothing behind it, so a customer's first mistaken attempt stayed
 * in their list permanently.
 *
 * Archive rather than delete, and the button says so. Published versions are
 * immutable and pinned by URL; applications are linking them right now. Deleting
 * the theme to tidy a list would break those links, so archiving hides the row
 * and leaves the stylesheets serving — which is also why the label is not
 * "Delete" dressed up.
 */
export function ArchiveForm({
  themeId,
  archived,
  reason,
}: {
  themeId: string;
  archived: boolean;
  /** Set when this role may not archive; surfaced on the control itself. */
  reason?: string;
}) {
  return (
    // `quiet` for the same reason the publish form beside it is: this sits in
    // the header's control row, where a result panel displaces the buttons.
    <ActionForm quiet action={archiveThemeAction}>
      <input type="hidden" name="themeId" value={themeId} />
      <input type="hidden" name="archived" value={archived ? "false" : "true"} />
      <SubmitButton
        variant="secondary"
        size="sm"
        reason={reason}
        pendingLabel={archived ? "Restoring…" : "Archiving…"}
      >
        {archived ? (
          <>
            <ArchiveRestore aria-hidden="true" strokeWidth={2} className="size-3.5" />
            Restore
          </>
        ) : (
          <>
            <Archive aria-hidden="true" strokeWidth={2} className="size-3.5" />
            Archive
          </>
        )}
      </SubmitButton>
    </ActionForm>
  );
}
