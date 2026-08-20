import type { Metadata } from "next";
import { CATALOG } from "@/lib/catalog";
import { ComponentCard } from "@/components/site/component-card";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";

export const metadata: Metadata = {
  title: "Components",
  description:
    "Every Oxygen UI component. Healthcare loaders paced to resting physiology, installed one at a time, with a designed reduced-motion state and a wait that is announced in words.",
};

export default function ComponentsPage() {
  // These two carry the product's argument — the signature wait, and the only
  // loader that can tell the truth about how much is left — so they lead, each
  // paired with a standard cell to keep the rhythm even.
  const FEATURED = ["pulse-loader", "infusion-loader"];

  // Deprecated components are still installable and still documented, but they
  // do not belong in the lead grid. Every other tier does: a beta component is
  // real, shipped, and the thing a visitor came to see. Filtering the grid down
  // to "stable" only made sense when the catalog had any.
  const current = CATALOG.filter((c) => c.status !== "deprecated");
  const deprecated = CATALOG.filter((c) => c.status === "deprecated");

  const featured = FEATURED.map((n) => current.find((c) => c.name === n)).filter(Boolean);
  const rest = current.filter((c) => !FEATURED.includes(c.name));
  const ordered = [featured[0], rest[0], featured[1], rest[1], ...rest.slice(2)].filter(Boolean);

  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main">
        <section className="border-b border-rule">
          <div className="mx-auto grid max-w-6xl section-major gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
            <div>
              <p className="eyebrow eyebrow-rule text-oxygen-deep" data-reveal>
                Catalog
              </p>
              <h1 className="display-lg mt-5 text-balance" data-reveal>
                Every component ships the states a demo would skip.
              </h1>
              <p className="body-lg mt-6 max-w-xl text-pretty text-graphite" data-reveal>
                Install them one at a time. Each one handles reduced motion with a designed still
                state, announces itself in words, and resolves every colour through a token your
                brand can override.
              </p>
            </div>

            {/* The right column was empty. Stats belong here, set as an
                instrument readout rather than a row under the paragraph. */}
            <dl className="lg:pb-1" data-reveal="right">
              <div className="ticks mb-5 opacity-70" aria-hidden="true" />
              {[
                { label: "Components", value: current.length },
                {
                  label: "Categories",
                  value: new Set(CATALOG.flatMap((c) => c.categories)).size,
                },
                {
                  label: "States handled",
                  value: CATALOG.reduce((total, c) => total + c.states.length, 0),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-baseline justify-between border-b border-rule/70 py-2.5"
                >
                  <dt className="axis-label">{stat.label}</dt>
                  <dd className="numeric text-2xl font-semibold text-oxygen-deep">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="bg-paper-sunk/40">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            {CATALOG.length === 0 && (
              <p
                className="max-w-xl rounded-2xl border border-dashed border-rule px-6 py-8 text-sm leading-relaxed text-graphite"
                data-reveal
              >
                The catalog is being rebuilt from scratch. Components appear here as each one ships.
              </p>
            )}

            {/* No `auto-rows-fr`. It sizes every row in the grid to the
                tallest row, so one preview taller than the rest — Care
                Timeline, which carries a banner, its events and the coverage
                sentence — set the height of all sixteen cards and left a
                column of empty frame in the other fifteen. Default `auto`
                rows still stretch the cards within a row to match each
                other, which is the part that was actually wanted. */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ordered.map((component, index) => (
                <ComponentCard
                  key={component!.name}
                  component={component!}
                  index={index}
                  featured={FEATURED.includes(component!.name)}
                />
              ))}
            </div>

            {deprecated.length > 0 && (
              <>
                <h2 className="display-sm mt-16" data-reveal>
                  Deprecated
                </h2>
                <p className="mt-2 max-w-xl text-sm text-graphite" data-reveal>
                  Still installable and still documented, with a removal version and a migration
                  note on each page.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {deprecated.map((component, index) => (
                    <ComponentCard key={component.name} component={component} index={index} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </RevealRoot>
  );
}
