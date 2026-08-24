import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";
import { KIND_LABEL, buyHref, priceLabel, shelf, APP, type ShelfItem } from "@/lib/marketplace";
import { PackPreview } from "@/components/site/pack-preview";

export const metadata: Metadata = {
  title: "Marketplace — clinically-reviewed packs for healthcare interfaces",
  description:
    "Icon sets, empty-state systems, theme packs and components for clinical software. Every item states what was checked — contrast pairs, forced colours, who reviewed it, and what it does not claim.",
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
              Stock illustration draws one empty state and calls it <em>nothing to see here</em>. In
              a clinical record an empty allergy list is at least three different facts — nobody
              asked, somebody asked and recorded none, or you are not allowed to see it — and they
              demand three different things of whoever is reading the screen.
            </p>
            <p className="mt-4 max-w-2xl text-pretty text-graphite" data-reveal>
              Every published item states what was checked: contrast pairs measured, forced colours
              verified, and — the part a safety officer reads first — what it explicitly does not
              claim.
            </p>
            {/*
              Said here rather than left to be inferred from a missing block.
              The clinical reviewer is the differentiator this page is built on,
              and it is the one thing not yet in place; a reader who finds that
              out on the item page has been let down by this one.
            */}
            <p className="mt-3 max-w-2xl text-pretty text-sm text-graphite-soft" data-reveal>
              Clinical review is not yet in place. No pack below has been reviewed by a registered
              clinician, and none of them says otherwise — the field stays empty until there is a
              name and a registration to put in it.
            </p>
          </div>
        </section>

        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            {ready.length === 0 ? (
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
            )}

            {announced.length > 0 && (
              <>
                <div
                  className="mt-16 flex flex-wrap items-baseline justify-between gap-3"
                  data-reveal
                >
                  <h2 className="display-sm">In production</h2>
                  <p className="numeric text-xs text-graphite-soft">{announced.length} announced</p>
                </div>
                <p className="body-sm mt-2 max-w-2xl text-graphite" data-reveal>
                  Announced rather than hidden. A team deciding whether to build a results grid
                  themselves deserves to know one is coming — and an empty catalogue makes a
                  specialist look like a hobby. These carry a price and nothing else: no version, no
                  files, and no measurements, because nothing has been built to measure.
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
                  Buying happens in the app
                </h2>
                <p className="body-sm mt-2 text-graphite">
                  A purchase belongs to an organisation rather than to the person who paid, so it
                  needs one to belong to. Packs are perpetual, install into a theme draft, and
                  nothing reaches a running application until somebody publishes it.
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
              In production
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
            <span className="body-xs text-graphite-soft">Not yet purchasable</span>
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
