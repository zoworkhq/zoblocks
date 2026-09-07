import Link from "next/link";
import { notFound } from "next/navigation";
import { MAX_FONT_BYTES } from "@zoblocks/theme";
import { requireMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { baseTokens } from "@/lib/base-tokens";
import { can, whyNot } from "@/lib/roles";
import { buildEditorModel } from "@/lib/token-editor";
import { PageHeader, Panel, StatusChip } from "@/components/ui";
import { TypographyEditor } from "./TypographyEditor";

export const metadata = { title: "Typography" };

/**
 * Typography, judged against a specimen that can actually fail.
 *
 * The specimen is a result table rather than a paragraph of prose, because a
 * font choice fails in a column of numbers and nowhere else. A face without
 * tabular figures looks perfectly good in a heading and makes every vitals
 * table ragged — and that is invisible until you look at aligned digits, which
 * is why the preview shows some.
 *
 * The families and the base size are *not* edited here. They are
 * `--zb-font-sans`, `--zb-font-mono` and `--zb-text-base`: ordinary semantic
 * tokens, edited on the token editor with the same live contrast and the same
 * gate as everything else. Duplicating them here would be a second place for
 * the same value, and the two would disagree.
 */
export default async function TypographyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = await requireMember();
  const theme = await scoped(member.orgId).themes.findOne({ slug });
  if (!theme) notFound();

  const model = buildEditorModel(await baseTokens(), theme.slug, theme.tokens, "light");
  const resolved = model.resolved;
  const fonts = theme.assets?.fonts ?? [];

  // The specimen renders in whichever family the theme actually resolves to, so
  // what a customer judges is what their application will draw.
  const sans = fonts[0]?.family ?? resolved["--zb-font-sans"];
  const mono = resolved["--zb-font-mono"];

  return (
    <>
      <PageHeader
        eyebrowHref={`/themes/${slug}`}
        eyebrow={`${theme.name}${theme.liveVersion ? ` · v${theme.liveVersion} live` : " · draft"}`}
        title="Typography"
        lede="Upload the faces your brand uses. Sizes live on the token editor."
      />

      {/*
       * `min-w-0` on both children is load-bearing, not tidying.
       *
       * A grid item defaults to `min-width: auto`, which floors it at its
       * content's min-content width. The specimen lists font stacks with
       * `truncate` — and `truncate` sets `white-space: nowrap`, whose
       * min-content width is the *entire* string. So the column widened to fit
       * `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
       * sans-serif`, truncation never engaged, and the page scrolled sideways
       * by 197px at 320px wide. `minmax(0, …)` already covered the second
       * column at `lg`; below `lg` the grid is one column and nothing did.
       */}
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,21rem)] lg:items-start">
        <div className="min-w-0">
          <TypographyEditor
            themeId={theme._id.toHexString()}
            fonts={fonts}
            maxBytes={MAX_FONT_BYTES}
            canWrite={can(member.role, "theme.write")}
            reason={whyNot(member.role, "theme.write")}
          />
        </div>

        <div className="min-w-0 space-y-4 lg:sticky lg:top-6">
          <Panel
            title="Specimen"
            description="A result table, not a paragraph. Ragged digits are invisible in prose and obvious here."
          >
            <div className="preview-region -m-1 p-4" style={{ fontFamily: sans }}>
              <p className="text-[0.9375rem] font-semibold">Serum potassium</p>
              <p className="text-[0.6875rem] text-graphite">Observation · 14 Aug 2026 09:12</p>

              {/* Digits in a column, which is the only place this decision shows. */}
              <dl
                className="tabular mt-3 space-y-1 text-[0.75rem]"
                style={{ fontFamily: mono ?? "ui-monospace, monospace" }}
              >
                {[
                  ["K⁺", "5.9", "mmol/L"],
                  ["Na⁺", "138.0", "mmol/L"],
                  ["Cl⁻", "101.5", "mmol/L"],
                ].map(([symbol, value, unit]) => (
                  <div key={symbol} className="flex justify-between gap-4">
                    <dt>{symbol}</dt>
                    <dd>
                      <b>{value}</b> {unit}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-3">
                {/* The word carries the meaning; the colour reinforces it. */}
                <StatusChip tone="fail">critical high</StatusChip>
                <span className="tabular ml-2 text-[0.6875rem] text-graphite">ref 3.5–5.1</span>
              </p>
            </div>
          </Panel>

          <Panel title="Resolved now" padded={false}>
            <dl className="divide-y divide-rule text-[0.75rem]">
              {[
                ["--zb-font-sans", resolved["--zb-font-sans"]],
                ["--zb-font-mono", resolved["--zb-font-mono"]],
                ["--zb-text-base", resolved["--zb-text-base"]],
              ].map(([token, value]) => (
                <div key={token} className="px-4 py-2.5">
                  <dt className="font-mono text-[0.6875rem] text-graphite-soft">{token}</dt>
                  <dd className="mt-0.5 truncate font-mono text-[0.6875rem]" title={value}>
                    {value ?? "—"}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-rule px-4 py-2.5">
              <Link href={`/themes/${slug}/tokens`} className="text-[0.75rem] link">
                Edit these on the token editor →
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
