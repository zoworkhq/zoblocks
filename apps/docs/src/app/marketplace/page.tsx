import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";
import { KIND_LABEL, shelf, APP, SELLING_OPEN, type ShelfItem } from "@/lib/marketplace";
import { PackPreview } from "@/components/site/pack-preview";
import { NOTIFY_MARKETPLACE, NotifyDialog } from "@/components/site/notify-dialog";

export const metadata: Metadata = {
  title: "Marketplace — clinical icon & theme packs",
  description:
    "Icon sets, empty-state systems and theme packs for clinical software. Every item states its contrast pairs, forced-colours behaviour and what it does not claim.",
  alternates: { canonical: "/marketplace" },
};

/**
 * The public shelf.
 *
 * It exists because a storefront reachable only after sign-up has no top of
 * funnel: the app has no anonymous traffic, and this site does. So the
 * catalogue is rendered here, where it can be linked to and indexed, and the
 * app keeps checkout, entitlement and delivery — the parts that need to
 * know who you are.
 *
 * What is worth indexing is not the price. It is the evidence: nobody else
 * selling healthcare artwork publishes a contrast record and an explicit list
 * of things the artwork does not claim, and that is the only durable reason for
 * this page to rank.
 */
export const revalidate = 600;

export default async function MarketplacePage() {
  const items = await shelf();
  const ready = items.filter((item) => item.purchasable);
  const announced = items.filter((item) => !item.purchasable);

  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main">
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <p className="eyebrow eyebrow-rule text-brand-deep" data-reveal>
              Marketplace
            </p>
            {/*
              The status is the heading, exactly as `/pro` does it.

              The shop has been shut shelf-wide since `SELLING_OPEN` went
              false, and this page said so once, in a paragraph most of the way
              down the Announced section. That is the right amount of repeating
              and the wrong place: a visitor reaches the cards before the
              sentence that explains why none of them has a buy button.

              It is derived from `SELLING_OPEN` rather than typed, because a
              hard-coded "Coming soon" becomes a lie the day somebody flips
              that flag — and flipping it is documented as a one-line change
              with nothing else to move.
            */}
            <h1 className="display-lg mt-5 max-w-4xl text-balance" data-reveal>
              {SELLING_OPEN ? "Artwork that knows what an empty field means." : "Coming soon"}
            </h1>
            {!SELLING_OPEN && (
              <p className="body-lg mt-5 max-w-xl text-pretty text-ink" data-reveal>
                Artwork that knows what an empty field means.
              </p>
            )}
            <p className="lede mt-5 max-w-2xl text-pretty" data-reveal>
              Stock illustration draws one empty state and calls it <em>nothing to see here</em>. An
              empty allergy list is three facts — nobody asked, asked and none found, or you may not
              see it — and each needs a different drawing.
            </p>
            {/*
              "Coming soon" on its own reads as *nothing here yet*, which is the
              one thing that is not true — several packs are finished and
              measured. The same correction `/pro` makes two lines under its
              own heading.
            */}
            <p className="mt-4 max-w-2xl text-pretty text-graphite" data-reveal>
              Several packs are finished and measured, and every item states what was checked:
              contrast pairs, forced colours, and what it does not claim. The shop is what is shut,
              and it opens with the console.
            </p>
            {/*
              Said here rather than left to be inferred from a missing block.
              The clinical reviewer is the differentiator this page is built on,
              and it is the one thing not yet in place; a reader who finds that
              out on the item page has been let down by this one.
            */}
            <p className="mt-3 max-w-2xl text-pretty text-sm text-graphite-soft" data-reveal>
              No pack has been reviewed by a registered clinician yet, and none claims otherwise.
            </p>

            {!SELLING_OPEN && (
              <div className="mt-8 flex flex-wrap gap-3" data-reveal>
                <NotifyDialog
                  topic={NOTIFY_MARKETPLACE}
                  className="group inline-flex items-center gap-2 rounded-xl bg-cta px-5 py-3.5 text-sm font-medium text-paper transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-cta-hover"
                >
                  Notify me when the shop opens
                </NotifyDialog>
                <Link
                  href="/components"
                  className="inline-flex items-center gap-2 rounded-xl border border-rule px-5 py-3.5 text-sm font-medium text-ink transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-brand/40"
                >
                  Browse components
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            {items.length === 0 ? (
              /*
               * Only reachable if the console answers with an empty catalogue.
               * The unreachable case has a floor now — see `shelf()`.
               */
              <div className="surface px-6 py-16 text-center">
                <p className="font-display text-lg font-semibold">The catalogue is empty</p>
                <p className="body-sm mx-auto mt-2 max-w-[46ch] text-graphite">
                  Nothing is published yet. Packs appear here as each one ships.
                </p>
              </div>
            ) : (
              ready.length > 0 && (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-3" data-reveal>
                    <h2 className="display-sm">Available now</h2>
                    <p className="numeric text-xs text-graphite-soft">
                      {ready.length} pack{ready.length === 1 ? "" : "s"} · perpetual licence
                    </p>
                  </div>

                  <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {ready.map((item, index) => (
                      <PackCard key={item.slug} item={item} index={index} />
                    ))}
                  </ul>
                </>
              )
            )}

            {announced.length > 0 && (
              <>
                <div
                  className={
                    (ready.length > 0 ? "mt-16 " : "") +
                    "flex flex-wrap items-baseline justify-between gap-3"
                  }
                  data-reveal
                >
                  <h2 className="display-sm">The shelf</h2>
                  <p className="numeric text-xs text-graphite-soft">{announced.length} packs</p>
                </div>
                {/*
                  It read "Announced", under an `h1` that already says "Coming
                  soon" — two status words for one status, and the line under it
                  explained our publishing policy rather than the list.

                  The heading names the thing instead, and the sentence keeps
                  the one idea that was worth keeping: a team can see what is
                  coming before they spend a fortnight drawing it themselves.
                */}
                <p className="body-sm mt-2 max-w-2xl text-graphite" data-reveal>
                  Public before it is buyable, so a team weighing whether to draw these themselves
                  does not have to guess.
                </p>

                <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {announced.map((item, index) => (
                    <PackCard key={item.slug} item={item} index={index} />
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <div className="surface flex flex-wrap items-center justify-between gap-6 px-7 py-7">
              <div className="max-w-xl">
                <h2 className="font-display text-xl font-semibold tracking-[-0.015em]">
                  Buying will happen in the console
                </h2>
                <p className="body-sm mt-2 text-graphite">
                  A purchase belongs to an organisation, not to the person who paid — so checkout,
                  entitlement and delivery all live there. Packs will be perpetual and install into
                  a theme draft.
                </p>
              </div>
              <a
                href={`${APP}/market`}
                className="group inline-flex items-center gap-2 rounded-xl bg-cta px-5 py-3.5 text-sm font-medium text-paper transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-cta-hover"
              >
                Open the console
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
                />
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </RevealRoot>
  );
}

/**
 * One pack.
 *
 * An article rather than one big link, because a published pack carries two
 * destinations — the detail page, and the console where it is actually bought.
 * The title owns the card through an overlay; the buy control sits above it.
 * A pack nobody can buy has one destination and no purchase: every path
 * refuses it, here as in the console.
 *
 * The card asks two different questions. Whether it can be bought — the badge
 * and the control — is `purchasable`. Whether it exists to be described — its
 * preview and its file count — is `comingSoon`. A shut shop is not a reason to
 * show a finished pack as a placeholder.
 */
function PackCard({ item, index }: { item: ShelfItem; index: number }) {
  return (
    <li>
      <article
        data-reveal
        style={{ "--reveal-delay": `${(index % 3) * 70}ms` } as React.CSSProperties}
        data-zb-pack={item.slug}
        className={
          "group relative flex h-full flex-col rounded-2xl border border-rule bg-paper p-6 " +
          "transition-all duration-300 ease-[var(--ease-out-expo)] " +
          "focus-within:border-brand/40 hover:-translate-y-0.5 hover:border-brand/40"
        }
      >
        {/*
          The kind, and nothing else.

          A `Not built yet` chip sat opposite it, and it was the last of four
          places one card told a reader it could not sell them anything. The
          section above says the shop opens with the console, once. A card that
          repeats it in a badge, a price, a file count and a disabled button is
          not being clearer, it is being repetitive — and it buries the pack
          itself, which is the only thing on the card worth reading.

          `item.comingSoon` still separates the two shelves on this page and
          still drives the detail route, so nothing about the data changed.
        */}
        <p className="eyebrow text-graphite-soft">{KIND_LABEL[item.kind]}</p>

        {/*
          A card leads somewhere only when there is somewhere to go.

          While selling is closed the detail page has nothing a card does not
          already say — the same blurb, the same price, the same disabled
          control — and Rahul asked that a card not open it. So the title is a
          link only for a purchasable pack, and the overlay that made the whole
          card clickable goes with it. When the shop opens, `purchasable`
          flips and the links come back without anyone touching this.
        */}
        <h3 className="mt-3 font-display text-lg font-semibold tracking-[-0.015em]">
          {item.purchasable ? (
            <Link
              href={`/marketplace/${item.slug}`}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {item.title}
            </Link>
          ) : (
            item.title
          )}
        </h3>

        <p className="body-sm mt-2 text-graphite">{item.blurb}</p>

        {/* `mt-auto`, so the preview and the price line up across a row
            whatever the blurb does. The slack lands above the preview, which
            is where a variable-length paragraph should put it. */}
        <div className="mt-auto pt-5">
          <PackPreview item={item} />
        </div>

        {/*
          No price, no file count, no disabled button.

          The card footer carried a figure, a `4 files · v2` line and a
          `Coming soon` control side by side. That is three ways of saying the
          same thing about a shop that is shut, and the figure read as an offer
          the page cannot honour. Rahul asked for all of it to go on
          10 Sep 2026; the section heading says once that the shop opens with
          the console, and the card is now the pack rather than a receipt for
          one.

          `priceLabel`, `buyHref`, `item.price`, `files` and `version` all stay
          in `lib/marketplace.ts` — the detail pages and the console still use
          them. They come back here together when there is something to sell,
          which is one edit rather than four: nothing is purchasable today, so
          the buy control this replaced never rendered anyway.
        */}
      </article>
    </li>
  );
}
