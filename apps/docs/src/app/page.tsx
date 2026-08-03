import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { CATALOG, STATUS_LABEL, type ComponentStatus } from "@/lib/catalog";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { Counter, InstallCommand, RevealRoot } from "@/components/site/interactions";
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
    </RevealRoot>
  );
}

/* ========================================================================== */

/* ========================================================================== */

function Hero() {
  return (
    // No ambient trace behind the headline. It read as an artifact at low
    // contrast and competed with the type at high contrast — and the
    // instrument already carries the trace, wired to real state. One
    // signature, used once.
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-16">
        <div className="max-w-4xl">
          <p className="eyebrow text-oxygen-deep" data-reveal>
            FHIR R4 · shadcn registry · MIT core
          </p>

          <h1 className="display-xl mt-5 text-balance" data-reveal style={{ "--reveal-delay": "60ms" } as React.CSSProperties}>
            Healthcare components that already know what the data means.
          </h1>

          <p
            className="lede mt-6 max-w-2xl text-pretty"
            data-reveal
            style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
          >
            Pass a FHIR <code className="numeric text-[0.9em] text-ink">Observation[]</code> and get
            reference ranges, interpretation flags, and the uninterpreted case handled correctly.
            The source is copied into your repo — yours to read, audit, and change.
          </p>

          <div
            className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center"
            data-reveal
            style={{ "--reveal-delay": "180ms" } as React.CSSProperties}
          >
            <InstallCommand command="pnpm dlx shadcn@latest add @oxygenui/vitals-panel" className="flex-1" />
            <a
              href="/components"
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-sm font-medium text-paper transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-oxygen-deep"
            >
              Browse components
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
              />
            </a>
          </div>
        </div>

        <div
          className="mt-10"
          data-reveal
          style={{ "--reveal-delay": "240ms" } as React.CSSProperties}
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
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="max-w-3xl">
          <p className="eyebrow text-graphite" data-reveal>
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

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-3">
          {STATE_FACTS.map((fact, index) => (
            <div
              key={fact.label}
              className="bg-paper p-6 sm:p-7"
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

const HAND_ROLLED = [
  "Crashes when valueQuantity is absent",
  "Calls an uninterpreted result normal",
  "Ignores a stated critical interpretation",
  "Shows a preliminary result as final",
  "Severity carried by color alone",
];

const WITH_OXYGEN = [
  "Renders the dataAbsentReason instead",
  "Reads “Not interpreted”, never “Normal”",
  "Explicit interpretation always wins",
  "Preliminary and corrected are labelled",
  "Badge, rule, icon, and live region",
];

function CodeComparison() {
  return (
    <section className="border-t border-rule">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="max-w-3xl">
          <p className="eyebrow text-graphite" data-reveal>
            The difference
          </p>
          <h2 className="display-lg mt-4 text-balance" data-reveal>
            One line replaces the five bugs everyone writes.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div data-reveal>
            <div className="mb-3 flex items-center gap-2">
              <span className="eyebrow text-graphite">Hand-rolled</span>
            </div>
            <pre className="scroll-thin overflow-x-auto rounded-2xl border border-rule bg-paper-sunk p-5 font-mono text-[0.75rem] leading-relaxed text-graphite">
              <code>{`{observations.map((o) => (
  <Row
    name={o.code?.text}
    value={o.valueQuantity.value + " " +
           o.valueQuantity.unit}
    status={o.valueQuantity.value >
            range.high ? "high" : "normal"}
  />
))}`}</code>
            </pre>
            <ul className="mt-4 space-y-2">
              {HAND_ROLLED.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-graphite">
                  <Minus aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-critical" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div data-reveal style={{ "--reveal-delay": "100ms" } as React.CSSProperties}>
            <div className="mb-3 flex items-center gap-2">
              <span className="eyebrow text-oxygen-deep">With Oxygen</span>
            </div>
            <pre className="scroll-thin-dark overflow-x-auto rounded-2xl border border-ink-rule bg-ink p-5 font-mono text-[0.75rem] leading-relaxed text-paper/90">
              <code>
                <span className="text-graphite-soft">{`// props are the FHIR resource\n`}</span>
                {`<ObservationPanel\n  observations={observations}\n/>`}
              </code>
            </pre>
            <ul className="mt-4 space-y-2">
              {WITH_OXYGEN.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink">
                  <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-oxygen-deep" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */



const STATUS_STYLE: Record<ComponentStatus, string> = {
  shipping: "border-oxygen/30 bg-oxygen/8 text-oxygen-deep",
  review: "border-rule-strong bg-paper-sunk text-graphite",
  design: "border-rule bg-transparent text-graphite-soft",
};

function Catalog() {
  return (
    <section id="components" className="scroll-mt-16 border-t border-rule bg-paper-sunk/50">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="max-w-3xl">
          <p className="eyebrow text-graphite" data-reveal>
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

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATALOG.map((component, index) => (
            <Link
              key={component.name}
              href={`/components/${component.name}`}
              data-reveal
              style={{ "--reveal-delay": `${(index % 3) * 70}ms` } as React.CSSProperties}
              className="group flex flex-col rounded-2xl border border-rule bg-paper p-5 transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-oxygen/40 hover:shadow-[0_16px_36px_-20px_rgb(6_118_98/0.35)]"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-base font-semibold tracking-tight">
                  {component.title}
                </h3>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider ${STATUS_STYLE[component.status]}`}
                >
                  {STATUS_LABEL[component.status]}
                </span>
              </div>

              <p className="numeric mt-2 text-xs text-oxygen-deep">{component.resource}</p>

              <p className="mt-3 flex-1 text-sm leading-relaxed text-graphite">
                {component.summary}
              </p>

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
    body: "WCAG 2.2 AA is the bar, with keyboard paths, focus order, accessible names, reduced motion, and forced-colors verified per component. Each ships a conformance note recording what was tested and what is left to you.",
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
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="max-w-3xl">
          <p className="eyebrow text-graphite" data-reveal>
            Quality
          </p>
          <h2 className="display-lg mt-4 text-balance" data-reveal>
            Claims we are willing to be held to.
          </h2>
        </div>

        <dl className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2">
          {QUALITY.map((item, index) => (
            <div
              key={item.title}
              className="bg-paper p-6 sm:p-8"
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
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="instrument relative px-6 py-14 sm:px-12 sm:py-16" data-reveal>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-30" aria-hidden="true">
            <TelemetryTrace mode="normal" height={90} />
          </div>

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="display-lg text-balance text-paper">
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
