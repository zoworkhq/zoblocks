import Link from "next/link";
import { themeHref } from "@oxygenui-design/theme";
import { requireMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { can } from "@/lib/roles";
import {
  CopyButton,
  DataTable,
  EmptyState,
  PageHeader,
  SortHeader,
  StatusChip,
  TableSearch,
  buttonClasses,
  tableQuery,
  type Column,
} from "@/components/ui";
import type { ThemeDoc } from "@/db/collections";

export const metadata = { title: "Themes" };

/**
 * The theme list.
 *
 * Deliberately not a dashboard. The list is the job, and a row states the one
 * thing a reader needs before opening anything: whether it is live, and if it
 * is not, why.
 *
 * Search and sort live in the URL rather than in component state, so a
 * filtered list is a link somebody can send and the whole screen still works
 * with JavaScript off. See `TableTools` for the reasoning.
 *
 * A real `<table>`, not a stack of flex rows. Version and date are compared
 * down a column, which is what tables are for, and a screen reader announces
 * "column 3 of 6, Live version" in one and nothing at all in the other.
 */
export default async function ThemesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const member = await requireMember();
  const data = scoped(member.orgId);
  const org = await data.organisation.get();
  const canWrite = can(member.role, "theme.write");

  const query = tableQuery(await searchParams, { sort: "updated", dir: "desc" });
  const stored = await data.themes.find().toArray();

  /*
   * Archived themes leave the list, and say how many did.
   *
   * Hiding them without a count is how a customer concludes a theme was
   * deleted; a permanent "Archived (2)" toggle in the toolbar is furniture on
   * the overwhelming majority of screens that have none. So the control appears
   * only when there is something behind it, and the URL carries the choice like
   * every other filter here.
   */
  const showArchived = (await searchParams).archived === "1";
  const archivedCount = stored.filter((theme) => theme.status === "archived").length;
  const all = showArchived ? stored : stored.filter((theme) => theme.status !== "archived");

  /*
   * Filtered and sorted here rather than in the query.
   *
   * An organisation has a handful of themes, not a page of them — the whole
   * list is already in memory to render, and a `$regex` for a substring cannot
   * use an index anyway. If this ever needs paging, that is the moment to move
   * it into MongoDB, and the shape of the URL will not have to change.
   */
  const needle = query.q.toLowerCase();
  const matched = needle
    ? all.filter(
        (theme) =>
          theme.name.toLowerCase().includes(needle) || theme.slug.toLowerCase().includes(needle),
      )
    : all;

  const themes = [...matched].sort((a, b) => {
    const by =
      query.sort === "name"
        ? a.name.localeCompare(b.name)
        : query.sort === "live"
          ? (a.liveVersion ?? -1) - (b.liveVersion ?? -1)
          : query.sort === "status"
            ? a.status.localeCompare(b.status)
            : a.updatedAt.getTime() - b.updatedAt.getTime();
    return query.dir === "asc" ? by : -by;
  });

  const create = canWrite ? (
    <Link href="/themes/new" className={buttonClasses({ variant: "primary" })}>
      New theme
    </Link>
  ) : null;

  const sorted = (column: string) =>
    query.sort === column ? (query.dir === "asc" ? "ascending" : "descending") : undefined;

  const columns: readonly Column<ThemeDoc>[] = [
    {
      key: "name",
      header: <SortHeader label="Theme" column="name" query={query} action="/themes" />,
      sorted: sorted("name"),
      cell: (theme) => (
        <div className="min-w-0">
          <Link
            href={`/themes/${theme.slug}`}
            className="font-medium text-ink underline-offset-2 hover:underline"
          >
            {theme.name}
          </Link>
          {/*
            The slug, because it is the address. It appears in every stylesheet
            URL an application links, so it is the field a developer is actually
            looking for on this screen — and it was the one thing the list did
            not show.
          */}
          <p className="tabular truncate font-mono text-[0.6875rem] text-graphite-soft">
            {theme.slug}
          </p>
        </div>
      ),
    },
    {
      key: "brand",
      header: "Brand",
      width: "9rem",
      cell: (theme) => {
        const seed = theme.tokens.ref?.brand?.["600"];
        return seed ? (
          <span className="inline-flex items-center gap-2">
            {/* Never the swatch alone — the value is what a customer checks
                against their brand guidelines, and colour is not information. */}
            <span
              aria-hidden="true"
              className="size-4 shrink-0 rounded ring-1 ring-rule-strong"
              style={{ background: seed }}
            />
            <code className="tabular text-[0.75rem] text-graphite">{seed.toUpperCase()}</code>
          </span>
        ) : (
          <span className="text-graphite-soft">—</span>
        );
      },
    },
    {
      key: "live",
      header: <SortHeader label="Live" column="live" query={query} action="/themes" numeric />,
      sorted: sorted("live"),
      numeric: true,
      width: "6rem",
      cell: (theme) =>
        theme.liveVersion === null ? (
          <span className="text-graphite-soft">never</span>
        ) : (
          <span className="font-mono">v{theme.liveVersion}</span>
        ),
    },
    {
      key: "updated",
      header: (
        <SortHeader label="Updated" column="updated" query={query} action="/themes" numeric />
      ),
      sorted: sorted("updated"),
      numeric: true,
      width: "7rem",
      cell: (theme) => theme.updatedAt.toISOString().slice(0, 10),
    },
    {
      key: "status",
      header: <SortHeader label="Status" column="status" query={query} action="/themes" />,
      sorted: sorted("status"),
      width: "7rem",
      cell: (theme) => (
        <StatusChip
          tone={
            theme.status === "published" ? "pass" : theme.status === "archived" ? "neutral" : "warn"
          }
        >
          {theme.status}
        </StatusChip>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      width: "9rem",
      cell: (theme) =>
        // Only a published theme has a URL to copy. An unpublished one has
        // nothing to link, and a disabled button would be a promise of a value
        // that does not exist yet.
        theme.liveVersion === null ? (
          <span className="text-[0.75rem] text-graphite-soft">not published</span>
        ) : (
          <CopyButton
            variant="ghost"
            value={themeHref(org?.slug ?? "org", theme.slug, theme.liveVersion)}
          >
            Copy CSS URL
          </CopyButton>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Themes"
        lede="Validated token overrides. An edit reaches a running application only when you publish."
        actions={create}
      />

      <div className="space-y-4">
        {/* Hidden when there is nothing to search through — a filter over an
            empty list is furniture. */}
        {(all.length > 0 || archivedCount > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="min-w-0 flex-1 basis-[18rem]">
              <TableSearch
                action="/themes"
                query={query}
                placeholder="Search themes by name or address"
                total={all.length}
                showing={themes.length}
              />
            </div>
            {archivedCount > 0 && (
              <Link
                href={showArchived ? "/themes" : "/themes?archived=1"}
                className="link shrink-0 text-[0.75rem]"
              >
                {showArchived ? "Hide archived" : `Show archived (${archivedCount})`}
              </Link>
            )}
          </div>
        )}

        <DataTable
          caption="Themes in this organisation"
          columns={columns}
          rows={themes}
          rowKey={(theme) => theme._id.toHexString()}
          empty={
            query.q ? (
              /*
                A search that matched nothing is not the same state as an
                organisation with no themes, and offering "create your first
                theme" to somebody who mistyped a name is the app telling
                them the wrong thing about their own data.
              */
              <EmptyState
                title={`Nothing matches “${query.q}”`}
                body="Search covers the theme name and its address."
                actions={
                  <Link href="/themes" className={buttonClasses({ variant: "secondary" })}>
                    Clear search
                  </Link>
                }
              />
            ) : (
              <EmptyState
                title="No themes yet"
                body="Start from your brand colour. We generate the eleven-step ramp and validate every derived pair before it can go live."
                actions={
                  create ?? (
                    <p className="body-sm text-graphite">
                      Your role can view themes. Creating one needs a designer or an admin.
                    </p>
                  )
                }
              />
            )
          }
        />
      </div>
    </>
  );
}
