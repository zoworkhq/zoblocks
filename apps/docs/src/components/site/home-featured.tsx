"use client";

/**
 * The six components the home page argues from.
 *
 * This replaces a twenty-seven cell grid. That grid had a fair claim to being
 * complete and no claim at all to being persuasive: each cell gave a component
 * about 150px of art, which is not enough for a date picker, a copilot or a
 * signature to be anything but a thumbnail — and several were rendering
 * clipped, which is worse than rendering small. A reader who has never met
 * this library needs to believe one component before being offered
 * twenty-seven.
 *
 * So: six, each at a size where the component is legible and operable, with
 * one sentence of claim rather than a paragraph of rationale. The full
 * catalogue is one link away and still lists everything.
 *
 * The six are not arbitrary. They are the components that already carry a
 * full gallery in this repo — the ones with enough states, variants and
 * clinical argument to survive being looked at closely.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LoaderShowcase } from "@/components/site/loader-showcase";
import { CopilotHomeDemo } from "@/components/site/component-preview";
import { SignatureDrawing } from "@/components/site/signature-showcase";
import { LiveSwitch } from "@/components/site/switch-gallery";
import { Tabs } from "@oxygenui-design/tabs";
import {
  BEHAVIORAL_HEALTH_DURATIONS,
  DateField,
  SessionTimeField,
} from "@/registry/oxygen/date-picker/date-picker";
import { plainDate, plainTime, sessionFrom } from "@/lib/oxygen-datetime";

/** Frozen so the demo says the same thing tomorrow. */
const TODAY = plainDate(2026, 8, 26);

interface Featured {
  /** Catalog slug — the href and the install argument both derive from it. */
  slug: string;
  /** Display name. */
  name: string;
  /** The FHIR resource it is typed to, where there is one. */
  resource?: string;
  /**
   * The claim, in one sentence.
   *
   * Deliberately short. The old cards ran to three lines of body copy each and
   * twenty-seven of them read as a wall; the component itself is the argument,
   * and this is the caption under it.
   */
  claim: string;
  /** Three facts, shown as a measured row. Numbers where possible. */
  facts: readonly string[];
  /** The demo. Authored to fill its stage rather than sit in the middle of it. */
  demo: () => React.ReactNode;
  /**
   * Render without the stage frame.
   *
   * Some demos arrive already framed — `LoaderShowcase` ships its own bezel
   * and inner panel — and putting that inside the stage produced three
   * nested borders with the innermost one almost touching the outermost.
   * A frame around a frame is not emphasis, it is noise.
   */
  bare?: boolean;
}

/* ------------------------------------------------------------------ */
/* The demos                                                           */
/* ------------------------------------------------------------------ */

/**
 * Tabs, as the thing tabs are actually for.
 *
 * `as="tabs"` rather than a radiogroup: this one has panels, so it is a
 * tablist and announces itself as one.
 */
function TabsDemo() {
  return (
    <Tabs
      as="tabs"
      aria-label="Encounter"
      variant="underline"
      defaultValue="summary"
      items={[
        {
          value: "summary",
          label: "Summary",
          children: (
            <div className="space-y-1.5 text-sm leading-relaxed text-graphite">
              <p>Follow-up, 12 Aug 2026. Reviewed by A. Vance, MD.</p>
              <p>Chief complaint: six weeks of progressive fatigue and dyspnea.</p>
              <p className="text-graphite-soft">Signed 12 Aug, 16:20 +05:30.</p>
            </div>
          ),
        },
        {
          value: "results",
          label: "Results",
          count: 24,
          children: (
            <div className="space-y-1.5 text-sm leading-relaxed text-graphite">
              <p>24 observations. 3 outside the reference range.</p>
              <p>Hgb 7.1 g/dL — low. Potassium 6.8 mmol/L — critical high.</p>
              <p className="text-graphite-soft">Northside Pathology, reporting laboratory.</p>
            </div>
          ),
        },
        {
          value: "meds",
          label: "Medications",
          count: 3,
          children: (
            <div className="space-y-1.5 text-sm leading-relaxed text-graphite">
              <p>Clozapine 300 mg nightly. ANC due 18 Aug.</p>
              <p>Sertraline 100 mg daily. Started 4 Jun.</p>
              <p className="text-graphite-soft">Two entries reconciled at intake.</p>
            </div>
          ),
        },
        {
          value: "audit",
          label: "Audit log",
          children: (
            <div className="space-y-1.5 text-sm leading-relaxed text-graphite">
              <p>41 events. Every read of this record is one of them.</p>
              <p>Last: A. Vance, MD — viewed results, 12 Aug 16:22.</p>
              <p className="text-graphite-soft">Retained for the statutory period.</p>
            </div>
          ),
        },
      ]}
    />
  );
}

