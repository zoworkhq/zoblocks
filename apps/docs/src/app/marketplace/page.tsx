import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";
import { MarketScene } from "@/components/site/market-scenes";
import { NOTIFY_MARKETPLACE, NotifyDialog } from "@/components/site/notify-dialog";
import { APP } from "@/lib/marketplace";
import { COLLECTION, type CollectionEntry } from "@/lib/market-collection";

export const metadata: Metadata = {
  title: "Marketplace — clinical illustrations, icons and design systems",
  description:
    "Empty-state illustrations, clinical and behavioural-health icons, a behavioural-health design system and a Figma library, for clinical interfaces.",
  alternates: { canonical: "/marketplace" },
};

/**
 * The public shelf: five curated packs, none on sale yet.
 *
 * The list, names and previews live in `lib/market-collection.ts` and
 * `components/site/market-scenes.tsx`. Cards do not link: while nothing can be
 * bought, a detail page says nothing a card does not.
 *
 * The status is the `h1`, as on `/pro`. That the shop is closed is said once,
 * here, and never on a card — `e2e/docs-site.spec.ts` holds both.
 */
export const revalidate = 600;

const pad = (n: number) => String(n).padStart(2, "0");

const NUMBER_WORDS = ["No", "One", "Two", "Three", "Four", "Five"];
const packCount = NUMBER_WORDS[COLLECTION.length] ?? String(COLLECTION.length);

export default function MarketplacePage() {
  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main" className="zbm">
        <section className="border-b border-rule">
          <div className="mx-auto grid max-w-6xl section-major gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end">
            <div>
              <p className="eyebrow eyebrow-rule text-brand-deep" data-reveal>
                Marketplace
              </p>
              <h1 className="display-lg mt-5 text-balance" data-reveal>
                Coming soon
              </h1>
              <p className="body-lg mt-5 max-w-xl text-pretty text-ink" data-reveal>
                {packCount} design packs, purpose-built for clinical software.
              </p>
              <p className="mt-4 max-w-xl text-pretty text-graphite" data-reveal>
                Purchasing opens with the ZoBlocks console.
              </p>
              <p className="mt-2 max-w-xl text-pretty text-sm text-graphite-soft" data-reveal>
                No pack has been reviewed by a registered clinician yet.
              </p>

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
            </div>

            <nav aria-label="Products" data-reveal>
              <ol className="zbm-index">
                {COLLECTION.map((entry, index) => (
                  <li key={entry.slug}>
                    <a href={`#pack-${entry.slug}`}>
                      <span className="zbm-index-n">{pad(index + 1)}</span>
                      <span className="zbm-index-name">{entry.name}</span>
                      <span className="zbm-index-kind">{entry.kind}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </section>

        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3" data-reveal>
              <h2 className="display-sm">Product catalogue</h2>
              <p className="numeric text-xs text-graphite-soft">{COLLECTION.length} products</p>
            </div>
            <p className="body-sm mt-2 max-w-2xl text-graphite" data-reveal>
              Preview each pack ahead of launch and plan your roadmap with confidence.
            </p>

            <ul className="zbm-grid mt-8">
              {COLLECTION.map((entry, index) => (
                <PackCard key={entry.slug} entry={entry} index={index} />
              ))}
            </ul>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <div className="surface flex flex-wrap items-center justify-between gap-6 px-7 py-7">
              <div className="max-w-xl">
                <h2 className="font-display text-xl font-semibold tracking-[-0.015em]">
                  Purchase through the ZoBlocks console
                </h2>
                <p className="body-sm mt-2 text-graphite">
                  Licences are issued to your organisation, with checkout and delivery in the
                  console. Every pack is a perpetual licence.
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

/** One pack: the preview, then what it is. No price and no status. */
function PackCard({ entry, index }: { entry: CollectionEntry; index: number }) {
  return (
    <li data-span={entry.span}>
      <article
        id={`pack-${entry.slug}`}
        className="zbm-card"
        data-span={entry.span}
        data-zb-pack={entry.slug}
        data-reveal
        style={{ "--reveal-delay": `${(index % 2) * 80}ms` } as React.CSSProperties}
      >
        <div
          className="zbm-stage"
          data-zb-pack-preview={entry.scene}
          role="img"
          aria-label={entry.preview}
        >
          <MarketScene scene={entry.scene} />
        </div>

        <div className="zbm-meta">
          <p className="zbm-kicker">
            <span className="zbm-kicker-n">{pad(index + 1)}</span>
            {entry.kind}
          </p>
          <h3 className="zbm-name">{entry.name}</h3>
          <p className="zbm-blurb">{entry.blurb}</p>
          <ul className="zbm-tags" aria-label="Includes">
            {entry.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>
      </article>
    </li>
  );
}
