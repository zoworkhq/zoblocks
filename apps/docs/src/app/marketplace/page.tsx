import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";
import { KIND_LABEL, catalogue, priceLabel, CONSOLE } from "@/lib/marketplace";

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
 * funnel: the console has no anonymous traffic, and this site does. So the
 * catalogue is rendered here, where it can be linked to and indexed, and the
 * console keeps checkout, entitlement and delivery — the parts that need to
 * know who you are.
 *
 * What is worth indexing is not the price. It is the evidence: nobody else
 * selling healthcare artwork publishes a contrast record and an explicit list
 * of things the artwork does not claim, and that is the only durable reason for
 * this page to rank.
 */
export const revalidate = 600;

export default async function MarketplacePage() {
  const items = await catalogue();

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
              Every item below states what was checked: contrast pairs measured, forced colours
              verified, who reviewed it clinically, and — the part a safety officer reads first —
              what it explicitly does not claim.
            </p>
          </div>
        </section>

        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            {items.length === 0 ? (
              /*
               * Not an error state. The catalogue lives in the console and this
               * page is deliberately readable without it — a marketing page
               * that 500s because a private service is restarting is a worse
               * property than one that says come back shortly.
               */
              <div className="surface px-6 py-16 text-center">
                <p className="font-display text-lg font-semibold">The catalogue is loading</p>
                <p className="body-sm mx-auto mt-2 max-w-[46ch] text-graphite">
                  It is published from the console and refreshes here every few minutes. If this
                  persists, the packs are all reachable directly at{" "}
                  <a href={`${CONSOLE}/market`} className="underline">
                    console.oxygenui.design
                  </a>
                  .
                </p>
              </div>
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <li key={item.slug} data-reveal>
                    <Link
                      href={`/marketplace/${item.slug}`}
                      className="group flex h-full flex-col rounded-2xl border border-rule bg-paper p-6 transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-oxygen/40"
                    >
                      <p className="eyebrow text-graphite-soft">{KIND_LABEL[item.kind]}</p>
                      <h2 className="mt-3 font-display text-lg font-semibold tracking-[-0.015em]">
                        {item.title}
                      </h2>
                      <p className="body-sm mt-2 flex-1 text-graphite">{item.blurb}</p>

                      <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-rule pt-4">
                        <span className="tabular font-mono text-sm font-semibold">
                          {priceLabel(item.price)}
                        </span>
                        <span className="body-xs text-graphite-soft">
                          {item.files} file{item.files === 1 ? "" : "s"} · v{item.version}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <div className="surface flex flex-wrap items-center justify-between gap-6 px-7 py-7">
              <div className="max-w-xl">
                <h2 className="font-display text-xl font-semibold tracking-[-0.015em]">
                  Buying happens in the console
                </h2>
                <p className="body-sm mt-2 text-graphite">
                  A purchase belongs to an organisation rather than to the person who paid, so it
                  needs one to belong to. Packs are perpetual, install into a theme draft, and
                  nothing reaches a running application until somebody publishes it.
                </p>
              </div>
              <a
                href={`${CONSOLE}/market`}
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
