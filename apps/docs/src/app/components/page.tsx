import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATALOG } from "@/lib/catalog";
import { ComponentCard } from "@/components/site/component-card";
import { ScrollRail, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";

export const metadata: Metadata = {
  title: "Components",
  description:
    "Every Oxygen UI component, named for the FHIR resource it takes. Patient, Observation, MedicationRequest, AllergyIntolerance, Appointment, Condition, and Coverage.",
};

export default function ComponentsPage() {
  // These two carry the product's argument — interpretation and identity — so
  // they lead, each paired with a standard cell to keep the rhythm even.
  const FEATURED = ["vitals-panel", "patient-banner"];
  const shipping = CATALOG.filter((c) => c.status === "shipping");
  const planned = CATALOG.filter((c) => c.status !== "shipping");

  const featured = FEATURED.map((n) => shipping.find((c) => c.name === n)!).filter(Boolean);
  const rest = shipping.filter((c) => !FEATURED.includes(c.name));
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
                Every component is named for the resource it takes.
              </h1>
              <p className="body-lg mt-6 max-w-xl text-pretty text-graphite" data-reveal>
                No adapter layer and no bespoke prop shape to learn. If your server speaks FHIR, the
                component is already typed for it — and every one of them ships the states a demo
                would skip.
              </p>
            </div>

            {/* The right column was empty. Stats belong here, set as an
                instrument readout rather than a row under the paragraph. */}
            <dl className="lg:pb-1" data-reveal="right">
              <div className="ticks mb-5 opacity-70" aria-hidden="true" />
              {[
                { label: "Components", value: shipping.length },
                {
                  label: "FHIR resources",
                  value: new Set(
                    CATALOG.filter((c) => c.resource !== "Primitive").map((c) => c.resource),
                  ).size,
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
            <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ordered.map((component, index) => (
                <ComponentCard
                  key={component!.name}
                  component={component!}
                  index={index}
                  featured={FEATURED.includes(component!.name)}
                />
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
      <ScrollRail />
    </RevealRoot>
  );
}

