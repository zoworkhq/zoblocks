import Link from "next/link";
import { notFound } from "next/navigation";
import { VALIDATOR_VERSION, validateTheme } from "@zoblocks/theme";
import { requireMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { baseTokens } from "@/lib/base-tokens";
import { whyNot } from "@/lib/roles";
import {
  Callout,
  DataTable,
  EmptyState,
  PageHeader,
  StatusChip,
  type Column,
  Verdict,
} from "@/components/ui";
import { RestoreForm } from "./RestoreForm";

export const metadata = { title: "Version history" };

interface Row {
  version: number;
  publishedAt: Date;
  rolledBackFrom?: number;
  reason?: string;
  live: boolean;
  /** What the *current* validator says about it, not what was recorded then. */
  passesNow: boolean;
  problems: number;
  validatedBy: string;
  pairsChecked: number;
}

/**
 * Every published version, and whether it could still go live today.
 *
 * The second half is the point, and it is why this is a screen rather than a
 * panel on the theme page. A version records the verdict it was published
 * under; the floors do not move, but the validator gains checks, so a palette
 * that passed under 1.0.0 may not pass under 1.1.0. Someone deciding what to
 * roll back to needs today's answer, not the historical one — and a rollback
 * that would fail is refused by the server anyway, so showing it here turns a
 * dead end into information.
 */
export default async function HistoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = await requireMember();
  const data = scoped(member.orgId);

  const theme = await data.themes.findOne({ slug });
  if (!theme) notFound();

  const versions = await data.versions.find({ themeId: theme._id }).sort({ version: -1 }).toArray();
  const base = await baseTokens();
  const now = new Date().toISOString();

  const rows: Row[] = versions.map((version) => {
    const check = validateTheme(base, theme.slug, version.tokens, now);
    return {
      version: version.version,
      publishedAt: version.publishedAt,
      ...(version.rolledBackFrom ? { rolledBackFrom: version.rolledBackFrom } : {}),
      ...(version.reason ? { reason: version.reason } : {}),
      live: version.version === theme.liveVersion,
      passesNow: check.ok,
      problems: check.problems.length,
      validatedBy: version.validation.validatorVersion,
      pairsChecked: version.validation.contrastPairs.checked,
    };
  });

  const stale = rows.filter((row) => row.validatedBy !== VALIDATOR_VERSION).length;
  const restoreReason = whyNot(member.role, "theme.rollback");

  const columns: readonly Column<Row>[] = [
    {
      key: "version",
      header: "Version",
      width: "8rem",
      cell: (row) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-mono font-medium">v{row.version}</span>
          {row.live && <StatusChip tone="accent">live</StatusChip>}
        </span>
      ),
    },
    {
      key: "what",
      header: "What was published",
      cell: (row) =>
        row.rolledBackFrom ? (
          <>
            Restored v{row.rolledBackFrom}
            {row.reason && <span className="text-graphite"> — {row.reason}</span>}
          </>
        ) : (
          <span className="text-graphite">{row.pairsChecked} contrast pairs passed</span>
        ),
    },
    {
      key: "today",
      header: "Under today's rules",
      width: "11rem",
      cell: (row) => (
        <span className="inline-flex items-center gap-2">
          <Verdict ok={row.passesNow}>
            {row.passesNow ? "passes" : `${row.problems} failing`}
          </Verdict>
          {row.validatedBy !== VALIDATOR_VERSION && (
            <span
              className="tabular font-mono text-[0.625rem] text-graphite-soft"
              title={`Validated by ${row.validatedBy}; current validator is ${VALIDATOR_VERSION}`}
            >
              {row.validatedBy}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "at",
      header: "Published",
      numeric: true,
      width: "7rem",
      sorted: "descending",
      cell: (row) => row.publishedAt.toISOString().slice(0, 10),
    },
    {
      key: "restore",
      header: "",
      width: "13rem",
      cell: (row) =>
        row.live ? (
          <span className="text-[0.75rem] text-graphite-soft">current</span>
        ) : (
          <RestoreForm
            themeId={theme._id.toHexString()}
            version={row.version}
            reason={
              !row.passesNow
                ? `v${row.version} does not pass the current rules. Restoring it is refused by the server, whatever your role.`
                : restoreReason
            }
          />
        ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrowHref={`/themes/${slug}`}
        eyebrow={`${theme.name}${theme.liveVersion ? ` · v${theme.liveVersion} live` : " · draft"}`}
        title="Version history"
        lede="Every publish writes a new immutable version. Restoring one publishes it again."
      />

      <div className="space-y-5">
        {stale > 0 && (
          <Callout
            tone="warn"
            title={`${stale} version${stale === 1 ? "" : "s"} predate the current validator`}
          >
            The accessibility floors have not moved, but the validator has gained checks — it is now{" "}
            {VALIDATOR_VERSION}. The <em>Under today&rsquo;s rules</em> column re-runs the current
            gate over each stored palette, so what you see is what a restore would be held to. One
            that fails is refused by the server, by any role.
          </Callout>
        )}

        <DataTable
          caption={`Published versions of ${theme.name}`}
          columns={columns}
          rows={rows}
          rowKey={(row) => String(row.version)}
          empty={
            <EmptyState
              title="Never published"
              body="The first publish becomes v1. Until then this theme is a draft, and nothing serves it."
              actions={
                <Link href={`/themes/${slug}`} className="text-[0.8125rem] link">
                  Back to the theme
                </Link>
              }
            />
          }
        />

        {rows.length >= 2 && (
          <p className="body-sm text-graphite">
            <Link
              href={`/themes/${slug}/compare?a=${rows[1]!.version}&b=${rows[0]!.version}`}
              className="link"
            >
              Compare v{rows[1]!.version} with v{rows[0]!.version} →
            </Link>
          </p>
        )}
      </div>
    </>
  );
}
