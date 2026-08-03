import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { CATALOG } from "@/lib/catalog";
import { ComponentCard } from "@/components/site/component-card";
import { ScrollRail, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { Counter, InstallCommand, RevealRoot } from "@/components/site/interactions";
import { FailureDemo } from "@/components/site/failure-demo";
import { LiveInstrument } from "@/components/site/live-instrument";
import { TelemetryTrace } from "@/components/site/telemetry-trace";

export default function HomePage() {
  return (
    <RevealRoot>
      <SiteHeader />
      <main id="main">
        <Hero />
        <StatesArgument />
        <CodeComparison />
        <Catalog />
        <Trust />
        <ClosingCta />
      </main>
      <SiteFooter />
      <ScrollRail />
    </RevealRoot>
  );
}

/* ========================================================================== */

/* ========================================================================== */

function Hero() {
  const resources = [
    "Patient",
    "Observation",
    "MedicationRequest",
    "AllergyIntolerance",
    "Appointment",
    "Condition",
    "Coverage",
  ];

  return (
    <section className="section-hero relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div>
            <p
              className="eyebrow eyebrow-rule enter text-oxygen-deep"
              style={{ "--enter-delay": "0ms" } as React.CSSProperties}
            >
              FHIR R4 · shadcn registry · MIT core
            </p>

            {/* Entrance is orchestrated on load rather than observed on scroll:
                above-the-fold content should never wait for an observer. */}
            <h1
              className="display-2xl enter-blur mt-6 text-balance"
              style={{ "--enter-delay": "90ms" } as React.CSSProperties}
            >
              Healthcare components that already know what the data means.
            </h1>

            <p
              className="body-lg enter mt-7 max-w-xl text-pretty text-graphite"
              style={{ "--enter-delay": "220ms" } as React.CSSProperties}
            >
              Pass a FHIR <code className="numeric text-[0.9em] text-ink">Observation[]</code> and
              get reference ranges, interpretation flags, and the uninterpreted case handled
              correctly. The source is copied into your repo — yours to read, audit, and change.
            </p>

          </div>

          {/* The right column used to be empty. It now carries the actual
              claim: which resources are typed. On-thesis, not decoration. */}
          <aside
            className="enter lg:pb-1"
            style={{ "--enter-delay": "430ms" } as React.CSSProperties}
            aria-label="FHIR resources covered"
          >
            <div className="ticks mb-5 opacity-70" aria-hidden="true" />
            <p className="axis-label">Resources typed</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 lg:grid-cols-1 lg:gap-y-2.5">
              {resources.map((resource, index) => (
                <li
                  key={resource}
                  className="group flex items-baseline gap-2.5 border-b border-rule/70 pb-2"
                >
                  <span className="numeric w-5 shrink-0 text-[0.625rem] text-graphite-soft">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="numeric text-[0.8125rem] text-ink">{resource}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

            <div
              className="enter mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center"
              style={{ "--enter-delay": "330ms" } as React.CSSProperties}
            >
              <InstallCommand
                command="pnpm dlx shadcn@latest add @oxygenui/vitals-panel"
                className="flex-1"
              />
              <Link
                href="/components"
                className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cta px-5 py-3.5 text-sm font-medium text-paper transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:opacity-90"
              >
                Browse components
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
                />
              </Link>
            </div>

        <div
          className="enter mt-14"
          style={{ "--enter-delay": "540ms" } as React.CSSProperties}
        >
          <LiveInstrument />
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */

const STATE_FACTS = [
  {
    value: 7,
    suffix: "",
    label: "Result states per component",
    detail: "Final, preliminary, corrected, amended, critical, absent, uninterpreted.",
  },
  {
    value: 3,
    suffix: "",
    label: "Density modes",
    detail: "Patient-facing, standard admin, and clinical-dense — switchable at any container.",
  },
  {
    value: 0,
    suffix: "",
    label: "Runtime dependencies added",
    detail: "The components are source. Nothing sits between you and the render.",
  },
];

function StatesArgument() {
  return (
    <section className="border-t border-rule bg-paper-sunk/50">
      <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="eyebrow eyebrow-rule text-graphite" data-reveal>
            Why this exists
          </p>
          <h2 className="display-lg mt-4 text-balance" data-reveal>
            The states your demo skips are the states your users hit.
          </h2>
          <p className="lede mt-5 max-w-2xl text-pretty" data-reveal>
            A generic card renders a value. It has no opinion about a result that came back
            preliminary, a range that doesn&rsquo;t exist, a record flagged restricted, or a
            potassium of 6.8. Those aren&rsquo;t edge cases. They are Tuesday.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {STATE_FACTS.map((fact, index) => (
            <div
              key={fact.label}
              className="surface-1 rounded-2xl p-6 sm:p-7"
              data-reveal
              style={{ "--reveal-delay": `${index * 80}ms` } as React.CSSProperties}
            >
              <div className="display-lg text-oxygen-deep">
                <Counter to={fact.value} suffix={fact.suffix} />
              </div>
              <h3 className="mt-3 font-display text-[0.9375rem] font-semibold tracking-tight">
                {fact.label}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-graphite">{fact.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */



function CodeComparison() {
  return (
    <section className="border-t border-rule">
      <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="eyebrow eyebrow-rule text-graphite" data-reveal>
            The difference
          </p>
          <h2 className="display-lg mt-4 text-balance" data-reveal>
            Same five results. Two renderers.
          </h2>
          <p className="body-lg mt-5 max-w-2xl text-pretty text-graphite" data-reveal>
            Not a feature list — the actual output. The left panel is written the way the
            hand-rolled example in our docs is written, and every defect it produces follows
            directly from that code.
          </p>
        </div>

        <div className="mt-12">
          <FailureDemo />
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */




function Catalog() {
  return (
    <section id="components" className="scroll-mt-16 border-t border-rule bg-paper-sunk/50">
      <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="eyebrow eyebrow-rule text-graphite" data-reveal>
            Catalog
          </p>
          <h2 className="display-lg mt-4 text-balance" data-reveal>
            Every component is named for the resource it takes.
          </h2>
          <p className="lede mt-5 max-w-2xl text-pretty" data-reveal>
            No adapter layer, no bespoke prop shape to learn. If your server speaks FHIR, the
            component is already typed for it.
          </p>
        </div>

        <div className="mt-12 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATALOG.map((component, index) => (
            <ComponentCard
              key={component.name}
              component={component}
              index={index}
              featured={index === 0}
            />
          ))}
        </div>

        <div className="mt-10" data-reveal>
          <Link
            href="/components"
            className="group inline-flex items-center gap-2 rounded-xl border border-rule bg-paper px-5 py-3 text-sm font-medium text-ink transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-oxygen/40"
          >
            Browse the full catalog
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */

const QUALITY = [
  {
    title: "Accessibility, stated as a target",
    body: "WCAG 2.2 AA is the bar, and it is enforced in CI — every page is audited with axe-core in both light and dark on each commit. That check found and fixed four real violations, three of them in the clinical status tokens themselves. Automated testing catches roughly a third of WCAG issues, so keyboard and screen-reader passes remain manual.",
  },
  {
    title: "Status is never color alone",
    body: "Every severity carries an icon, a text label, and a second structural cue. View any component in forced-colors mode: nothing that mattered disappears.",
  },
  {
    title: "Synthetic data, always",
    body: "Every fixture, demo, and screenshot uses invented values on reserved example.org systems. No PHI enters this repository, its issues, or its analytics.",
  },
  {
    title: "What this is not",
    body: "Oxygen is not a compliance boundary. It does not make an application HIPAA, GDPR, or DPDP compliant, and it is not a medical device. It is well-built UI; the clinical and regulatory obligations remain yours.",
  },
];

function Trust() {
  return (
    <section id="quality" className="scroll-mt-16 border-t border-rule">
      <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="eyebrow eyebrow-rule text-graphite" data-reveal>
            Quality
          </p>
          <h2 className="display-lg mt-4 text-balance" data-reveal>
            Claims we are willing to be held to.
          </h2>
        </div>

        <dl className="mt-12 grid gap-4 sm:grid-cols-2">
          {QUALITY.map((item, index) => (
            <div
              key={item.title}
              className="surface-1 rounded-2xl p-6 sm:p-8"
              data-reveal
              style={{ "--reveal-delay": `${(index % 2) * 80}ms` } as React.CSSProperties}
            >
              <dt className="display-sm">{item.title}</dt>
              <dd className="mt-3 text-sm leading-relaxed text-graphite">{item.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ========================================================================== */

function ClosingCta() {
  return (
    <section className="border-t border-rule">
      <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
        <div className="instrument relative px-6 py-14 sm:px-12 sm:py-16" data-reveal>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-30" aria-hidden="true">
            <TelemetryTrace mode="normal" height={90} />
          </div>

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="display-lg text-balance text-panel-fg">
              Install one component. See if it holds up.
            </h2>
            <p className="mt-5 text-pretty text-[1.0625rem] leading-relaxed text-graphite-soft">
              The core is MIT. Nothing is gated behind an account, and the source lands in your
              repository where you can read every line before you trust it.
            </p>
            <div className="mx-auto mt-8 max-w-xl">
              <InstallCommand command="pnpm dlx shadcn@latest add @oxygenui/vitals-panel" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
