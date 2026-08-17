"use client";

/**
 * The catalog card.
 *
 * The grid used to be eight identical boxes of prose, which told a visitor
 * nothing about which component to open first and looked like every other
 * component library.
 *
 * Two changes fix that:
 *
 *   1. Hierarchy. The components that carry the product's argument get a
 *      featured cell — wider, taller art, and a "Start here" marker.
 *   2. Every card renders the real component, and shows the states it claims
 *      rather than describing them. Once the rebuilt StatusBadge exists the
 *      strip should be built from it, so a card cannot claim a state the
 *      component does not actually render.
 *
 * Hierarchy is carried by size, never by presence. An earlier version gave a
 * live render only to the two featured cells, and because a featured cell spans
 * two columns and is twice as tall, the standard cards stretched to match and
 * showed a void where the component should be. Add every new component to
 * PREVIEW below — a catalog whose pitch is "real components, real states" must
 * not have a cell that shows neither.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PulseLoader } from "@/registry/oxygen/pulse-loader/pulse-loader";
import { InfusionLoader } from "@/registry/oxygen/infusion-loader/infusion-loader";
import { RhythmLoader } from "@/registry/oxygen/rhythm-loader/rhythm-loader";
import { BreathLoader } from "@/registry/oxygen/breath-loader/breath-loader";
import { HelixLoader } from "@/registry/oxygen/helix-loader/helix-loader";
import { Switch } from "@/registry/oxygen/switch/switch";
import { Accordion } from "@/registry/oxygen/accordion/accordion";
import {
  ChartAccordion,
  type ChartSection,
} from "@/registry/oxygen/chart-accordion/chart-accordion";
import type { AccordionItem } from "@/registry/oxygen/lib/accordion-core";
import { SafetyPlan } from "@/registry/oxygen/safety-plan/safety-plan";
import { Tabs } from "@oxygenui-design/tabs";
import { Consult } from "@/registry/oxygen/consult/consult";
import { createStaticProvider, lookUp, minimalDisclosure } from "@oxygenui-design/consult-core";
import { SignatureMark } from "@/components/site/signature-mark";
import { IdentityProvider, PatientChip, IdentitySet } from "@oxygenui-design/identity";
import { STATUS_LABEL, type ComponentDoc } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * Keyed by the stability tiers in ADR 0006. These used to be "shipping",
 * "review", and "design" — labels from an earlier vocabulary that no longer
 * match anything a component can declare, so every badge silently rendered
 * unstyled.
 */
const STATUS_STYLE: Record<string, string> = {
  stable: "border-oxygen/30 bg-oxygen/8 text-oxygen-deep",
  beta: "border-rule-strong bg-paper-sunk text-graphite",
  experimental: "border-rule bg-transparent text-graphite-soft",
  deprecated: "border-rule bg-transparent text-graphite-soft line-through",
};

/**
 * A live render for every card. Real components, unedited.
 *
 * This used to hold only the two featured entries, and the result was a grid
 * where two cards showed the product and three showed a void: a featured cell
 * spans two columns and is roughly twice as tall, the standard cards in the
 * same row stretch to match it, and a short summary plus four chips does not
 * fill that height. It read as three broken previews rather than a deliberate
 * hierarchy.
 *
 * Every loader can render itself in a hundred pixels, so every card now does.
 * Hierarchy is still carried — by the span, the "Start here" marker, and the
 * larger art — but no cell is empty, and a library whose whole argument is
 * "real components, real states" no longer shows two of them.
 *
 * `size` is passed per cell rather than left to the default: the featured cells
 * are twice as wide, and art scaled to a two-column cell overflows a one-column
 * one.
 */
/**
 * Step through a list on a timer, pausing when the tab is hidden.
 *
 * The loaders animate themselves, so a grid of them reads as alive while every
 * composite component sat frozen next to them — the same cell, doing nothing.
 * These components have no idle animation of their own and cannot be clicked
 * here (the card is a link, and the art is `inert`), so the only way to show
 * what they do is to drive them.
 *
 * `visibilitychange` matters at this count: a dozen cards each holding an
 * interval keeps a backgrounded tab awake for no one's benefit.
 */
function useCycle<T>(values: readonly T[], everyMs: number): T {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (values.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      timer ??= setInterval(() => setIndex((i) => (i + 1) % values.length), everyMs);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };

    const onVisibility = () => (document.hidden ? stop() : start());
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [values.length, everyMs]);

  return values[index % values.length]!;
}

