import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TIERS } from "@/lib/offerings";
import { PRO_FEATURES } from "@/lib/pro-features";
import { signInHref, signUpHref } from "@/lib/app";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";
import { FeatureBrowser } from "@/components/pro/feature-browser";
import { Stage } from "@/components/pro/stage-map";
import { StageGate, VisionFilters } from "@/components/pro/stages";

/**
 * Pro.
 *
 * The page this replaces sold Team and Enterprise with a waitlist and six
 * bullet points. Pro is not a tier we are going to build — it is the
 * application already running at app.oxygenui.design, and a page listing what
 * a shipped product *will* do is weaker than one showing it doing it.
 *
 * So the argument is made by ten glances rather than by adjectives, and the
 * tier table moves below them: Enterprise is a real conversation, but it is
 * not the first thing this page should say.
 */

export const metadata: Metadata = {
  title: "Pro — the Oxygen console",
  description:
    "A theming console for behavioral health. One brand colour becomes eleven contrast-validated steps, and a theme that fails the gate cannot be published.",
  alternates: { canonical: "/pro" },
};

export default function ProPage() {
  return (
    <RevealRoot>
      <SiteHeader />
      <VisionFilters />

      <main id="main" className="oxp">
        {/* ---------------------------------------------------------- hero */}
        <section className="border-b border-rule">
          <div className="mx-auto grid max-w-6xl section-major gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
            <div>
              <p className="eyebrow eyebrow-rule text-oxygen-deep" data-reveal>
                Oxygen Pro
              </p>
              <h1 className="display-lg mt-5 text-balance" data-reveal>
                Your brand, through a gate that will not let it fail.
              </h1>
              <p className="body-lg mt-6 max-w-xl text-pretty text-graphite" data-reveal>
                A theming console for behavioral health. Set one brand colour, get eleven validated
                steps. Publish only what passes contrast. Ship a stylesheet pinned to a version, so
                an edit here cannot change a running application until somebody moves the pin.
              </p>

              <div className="mt-8 flex flex-wrap gap-3" data-reveal>
                <a
                  href={signUpHref}
                  className="group inline-flex items-center gap-2 rounded-xl bg-cta px-5 py-3.5 text-sm font-medium text-paper transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-cta-hover"
                >
                  Create an organisation
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
                  />
                </a>
                <a
                  href={signInHref}
                  className="inline-flex items-center gap-2 rounded-xl border border-rule px-5 py-3.5 text-sm font-medium text-ink transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-oxygen/40"
                >
                  Sign in
                </a>
              </div>
              <p className="mt-4 text-xs text-graphite-soft" data-reveal>
                Free while in preview · no card · the marketplace is the paid part
              </p>
            </div>

            <div className="fStage seen" style={{ height: 200 }} data-reveal="right">
              <StageGate />
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- proof */}
        <section className="border-b border-rule bg-paper-sunk/30">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px overflow-hidden px-5 sm:grid-cols-3 sm:px-8">
            {(
              [
                ["11", "token steps from one colour"],
                ["3", "tiers: reference, semantic, component"],
                ["0", "failing themes can reach production"],
              ] as const
            ).map(([k, v]) => (
              <div key={v} className="py-7 sm:px-6 sm:first:pl-0" data-reveal>
                <div className="numeric text-2xl font-semibold tracking-tight">{k}</div>
                <div className="mt-1 text-xs text-graphite-soft">{v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------- glances */}
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="axis-label" data-reveal>
                Ten features
              </p>
              <h2 className="display-sm mt-3 text-balance" data-reveal>
                Each one shown in about four seconds.
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-graphite" data-reveal>
                Not screenshots and not recordings — markup, so each one themes with the page,
                scales without artefacts and rests on its finished frame if you have asked for
                reduced motion.
              </p>
            </div>

            <div className="glances mt-9">
              {PRO_FEATURES.map((f, i) => (
                <article
                  key={f.id}
                  className="glance"
                  data-reveal
                  style={{ ["--enter-delay" as string]: `${(i % 3) * 60}ms` }}
                >
                  <div className="stage seen">
                    <Stage id={f.id} />
                  </div>
                  <div className="gBody">
                    <h3>{f.title}</h3>
                    <p>{f.body}</p>
                    <p className="gWhere">{f.where}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ feature browser */}
        <section className="border-b border-rule bg-paper-sunk/30">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <h2 className="display-sm text-balance" data-reveal>
                  Everything in the console
                </h2>
                <p className="mt-2 text-sm text-graphite" data-reveal>
                  One stage, switched by tab. Pick a feature and watch it happen.
                </p>
              </div>
              <span className="chip" data-reveal>
                {PRO_FEATURES.length} features
              </span>
            </div>
            <div data-reveal>
              <FeatureBrowser />
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- who it is for */}
        {/*
          The page sold a console to the person who would operate it and said
          nothing to the person who signs for it.

          That was the largest commercial gap on the site: an engineer could
          evaluate this page and had nothing to forward. Three roles, one
          sentence each, immediately above the price — because the question a
          budget holder asks is not what the console does, it is who on their
          team stops doing something manually.
        */}
        <section className="border-b border-rule" id="who">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <h2 className="display-sm text-balance" data-reveal>
              Who this is for.
            </h2>
            <div
              className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule md:grid-cols-3"
              data-reveal
            >
              {[
                {
                  role: "Design lead",
                  line: "One brand colour becomes eleven contrast-validated steps. No more hand-picking hex values and hoping.",
                  proof: "11 steps · every pair checked",
                },
                {
                  role: "Engineering lead",
                  line: "Publishes a versioned stylesheet. No runtime, no theme provider, no second source of truth in the app.",
                  proof: "0 runtime dependencies",
                },
                {
                  role: "Whoever signs for it",
                  line: "Priced per organisation, not per seat. Adding a designer does not change the invoice.",
                  proof: "No per-seat metering",
                },
              ].map((item) => (
                <div key={item.role} className="bg-paper p-6">
                  <p className="eyebrow text-graphite">{item.role}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink">{item.line}</p>
                  <p className="numeric mt-4 text-xs text-oxygen-deep">{item.proof}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- pricing */}
        <section className="border-b border-rule" id="pricing">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <div className="mb-7 flex flex-wrap items-baseline justify-between gap-4">
              <div className="max-w-2xl">
                <h2 className="display-sm text-balance" data-reveal>
                  What it costs
                </h2>
                <p className="mt-3 text-pretty leading-relaxed text-graphite" data-reveal>
                  The console is free while it is in preview. The marketplace is the part that
                  charges today — and the tier that used to sit in the middle is gone rather than
                  quietly still on the page.
                </p>
              </div>
              <span className="chip" data-reveal>
                no card to start
              </span>
            </div>

            <div className="tiers">
              {TIERS.map((tier, i) => (
                <div
                  key={tier.name}
                  className="tier"
                  data-reveal
                  style={{ ["--enter-delay" as string]: `${i * 55}ms` }}
                  {...(tier.featured ? { "data-featured": "" } : {})}
                >
                  <div className="tn">
                    <b>{tier.name}</b>
                    {tier.featured ? <span className="badge">buyable today</span> : null}
                    {tier.href === "#waitlist" ? (
                      <span className="badge" style={{ color: "var(--site-graphite-soft)" }}>
                        waitlist
                      </span>
                    ) : null}
                  </div>
                  <div className="pr">
                    <span className="amt">{tier.price}</span>
                    {tier.cadence ? <span className="cad">{tier.cadence}</span> : null}
                  </div>
                  <p className="sm">{tier.summary}</p>
                  <ul>
                    {tier.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  {tier.href.startsWith("/") ? (
                    <Link href={tier.href} className="tcta">
                      {tier.cta}
                    </Link>
                  ) : (
                    <a href={tier.href} className="tcta">
                      {tier.cta}
                    </a>
                  )}
                  {tier.note ? <p className="tnote">{tier.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ the way in */}
        <section>
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <div className="authBand" data-reveal>
              <div>
                <h2>Create an organisation, or sign back in.</h2>
                <p>
                  Themes, members and purchases belong to an organisation rather than a person, so
                  the first account creates one. Signing up puts you in a pending state until an
                  administrator approves you — on a new organisation that is you, immediately.
                </p>
              </div>
              <div className="authBtns">
                <a
                  href={signUpHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-cta px-5 py-3 text-sm font-medium text-paper transition-colors duration-200 hover:bg-cta-hover"
                >
                  Create an organisation
                </a>
                <a
                  href={signInHref}
                  className="inline-flex items-center gap-2 rounded-xl border border-rule-strong px-5 py-3 text-sm font-medium text-ink transition-colors duration-200 hover:bg-paper"
                >
                  Sign in
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </RevealRoot>
  );
}
