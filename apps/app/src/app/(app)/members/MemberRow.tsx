"use client";

import { KeyRound } from "lucide-react";
import { issueResetAction, updateMemberAction } from "@/lib/actions";
import { ROLE_SUMMARY } from "@/lib/roles";
import { ActionForm } from "@/components/action-form";
import { ConfirmSubmit, Select, StatusChip, SubmitButton } from "@/components/ui";
import type { MemberRole } from "@/db/collections";

/**
 * Built from `ROLE_SUMMARY` rather than restating it. The sentence somebody
 * reads while choosing a role and the sentence in the reference table under
 * this list are now guaranteed to be the same sentence.
 */
const ROLES: readonly { value: MemberRole; label: string; can: string }[] = (
  Object.keys(ROLE_SUMMARY) as MemberRole[]
).map((value) => ({
  value,
  label: value[0]!.toUpperCase() + value.slice(1),
  can: ROLE_SUMMARY[value],
}));

/**
 * The controls on one member.
 *
 * A `<select>` that submits on change rather than a select plus a save button.
 * A role change is one decision with an immediate, reversible effect and a
 * server-side guard behind it; making somebody confirm it twice implies a
 * weight it does not have. The refusals that *do* matter — the last admin,
 * disabling yourself — come back as messages rather than being prevented by a
 * greyed control, because the reason is the useful part.
 */
/**
 * The role, as a column of its own.
 *
 * A pending member has no role yet — approving them chooses one — so this
 * shows what they will get and leaves the choice with the Approve control,
 * where it is part of a single decision rather than a second one.
 */
export function RoleCell({
  memberId,
  role,
  status,
  canManage,
}: {
  memberId: string;
  role: MemberRole;
  status: "pending" | "active" | "disabled";
  canManage: boolean;
}) {
  if (status === "pending") {
    return <span className="text-[0.8125rem] text-graphite">On approval</span>;
  }

  return (
    <ActionForm quiet action={updateMemberAction}>
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="intent" value="role" />
      <label className="sr-only" htmlFor={`role-${memberId}`}>
        Role
      </label>
      <Select
        id={`role-${memberId}`}
        name="role"
        size="sm"
        defaultValue={role}
        disabled={!canManage}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {ROLES.map((entry) => (
          // The description lives on the option rather than in a reference
          // panel beside the table: it is the moment the choice is being made.
          <option key={entry.value} value={entry.value} title={entry.can}>
            {entry.label}
          </option>
        ))}
      </Select>
    </ActionForm>
  );
}

export function MemberRow({
  memberId,
  name,
  status,
  isSelf,
  canManage,
  reason,
}: {
  memberId: string;
  /** The person this row acts on. Named in the confirmation, per CONTENT.md §4. */
  name: string;
  status: "pending" | "active" | "disabled";
  isSelf: boolean;
  canManage: boolean;
  reason?: string;
}) {
  if (status === "pending") {
    return (
      <ActionForm quiet action={updateMemberAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="memberId" value={memberId} />
        <input type="hidden" name="intent" value="approve" />
        <label className="sr-only" htmlFor={`role-${memberId}`}>
          Role to approve with
        </label>
        <Select
          id={`role-${memberId}`}
          name="role"
          size="sm"
          defaultValue="viewer"
          disabled={!canManage}
          className="w-32"
        >
          {ROLES.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </Select>
        <SubmitButton reason={reason} size="sm" pendingLabel="Approving…">
          Approve
        </SubmitButton>
      </ActionForm>
    );
  }

  /*
   * A left-aligned column, not a wrapping row.
   *
   * `SubmitButton` renders its `reason` as a sibling, so a row that wraps put
   * the button, a two-line sentence and a link at three different left edges.
   * The reason is worth keeping visible — a disabled control that does not say
   * why is a dead end — so the fix is to stop pretending these are inline.
   */
  return (
    <div className="flex flex-col items-start gap-1.5">
      <ActionForm
        quiet
        action={updateMemberAction}
        // In `footer`, so the control does not go `disabled` mid-submit and
        // drop focus to the document body — the same reason the publish form
        // on the theme page does it this way.
        footer={
          /*
            Disabling takes somebody's access away and re-enabling gives it
            back; only one of those is worth a sentence. The name is in it
            because a column of identical buttons in a member table is exactly
            where the wrong one gets clicked.
          */
          status === "active" ? (
            <ConfirmSubmit
              variant="danger"
              reason={isSelf ? "You cannot disable your own account." : reason}
              size="sm"
              pendingLabel="Saving…"
              confirmLabel="Disable"
              consequence={`Signs ${name} out everywhere and blocks them from signing back in. The account and its audit trail are kept, and you can re-enable it.`}
            >
              Disable
            </ConfirmSubmit>
          ) : (
            <SubmitButton variant="secondary" reason={reason} size="sm" pendingLabel="Saving…">
              Re-enable
            </SubmitButton>
          )
        }
      >
        <input type="hidden" name="memberId" value={memberId} />
        <input type="hidden" name="intent" value="status" />
        <input type="hidden" name="status" value={status === "active" ? "disabled" : "active"} />
      </ActionForm>

      {status === "active" && (
        // The link is returned in the result and shown once — only its hash is
        // stored, so it is never recoverable afterwards.
        <ActionForm quiet action={issueResetAction}>
          <input type="hidden" name="memberId" value={memberId} />
          <SubmitButton variant="ghost" size="sm" reason={reason} pendingLabel="Issuing…">
            <KeyRound aria-hidden="true" className="size-3.5" />
            Reset link
          </SubmitButton>
        </ActionForm>
      )}

      {status === "disabled" && <StatusChip tone="neutral">no access</StatusChip>}
    </div>
  );
}
