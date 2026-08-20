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
              The preview sits in a dark panel because that is what this design
              language does with anything *rendering* something: the instrument
              is the lit object. It is also the honest frame for artwork whose
              colours are not ours to sit beside.
            */}
            <div className="flex h-24 items-center justify-center gap-3 border-b border-panel-rule bg-panel px-4">
              <span className="eyebrow text-[0.5625rem] text-panel-muted">
                {KIND_LABEL[item.kind]}
              </span>
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
