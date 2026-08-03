import Link from "next/link";
import { Activity, ArrowRight, Braces, Check, ShieldCheck } from "lucide-react";
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
        <LiveDemo />
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
    <section className="section-hero hero-section relative overflow-hidden">
      <div className="hero-aura" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div
          className="hero-topline enter"
          style={{ "--enter-delay": "0ms" } as React.CSSProperties}
        >
          <span className="numeric">OX / 01</span>
          <span className="hidden sm:inline">Healthcare data systems · FHIR-native</span>
          <span className="text-oxygen-deep">
            Build on meaning <ArrowRight aria-hidden="true" className="inline size-3" />
          </span>
        </div>

        <div className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-14 lg:pt-12">
          <div className="min-w-0">
            <p
              className="eyebrow eyebrow-rule enter text-oxygen-deep"
              style={{ "--enter-delay": "90ms" } as React.CSSProperties}
            >
              FHIR R4 · source-first · MIT core
            </p>

            {/* Entrance is orchestrated on load rather than observed on scroll:
                above-the-fold content should never wait for an observer. */}
            <h1
              className="display-2xl enter-blur mt-6 text-balance"
              style={{ "--enter-delay": "180ms" } as React.CSSProperties}
            >
              Healthcare UI that already knows what the data means.
            </h1>

            <p
              className="body-lg enter mt-7 max-w-xl text-pretty text-graphite"
              style={{ "--enter-delay": "300ms" } as React.CSSProperties}
            >
              Pass a FHIR <code className="numeric text-[0.9em] text-ink">Observation[]</code> and
              get reference ranges, interpretation flags, and the uninterpreted case handled
              correctly. The source is copied into your repo — yours to read, audit, and change.
            </p>
            <div
              className="enter mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center"
              style={{ "--enter-delay": "390ms" } as React.CSSProperties}
            >
              <InstallCommand
                command="pnpm dlx shadcn@latest add @oxygenui/vitals-panel"
                className="min-w-0 flex-1"
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
              className="hero-proofline enter mt-6"
              style={{ "--enter-delay": "470ms" } as React.CSSProperties}
            >
              {[
                { label: "Source copied", icon: Braces },
                { label: "WCAG-minded", icon: ShieldCheck },
                { label: "Runtime: 0", icon: Activity },
              ].map(({ label, icon: Icon }) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <Icon aria-hidden="true" className="size-3.5 text-oxygen-deep" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div
            className="enter min-w-0 lg:pl-2"
            style={{ "--enter-delay": "330ms" } as React.CSSProperties}
          >
            <SignalField />
          </div>
        </div>

        <div
          className="hero-resource-strip enter mt-10"
          style={{ "--enter-delay": "530ms" } as React.CSSProperties}
        >
          <span className="axis-label shrink-0">Typed to</span>
          <div className="flex min-w-0 flex-wrap gap-2">
            {resources.map((resource) => (
              <span key={resource} className="hero-resource-chip numeric">
                {resource}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

/**
 * The interactive demo, promoted out of the hero.
 *
 * It sat below the hero's SignalField with no heading — two large panels
 * making the same argument, which pushed the hero to 1.5 viewports and left
 * the instrument itself unexplained. It earns a section.
 */
function LiveDemo() {
  return (
    <section className="border-t border-rule bg-paper-sunk/40">
      <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="eyebrow eyebrow-rule text-graphite" data-reveal>
              Try it
            </p>
            <h2 className="display-sm mt-3 text-balance" data-reveal>
              Switch the state. The components respond.
            </h2>
          </div>
          <p className="axis-label" data-reveal>
            real components · synthetic FHIR
          </p>
        </div>

        <div className="mt-8" data-reveal>
          <LiveInstrument />
        </div>
      </div>
    </section>
  );
}

function SignalField() {
  return (
    <div
      className="signal-field"
      role="img"
      aria-label="Live FHIR observation translated into a clinical UI: a critical potassium result is interpreted, while an observation without a reference range remains not interpreted."
    >
      <div className="signal-field__chrome">
        <span className="inline-flex items-center gap-2">
          <span className="signal-live-dot" aria-hidden="true" /> Live parser
        </span>
        <span className="numeric">trace://observation/001</span>
      </div>

      <div className="signal-field__stage" aria-hidden="true">
        <div className="signal-core">
          <span className="signal-core__mark">O₂</span>
          <span className="signal-core__label">FHIR → UI</span>
        </div>

        <div className="signal-card signal-card--source">
          <span className="eyebrow text-electric">INPUT</span>
          <code className="mt-2 block text-[0.7rem] text-panel-fg/80">Observation[]</code>
          <span className="mt-2 block text-[0.65rem] text-panel-muted">typed at the boundary</span>
        </div>

        <div className="signal-card signal-card--main">
          <div className="flex items-center justify-between gap-3">
            <span className="eyebrow text-panel-muted">Observation · potassium</span>
            <span className="signal-status">Critical high</span>
          </div>
          <div className="signal-reading mt-4">
            <span className="numeric">6.8</span>
            <span>mmol/L</span>
          </div>
          <div className="signal-reading-bar mt-4">
            <span />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-[0.65rem] text-panel-muted">
            <span>3.5 — 5.1 mmol/L</span>
            <span className="numeric">interpreted</span>
          </div>
          <TelemetryTrace mode="critical" height={38} />
        </div>

        <div className="signal-card signal-card--quiet">
          <span className="eyebrow text-panel-muted">No range</span>
          <strong className="mt-2 block font-display text-sm text-panel-fg">Not interpreted</strong>
          <span className="mt-1 block text-[0.65rem] text-panel-muted">
            never defaults to Normal
          </span>
        </div>
      </div>

      <div className="signal-field__footer">
        <span>
          <span className="signal-footer-dot" aria-hidden="true" /> Rendered state
        </span>
        <span className="numeric">0.8ms · source owned</span>
      </div>
    </div>
  );
}

/* ========================================================================== */

const STATE_FACTS = [
  {
    value: 7,
    suffix: "",
    scope: "RESULT PROTOCOL",
    unit: "STATES",
    label: "Result states per component",
    detail: "Final, preliminary, corrected, amended, critical, absent, uninterpreted.",
  },
  {
    value: 3,
    suffix: "",
    scope: "LAYOUT SYSTEM",
    unit: "MODES",
    label: "Density modes",
    detail: "Patient-facing, standard admin, and clinical-dense — switchable at any container.",
  },
  {
    value: 0,
    suffix: "",
    scope: "SOURCE RUNTIME",
    unit: "ADDED",
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

        <div className="state-facts mt-14">
          {STATE_FACTS.map((fact, index) => (
            <article
              key={fact.label}
              className="state-fact"
              data-reveal
              style={{ "--reveal-delay": `${index * 80}ms` } as React.CSSProperties}
            >
              <div className="state-fact__topline">
                <span className="state-fact__scope numeric">
                  0{index + 1} / {fact.scope}
                </span>
                <span className="state-fact__signal" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </div>

              <div className="state-fact__reading">
                <div className="state-fact__number display-lg text-oxygen-deep">
                  <Counter to={fact.value} suffix={fact.suffix} />
                </div>
                <span className="state-fact__unit numeric">{fact.unit}</span>
              </div>

              <h3 className="state-fact__label font-display text-[0.9375rem] font-semibold tracking-tight">
                {fact.label}
              </h3>
              <p className="state-fact__detail text-sm leading-relaxed text-graphite">
                {fact.detail}
              </p>

              <div className="state-fact__baseline" aria-hidden="true">
                <span />
              </div>
            </article>
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

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 opacity-30"
            aria-hidden="true"
          >
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
