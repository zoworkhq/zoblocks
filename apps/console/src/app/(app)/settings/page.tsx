import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { whyNot } from "@/lib/roles";
import {
  Callout,
  DataTable,
  PageHeader,
  StatusChip,
  TableSearch,
  tableQuery,
  type Column,
} from "@/components/ui";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings" };

interface Entry {
  id: string;
  action: string;
  subject: string;
  detail?: string;
  at: Date;
}

/**
 * Organisation settings, and the trail of who changed what.
 *
 * The audit trail is on this screen rather than its own because it is the
 * answer to the questions this screen's controls provoke — "who made me a
 * viewer", "when did the accent change" — and a trail nobody can find is a
 * trail that may as well not be written.
 */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const member = await requireMember();
  const data = scoped(member.orgId);

  const query = tableQuery(await searchParams, { sort: "at", dir: "desc" });

  const org = await data.organisation.get();
  const publishedVersions = await data.versions.countDocuments();

  /*
   * Searching widens the window before it narrows it.
   *
   * Filtering the most recent 25 would answer "was this theme published?" with
   * "not in the last 25 things that happened", which is a different question
   * and a worse answer. A search reads further back and then filters; an
   * unfiltered view keeps its 25, because that is a summary rather than a
   * lookup.
   */
  const audit = await data.audit
    .find()
    .sort({ at: -1 })
    .limit(query.q ? 500 : 25)
    .toArray();

  const all: Entry[] = audit.map((row) => ({
    id: row._id.toHexString(),
    action: row.action,
    subject: row.subject,
    ...(row.detail ? { detail: row.detail } : {}),
    at: row.at,
  }));

  const needle = query.q.toLowerCase();
  const entries = needle
    ? all.filter(
        (entry) =>
          entry.action.toLowerCase().includes(needle) ||
          entry.subject.toLowerCase().includes(needle) ||
          (entry.detail ?? "").toLowerCase().includes(needle),
      )
    : all;

  const columns: readonly Column<Entry>[] = [
    {
      key: "action",
      header: "Action",
      width: "12rem",
      cell: (entry) => <StatusChip tone="neutral">{entry.action}</StatusChip>,
    },
    {
      key: "subject",
      header: "Subject",
      cell: (entry) => (
        <div className="min-w-0">
          <code className="block truncate font-mono text-[0.75rem]">{entry.subject}</code>
          {entry.detail && (
            <p className="truncate text-[0.6875rem] text-graphite" title={entry.detail}>
              {entry.detail}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "at",
      header: "When",
      numeric: true,
      width: "11rem",
      sorted: "descending",
      cell: (entry) => entry.at.toISOString().slice(0, 16).replace("T", " "),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={org?.name}
        title="Settings"
        lede="The organisation's identity, and every change made to it."
      />

      <div className="space-y-6">
        <SettingsForm
          name={org?.name ?? ""}
          slug={org?.slug ?? ""}
          publishedVersions={publishedVersions}
          reason={whyNot(member.role, "org.configure")}
        />

        <Callout tone="info" title="Frameworks are configured separately">
          Which bridges this console offers lives on the{" "}
          <Link href="/frameworks" className="link">
            frameworks screen
          </Link>
          , beside the numbers that explain what each one reaches.
        </Callout>

        <section>
          <h2 className="mb-3 font-display text-[0.9375rem] font-semibold tracking-[-0.008em]">
            Recent activity
          </h2>
          {all.length > 0 && (
            <div className="mb-3">
              <TableSearch
                action="/settings"
                query={query}
                placeholder="Search by action, theme or detail"
                total={all.length}
                showing={entries.length}
                noun="entry"
              />
            </div>
          )}

          <DataTable
            caption="Recent audit entries for this organisation"
            columns={columns}
            rows={entries}
            rowKey={(entry) => entry.id}
            empty={
              <p className="surface px-5 py-6 text-center text-[0.8125rem] text-graphite">
                Nothing recorded yet.
              </p>
            }
          />
          <p className="body-sm mt-2 text-graphite">
            Append-only. Nothing here is ever updated or deleted, which is what makes it evidence
            rather than a log.
          </p>
        </section>
      </div>
    </>
  );
}
