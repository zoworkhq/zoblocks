import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Layers } from "lucide-react";
import { FAQ, STATUS_COPY, TEMPLATES, TIERS } from "@/lib/offerings";
import { ScrollRail, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { cn } from "@/lib/utils";
import { RevealRoot } from "@/components/site/interactions";
import { TelemetryTrace } from "@/components/site/telemetry-trace";

export const metadata: Metadata = {
  title: "Pro — starter kits and workflow blocks",
  description:
    "Production-ready healthcare starter kits built on Oxygen UI: patient portal, provider workspace, clinic operations, and telehealth. Source you own, FHIR-typed, MIT core.",
  alternates: { canonical: "/pro" },
};

const STATUS_STYLE: Record<string, string> = {
  available: "border-oxygen/30 bg-oxygen/8 text-oxygen-deep",
  building: "border-rule-strong bg-paper-sunk text-graphite",
  planned: "border-rule bg-transparent text-graphite-soft",
};

export default function ProPage() {
  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main">
        {/* Hero --------------------------------------------------------- */}
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <p className="eyebrow text-oxygen-deep" data-reveal>
              Oxygen Pro
            </p>
            <h1 className="display-xl mt-5 max-w-4xl text-balance" data-reveal>
              Whole products, not just components.
            </h1>
            <p className="lede mt-6 max-w-2xl text-pretty" data-reveal>
              Core gets you a component. Pro gets you the information architecture, the routes, the
              empty states, and the fixtures — a healthcare product you can hand to a clinician on
              day one instead of week six.
            </p>

            <div className="mt-8 flex flex-wrap gap-3" data-reveal>
              <a
                href="#pricing"
                className="group inline-flex items-center gap-2 rounded-xl bg-cta px-5 py-3.5 text-sm font-medium text-paper transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:opacity-90"
              >
                See pricing
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
                />
              </a>
              <Link
                href="/components"
                className="inline-flex items-center gap-2 rounded-xl border border-rule px-5 py-3.5 text-sm font-medium text-ink transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-oxygen/40"
              >
                Start free with Core
              </Link>
            </div>

            {/* Said up front, not buried in the FAQ. A team that discovers
                this at checkout will not come back. */}
            <p
              className="mt-8 max-w-2xl rounded-xl border border-rule bg-paper-sunk px-4 py-3 text-sm leading-relaxed text-graphite"
              data-reveal
            >
              <strong className="text-ink">Pre-launch.</strong> The catalog is eight components and
              the first starter kit is still in build. The waitlist is free and nothing is charged
              until a kit actually ships.
            </p>
          </div>
        </section>

        {/* Kits --------------------------------------------------------- */}
        <section className="border-b border-rule bg-paper-sunk/40">
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <div className="max-w-3xl">
              <p className="eyebrow text-graphite" data-reveal>
                Launch kits
              </p>
              <h2 className="display-lg mt-4 text-balance" data-reveal>
                Six products, one design system.
              </h2>
              <p className="lede mt-5 max-w-2xl text-pretty" data-reveal>
                Each kit is a working Next.js application — routes, role-based navigation, synthetic
                FHIR fixtures, and every state wired up. Not a landing page with a dashboard
                screenshot.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((template, index) => (
                <article
                  key={template.slug}
                  data-reveal
                  style={{ "--reveal-delay": `${(index % 3) * 70}ms` } as React.CSSProperties}
                  className="group flex flex-col surface-2 lift rounded-2xl p-5 hover:border-oxygen/45"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-base font-semibold tracking-tight">
                      {template.title}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider ${STATUS_STYLE[template.status]}`}
                    >
                      {STATUS_COPY[template.status]}
                    </span>
                  </div>

                  <p className="numeric mt-2 text-xs text-oxygen-deep">{template.role}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-graphite">
                    {template.summary}
                  </p>

                  <div className="mt-4 border-t border-rule pt-3">
                    <p className="text-[0.6875rem] uppercase tracking-wide text-graphite-soft">
                      {template.screens.length} screens
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-graphite">
                      {template.screens.join(" · ")}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {template.uses.map((item) => (
                      <Link
                        key={item}
                        href={`/components/${item}`}
                        className="numeric rounded-md border border-rule px-1.5 py-0.5 text-[0.625rem] text-graphite transition-colors hover:border-oxygen/40 hover:text-oxygen-deep"
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing ------------------------------------------------------ */}
        <section id="pricing" className="scroll-mt-16 border-b border-rule">
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <div className="max-w-3xl">
              <p className="eyebrow text-graphite" data-reveal>
                Pricing
              </p>
              <h2 className="display-lg mt-4 text-balance" data-reveal>
                Free forever at the bottom. Real support at the top.
              </h2>
            </div>

            {/*
              Four equal columns is the default answer and it flattens the
              decision. Free and Enterprise are the two real ends of this
              ladder — one is where everyone starts, one is where the revenue
              is — so they anchor, and the paid middle sits between them at
              standard weight with Pro carried on border, not scale.
            */}
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-12">
              {TIERS.map((tier, index) => {
                const anchor = tier.name === "Core" || tier.name === "Enterprise";
                return (
                  <article
                    key={tier.name}
                    data-reveal
                    style={{ "--reveal-delay": `${index * 70}ms` } as React.CSSProperties}
                    className={cn(
                      "flex flex-col rounded-2xl p-6 lg:col-span-3",
                      tier.featured
                        ? "surface-3 border-oxygen/45 ring-1 ring-oxygen/15"
                        : anchor
                          ? "surface-2"
                          : "surface-1",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-semibold tracking-tight">
                        {tier.name}
                      </h3>
                      {tier.featured && (
                        <span className="rounded-full bg-oxygen/12 px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider text-oxygen-deep">
                          Popular
                        </span>
                      )}
                    </div>

                    <p className="mt-5 flex items-baseline gap-1.5">
                      <span className="numeric text-3xl font-semibold tracking-tight text-ink">
                        {tier.price}
                      </span>
                      {tier.cadence && (
                        <span className="text-xs text-graphite-soft">{tier.cadence}</span>
                      )}
                    </p>

                    <p className="body-sm mt-3 text-graphite">{tier.summary}</p>

                    <div className="ticks my-5 opacity-60" aria-hidden="true" />

                    <ul className="flex-1 space-y-2.5">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-graphite">
                          <Check
                            aria-hidden="true"
                            className="mt-[3px] size-3.5 shrink-0 text-oxygen-deep"
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {tier.note && (
                      <p className="mt-4 text-xs leading-relaxed text-graphite-soft">{tier.note}</p>
                    )}

                    <a
                      href={tier.href}
                      className={cn(
                        "mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5",
                        tier.featured
                          ? "bg-cta text-paper hover:opacity-90"
                          : "border border-rule text-ink hover:border-oxygen/45",
                      )}
                    >
                      {tier.cta}
                    </a>
                  </article>
                );
              })}
            </div>

            <div
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-rule bg-paper-sunk px-5 py-4 text-sm text-graphite"
              data-reveal
            >
              <span className="inline-flex items-center gap-2 font-medium text-ink">
                <Layers aria-hidden="true" className="size-4 text-oxygen-deep" />
                Services
              </span>
              <span>
                Component sprints, design-system setup, accessibility review, and template
                customisation are quoted per engagement.
              </span>
              <a
                href="mailto:hello@zowork.com?subject=Oxygen%20UI%20services"
                className="font-medium text-oxygen-deep transition-colors hover:text-ink"
              >
                Start a conversation →
              </a>
            </div>
          </div>
        </section>

        {/* Waitlist ----------------------------------------------------- */}
        <section id="waitlist" className="scroll-mt-16 border-b border-rule bg-paper-sunk/40">
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <div className="instrument relative px-6 py-12 sm:px-12" data-reveal>
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 opacity-30"
                aria-hidden="true"
              >
                <TelemetryTrace mode="normal" height={80} />
              </div>
              <div className="relative mx-auto max-w-2xl text-center">
                <h2 className="display-lg text-balance text-panel-fg">
                  Tell us which kit you need first.
                </h2>
                <p className="mt-5 text-pretty leading-relaxed text-panel-muted">
                  We are building in the open and the order is not fixed. Email us the workflow you
                  are stuck on — it genuinely moves the roadmap, and there is nothing to pay.
                </p>
                <a
                  href="mailto:hello@zowork.com?subject=Oxygen%20UI%20waitlist"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-trace px-5 py-3.5 text-sm font-medium text-[#04211c] transition-opacity duration-200 hover:opacity-90"
                >
                  Email us
                  <ArrowRight aria-hidden="true" className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ---------------------------------------------------------- */}
        <section>
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <div className="max-w-3xl">
              <p className="eyebrow text-graphite" data-reveal>
                Questions
              </p>
              <h2 className="display-lg mt-4 text-balance" data-reveal>
                The ones procurement actually asks.
              </h2>
            </div>

            <dl className="mt-10 max-w-3xl divide-y divide-rule border-y border-rule">
              {FAQ.map((item) => (
                <div key={item.q} data-reveal>
                  <details className="group py-5">
                    <summary className="flex cursor-pointer items-start justify-between gap-4 font-display text-base font-semibold tracking-tight">
                      {item.q}
                      <span
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-graphite transition-transform duration-300 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-graphite">{item.a}</p>
                  </details>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <SiteFooter />
      <ScrollRail />
    </RevealRoot>
  );
}
