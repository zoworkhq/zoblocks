import Link from "next/link";
import { currentMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { ROLE_SUMMARY } from "@/lib/roles";
import { Callout, PageHeader, Panel, StatusChip } from "@/components/ui";
import { PasswordForm } from "./PasswordForm";

export const metadata = { title: "Account" };

/**
 * Your own account, as distinct from the organisation's settings.
 *
 * The split is the point. `/settings` is the tenant — its name, its address,
 * the audit trail — and needs an administrator. This is the one screen that is
 * yours whatever your role, and until now it did not exist: `changePassword`
 * had been sitting in `auth.ts` with no action and no form in front of it, so
 * routine hygiene meant asking an administrator to mint you a reset link.
 *
 * Nothing here is editable except the password. Name, email and role are
 * decided by the organisation — a member who could rename themselves after
 * publishing a theme would make the audit trail a suggestion.
 */
export default async function AccountPage() {
  const member = (await currentMember())!;
  const org = await scoped(member.orgId).organisation.get();

  return (
    <>
      <PageHeader
        eyebrow={org?.name}
        title="Your account"
        lede="Your identity here is set by your organisation. Your password is yours."
      />

      <div className="space-y-6">
        <Panel title="You" description="Ask an administrator to change any of this.">
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Detail label="Name" value={member.name} />
            <Detail label="Email" value={member.email} mono />
            <Detail
              label="Role"
              value={<StatusChip tone="accent">{member.role}</StatusChip>}
              note={ROLE_SUMMARY[member.role]}
            />
            <Detail label="Organisation" value={org?.name ?? "—"} note={org?.slug} />
          </dl>
        </Panel>

        <Panel
          id="password"
          title="Change password"
          description="Knowing your current password is what makes this a change rather than a recovery."
        >
          <PasswordForm />

          <Callout tone="info" title="Your other devices will be signed out" className="mt-6">
            This session stays signed in and every other one is destroyed, so changing your password
            on the machine in front of you does not lock you out of it. If you have forgotten the
            current password, an administrator can{" "}
            <Link href="/members" className="link">
              issue you a reset link
            </Link>{" "}
            instead — that one signs out every device including this.
          </Callout>
        </Panel>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function Detail({
  label,
  value,
  note,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    /*
      The note lives inside the `<dd>`, not beside it.
      
      A `<div>` inside a `<dl>` may hold `<dt>`s followed by `<dd>`s and nothing
      else — a `<p>` sibling makes the list malformed, which is what the axe
      sweep caught the first time it was pointed at this screen. It is also the
      more honest nesting: the note describes the value, so it belongs to it.
    */
    <div className="min-w-0">
      <dt className="eyebrow text-[0.5625rem] text-graphite-soft">{label}</dt>
      <dd className={mono ? "tabular mt-1.5 truncate font-mono text-[0.8125rem]" : "mt-1.5"}>
        {value}
        {note && <p className="mt-1 text-[0.75rem] leading-relaxed text-graphite">{note}</p>}
      </dd>
    </div>
  );
}
