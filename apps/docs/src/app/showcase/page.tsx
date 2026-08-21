import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import { BLOCKS } from "@/lib/blocks";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";
import { BlockGallery } from "@/components/site/block-gallery";

export const metadata: Metadata = {
  title: "Showcase — Oxygen UI blocks",
  description:
    "Behavioral health blocks built with Oxygen UI: a clinical caseload dashboard, a progress note with provenance, a patient details view, and a sourced clinical copilot. Live compositions on synthetic data.",
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
                Blocks
              </p>
              <h1 className="display-lg mt-5 text-balance" data-reveal>
                Blocks for the parts of the record that carry consequence.
              </h1>
              <p className="body-lg mt-6 max-w-xl text-pretty text-graphite" data-reveal>
                A dashboard block elsewhere counts revenue, customers and growth rate. These count
                who is not responding to treatment, whose risk screen is past its follow-up window,
                and which note has been open three days unsigned. Same craft, different stakes — and
                the difference has to show in the design, not just the labels.
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
                  Oxygen is new and has none yet. Every block below is built by us on synthetic
                  data. When customers ship, their work appears here with their names on it.
                </p>
              </div>
            </div>

            <nav className="lg:pb-1" aria-label="Blocks" data-reveal="right">
              <div className="ticks mb-5 opacity-70" aria-hidden="true" />
              <p className="axis-label">On this page</p>
              <ul className="mt-4">
                {BLOCKS.map((entry, index) => (
                  <li key={entry.slug}>
                    <Link
                      href={`/showcase/${entry.slug}`}
                      className="group flex items-baseline justify-between gap-3 border-b border-rule/70 py-2.5 transition-colors hover:text-ink"
                    >
                      <span className="flex items-baseline gap-2.5">
                        <span className="numeric text-[0.625rem] text-graphite-soft">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm text-ink">{entry.title}</span>
                      </span>
                      <span className="numeric text-[0.625rem] text-graphite-soft">
                        {entry.slug}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>

        <section className="border-b border-rule bg-paper-sunk/30">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <BlockGallery blocks={BLOCKS} />
          </div>
        </section>

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
                  className="group inline-flex items-center gap-2 rounded-xl bg-cta px-5 py-3.5 text-sm font-medium text-paper transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-cta-hover"
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
    </RevealRoot>
  );
}
