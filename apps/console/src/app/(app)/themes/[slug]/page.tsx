import { notFound } from "next/navigation";
import { currentMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { baseTokens } from "@/lib/base-tokens";
import { RAMP_STEPS, themeHref, validateTheme, withTierDefaults } from "@oxygenui-design/theme";
import { whyNot } from "@/lib/roles";
import { publishThemeAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import {
  Callout,
  CopyButton,
  DataTable,
  PageHeader,
  Panel,
  Ramp,
  StatusChip,
  SubmitButton,
  type Column,
} from "@/components/ui";
import type { ThemeVersionDoc } from "@/db/collections";
import { ThemeScreens } from "./ThemeScreens";
import { ArchiveForm } from "./ArchiveForm";

export const metadata = { title: "Theme" };

/**
 * One theme: its ramp, what the gate says about it, and its history.
 *
 * The validation panel is the point of the screen. It runs the *same* check the
 * publish action runs, so what a reader sees here is what the server will
 * decide — and every failure states the pair, the measured ratio, the floor and
 * the WCAG criterion, because "invalid colour" is not something a customer can
 * act on.
 */
export default async function ThemePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = (await currentMember())!;
  const data = scoped(member.orgId);

  const theme = await data.themes.findOne({ slug });
  if (!theme) notFound();

  const org = await data.organisation.get();
  const versions = await data.versions.find({ themeId: theme._id }).sort({ version: -1 }).toArray();

  const check = validateTheme(
    await baseTokens(),
    theme.slug,
    theme.tokens,
    new Date().toISOString(),
  );
  const ramp = theme.tokens.ref?.brand ?? {};
  const href = theme.liveVersion
    ? themeHref(org?.slug ?? "org", theme.slug, theme.liveVersion)
    : undefined;

  /*
   * Two reasons Publish can be blocked, and the accessibility one wins.
   *
   * A designer sees it disabled because of their role; anyone sees it disabled
   * because the theme fails. Showing the role reason to someone whose theme
   * also fails would send them to find an admin, who would then hit the same
   * wall — so the reason no role can override is the one shown.
   */
  const publishReason = !check.ok
    ? `${check.problems.length} accessibility failure(s). This cannot be published by any role.`
    : whyNot(member.role, "theme.publish");

  const columns: readonly Column<ThemeVersionDoc>[] = [
    {
      key: "version",
      header: "Version",
      width: "6rem",
      cell: (version) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-mono font-medium">v{version.version}</span>
          {version.version === theme.liveVersion && <StatusChip tone="accent">live</StatusChip>}
        </span>
      ),
    },
    {
      key: "what",
      header: "What was published",
      cell: (version) =>
        version.rolledBackFrom ? (
          <>
            Restored v{version.rolledBackFrom}
            {version.reason && <span className="text-graphite"> — {version.reason}</span>}
          </>
        ) : (
          <span className="text-graphite">
            {version.validation.contrastPairs.checked} contrast pairs passed
          </span>
        ),
    },
    {
      key: "at",
      header: "Published",
      numeric: true,
      width: "7rem",
      sorted: "descending",
      cell: (version) => version.publishedAt.toISOString().slice(0, 10),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={
          theme.liveVersion
            ? `${org?.name ?? "Organisation"} · v${theme.liveVersion} live`
            : org?.name
        }
        title={theme.name}
        lede="Nothing here reaches a running application until you publish."
        actions={
          <>
            {/* Archive first, Publish last: the primary action sits rightmost,
                and the one that removes a theme from the list is not where a
                hand lands by default. Two children in one `actions` rather than
                a new slot — the container is already a flex row. */}
            <ArchiveForm
              themeId={theme._id.toHexString()}
              archived={theme.status === "archived"}
              reason={whyNot(member.role, "theme.archive")}
            />

            {/* Width-capped because the form renders its own result beneath the
                button, and "Published v3. Link https://…/t/northwind/clinical@3.css
                from your application." is a sentence, not a label — unconstrained
                it would stretch the header and push the title off its own line. */}
            <ActionForm
              action={publishThemeAction}
              /*
                Toast only. The header is a row of controls, and an inline
                result panel inside it is not a layout problem that can be
                width-capped away: two forms live here, each renders its own
                panel beside its own button, and after one archive and one
                publish the row holds two buttons and two paragraphs pushed out
                of alignment with each other.
                
                Nothing is lost by moving it. The toast announces, and the
                version-pinned URL — the part actually worth keeping — is on the
                Live stylesheet panel below with a copy button, where it
                persists instead of scrolling away.
              */
              quiet
              // In `footer`, not in `children`: children sit inside the fieldset
              // the form disables while the action runs, and a button that goes
              // `disabled` mid-submit drops out of the accessibility tree and
              // sends focus to the document body — exactly when the reader is
              // waiting to hear whether their theme published.
              footer={
                <SubmitButton id="publish" reason={publishReason} pendingLabel="Publishing…">
                  Publish
                </SubmitButton>
              }
            >
              <input type="hidden" name="themeId" value={theme._id.toHexString()} />
            </ActionForm>
          </>
        }
      />

      <div className="space-y-6">
        {/*
          The gate's answer, first and unmissable. It is the one thing on this
          screen that decides whether the rest of it matters.
        */}
        {check.ok ? (
          <Callout tone="pass" title="Passes every check">
            {check.record.contrastPairs.checked} contrast pairs across light, dark and high
            contrast. This theme can be published.
          </Callout>
        ) : (
          <Callout
            tone="fail"
            title={`${check.problems.length} failure${check.problems.length === 1 ? "" : "s"} — cannot be published by any role`}
            items={check.problems.slice(0, 8).map((problem) => problem.message)}
          >
            {check.record.contrastPairs.checked} pairs checked. An accessibility floor with an
            exception is a default, so this is enforced on the server as well as here.
            {check.problems.length > 8 && ` Showing the first 8 of ${check.problems.length}.`}
          </Callout>
        )}

        {/*
          Where to go next, immediately after the verdict.

          The verdict decides whether the rest of the theme matters; this is how
          a reader acts on it. Before this the screen ended here for anyone who
          had not noticed the rail change.
        */}
        <ThemeScreens
          slug={theme.slug}
          facts={{
            /*
              Normalised, because a stored document is not a parsed one.
              `ThemeTokens` says `semantic` and `component` are always there —
              zod fills them with `.default({})` — but `findOne` hands back raw
              BSON that was never parsed, and the seeded theme carries only
              `ref`. The type asserts a guarantee the parser provides and the
              database does not. `withTierDefaults` is what the components
              screen and the token editor already call for exactly this.
            */
            tokens: withTierDefaults(theme.tokens),
            fonts: theme.assets?.fonts?.length ?? 0,
            icons: theme.assets?.icons?.length ?? 0,
            versions: versions.length,
          }}
        />

        {href && (
          <Panel
            title="Live stylesheet"
            description="Version-pinned and immutable. Link this from your application; publishing again mints a new URL rather than changing this one."
            actions={<CopyButton value={href}>Copy URL</CopyButton>}
          >
            <code className="tabular block overflow-x-auto rounded-lg border border-rule bg-paper-sunk px-3 py-2 font-mono text-[0.75rem]">
              {href}
            </code>
          </Panel>
        )}

        <Panel
          title="Brand ramp"
          description="Step 600 is the colour you chose. The rest are derived, and each is checked in all three themes."
        >
          <div className="preview-region -m-1 space-y-3 p-4">
            <Ramp steps={ramp} anchor="600" />
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {RAMP_STEPS.map((step) => {
                const value = ramp[String(step)];
                if (!value) return null;
                return (
                  <span key={step} className="inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-3.5 shrink-0 rounded ring-1 ring-rule-strong"
                      style={{ background: value }}
                    />
                    <code className="tabular font-mono text-[0.6875rem] text-graphite-soft">
                      {step}
                    </code>
                    <code className="tabular font-mono text-[0.6875rem] uppercase">{value}</code>
                  </span>
                );
              })}
            </div>
          </div>
        </Panel>

        <section>
          <h2 className="mb-3 font-display text-[0.9375rem] font-semibold tracking-[-0.008em]">
            Version history
          </h2>
          <DataTable
            caption={`Published versions of ${theme.name}`}
            columns={columns}
            rows={versions}
            rowKey={(version) => String(version.version)}
            empty={
              <p className="surface px-5 py-6 text-center text-[0.8125rem] text-graphite">
                Never published. The first publish becomes v1.
              </p>
            }
          />
        </section>
      </div>
    </>
  );
}
