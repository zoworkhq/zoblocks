import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATALOG, STATUS_LABEL, type ComponentStatus } from "@/lib/catalog";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";

export const metadata: Metadata = {
  title: "Components",
  description:
    "Every Oxygen UI component, named for the FHIR resource it takes. Patient, Observation, MedicationRequest, AllergyIntolerance, Appointment, Condition, and Coverage.",
};

const STATUS_STYLE: Record<ComponentStatus, string> = {
  shipping: "border-oxygen/30 bg-oxygen/8 text-oxygen-deep",
  review: "border-rule-strong bg-paper-sunk text-graphite",
  design: "border-rule bg-transparent text-graphite-soft",
};

export default function ComponentsPage() {
  const shipping = CATALOG.filter((c) => c.status === "shipping");
  const planned = CATALOG.filter((c) => c.status !== "shipping");

  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main">
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
            <p className="eyebrow text-oxygen-deep" data-reveal>
              Catalog
            </p>
            <h1 className="display-lg mt-4 max-w-3xl text-balance" data-reveal>
              Every component is named for the resource it takes.
            </h1>
            <p className="lede mt-5 max-w-2xl text-pretty" data-reveal>
              No adapter layer and no bespoke prop shape to learn. If your server speaks FHIR, the
              component is already typed for it — and every one of them ships the states a demo
              would skip.
            </p>

            {/*
              These three read 8 / 8 / 8 when they were components / catalog /
              resources — every component ships and every one takes a distinct
              resource, so the numbers were identical and looked broken.
              "States handled" is the one that actually carries the argument.
            */}
            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3" data-reveal>
              <Stat value={shipping.length} label="Components" />
              <Stat
                value={new Set(CATALOG.filter((c) => c.resource !== "Primitive").map((c) => c.resource)).size}
                label="FHIR resources"
              />
              <Stat
                value={CATALOG.reduce((total, c) => total + c.states.length, 0)}
                label="States handled"
              />
            </dl>
          </div>
        </section>

        <section className="bg-paper-sunk/40">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shipping.map((component, index) => (
                <ComponentCard key={component.name} component={component} index={index} />
              ))}
            </div>

            {planned.length > 0 && (
              <>
                <h2 className="display-sm mt-16" data-reveal>
                  In progress
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {planned.map((component, index) => (
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

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="numeric display-sm text-oxygen-deep">{value}</dd>
      <p className="mt-0.5 text-xs uppercase tracking-wide text-graphite">{label}</p>
    </div>
  );
}

function ComponentCard({
  component,
  index,
}: {
  component: (typeof CATALOG)[number];
  index: number;
}) {
  return (
    <Link
      href={`/components/${component.name}`}
      data-reveal
      style={{ "--reveal-delay": `${(index % 3) * 70}ms` } as React.CSSProperties}
      className="group flex flex-col rounded-2xl border border-rule bg-paper p-5 transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-oxygen/40 hover:shadow-[0_16px_36px_-20px_rgb(6_118_98/0.35)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-semibold tracking-tight">{component.title}</h3>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider ${STATUS_STYLE[component.status]}`}
        >
          {STATUS_LABEL[component.status]}
        </span>
      </div>

      <p className="numeric mt-2 text-xs text-oxygen-deep">{component.resource}</p>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-graphite">{component.summary}</p>

      <div className="mt-4 flex items-center justify-between border-t border-rule pt-3">
        <span className="numeric text-[0.6875rem] text-graphite-soft">
          {component.states.length} states
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-oxygen-deep">
          View
          <ArrowRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
