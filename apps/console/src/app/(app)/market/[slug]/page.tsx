import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { can, whyNot } from "@/lib/roles";
import { KIND_LABEL, detail, priceLabel, versionFor } from "@/lib/market/catalogue";
import { MarketError } from "@/lib/market/entitlements";
import { buyAction, installAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { GrantForm } from "./GrantForm";
import {
  Callout,
  PageHeader,
  Panel,
  Select,
  StatusChip,
  SubmitButton,
  buttonClasses,
} from "@/components/ui";

export const metadata = { title: "Item" };

/**
 * One item, and the evidence for it.
 *
 * The right-hand column is the product. It is rendered from the item's
 * `provenance` record rather than written by hand, so it cannot drift from
 * what was actually checked — and a customer can lift it straight into the
 * accessibility evidence file their own procurement is asking them for.
 *
 * "Accessible" is marketing. "17 of 17 pairs at or above 4.5:1, forced-colors
 * verified, checker v3, 14 August" is a fact, and `doesNotClaim` is the part a
 * clinical safety officer reads first.
 */
export default async function MarketItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = await requireMember();

  let found;
  try {
    found = await detail(member.orgId, slug);
  } catch (error) {
    if (error instanceof MarketError) notFound();
    throw error;
  }

  const { item, owned, entitlement } = found;
  const version = await versionFor(item, entitlement?.versionLine ?? item.liveVersion).catch(
    () => undefined,
  );

  const canBuy = can(member.role, "market.purchase");
  const canInstall = can(member.role, "market.install");
  const { accessibility, clinical, authorship, licence, fhir } = item.provenance;

  // Only for the kinds that install into a theme. A component or a fixture
  // pack has nowhere to go in a theme, and offering a picker for it would be
  // a control that does nothing.
  const installsIntoTheme = item.kind === "icons";
  const themes = installsIntoTheme
    ? await scoped(member.orgId)
        .themes.find({ status: { $ne: "archived" } })
        .project<{ _id: string; name: string }>({ _id: 1, name: 1 })
        .toArray()
    : [];

  return (
    <>
      <PageHeader
        eyebrow={KIND_LABEL[item.kind]}
        eyebrowHref="/market"
        title={item.title}
        lede={item.blurb}
        actions={
          <div className="text-right">
            <p className="tabular font-mono text-[1.25rem] font-semibold">
              {owned ? "Owned" : priceLabel(item)}
            </p>
            <p className="body-xs text-graphite-soft">
              {owned ? `Version line ${entitlement?.versionLine}` : "one-time · whole organisation"}
            </p>
          </div>
        }
      />

      {entitlement?.revokedAt && (
        <Callout
          tone="warn"
          title="Access to this item was withdrawn."
          className="mt-4"
          items={[
            entitlement.revokedReason ?? "No reason recorded.",
            `Withdrawn ${entitlement.revokedAt.toISOString().slice(0, 10)}.`,
          ]}
        >
          Anything already downloaded or installed into a theme stays where it is — revoking stops
          future downloads rather than reaching into a published stylesheet.
        </Callout>
      )}

      {/*
        `items-start`, so a short panel is short.
        
        Grid items stretch to the row height by default, so "What you get" —
        four filenames — was padded out to match the length of "What was
        checked" and left a void most of a screen tall. An empty region that
        large reads as something failing to load.
      */}
      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Panel tone="instrument" title="What you get">
          {version ? (
            <ul className="space-y-1.5">
              {version.files.slice(0, 12).map((file) => (
                <li key={file.path} className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-mono text-[0.75rem] text-panel-fg">
                    {file.path}
                  </span>
                  <span className="tabular shrink-0 font-mono text-[0.6875rem] text-panel-muted">
                    {Math.max(1, Math.round(file.size / 1024))} KB
                  </span>
                </li>
              ))}
              {version.files.length > 12 && (
                <li className="font-mono text-[0.6875rem] text-panel-muted">
                  and {version.files.length - 12} more
                </li>
              )}
            </ul>
          ) : (
            <p className="body-sm text-panel-muted">Nothing is published for this item yet.</p>
          )}
        </Panel>

        <Panel title="What was checked">
          {/*
            A list, not a definition list.
            
            This was a `<dl>`, and axe was right to refuse it: a `<dl>` promises
            term/definition pairs and this has none — every row is a single
            statement about what was checked. The promise was structural rather
            than cosmetic, so a screen reader announced a definition list with
            nothing in it.
          */}
          <ul className="space-y-2 text-[0.8125rem]">
            <Fact tone="pass">
              {accessibility.contrastPairs.passed}/{accessibility.contrastPairs.total} contrast
              pairs at or above {accessibility.contrastPairs.floor} · checker v
              {accessibility.checkerVersion}, {accessibility.checkedAt.toISOString().slice(0, 10)}
            </Fact>
            <Fact tone="pass">
              Forced colors {accessibility.forcedColors === "verified" ? "verified" : "n/a"} —
              meaning carried by {accessibility.nonColourChannel}
            </Fact>
            {clinical && (
              <>
                <Fact tone="pass">
                  Clinically reviewed {clinical.reviewedAt.toISOString().slice(0, 10)} by{" "}
                  {clinical.reviewedBy} ({clinical.registration}) — {clinical.scope}
                </Fact>
                <Fact tone="warn">
                  Does <strong>not</strong> claim: {clinical.doesNotClaim.join(" · ")}
                </Fact>
              </>
            )}
            <Fact tone="neutral">
              {authorship.method}
              {authorship.thirdPartyContent.length > 0
                ? ` · includes ${authorship.thirdPartyContent.join(", ")}`
                : " · no third-party content"}
            </Fact>
            {fhir && (
              <Fact tone="neutral">
                Maps {fhir.maps.join(", ")} ({fhir.release})
              </Fact>
            )}
          </ul>

          <p className="eyebrow mt-4 mb-1.5 text-[0.5625rem] text-graphite-soft">Licence</p>
          <p className="body-sm text-graphite">
            {licence.grant}. Derivatives {licence.derivatives}. Resale {licence.resale}.
          </p>
        </Panel>
      </div>

      {owned ? (
        <Panel
          className="mt-4"
          title="Install"
          description="Nothing here publishes. An icon pack lands in a theme's draft and an admin still decides when it goes live."
        >
          <div className="flex flex-wrap items-center gap-2">
            {version && (
              <a
                href={`/m/${item.slug}/pack.zip`}
                className={buttonClasses({ variant: "secondary", size: "sm" })}
              >
                Download pack
              </a>
            )}
            {item.kind === "component" && (
              <Link
                href="/market/tokens"
                className={buttonClasses({ variant: "secondary", size: "sm" })}
              >
                Mint a CLI token
              </Link>
            )}
          </div>

          {installsIntoTheme && (
            <ActionForm action={installAction} className="mt-4 flex flex-wrap items-end gap-2">
              <input type="hidden" name="slug" value={item.slug} />
              <label className="body-sm flex flex-col gap-1">
                <span className="text-graphite">Install into</span>
                <Select name="themeId" defaultValue={themes[0]?._id?.toString() ?? ""}>
                  {themes.map((theme) => (
                    <option key={String(theme._id)} value={String(theme._id)}>
                      {theme.name}
                    </option>
                  ))}
                </Select>
              </label>
              <SubmitButton
                size="sm"
                pendingLabel="Installing…"
                reason={
                  canInstall ? undefined : (whyNot(member.role, "market.install") ?? undefined)
                }
              >
                Install glyphs
              </SubmitButton>
            </ActionForm>
          )}

          {item.kind === "component" && (
            <pre className="mt-4 overflow-x-auto rounded-lg bg-panel p-3 font-mono text-[0.6875rem] text-panel-fg">
              {`// components.json
"registries": {
  "@oxygen-pro": {
    "url": "${"https://console.oxygenui.design/r/pro/{name}.json"}",
    "headers": { "Authorization": "Bearer \${OXYGEN_TOKEN}" }
  }
}

npx shadcn@latest add @oxygen-pro/${item.slug}`}
            </pre>
          )}
        </Panel>
      ) : (
        <Panel
          className="mt-4"
          title="Buy for this organisation"
          description="Payment is taken by Stripe. Card details never reach this console."
        >
          <ActionForm action={buyAction}>
            <input type="hidden" name="slug" value={item.slug} />
            <SubmitButton
              pendingLabel="Opening Stripe…"
              reason={canBuy ? undefined : (whyNot(member.role, "market.purchase") ?? undefined)}
            >
              {item.priceMinor === null ? "Ask for an invoice" : `Buy · ${priceLabel(item)}`}
            </SubmitButton>
          </ActionForm>

          {/*
            The fourth way an item arrives — a pack inside an engagement, or
            one paid for against an invoice outside this console. The whole
            reason entitlements exist separately from Stripe.
          */}
          {canBuy && <GrantForm slug={item.slug} />}
        </Panel>
      )}
    </>
  );
}

/**
 * One checked fact.
 *
 * A word beside every mark, never a bare tick: this console's rule is that
 * nothing carries meaning by colour alone, and an evidence list is the last
 * place to break it.
 */
function Fact({
  tone,
  children,
}: {
  tone: "pass" | "warn" | "neutral";
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-baseline gap-2">
      <StatusChip tone={tone === "neutral" ? "neutral" : tone}>
        {tone === "pass" ? "Pass" : tone === "warn" ? "Note" : "Info"}
      </StatusChip>
      <span className="text-graphite">{children}</span>
    </li>
  );
}