/**
 * Scale a component down to fit the cell without reflowing it.
 *
 * SafetyPlan is the case this exists for: its six steps are fixed by the
 * instrument, so it cannot be shortened, and clipping it cut labels through the
 * middle of a word — which reads as a broken component rather than a thumbnail.
 * A transform keeps every proportion the component actually has and simply
 * shows less of it, which is what a thumbnail is.
 */
function ScaledArt({ scale, children }: { scale: number; children: React.ReactNode }) {
  return (
    <div className="w-full overflow-hidden">
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${100 / scale}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

const PREVIEW: Record<string, (featured: boolean) => React.ReactNode> = {
  "pulse-loader": (featured) => (
    <PulseLoader size={featured ? 124 : 96} label="Loading your records" />
  ),
  "infusion-loader": (featured) => (
    <InfusionLoader size={featured ? 190 : 148} progress={62} label="Importing records" />
  ),
  "rhythm-loader": (featured) => (
    <RhythmLoader size={featured ? 132 : 104} label="Loading results" />
  ),
  "breath-loader": (featured) => (
    <BreathLoader size={featured ? 124 : 96} label="Loading your information" />
  ),
  "helix-loader": (featured) => (
    <HelixLoader size={featured ? 124 : 96} label="Running the panel" />
  ),
  // Not the component itself: Signature wraps Ant Design, which the docs site
  // does not carry. This draws the same geometry from the same engine — see
  // signature-mark.tsx.
  signature: (featured) => <SignatureMark size={featured ? 120 : 96} />,

  /*
   * The composite components, at card scale.
   *
   * These are the real components with a card-sized slice of real data — two
   * sections rather than seven, one switch rather than a group. A card is a
   * thumbnail, and the honest thumbnail of a disclosure surface is a disclosure
   * surface with fewer rows in it, not a picture of one.
   *
   * No theme scope on any of them. The card sits on the site's own surface and
   * follows the site's own toggle, and the component tokens already resolve
   * light or dark from the `.dark` class on the document — so a scope here
   * could only be a second, disagreeing opinion. (The detail-page previews do
   * carry one, because the instrument panel they sit in is dark under both site
   * themes and is the exception rather than the rule.)
   */
  switch: () => <SwitchArt />,
  tabs: (featured) => <TabsArt featured={featured} />,
  accordion: (featured) => <AccordionArt featured={featured} />,
  "chart-accordion": (featured) => <ChartAccordionArt featured={featured} />,
  "safety-plan": (featured) => <SafetyPlanArt featured={featured} />,

  /*
   * Two rows rather than seven, and the two that carry the argument: the same
   * surname, escalated to the point where a reader can tell them apart. A
   * single banner would be a prettier thumbnail and would show the half of this
   * component every other library also has.
   */
  identity: (featured) => <IdentityArt featured={featured} />,

  /*
   * The dock at rest, inline rather than floating: `anchor="bottom-center"` is
   * fixed to the viewport, which inside a card would park the copilot over the
   * page instead of in the cell. The provider is scripted and never asked for
   * anything here — a card is not a place to start a model session.
   */
  consult: (featured) => (
    <div className="w-full" style={{ maxWidth: featured ? 340 : 280 }}>
      <Consult provider={CARD_CONSULT_PROVIDER} modes={[lookUp]} anchor="inline" locale="en-GB" />
    </div>
  ),
};

/**
 * A fixed clock.
 *
 * Age is derived, and a card that read the wall clock would change on a
 * birthday and drift a visual-regression baseline with it.
 */
const IDENTITY_NOW = new Date("2026-08-16T09:00:00Z");

const IDENTITY_MRN = "urn:oid:2.16.840.1.113883.4.1";

const IDENTITY_ROWS = [
  {
    resourceType: "Patient" as const,
    id: "card-1",
    name: [{ use: "official" as const, given: ["Amara", "Chinelo"], family: "Okonkwo" }],
    birthDate: "1985-03-08",
    identifier: [{ system: IDENTITY_MRN, value: "123456789" }],
  },
  {
    resourceType: "Patient" as const,
    id: "card-2",
    name: [{ use: "official" as const, given: ["Amara", "Nkechi"], family: "Okonkwo" }],
    birthDate: "1991-09-22",
    identifier: [{ system: IDENTITY_MRN, value: "998220106" }],
  },
];

function IdentityArt({ featured }: { featured: boolean }) {
  return (
    <ScaledArt scale={featured ? 0.95 : 0.86}>
      <IdentityProvider now={IDENTITY_NOW} disclosure="clinical" photos="deny">
        <IdentitySet>
          <div className="flex w-full max-w-[280px] flex-col gap-2">
            {IDENTITY_ROWS.map((patient) => (
              <PatientChip key={patient.id} patient={patient} />
            ))}
          </div>
        </IdentitySet>
      </IdentityProvider>
    </ScaledArt>
  );
}

const CARD_CONSULT_PROVIDER = createStaticProvider({
  events: [{ type: "done", finish: "stop" }],
  disclosure: minimalDisclosure("demo-model@1", {
    developer: "Zowork",
    knowledgeCutoff: "2025-10",
  }),
});

/* ------------------------------------------------------------------ */
/* The driven previews                                                  */
/* ------------------------------------------------------------------ */

/** Three of the values a switch can hold, including the one nobody models. */
const SWITCH_VALUES = [true, "unknown", false] as const;

function SwitchArt() {
  const checked = useCycle(SWITCH_VALUES, 2200);
  return (
    <div className="w-full max-w-[236px]">
      <Switch
        label="Contact precautions"
        stateLabels="in-effect"
        tone="caution"
        checked={checked}
        absentReason={checked === "unknown" ? "not-collected" : undefined}
        readOnly
      />
    </div>
  );
}

const TABS_VALUES = ["personal", "shared"] as const;

function TabsArt({ featured }: { featured: boolean }) {
  // The thumb interpolates position and width between these two, which is the
  // one thing about this component a still image cannot show.
  const value = useCycle(TABS_VALUES, 2000);
  return (
    <div className="w-full" style={{ maxWidth: featured ? 340 : 268 }}>
      <Tabs
        as="radiogroup"
        aria-label="Documents"
        variant="segmented"
        fill="equal"
        value={value}
        onChange={() => {}}
        items={[
          { value: "personal", label: "Personal" },
          { value: "shared", label: "Shared" },
        ]}
      />
    </div>
  );
}

const ACCORDION_ITEMS: AccordionItem[] = [
  {
    key: "risk",
    label: "Risk & suicidality",
    severity: "critical",
    summary: "C-SSRS positive · 13 Aug",
    children: <p>Ideation 3 — no plan, no intent.</p>,
  },
  {
    key: "meds",
    label: "Medications",
    severity: "high",
    summary: "Clozapine ANC due 18 Aug",
    children: <p>Clozapine 300 mg nightly.</p>,
  },
  {
    key: "plan",
    label: "Safety plan",
    severity: "normal",
    summary: "Current · revised 11 Aug",
    children: <p>Six steps complete.</p>,
  },
];

const ACCORDION_KEYS = ["risk", "meds", "plan"] as const;

function AccordionArt({ featured }: { featured: boolean }) {
  const open = useCycle(ACCORDION_KEYS, 2600);
  return (
    <ScaledArt scale={featured ? 0.92 : 0.8}>
      <Accordion
        headingLevel={4}
        density="clinical"
        accordion
        activeKey={open}
        onChange={() => {}}
        items={ACCORDION_ITEMS}
      />
    </ScaledArt>
  );
}

const RECORD_SECTIONS: ChartSection[] = [
  {
    key: "risk",
    label: "Risk & suicidality",
    severity: "critical",
    status: "C-SSRS positive",
    children: <p>Ideation 3.</p>,
  },
  {
    key: "assessments",
    label: "Assessments",
    severity: "high",
    status: "PHQ-9 21 · severe",
    children: <p>PHQ-9 21 of 27.</p>,
  },
  {
    key: "audit",
    label: "AUDIT",
    severity: "unknown",
    status: "Not asked this visit",
    children: <p>Last score 14.</p>,
  },
];

const SECTION_KEYS = ["risk", "assessments", "audit"] as const;

function ChartAccordionArt({ featured }: { featured: boolean }) {
  const open = useCycle(SECTION_KEYS, 2600);
  return (
    <ScaledArt scale={featured ? 0.92 : 0.8}>
      <ChartAccordion
        toolbar={false}
        headingLevel={4}
        density="clinical"
        defaultOpenKeys={[open]}
        key={open}
        sections={RECORD_SECTIONS}
      />
    </ScaledArt>
  );
}

/*
 * The whole plan, scaled rather than cropped.
 *
 * SafetyPlan renders all six steps by design — the order is the instrument and
 * the component will not let a caller drop one — so a card-height crop sliced
 * labels through the middle of a word. Scaled down, the shape a reader
 * recognises survives: six numbered steps with the crisis step held open.
 */
function SafetyPlanArt({ featured }: { featured: boolean }) {
  return (
    <ScaledArt scale={featured ? 0.62 : 0.5}>
      <SafetyPlan
        headingLevel={4}
        density="clinical"
        steps={{
          warningSigns: { entries: ["Sleeping less than four hours"] },
          internalCoping: { entries: ["Four in, six out, ten times"] },
          supportContacts: { contacts: [{ name: "Priya", detail: "Sister" }] },
          professionals: {
            contacts: [
              { name: "988", detail: "Suicide & Crisis Lifeline", availability: "24 hours" },
            ],
          },
        }}
      />
    </ScaledArt>
  );
}

export function ComponentCard({
  component,
  index,
  featured = false,
}: {
  component: ComponentDoc;
  index: number;
  featured?: boolean;
}) {
  const preview = PREVIEW[component.name];

  return (
    <Link
      href={`/components/${component.name}`}
      data-reveal
      style={{ "--reveal-delay": `${(index % 3) * 70}ms` } as React.CSSProperties}
      className={cn(
        "surface-2 lift group relative flex flex-col overflow-hidden rounded-2xl hover:border-oxygen/45",
        // Span only at 3 columns. At 2 columns a span-2 cell after an odd number
        // of standard cards leaves an empty grid slot.
        featured ? "p-6 lg:col-span-2" : "p-5",
      )}
    >
      {featured && (
        <span className="axis-label mb-3 inline-flex items-center gap-2 text-oxygen-deep">
          <span className="size-1.5 rounded-full bg-oxygen" aria-hidden="true" />
          Start here
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <h3
          className={cn(
            "font-display font-semibold tracking-tight",
            featured ? "text-xl" : "text-base",
          )}
        >
          {component.title}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider",
            STATUS_STYLE[component.status],
          )}
        >
          {STATUS_LABEL[component.status]}
        </span>
      </div>

      {/* Primitives take no FHIR resource; an empty line here would just be a
          gap the reader has to account for. */}
      {component.resource ? (
        <p className="numeric mt-2 text-xs text-oxygen-deep">{component.resource}</p>
      ) : null}

      <p
        className={cn(
          "mt-3 leading-relaxed text-graphite",
          featured ? "body max-w-lg" : "flex-1 text-sm",
        )}
      >
        {component.summary}
      </p>

      {preview ? (
        <div
          data-ox-density="standard"
          className="component-preview-frame relative mt-5 flex flex-1 items-center justify-center overflow-hidden rounded-xl p-3"
        >
          {/* Decorative inside the card. aria-hidden alone is a violation here:
              the panel contains a focusable scroll region, and hiding a
              focusable element from AT strands keyboard users on it. `inert`
              removes it from both the a11y tree and the tab order. */}
          <div
            inert
            aria-hidden="true"
            className={cn(
              // Raised from 120/92. The art was sized to the old floor and read
              // as a stamp in the middle of a large empty frame — a rhythm strip
              // at 68px in a 330px-wide cell is a hairline, not a component.
              "pointer-events-none flex w-full items-center justify-center",
              featured ? "min-h-[184px]" : "min-h-[148px]",
            )}
          >
            {preview(featured)}
          </div>
        </div>
      ) : (
        // No preview yet — the states are still worth showing, and they keep
        // the cell from collapsing next to a featured card twice its height.
        <div className="mt-5 flex flex-1 flex-wrap content-center gap-1.5" aria-hidden="true">
          {component.states.slice(0, 4).map((state) => (
            <span
              key={state}
              className="rounded-full border border-rule px-1.5 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider text-graphite"
            >
              {state.split(" ")[0]}
            </span>
          ))}
        </div>
      )}

      {/* Below the preview rather than instead of it: the states are what the
          card is claiming, and a reader comparing five loaders wants both. */}
      {preview ? (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-hidden="true">
          {component.states.slice(0, featured ? 5 : 3).map((state) => (
            <span
              key={state}
              className="rounded-full border border-rule px-1.5 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider text-graphite"
            >
              {state.split(" ")[0]}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between border-t border-rule pt-3">
        <span className="numeric text-[0.6875rem] text-graphite-soft">
          {component.states.length} states
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-oxygen-deep">
          View
          <ArrowRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  );
}
