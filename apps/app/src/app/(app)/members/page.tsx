import { requireMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { ALL_CAPABILITIES, ROLE_SUMMARY, can, capabilitiesFor, whyNot } from "@/lib/roles";
import {
  Callout,
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatusChip,
  TableSearch,
  tableQuery,
  type Column,
} from "@/components/ui";
import type { MemberRole } from "@/db/collections";
import { MemberRow, RoleCell } from "./MemberRow";

export const metadata = { title: "Members" };

interface Row {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: "pending" | "active" | "disabled";
  createdAt: Date;
  isSelf: boolean;
}

/**
 * Who can do what, and who is waiting.
 *
 * Pending accounts sort to the top because they are the only rows that need a
 * decision — everything else on this screen is reference. A person who signed
 * up an hour ago and cannot see anything is the one support ticket this screen
 * exists to prevent.
 */
export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const member = await requireMember();
  const data = scoped(member.orgId);

  const query = tableQuery(await searchParams, { sort: "name", dir: "asc" });
  const members = await data.members.find().sort({ createdAt: 1 }).toArray();
  const canManage = can(member.role, "member.manage");
  const reason = whyNot(member.role, "member.manage");

  const rows: Row[] = members
    .map((entry) => ({
      id: entry._id.toHexString(),
      name: entry.name,
      email: entry.email,
      role: entry.role,
      status: entry.status,
      createdAt: entry.createdAt,
      isSelf: entry._id.toHexString() === member.id,
    }))
    // Pending first, then active, then disabled — decisions before reference.
    // The rank always wins: a search should narrow the list, not reorder the
    // one row that needs a decision away from the top of it.
    .sort((a, b) => rank(a.status) - rank(b.status) || a.name.localeCompare(b.name));

  const needle = query.q.toLowerCase();
  const shown = needle
    ? rows.filter(
        (row) =>
          row.name.toLowerCase().includes(needle) || row.email.toLowerCase().includes(needle),
      )
    : rows;

  const pending = rows.filter((row) => row.status === "pending").length;
  const admins = rows.filter((row) => row.role === "admin" && row.status === "active").length;

  const columns: readonly Column<Row>[] = [
    {
      key: "person",
      header: "Member",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium">
            {row.name}
            {row.isSelf && <span className="ml-1.5 text-[0.6875rem] text-graphite">(you)</span>}
          </p>
          <p className="truncate text-[0.6875rem] text-graphite">{row.email}</p>
        </div>
      ),
    },
    {
      /*
        Its own column, with a header.
        
        The select used to live in the actions cell beside a Disable button, a
        sentence explaining why Disable was unavailable, and a Reset link — four
        kinds of control in 16rem, wrapping into a ragged stack that set the row
        height. A role is a property of the person, like their status; it is not
        something you *do* to them.
      */
      key: "role",
      header: "Role",
      width: "9rem",
      cell: (row) => (
        <RoleCell memberId={row.id} role={row.role} status={row.status} canManage={canManage} />
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "8rem",
      cell: (row) => (
        <StatusChip
          tone={row.status === "active" ? "pass" : row.status === "pending" ? "warn" : "neutral"}
        >
          {row.status}
        </StatusChip>
      ),
    },
    {
      key: "capabilities",
      header: "Can",
      width: "6rem",
      numeric: true,
      cell: (row) => (
        <span className="tabular text-graphite" title={capabilitiesFor(row.role).join(", ")}>
          {row.status === "active"
            ? `${capabilitiesFor(row.role).length} of ${ALL_CAPABILITIES.length}`
            : "—"}
        </span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      numeric: true,
      width: "7rem",
      cell: (row) => row.createdAt.toISOString().slice(0, 10),
    },
    {
      key: "actions",
      header: "",
      width: "12rem",
      cell: (row) => (
        <MemberRow
          memberId={row.id}
          // Named, because the confirmation has to say who it applies to.
          // Acting on the wrong person is the error the sentence prevents.
          name={row.name}
          status={row.status}
          isSelf={row.isSelf}
          canManage={canManage}
          reason={reason}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={`${rows.length} member${rows.length === 1 ? "" : "s"}`}
        title="Members"
        lede="An administrator decides what each person may do. Accounts are disabled, never deleted."
      />

      <div className="space-y-5">
        {pending > 0 && (
          <Callout
            tone="warn"
            title={`${pending} account${pending === 1 ? "" : "s"} waiting for approval`}
          >
            Choose the role first — it decides whether they can publish.
          </Callout>
        )}

        {admins === 1 && (
          <Callout tone="info" title="One administrator">
            The last active administrator cannot be demoted or disabled. Promote a second before you
            need one.
          </Callout>
        )}

        {rows.length > 3 && (
          <TableSearch
            action="/members"
            query={query}
            placeholder="Search by name or email"
            total={rows.length}
            showing={shown.length}
            noun="member"
          />
        )}

        <DataTable
          caption="Members of this organisation"
          columns={columns}
          rows={shown}
          rowKey={(row) => row.id}
          empty={
            /*
              Reachable, despite appearances: an organisation is created with an
              administrator, but that account can be disabled by another one, and
              a disabled member still appears here. The genuinely empty case is a
              tenant seeded without a member — rare, and precisely when a bare
              table head over nothing is least helpful.
            */
            <EmptyState
              title="Nobody here yet"
              body="People appear once they request access to this organisation. An administrator then chooses what they may do."
            />
          }
        />

        <Panel title="What each role can do">
          <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {(Object.entries(ROLE_SUMMARY) as [MemberRole, string][]).map(([role, what]) => (
              <div key={role} className="flex gap-2">
                <dt className="w-20 shrink-0">
                  <StatusChip tone="neutral">{role}</StatusChip>
                </dt>
                <dd className="text-[0.75rem] leading-relaxed text-graphite">{what}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </>
  );
}

function rank(status: Row["status"]): number {
  return status === "pending" ? 0 : status === "active" ? 1 : 2;
}
