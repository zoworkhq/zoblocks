"use client";

import { Archive, ArchiveRestore } from "lucide-react";
import { archiveThemeAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { ConfirmSubmit, SubmitButton } from "@/components/ui";

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
    <ActionForm
      quiet
      action={archiveThemeAction}
      /*
        In `footer`, not in `children`: children sit inside the fieldset the
        form disables while the action runs, and a button that goes `disabled`
        mid-submit drops out of the accessibility tree and sends focus to the
        document body. The publish form beside this one has always done it this
        way; this one had not.
      */
      footer={
        <>
          {/*
            Restoring needs no sentence; archiving does.

            Archiving is reversible — that is the whole reason it is not a
            delete — but it removes a theme from everybody's list in the
            organisation, and the published stylesheets carry on serving
            underneath. A reader who thinks they have taken something out of
            production has the wrong model, and the button is where that gets
            corrected.
          */}
          {archived ? (
            <SubmitButton variant="secondary" size="sm" reason={reason} pendingLabel="Restoring…">
              <ArchiveRestore aria-hidden="true" strokeWidth={2} className="size-3.5" />
              Restore
            </SubmitButton>
          ) : (
            <ConfirmSubmit
              variant="secondary"
              size="sm"
              reason={reason}
              pendingLabel="Archiving…"
              confirmLabel="Archive it"
              consequence="Hides this theme from everyone in your organisation. Published versions keep serving at their own URLs, so any application pinned to one is unaffected. You can restore it."
            >
              <Archive aria-hidden="true" strokeWidth={2} className="size-3.5" />
              Archive
            </ConfirmSubmit>
          )}
        </>
      }
    >
      <input type="hidden" name="themeId" value={themeId} />
      <input type="hidden" name="archived" value={archived ? "false" : "true"} />
    </ActionForm>
  );
}
