import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import { SHOWCASE } from "@/lib/offerings";
import { ScrollRail, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";
import { ShowcasePreview } from "@/components/site/showcase-preview";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Showcase — Oxygen UI in composition",
  description:
    "Reference implementations built with Oxygen UI: patient results, chart summary, front-desk check-in, and medication review. Live compositions on synthetic FHIR data.",
  alternates: { canonical: "/showcase" },
};

export default function ShowcasePage() {
  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main">
        <section className="border-b border-rule">
          <div className="mx-auto grid max-w-6xl section-major gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
            <div>
              <p className="eyebrow eyebrow-rule text-oxygen-deep" data-reveal>
                Showcase
              </p>
              <h1 className="display-lg mt-5 text-balance" data-reveal>
                What the components look like doing real work.
              </h1>
              <p className="body-lg mt-6 max-w-xl text-pretty text-graphite" data-reveal>
                A single component is easy to make look good. These are compositions — several
                components on one screen, at the density that screen actually runs at, with the
                hard states left in.
              </p>

              {/*
                Stated at the top, not in the footer. Healthcare buyers check
                logos, and a showcase padded with invented customers is the
                fastest way to lose one.
              */}
              <div
                className="mt-7 flex max-w-xl items-start gap-3 rounded-xl border border-rule bg-paper-sunk px-4 py-3"
                data-reveal
              >
                <FlaskConical aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-graphite" />
                <p className="body-sm text-graphite">
                  <strong className="text-ink">Reference implementations, not customers.</strong>{" "}
                  Oxygen is new and has none yet. Every screen below is built by us on synthetic
                  FHIR data. When customers ship, their work appears here with their names on it.
                </p>
              </div>
            </div>

            {/* The right column was empty. It now indexes the page. */}
            <nav className="lg:pb-1" aria-label="Compositions" data-reveal="right">
              <div className="ticks mb-5 opacity-70" aria-hidden="true" />
              <p className="axis-label">On this page</p>
              <ul className="mt-4">
                {SHOWCASE.map((entry, index) => (
                  <li key={entry.slug}>
                    <a
                      href={`#${entry.slug}`}
                      className="group flex items-baseline justify-between gap-3 border-b border-rule/70 py-2.5 transition-colors hover:text-ink"
                    >
                      <span className="flex items-baseline gap-2.5">
                        <span className="numeric text-[0.625rem] text-graphite-soft">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm text-ink">{entry.title}</span>
                      </span>
                      <span className="axis-label">{entry.density}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>

        {SHOWCASE.map((entry, index) => (
          <section
            key={entry.slug}
            id={entry.slug}
            className={cn(
              "scroll-mt-20 border-b border-rule",
              index % 2 === 0 && "bg-paper-sunk/40",
            )}
          >
            <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="eyebrow text-graphite" data-reveal>
                    {entry.role}
                  </p>
                  <h2 className="display-sm mt-3 text-balance" data-reveal>
                    {entry.title}
                  </h2>
                  <p className="mt-3 text-pretty leading-relaxed text-graphite" data-reveal>
                    {entry.blurb}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5" data-reveal>
                  {entry.uses.map((item) => (
                    <Link
                      key={item}
                      href={`/components/${item}`}
                      className="numeric rounded-md border border-rule px-2 py-1 text-[0.6875rem] text-graphite transition-colors hover:border-oxygen/40 hover:text-oxygen-deep"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-8" data-reveal>
                <ShowcasePreview slug={entry.slug} density={entry.density} />
              </div>

              <p
                className="mt-4 max-w-3xl border-l-2 border-oxygen/40 pl-4 text-sm leading-relaxed text-graphite"
                data-reveal
              >
                <span className="font-medium text-ink">What to look at: </span>
                {entry.demonstrates}
              </p>
            </div>
          </section>
        ))}

        <section>
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <div className="max-w-2xl">
              <h2 className="display-lg text-balance" data-reveal>
                Built something with Oxygen?
              </h2>
              <p className="lede mt-5 text-pretty" data-reveal>
                We would rather show your product than ours. Send a link and a sentence about the
                workflow — we will never publish patient data, screenshots with real records, or
                anything you have not cleared.
              </p>
              <div className="mt-8 flex flex-wrap gap-3" data-reveal>
                <a
                  href="mailto:hello@zowork.com?subject=Oxygen%20UI%20showcase%20submission"
                  className="group inline-flex items-center gap-2 rounded-xl bg-cta px-5 py-3.5 text-sm font-medium text-paper transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:opacity-90"
                >
                  Submit your build
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
                  />
                </a>
                <Link
                  href="/components"
                  className="inline-flex items-center gap-2 rounded-xl border border-rule px-5 py-3.5 text-sm font-medium text-ink transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-oxygen/40"
                >
                  Browse components
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <ScrollRail />
    </RevealRoot>
  );
}
