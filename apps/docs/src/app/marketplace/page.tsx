import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";
import { KIND_LABEL, buyHref, priceLabel, shelf, APP, type ShelfItem } from "@/lib/marketplace";
import { PackPreview } from "@/components/site/pack-preview";

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
  const ready = items.filter((item) => !item.comingSoon);
  const announced = items.filter((item) => item.comingSoon);

  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main">
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <p className="eyebrow eyebrow-rule text-oxygen-deep" data-reveal>
              Marketplace
            </p>
            <h1 className="display-xl mt-5 max-w-4xl text-balance" data-reveal>
              Artwork that knows what an empty field means.
            </h1>
            <p className="lede mt-6 max-w-2xl text-pretty" data-reveal>
              Stock illustration draws one empty state and calls it <em>nothing to see here</em>. An
              empty allergy list is three facts — nobody asked, asked and none found, or you may not
              see it — and each needs a different drawing.
            </p>
            <p className="mt-4 max-w-2xl text-pretty text-graphite" data-reveal>
              Every item states what was checked: contrast pairs, forced colours, and what it does
              not claim.
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
                  <h2 className="display-sm">Coming soon</h2>
                  <p className="numeric text-xs text-graphite-soft">{announced.length} announced</p>
                </div>
                <p className="body-sm mt-2 max-w-2xl text-graphite" data-reveal>
                  Announced rather than hidden — a team deciding whether to build one of these
                  themselves deserves to know it is coming. Nothing is on sale yet: the price is
                  what a pack will cost, not an offer.
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
                  Buying will happen in the app
                </h2>
                <p className="body-sm mt-2 text-graphite">
                  A purchase belongs to an organisation, not to the person who paid. Packs will be
                  perpetual and install into a theme draft. Nothing can be bought yet.
                </p>
              </div>
              <a
                href={`${APP}/market`}
                className="group inline-flex items-center gap-2 rounded-xl bg-cta px-5 py-3.5 text-sm font-medium text-paper transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-cta-hover"
              >
                Open the app
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
 * An announced pack has one destination and no purchase: every path refuses
 * them, here as in the console.
 */
function PackCard({ item, index }: { item: ShelfItem; index: number }) {
  return (
    <li>
      <article
        data-reveal
        style={{ "--reveal-delay": `${(index % 3) * 70}ms` } as React.CSSProperties}
        data-ox-pack={item.slug}
        className={
          "group relative flex h-full flex-col rounded-2xl border border-rule bg-paper p-6 " +
          "transition-all duration-300 ease-[var(--ease-out-expo)] " +
          "focus-within:border-oxygen/40 hover:-translate-y-0.5 hover:border-oxygen/40"
        }
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="eyebrow text-graphite-soft">{KIND_LABEL[item.kind]}</p>
          {item.comingSoon ? (
            <span className="rounded-full border border-rule px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider text-graphite-soft">
              Coming soon
            </span>
          ) : null}
        </div>

        <h3 className="mt-3 font-display text-lg font-semibold tracking-[-0.015em]">
          <Link
            href={`/marketplace/${item.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {item.title}
          </Link>
        </h3>

        <p className="body-sm mt-2 text-graphite">{item.blurb}</p>

        {/* `mt-auto`, so the preview and the price line up across a row
            whatever the blurb does. The slack lands above the preview, which
            is where a variable-length paragraph should put it. */}
        <div className="mt-auto pt-5">
          <PackPreview item={item} />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
          <div className="flex items-baseline gap-2">
            <span className="tabular font-mono text-sm font-semibold">
              {priceLabel(item.price)}
            </span>
            {item.comingSoon ? null : (
              <span className="body-xs text-graphite-soft">
                {item.files} file{item.files === 1 ? "" : "s"} · v{item.version}
              </span>
            )}
          </div>

          {item.comingSoon ? (
            /* A disabled button rather than a line of text: the slot holds a
               control on a purchasable pack, and a label where a button was
               reads as a missing button. `disabled` is what says the action
               exists and is unavailable — to a screen reader as well as to the
               eye. No `z-10` here, unlike the buy link: nothing to click means
               the title's overlay should keep the whole card pointing at the
               detail page. */
            <button
              type="button"
              disabled
              className={
                "inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-rule " +
                "bg-paper-sunk px-2.5 py-1.5 text-[0.6875rem] font-semibold text-graphite-soft"
              }
            >
              Coming soon
            </button>
          ) : (
            <a
              href={buyHref(item.slug)}
              // Above the title's overlay, so the card opens the detail page and
              // this one control goes to the console.
              className={
                "relative z-10 inline-flex items-center gap-1.5 rounded-lg border border-oxygen/40 " +
                "bg-oxygen/8 px-2.5 py-1.5 text-[0.6875rem] font-semibold text-oxygen-deep " +
                "transition-colors hover:bg-oxygen/15 focus-visible:outline focus-visible:outline-2 " +
                "focus-visible:outline-offset-2 focus-visible:outline-oxygen"
              }
            >
              Buy in the app
              <ArrowUpRight aria-hidden="true" className="size-3" />
            </a>
          )}
        </div>
      </article>
    </li>
  );
}
