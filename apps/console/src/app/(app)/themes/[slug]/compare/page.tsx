import { notFound } from "next/navigation";
import { currentMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { baseTokens } from "@/lib/base-tokens";
import { validateTheme } from "@oxygenui-design/theme";
import { DataTable, EmptyState, PageHeader, Panel, StatusChip, type Column } from "@/components/ui";
import { ComparePicker } from "./ComparePicker";

export const metadata = { title: "Compare" };

interface Change {
  token: string;
  before?: string;
  after?: string;
}

/**
 * Two versions, and what changed between them.
 *
 * Computed from two immutable `themeVersions` documents, so the diff is exact
 * rather than reconstructed — that is the property immutability buys, and the
 * reason rollback is a pointer move rather than a restore.
 *
 * Each version carries the verdict of re-running today's gate over it, not the
 * verdict recorded when it was published. A version that passed last year and
 * fails now is the interesting case: the floors do not move, but the validator
 * gains checks, and a customer deciding what to roll back to needs the current
 * answer rather than the historical one.
 */
export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { slug } = await params;
  const { a, b } = await searchParams;
  const member = (await currentMember())!;
  const data = scoped(member.orgId);

  const theme = await data.themes.findOne({ slug });
  if (!theme) notFound();

  const versions = await data.versions.find({ themeId: theme._id }).sort({ version: -1 }).toArray();

  if (versions.length < 2) {
    return (
      <>
        <PageHeader eyebrow={theme.name} title="Compare versions" />
        <EmptyState
          title="A comparison needs two versions"
          body={`${theme.name} has ${versions.length === 0 ? "no published versions" : "one published version"}. Publish again and the difference between the two appears here, token by token.`}
        />
      </>
    );
  }

  const pick = (want: string | undefined, fallback: number) => {
    const n = Number(want);
    return versions.find((v) => v.version === n) ?? versions.find((v) => v.version === fallback);
  };

  const left = pick(a, versions[1]!.version)!;
  const right = pick(b, versions[0]!.version)!;

  // Every step either side defines, so a token added or removed shows up as a
  // change rather than silently not appearing.
  const groups = new Set([...Object.keys(left.tokens.ref), ...Object.keys(right.tokens.ref)]);

  const rows: Change[] = [];
  for (const group of groups) {
    const steps = new Set([
      ...Object.keys(left.tokens.ref[group] ?? {}),
      ...Object.keys(right.tokens.ref[group] ?? {}),
    ]);
    for (const step of steps) {
      const before = left.tokens.ref[group]?.[step];
      const after = right.tokens.ref[group]?.[step];
      if (before !== after) rows.push({ token: `ref.${group}.${step}`, before, after });
    }
  }
  rows.sort((x, y) => x.token.localeCompare(y.token));

  const base = await baseTokens();
  const now = new Date().toISOString();
  const sides = [
    {
      label: `v${left.version}`,
      check: validateTheme(base, theme.slug, left.tokens, now),
      live: left.version === theme.liveVersion,
    },
    {
      label: `v${right.version}`,
      check: validateTheme(base, theme.slug, right.tokens, now),
      live: right.version === theme.liveVersion,
    },
  ];

  const columns: readonly Column<Change>[] = [
    {
      key: "token",
      header: "Token",
      cell: (row) => <code className="font-mono text-[0.75rem]">{row.token}</code>,
    },
    {
      key: "before",
      header: `v${left.version}`,
      width: "11rem",
      cell: (row) => <Value value={row.before} />,
    },
    {
      key: "after",
      header: `v${right.version}`,
      width: "11rem",
      cell: (row) => <Value value={row.after} />,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrowHref={`/themes/${slug}`}
        eyebrow={theme.name}
        title="Compare versions"
        lede={`v${left.version} against v${right.version} — ${rows.length} token change${rows.length === 1 ? "" : "s"}, re-checked against today's rules.`}
      />

      <div className="space-y-6">
        <ComparePicker
          versions={versions.map((v) => ({
            version: v.version,
            live: v.version === theme.liveVersion,
          }))}
          left={left.version}
          right={right.version}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {sides.map(({ label, check, live }) => (
            <Panel key={label} padded={false}>
              <div className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[0.9375rem] font-semibold">{label}</span>
                  {live && <StatusChip tone="pass">live</StatusChip>}
                  <StatusChip tone={check.ok ? "pass" : "fail"} className="ml-auto">
                    {check.ok ? "passes" : "fails"}
                  </StatusChip>
                </div>
                <p className="body-sm mt-1.5 text-graphite">
                  {check.ok
                    ? `${check.record.contrastPairs.checked} pairs pass`
                    : `${check.problems.length} failure(s) under today's rules`}
                </p>
              </div>
            </Panel>
          ))}
        </div>

        <DataTable
          caption={`Token differences between v${left.version} and v${right.version}`}
          columns={columns}
          rows={rows}
          rowKey={(row) => row.token}
          empty={
            <p className="surface px-5 py-6 text-center text-[0.8125rem] text-graphite">
              The palettes are identical. The versions differ only in when they were published.
            </p>
          }
        />
      </div>
    </>
  );
}

/** A colour with its value beside it — never the swatch alone. */
function Value({ value }: { value?: string }) {
  if (!value) return <span className="text-graphite-soft">—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="size-4 shrink-0 rounded ring-1 ring-rule-strong"
        style={{ background: value }}
      />
      <code className="tabular font-mono text-[0.75rem] uppercase">{value}</code>
    </span>
  );
}
