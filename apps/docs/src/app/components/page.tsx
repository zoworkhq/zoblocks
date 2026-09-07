import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATALOG } from "@/lib/catalog";
import { TIERS } from "@/lib/offerings";
import { CatalogExplorer } from "@/components/site/catalog-explorer";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { InstallCommand, RevealRoot } from "@/components/site/interactions";

export const metadata: Metadata = {
  title: "Components — React healthcare UI library",
  // Derived, like the count in the page body directly below it. This said 27
  // against a catalogue of 30 — and a description is the one string on a page
  // that nobody sees while editing, so it is the one that stays wrong longest.
  description:
    `${CATALOG.length} React components for clinical software, typed to FHIR R4. ` +
    `Live preview and install line on every card. MIT licensed, installed one at a time.`,
  alternates: { canonical: "/components" },
};

export default function ComponentsPage() {
  const current = CATALOG.filter((component) => component.status !== "deprecated");
  const free = current.filter((component) => component.tier !== "pro").length;

  /*
   * The commercial tiers, read from the one place that owns them.
   *
   * Not restated here and not priced here. `offerings.ts` says the model moves,
   * and a second copy on the catalogue page is the copy that will be six months
   * out of date the first time it does.
   */
  const core = TIERS.find((tier) => tier.name === "Core");
  const marketplace = TIERS.find((tier) => tier.featured);

  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main">
        <section className="border-b border-rule">
          <div className="mx-auto grid max-w-6xl section-major gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
            <div>
              <p className="eyebrow eyebrow-rule text-brand-deep" data-reveal>
                Catalogue
              </p>
              <h1 className="display-lg mt-5 text-balance" data-reveal>
                Every component ships the states a demo would skip.
              </h1>
              <p className="body-lg mt-6 max-w-xl text-pretty text-graphite" data-reveal>
                {/*
                  The count is derived. It used to be a number in a sentence and
                  a different number in the pricing table, and both were wrong
                  by the time anybody read them.
                */}
                All {free} are free, MIT licensed, and installed as source you own — the command is
                on every card. Each one has a designed still state for reduced motion, says its
                status in words rather than colour alone, and takes every colour from a token your
                brand can override.
              </p>

              <div className="mt-8 max-w-md" data-reveal>
                <InstallCommand
                  size="sm"
                  command="npx @zoblocks/cli init"
                  note={
                    <>
                      Run once per project. It records where your{" "}
                      <code className="font-mono text-[0.6875rem] text-ink">@/</code> alias points,
                      and every install command below works after that.
                    </>
                  }
                />
              </div>
            </div>

            <dl className="lg:pb-1" data-reveal="right">
              <div className="ticks mb-5 opacity-70" aria-hidden="true" />
              {[
                { label: "Components", value: current.length },
                {
                  label: "Categories",
                  value: new Set(CATALOG.flatMap((component) => component.categories)).size,
                },
                {
                  label: "Documented states",
                  value: CATALOG.reduce((total, component) => total + component.states.length, 0),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-baseline justify-between border-b border-rule/70 py-2.5"
                >
                  <dt className="axis-label">{stat.label}</dt>
                  <dd className="numeric text-2xl font-semibold text-brand-deep">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="bg-paper-sunk/40">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            {/*
              The guard stays; the sentence does not.

              "The catalog is being rebuilt from scratch" described a real state
              months ago and describes nothing now — 27 components ship. An
              empty catalogue today would mean the generated module failed to
              build, which is a broken deploy rather than a product phase, so
              the copy says that instead of reassuring a reader about a
              migration that finished.
            */}
            {CATALOG.length === 0 ? (
              <p className="max-w-xl rounded-2xl border border-dashed border-rule px-6 py-8 text-sm leading-relaxed text-graphite">
                The catalogue failed to load. This is a build fault, not an empty library —{" "}
                <a className="underline" href="https://github.com/zoworkhq/zoblocks/issues">
                  please report it
                </a>
                .
              </p>
            ) : (
              <CatalogExplorer catalog={CATALOG} />
            )}
          </div>
        </section>

        {/*
          What it costs, at the bottom of the thing being priced.
          Every component on this page is free; the paid surface is the
          marketplace, and saying so here is more honest than a "Pro" badge on
          a component nobody can buy separately.
        */}
        {core && marketplace ? (
          <section className="border-t border-rule">
            <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
              <h2 className="display-sm" data-reveal>
                What this costs
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2" data-reveal>
                <div className="surface-2 rounded-2xl p-6">
                  <p className="axis-label text-brand-deep">{core.name}</p>
                  <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
                    {core.price}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-graphite">{core.summary}</p>
                  <p className="mt-4 text-sm text-graphite">
                    That is every card above — all {free} of them, commercial use permitted, with no
                    account and nothing to sign.
                  </p>
                </div>

                <div className="surface-2 rounded-2xl border-brand/30 p-6">
                  <p className="axis-label text-brand-deep">{marketplace.name}</p>
                  <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
                    {marketplace.price}
                    {marketplace.cadence ? (
                      <span className="ml-2 text-sm font-normal text-graphite-soft">
                        {marketplace.cadence}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-graphite">
                    {marketplace.summary}
                  </p>
                  <Link
                    href={marketplace.href}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-deep transition-colors hover:text-ink"
                  >
                    {marketplace.cta}
                    <ArrowUpRight aria-hidden="true" className="size-3.5" />
                  </Link>
                </div>
              </div>

              {/*
                No link to a table that does not exist.

                This pointed at /pro for "the full table", and /pro has been a
                holding page since the console left the first release — no
                tiers, no prices, nothing to compare. A link is a promise about
                the destination, and this one promised the single thing the
                destination does not have. The address is the honest next step,
                because talking to somebody is genuinely how these are priced.
              */}
              <p className="mt-4 text-xs text-graphite-soft" data-reveal>
                Team and Enterprise add starter kits, shared design assets and support.{" "}
                <a
                  href="mailto:hello@zowork.com?subject=ZoBlocks%20Team%20and%20Enterprise"
                  className="underline underline-offset-2 hover:text-ink"
                >
                  Ask us for the current terms
                </a>
                .
              </p>
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </RevealRoot>
  );
}
