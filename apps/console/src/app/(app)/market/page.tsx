import Link from "next/link";
import { currentMember } from "@/lib/auth";
import { can, whyNot } from "@/lib/roles";
import { KIND_LABEL, listing, priceLabel } from "@/lib/market/catalogue";
import { EmptyState, PageHeader, StatusChip, buttonClasses } from "@/components/ui";

export const metadata = { title: "Catalogue" };

/**
 * The shelf.
 *
 * Two decisions worth naming, because both were the other way round first.
 *
 * **Everybody can browse, including a viewer.** Seeing what exists costs
 * nothing, and a viewer who spots a pack is the only marketing channel that
 * exists inside the product. What a viewer cannot do is buy — and the card
 * says so, naming the role that can, rather than hiding the button. A hidden
 * control teaches somebody the feature does not exist and sends them to
 * support for something their organisation already has.
 *
 * **A purchase belongs to the organisation.** So the card reads "owned"
 * rather than "purchased by you", and a designer who joined last week sees the
 * packs a predecessor bought.
 */
export default async function MarketPage() {
  const member = (await currentMember())!;
  const items = await listing(member.orgId);

  const canBuy = can(member.role, "market.purchase");
  const refusal = whyNot(member.role, "market.purchase");

  if (items.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Marketplace"
          title="Catalogue"
          lede="Packs, components and themes for this organisation."
        />
        <EmptyState
          title="Nothing is listed yet"
          body="The catalogue is seeded separately from the console. Run the marketplace seed to populate it, or grant an item directly if it came with an engagement."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Marketplace"
        title="Catalogue"
        lede="Purchases are perpetual and belong to the organisation, not to the person who paid. Nothing installed here is live until a theme is published."
      />

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map(({ item, owned, entitlement }) => (
          <li key={item.slug} className="surface flex flex-col overflow-hidden p-0">
            {/*
              The dark panel is what this design language does with anything
              *rendering* something: the instrument is the lit object.

              It used to hold a single centred category label in 96px of empty
              space — a frame promising artwork and delivering a word, on the
              screen where somebody decides whether to spend $290. What makes
              these packs worth that is not a thumbnail; it is that every pair
              was measured, forced colours were checked, and a clinician read
              the vocabulary. So the frame carries the evidence instead.
            */}
            <div className="flex flex-col justify-between gap-3 border-b border-panel-rule bg-panel px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="eyebrow text-[0.5625rem] text-panel-muted">
                  {KIND_LABEL[item.kind]}
                </span>
                <span className="font-mono text-[0.625rem] text-panel-muted">
                  v{item.liveVersion}
                </span>
              </div>

              <dl className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                {/*
                  A pack with nothing to measure says so.
                  
                  Synthetic FHIR bundles have no contrast surface, so the honest
                  count is zero of zero — which on a card reads as a failed check
                  rather than an inapplicable one. It leads with how the pack was
                  made instead, which is the fact procurement asks about and the
                  one that is always true.
                */}
                {item.provenance.accessibility.contrastPairs.total > 0 ? (
                  <div className="flex items-baseline gap-1.5">
                    <dt className="sr-only">Contrast pairs passing</dt>
                    {/*
                      The qualifier lives inside the `dd`, not beside it.
                      
                      A `dl` group may hold only `dt` and `dd`; a bare `span` in
                      there is invalid, and axe says so. It reads as one value
                      anyway — "17/17 at 4.5:1" is a single fact.
                    */}
                    <dd className="tabular flex items-baseline gap-1.5 font-mono text-[0.9375rem] font-semibold text-panel-fg">
                      {item.provenance.accessibility.contrastPairs.passed}/
                      {item.provenance.accessibility.contrastPairs.total}
                      <span className="font-mono text-[0.625rem] font-normal text-panel-muted">
                        at {item.provenance.accessibility.contrastPairs.floor}
                      </span>
                    </dd>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <dt className="sr-only">How it was made</dt>
                    <dd className="flex items-baseline gap-1.5 font-mono text-[0.8125rem] font-semibold text-panel-fg">
                      {item.provenance.authorship.method}
                      <span className="font-mono text-[0.625rem] font-normal text-panel-muted">
                        no rendered surface to measure
                      </span>
                    </dd>
                  </div>
                )}

                {item.provenance.accessibility.forcedColors === "verified" &&
                  item.provenance.accessibility.contrastPairs.total > 0 && (
                    <div className="flex items-baseline gap-1.5">
                      <dt className="sr-only">Forced colours</dt>
                      <dd className="font-mono text-[0.625rem] text-panel-muted">
                        forced colours verified
                      </dd>
                    </div>
                  )}

                {item.provenance.clinical && (
                  <div className="flex items-baseline gap-1.5">
                    <dt className="sr-only">Clinical review</dt>
                    <dd className="font-mono text-[0.625rem] text-panel-muted">
                      clinically reviewed
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/market/${item.slug}`}
                  className="font-display text-[0.9375rem] font-semibold tracking-[-0.015em] hover:text-oxygen-deep"
                >
                  {item.title}
                </Link>
                {owned && <StatusChip tone="pass">Owned</StatusChip>}
                {entitlement?.revokedAt && <StatusChip tone="fail">Withdrawn</StatusChip>}
              </div>

              <p className="body-sm text-graphite">{item.blurb}</p>

              <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                <span className="tabular font-mono text-[0.8125rem] font-semibold">
                  {owned ? `Owned · v${item.liveVersion}` : priceLabel(item)}
                </span>

                <Link
                  href={`/market/${item.slug}`}
                  className={buttonClasses({
                    variant: owned ? "secondary" : "primary",
                    size: "sm",
                  })}
                >
                  {owned ? "Install" : canBuy ? "Buy" : "Details"}
                </Link>
              </div>

              {/*
                The refusal, once per screen would be tidier — but a reader
                scanning a grid decides on a card, and a note at the top of the
                page is not where they are looking when they wonder why the
                button says Details.
              */}
              {!owned && !canBuy && refusal && (
                <p className="body-xs text-graphite-soft">{refusal}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