/**
 * Two date fields, because one does not show the argument.
 *
 * The left is eight keystrokes and no calendar; the right is a session, where
 * start, end and duration are three values with two degrees of freedom and the
 * component says which one it derived.
 */
function DateDemo() {
  /*
    Flex with `items-start`, not a two-column grid.

    The grid stretched both cells to the height of the taller one, and
    DateField distributes its own label and input across whatever height it is
    given — so "Date of service" floated about 150px above its own field, with
    an empty column beside a dense one. Each field takes its natural width
    here, both start at the top, and they wrap rather than squeeze.
  */
  return (
    <div className="flex w-full flex-wrap items-start gap-x-12 gap-y-8">
      <DateField label="Date of service" now={TODAY} defaultValue={plainDate(2026, 8, 21)} />
      <SessionTimeField
        label="Individual therapy"
        defaultValue={sessionFrom(plainTime(14, 0), 50)}
        durationPresets={BEHAVIORAL_HEALTH_DURATIONS}
      />
    </div>
  );
}

/**
 * A switch with a third value.
 *
 * `stateLabels="in-effect"` because "on" is not what a precaution is. The
 * commit is asynchronous and can be watched — that is the whole component.
 */
function SwitchDemo() {
  return (
    <div className="grid w-full max-w-md gap-5">
      <LiveSwitch
        label="Contact precautions"
        description="Gown and gloves on entry."
        stateLabels="in-effect"
        size="large"
        checked={true}
      />
      <LiveSwitch
        label="Falls risk"
        description="Adds the bed sensor to the round list."
        stateLabels="in-effect"
        size="large"
        checked={"unknown"}
      />
    </div>
  );
}

/**
 * The signature, drawing itself.
 *
 * `SignatureDrawing` strokes with `currentColor` and sizes to `w-full`, so it
 * needs both a colour and a width from whatever holds it — the signature page
 * gives it `text-panel-fg sm:w-52`. This gave it neither: it inherited a
 * colour that matched the ground and stretched across the full stage, which
 * rendered as an empty box with a single green nib travelling through it.
 *
 * The caption is here because a signature with no context is a squiggle. What
 * makes this component worth anything is the line underneath it.
 */
function SignatureHomeDemo() {
  return (
    <div className="flex flex-col gap-5 text-panel-fg sm:flex-row sm:items-center sm:gap-8">
      <div className="w-56 shrink-0">
        <SignatureDrawing />
      </div>
      <div className="min-w-0 space-y-1.5 text-sm leading-relaxed">
        <p className="text-panel-fg">A. Vance, MD — attending</p>
        <p className="text-panel-muted">
          Signed 12 Aug 2026, 16:20 +05:30, on a note whose text hash is stored beside it.
        </p>
        <p className="numeric text-xs text-panel-muted">Provenance/9f2c · agent · Practitioner/7</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const FEATURED: readonly Featured[] = [
  {
    slug: "copilot",
    name: "Copilot",
    resource: "AuditEvent",
    claim:
      "It answers with its sources attached, names what it was not allowed to read, and refuses rather than guesses.",
    facts: ["12 states", "Cites or declines", "Every read audited"],
    demo: () => <CopilotHomeDemo />,
  },
  {
    slug: "date-picker",
    name: "Date & time",
    resource: "Period",
    claim:
      "Fourteen variants on one contract — and a bare 9 in a time field is asked about rather than resolved into a twelve-hour error.",
    facts: ["14 variants", "8 keystrokes, no calendar", "RFC 5545 recurrence"],
    demo: () => <DateDemo />,
  },
  {
    slug: "signature",
    name: "Signature",
    resource: "Provenance",
    claim:
      "It records what was on screen at the moment of signing, so a countersignature can be defended a year later.",
    facts: ["19 props", "Draw, type or certify", "Bound to what was shown"],
    demo: () => <SignatureHomeDemo />,
  },
  {
    slug: "switch",
    name: "Switch",
    resource: "Flag",
    claim:
      "Three values, not two: on, off, and nobody has said. The commit is visible, reversible, and survives a conflict.",
    facts: ["25 props", "Third value: unknown", "Optimistic with rollback"],
    demo: () => <SwitchDemo />,
  },
  {
    slug: "tabs",
    name: "Tabs",
    resource: "—",
    claim:
      "Eleven skins over one accessibility tree, so choosing a look is never a choice about whether a keyboard works.",
    facts: ["22 props", "11 variants", "APG roving tabindex"],
    demo: () => <TabsDemo />,
  },
  {
    slug: "pulse-loader",
    name: "Loaders",
    resource: "—",
    claim:
      "Five waits with different meanings, each with a designed reduced-motion state rather than a spinner that simply stops.",
    facts: ["5 loaders", "Reduced motion designed", "Announced, not silent"],
    demo: () => <LoaderShowcase />,
    bare: true,
  },
];

/* ------------------------------------------------------------------ */

/**
 * One component, given room.
 *
 * The demo leads on every row rather than alternating sides. Alternation
 * reads as a marketing page; a reader comparing six components wants them in
 * the same place each time, which is also why the fact row is in a fixed
 * position rather than flowing under copy of variable length.
 */
function FeaturedRow({ item, index }: { item: Featured; index: number }) {
  return (
    <article
      data-reveal
      data-ox-featured={item.slug}
      className="grid items-center gap-8 border-t border-rule py-12 lg:grid-cols-[1fr_19rem] lg:gap-16 lg:py-20"
    >
      {/*
        The stage.

        `min-h` rather than a fixed height: a loader strip and a copilot are
        genuinely different sizes, and forcing them into one box is how the
        old cards ended up clipping. The floor stops a small component from
        reading as an accident.
      */}
      {/*
        `instrument-demo`, never bare `instrument`.

        Bare `instrument` paints the dark panel ground, and globals.css is
        explicit that it is reserved for deliberate contrast moments — the
        closing CTA is the only other user. A live component inside it renders
        its own light-theme tokens on a near-black field: "Date of service",
        "Start", "End" and "Contact precautions" all came out dark on dark, and
        the signature pad rendered as an empty box. The modifier remaps the
        panel tokens to the page theme, which is the whole reason it exists.

        It also carries its own background, border and radius, so the
        `bg-paper border border-rule rounded-2xl` that used to be here was both
        redundant and part of the fight.

        No minimum height.

        It had `min-h-[16rem]`, and measuring the rendered page showed every
        stage carrying between 130 and 175 pixels of nothing: a tabstrip is 83
        pixels tall and was being centred inside 256. That is the same void
        that made the state browser look unfinished, reintroduced one file
        later. A signature pad and a tabstrip are honestly different heights,
        and the stage should say so — the text column beside it is centred, so
        rows of unequal height still read as a set.
      */}
      <div
        className={
          item.bare
            ? "flex flex-col justify-center"
            : "instrument instrument-demo flex flex-col justify-center p-8 sm:p-10"
        }
        data-ox-stage={item.slug}
      >
        {item.demo()}
      </div>

      <div className="flex flex-col">
        <p className="eyebrow text-graphite">
          <span className="numeric text-oxygen-deep">{String(index + 1).padStart(2, "0")}</span>
          <span className="mx-2 text-rule-strong">/</span>
          {item.name}
        </p>

        {item.resource && item.resource !== "—" ? (
          <p className="numeric mt-2 text-xs text-oxygen-deep">{item.resource}</p>
        ) : null}

        <p className="mt-4 text-pretty text-base leading-relaxed text-ink">{item.claim}</p>

        <ul className="mt-6 space-y-1.5">
          {item.facts.map((fact) => (
            <li key={fact} className="numeric text-xs text-graphite-soft">
              {fact}
            </li>
          ))}
        </ul>

        <Link
          href={`/components/${item.slug}`}
          className="group mt-7 inline-flex items-center gap-2 self-start text-sm font-medium text-ink transition-colors duration-200 hover:text-oxygen-deep"
        >
          View {item.name}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </article>
  );
}

export function HomeFeatured({ total }: { total: number }) {
  const rest = Math.max(0, total - FEATURED.length);

  return (
    <section id="components" className="scroll-mt-16 border-t border-rule bg-paper-sunk/50">
      <div className="section-major mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="eyebrow eyebrow-rule text-graphite" data-reveal>
            The library
          </p>
          <h2 className="display-lg mt-4 text-balance" data-reveal>
            Six components, at the size you would actually use them.
          </h2>
          <p className="lede mt-5 max-w-2xl text-pretty" data-reveal>
            Every one below is the real component, running. Operate it — type into the date field,
            throw the switch, ask the copilot a question. Nothing here is a screenshot.
          </p>
        </div>

        <div className="mt-10">
          {FEATURED.map((item, index) => (
            <FeaturedRow key={item.slug} item={item} index={index} />
          ))}
        </div>

        <div className="border-t border-rule pt-10" data-reveal>
          <Link
            href="/components"
            className="group inline-flex items-center gap-2 rounded-xl border border-rule bg-paper px-5 py-3 text-sm font-medium text-ink transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-oxygen/40"
          >
            {rest > 0 ? `${rest} more components in the catalogue` : "Browse the full catalogue"}
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
