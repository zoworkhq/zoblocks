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
import { Timeline } from "@/registry/oxygen/timeline/timeline";
import { CareTimeline } from "@/registry/oxygen/care-timeline/care-timeline";
import {
  EVENTS as TIMELINE_EVENTS,
  NOW as TIMELINE_NOW,
} from "@/registry/oxygen/care-timeline/care-timeline.fixtures";
import { Tabs } from "@oxygenui-design/tabs";
import { Copilot } from "@/registry/oxygen/copilot/copilot";
import { createStaticProvider, lookUp, minimalDisclosure } from "@oxygenui-design/copilot-core";
import { SignatureMark } from "@/components/site/signature-mark";
import { ClinicalStatus } from "@/registry/oxygen/clinical-status/clinical-status";
import { ResultValue } from "@/registry/oxygen/result-value/result-value";
import { AllergyChip } from "@/registry/oxygen/allergy-chip/allergy-chip";
import { RiskIndicator } from "@/registry/oxygen/risk-indicator/risk-indicator";
import { ProvenanceChip } from "@/registry/oxygen/provenance-chip/provenance-chip";
import { TrendIndicator } from "@/registry/oxygen/trend-indicator/trend-indicator";
import { PresenceChip } from "@/registry/oxygen/care-team-presence/care-team-presence";
import { ChartHeader } from "@/registry/oxygen/chart-header/chart-header";
import { DataGrid, type DataGridColumn } from "@/registry/oxygen/data-grid/data-grid";
import { PatientPortrait } from "@/components/site/patient-portrait";
import { facesFor } from "@/lib/faces";

/* One face each on the catalogue card — see `facesFor`. */
const CARD_FACE = facesFor(["A. Okonkwo", "T. Boateng", "L. Marsh"]);
import { CASELOAD, type CaseloadRow } from "@/registry/oxygen/data-grid/data-grid.fixtures";
import { RecentPatientStack } from "@/registry/oxygen/recent-patient-stack/recent-patient-stack";
import { ChartCommandPalette } from "@/registry/oxygen/chart-command-palette/chart-command-palette";
import { ContextMenuArt } from "@/components/site/context-menu-demo";
import { IdentityProvider, PatientChip, IdentitySet } from "@oxygenui-design/identity";
import { STATUS_CONTRACT, STATUS_LABEL, type ComponentDoc } from "@/lib/catalog";
import { AcquireAction, PriceTag } from "@/components/site/acquire";
import { cn } from "@/lib/utils";
import {
  DISTRIBUTION_CONTRACT,
  DISTRIBUTION_LABEL,
  distributionState,
  isReady,
} from "@/lib/readiness";

import { Recorder } from "@/registry/oxygen/recorder/recorder";
import { DateField } from "@/registry/oxygen/date-picker/date-picker";
import { plainDate } from "@/lib/oxygen-datetime";
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
 *
 * The wrapper has to be measured, because `transform` paints small and reserves
 * large: it does not participate in layout, so a component scaled to 0.74 still
 * booked every pixel of its natural height. Care Timeline claimed 605px of card
 * for the 448px it painted, SafetyPlan 285 for 143, and under `auto-rows-fr`
 * that surplus was copied into every other row in the grid. So the outer box is
 * pinned to the scaled size and the surplus stops existing.
 *
 * `fit` is the guard rather than the mechanism. A preview should be authored to
 * sit inside the art band and most are; `fit` only keeps a component that
 * outgrows it — because its content changed, or because a new one was added —
 * from setting the height of the row it lands in. It shrinks the paint, never
 * the layout the child sees: the inner width is pinned in pixels, so clamping
 * the scale cannot reflow the child and re-trigger the clamp.
 */
function ScaledArt({
  scale,
  fit,
  children,
}: {
  scale: number;
  fit?: number;
  children: React.ReactNode;
}) {
  const inner = React.useRef<HTMLDivElement>(null);
  const [natural, setNatural] = React.useState<{ w: number; h: number } | null>(null);

  React.useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const read = () => setNatural({ w: el.offsetWidth, h: el.offsetHeight });
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const applied = natural && fit && natural.h > 0 ? Math.min(scale, fit / natural.h) : scale;

  return (
    // No `overflow-hidden`. It was here to clip an inner box deliberately made
    // wider than its parent; the inner box is now pinned to the measured width,
    // so the only thing left to clip was the few pixels a shadow or a rule
    // paints past its own border box — which showed up as a severed row at the
    // bottom of the Accordion and SafetyPlan cards.
    <div
      style={
        natural ? { width: natural.w * applied, height: natural.h * applied } : { width: "100%" }
      }
    >
      <div
        ref={inner}
        style={{
          transform: `scale(${applied})`,
          transformOrigin: "top left",
          // Percentage until measured, pixels after. A percentage of a box that
          // is itself derived from this element's width is a feedback loop the
          // moment `applied` differs from `scale`.
          width: natural ? natural.w : `${100 / scale}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * The art band, in pixels.
 *
 * Raised from 120/92 once already: art sized to the old floor read as a stamp
 * in the middle of a large empty frame — a rhythm strip at 68px in a 330px-wide
 * cell is a hairline, not a component. Every preview is authored to sit inside
 * these, and `ScaledArt`'s `fit` holds any that stops doing so.
 *
 * The standard band carries a few pixels over what any preview measures.
 * `fit` sizes to the border box, and a component whose rule or shadow paints
 * past its own border box — SafetyPlan's last step does, by 6px — would
 * otherwise sit those pixels outside the band.
 */
const STANDARD_ART = 156;
const FEATURED_ART = 184;

const DT_TODAY = plainDate(2026, 8, 26);

/**
 * A deterministic take for the Recorder card.
 *
 * Generated rather than sampled, and generated from a formula rather than a
 * random seed, so the card is byte-identical between runs and a visual
 * regression means something changed rather than that the noise moved.
 */
const REC_PEAKS = Float32Array.from({ length: 180 }, (_, i) => {
  const t = i / 12;
  const phrase = (t % 3.9) / 3.9 < 0.82 ? 1 : 0.06;
  const syllable = 0.5 + 0.5 * Math.sin(2 * Math.PI * 4.4 * t);
  return Math.min(1, phrase * (0.2 + 0.8 * syllable ** 1.3));
});
const REC_CARD_MARKERS = [
  { id: "exam", at: 0.31, label: "Exam" },
  { id: "struck", at: 0.79, label: "Struck 0:22", struck: true, span: 0.03 },
];
const REC_SPEAKERS = Uint8Array.from({ length: 180 }, (_, i) =>
  Math.floor(i / 26) % 2 === 0 ? 0 : 1,
);

/**
 * A three-column slice of the ledger.
 *
 * The card has 156px and the component's argument is a whole page, so the
 * slice keeps the one thing that identifies it from across a catalogue — the
 * coverage claim above the data, and the count of what is not shown — and
 * drops the rest. The footnotes went with them: two of them wrap to six lines,
 * which forced the scale down far enough that nothing on the card was legible,
 * and an illegible card identifies nothing. The provenance and the absence
 * vocabulary are the detail page's job; a card is an identifier, not a tour.
 */
const GRID_CARD_COLUMNS: DataGridColumn<CaseloadRow>[] = [
  {
    key: "name",
    header: "Patient",
    kind: "text",
    value: (row) => row.name,
    cell: (row) => (
      <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <PatientPortrait src={row.photo} size={18} />
        <span style={{ whiteSpace: "nowrap" }}>{row.name}</span>
      </span>
    ),
  },
  {
    key: "phq9",
    header: "PHQ-9",
    kind: "measure",
    align: "start",
    value: (row) => row.phq9,
  },
  {
    key: "risk",
    header: "Risk",
    kind: "number",
    value: (row) => row.risk,
    cell: (row) => row.risk.toFixed(2),
  },
];

/* Three rows with values in them. The absent ones are the better story and the
   wrong card: each earns a footnote, and two footnotes are taller than the art
   band the card has to fit inside. */
const GRID_CARD_ROWS = [CASELOAD[1]!, CASELOAD[3]!, CASELOAD[0]!];

const PREVIEW: Record<string, (featured: boolean) => React.ReactNode> = {
  /*
   * The one card that has to show a claim rather than a control. Everything
   * else in the catalogue is a thing you look at; this is a thing that tells
   * you what it is not showing you.
   */
  "data-grid": (featured) => (
    <ScaledArt scale={featured ? 1 : 0.94} fit={featured ? FEATURED_ART : STANDARD_ART}>
      <div style={{ inlineSize: featured ? 420 : 380 }}>
        <DataGrid
          caption="Clients on this caseload with a raised PHQ-9"
          title="Caseload · adult outpatient"
          density="compact"
          columns={GRID_CARD_COLUMNS}
          rows={featured ? GRID_CARD_ROWS : GRID_CARD_ROWS.slice(0, 2)}
          rowKey={(row) => row.mrn}
          coverage={{ shown: 6, total: 312, noun: "clients on this caseload" }}
        />
      </div>
    </ScaledArt>
  ),
  /* One card for the whole family. It shows the field with its calendar
     because that is the variant a reader reaches for first, and the card is
     an identifier rather than a tour — the sixteen variants are the page. */
  "date-picker": () => (
    <DateField
      label="Date of service"
      showCalendar
      now={DT_TODAY}
      defaultValue={DT_TODAY}
      showRelative
    />
  ),
  /*
   * The card shows Duet rather than a live meter.
   *
   * A capture art on a card would have to animate with no signal behind it,
   * which is the exact thing this component exists to argue against — and a
   * card cannot ask for a microphone. Duet is a rendered take: it is honest
   * standing still, and it is the art nobody else ships.
   */
  recorder: (featured) => (
    <Recorder
      variant="duet"
      phase="ready"
      peaks={REC_PEAKS}
      speakers={REC_SPEAKERS}
      position={featured ? 0.44 : 0.36}
      durationMs={754_000}
      speakerLabels={["Dr Okafor", "Patient"]}
      title="Consultation — 14 Aug, 09:12"
      markers={featured ? REC_CARD_MARKERS : undefined}
    />
  ),
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
   * Six chips from six different scales, at card scale.
   *
   * Not one scale's five steps: the card has to say "this is a vocabulary",
   * and a single scale reads as a severity badge — which is the component
   * every other library already ships.
   */
  /*
   * A critical value and an absence, together.
   *
   * One of each, because the card has to say what the component is for: the
   * number nobody gets wrong, and the blank cell everybody does.
   */
  /*
   * The two rows that are the whole argument.
   *
   * Same manifestation, opposite consequences. A card showing one allergy
   * would be a card for a component every library already ships.
   */
  /* The whole card, because the point is what surrounds the number. */
  /* Three of the six, beside the value they qualify — because the chip alone
     reads as a badge rather than a qualifier. */
  /* Two falling lines with opposite meanings, and one it refuses to draw. */
  "trend-indicator": (featured) => (
    <div style={{ display: "grid", gap: featured ? 10 : 7 }}>
      {(
        [
          {
            id: "card-phq9",
            label: "PHQ-9",
            valence: "higher-is-worse",
            points: [
              { at: "2026-03-04", value: 21 },
              { at: "2026-05-04", value: 14 },
              { at: "2026-07-04", value: 9 },
            ],
          },
          {
            id: "card-egfr",
            label: "eGFR",
            valence: "higher-is-better",
            points: [
              { at: "2026-03-04", value: 74 },
              { at: "2026-05-04", value: 64 },
              { at: "2026-07-04", value: 52 },
            ],
          },
        ] as const
      ).map((series) => (
        <div key={series.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ inlineSize: 46, fontSize: 12, opacity: 0.75 }}>{series.label}</span>
          <TrendIndicator series={series} width={featured ? 110 : 84} height={20} />
        </div>
      ))}
    </div>
  ),

  /*
   * The row nobody else has: the count of what may not be named.
   *
   * The palette is `position: fixed`, so the card gives it a contained box to
   * sit in — `contain: layout paint` makes the stage its containing block —
   * rather than letting it cover the page it is being read on.
   */
  "chart-context-menu": (featured) => <ContextMenuArt featured={featured} />,
  "chart-command-palette": (featured) => (
    <div
      style={{
        position: "relative",
        inlineSize: "100%",
        maxInlineSize: featured ? 340 : 268,
        blockSize: featured ? 168 : 148,
        overflow: "hidden",
        borderRadius: 10,
        contain: "layout paint",
      }}
    >
      <ChartCommandPalette
        open
        placeholder="oko"
        scope={{ inScope: new Set(["p-mine"]), breakGlass: true }}
        items={[
          { id: "p-mine", kind: "patient", label: "A. Okonkwo", detail: "093-441-208" },
          { id: "p-other-1", kind: "patient", label: "A. Okonjo" },
          { id: "p-other-2", kind: "patient", label: "A. Okoro" },
        ]}
      />
    </div>
  ),

  /*
   * Three charts, one active, one with a note owed.
   *
   * The card has to say what the component is for in one glance: a set that is
   * visible without being opened, and a badge that says which one is unfinished.
   */
  "recent-patient-stack": (featured) => (
    <div style={{ maxInlineSize: featured ? 340 : 268, inlineSize: "100%" }}>
      <RecentPatientStack
        activeId="card-a"
        now="2026-08-24T10:00:00Z"
        charts={[
          {
            id: "card-a",
            display: "A. Okonkwo",
            photo: CARD_FACE("A. Okonkwo"),
            reason: "Ward round",
          },
          {
            id: "card-b",
            display: "T. Boateng",
            photo: CARD_FACE("T. Boateng"),
            work: [{ kind: "unsigned-note", since: "2026-08-21T09:00:00Z" }],
          },
          { id: "card-c", display: "L. Marsh", photo: CARD_FACE("L. Marsh"), pinned: true },
        ]}
      />
    </div>
  ),

  /*
   * The collapsed strip, which is the whole argument in 44 pixels.
   *
   * A card showing the expanded header would be a card for a component every
   * library already ships. The strip is the part nothing else has.
   */
  "chart-header": (featured) => (
    <div style={{ maxInlineSize: featured ? 340 : 272, inlineSize: "100%" }}>
      <ChartHeader
        collapsed
        now="2026-08-24T10:00:00Z"
        identifiers={[{ kind: "mrn" }, { kind: "nhs" }]}
        patient={{
          resourceType: "Patient",
          id: "card-ch",
          name: [{ use: "official", family: "Okonkwo", given: ["Amara"] }],
          birthDate: "1985-03-08",
          identifier: [{ system: "http://example.org/fhir/sid/mrn", value: "MRN-4417" }],
        }}
        safety={{
          allergies: { label: "Penicillin", tone: "critical" },
          codeStatus: { label: "DNR" },
          legalStatus: { label: "Hold", until: "2026-08-24T09:00:00Z" },
        }}
      />
    </div>
  ),

  /*
   * Three people, all online, all a different answer.
   *
   * The card has to make the argument in one glance, so it is the three states
   * a green dot collapses: available, in session, and signed out to somebody
   * else. The rings differ in shape before they differ in hue.
   */
  "care-team-presence": (featured) => (
    <div style={{ display: "grid", gap: featured ? 10 : 7 }}>
      {(
        [
          {
            clinician: { id: "card-a", display: "A. Vance, MD", role: "Attending" },
            state: "available",
          },
          {
            clinician: { id: "card-b", display: "L. Marsh, LCSW", role: "Therapist" },
            state: "in-session",
            until: "15:50",
          },
          {
            clinician: { id: "card-c", display: "R. Adeyemi, MD", role: "Hospitalist" },
            state: "signed-out",
            coveredBy: {
              id: "card-d",
              display: "T. Boateng, MD",
              role: "Night attending",
            },
          },
        ] as const
      ).map((presence) => (
        <PresenceChip
          key={presence.clinician.id}
          presence={presence}
          now="2026-08-24T02:30:00+05:30"
        />
      ))}
    </div>
  ),

  "provenance-chip": (featured) => (
    <div style={{ display: "grid", gap: featured ? 10 : 7 }}>
      {(
        [
          { source: "clinic", observedAt: "2026-08-12T09:48:00Z" },
          { source: "device", observedAt: "2026-08-08T08:10:00Z", device: "Omron BP7450" },
          { source: "ai-extracted", model: "oxy-extract-3", confirmed: false },
        ] as const
      ).map((record, index) => (
        <span key={index} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: featured ? 16 : 14,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            128/76
          </span>
          <ProvenanceChip
            record={record}
            now="2026-08-12T10:00:00Z"
            stalenessPolicy={(r) => (r.source === "device" ? 48 * 3_600_000 : null)}
          />
        </span>
      ))}
    </div>
  ),

  /*
   * Wrapped in `ScaledArt`, because the card cannot shorten it.
   *
   * The band, the score, the drivers and the staleness affix are the component:
   * dropping one to fit a thumbnail would make the card advertise a different
   * component. It painted 266px inside a 156px band and the frame clipped the
   * overflow silently — `fit` shrinks the paint instead, which is what a
   * thumbnail is.
   */
  "risk-indicator": (featured) => (
    <ScaledArt scale={featured ? 0.9 : 0.72} fit={featured ? FEATURED_ART : STANDARD_ART}>
      <div style={{ maxInlineSize: featured ? 320 : 258, inlineSize: "100%" }}>
        <RiskIndicator
          density={featured ? "default" : "compact"}
          now="2026-08-12T10:00:00Z"
          notADiagnosis="A statistical estimate. Not a diagnosis."
          assessment={{
            id: "card-risk",
            outcome: "30-day readmission",
            band: "high",
            probability: 0.31,
            percentile: 94,
            cohort: "adult medicine",
            computedAt: "2026-08-12T04:12:00Z",
            validUntil: "2026-08-13T04:12:00Z",
            drivers: [
              { label: "3 admissions / 6 mo", weight: 11.2 },
              { label: "Lives alone", weight: 4.8 },
              { label: "Adherent to statin", weight: -2.1 },
            ],
            model: { name: "Readmit-v4", auc: 0.71 },
          }}
          driverCount={3}
        />
      </div>
    </ScaledArt>
  ),

  /* Two rows of chip, 3.5px over the band. `fit` takes the last hair off. */
  "allergy-chip": (featured) => (
    <ScaledArt scale={featured ? 1 : 0.96} fit={featured ? FEATURED_ART : STANDARD_ART}>
      <div
        style={{ display: "grid", gap: 8, maxInlineSize: featured ? 320 : 250, inlineSize: "100%" }}
      >
        <AllergyChip
          density={featured ? "default" : "compact"}
          record={{
            id: "card-1",
            substance: "Penicillin G",
            kind: "allergy",
            criticality: "high",
            verification: "confirmed",
            reactions: [{ manifestation: "Urticaria", severity: "mild", onset: "1998" }],
          }}
        />
        <AllergyChip
          density={featured ? "default" : "compact"}
          record={{
            id: "card-2",
            substance: "Amoxicillin",
            kind: "allergy",
            criticality: "low",
            verification: "unconfirmed",
            reactions: [{ manifestation: "Urticaria", severity: "mild", onset: "2019" }],
          }}
        />
      </div>
    </ScaledArt>
  ),

  "result-value": (featured) => (
    <div
      style={{ display: "grid", gap: 12, maxInlineSize: featured ? 320 : 250, inlineSize: "100%" }}
    >
      <ResultValue
        density={featured ? "default" : "compact"}
        now="2026-08-12T10:41:00Z"
        value={{
          id: "card-k",
          analyte: "Potassium",
          value: 6.8,
          unit: "mmol/L",
          interpretation: "critical",
          range: { low: 3.5, high: 5.1 },
          status: "final",
          prior: { value: 4.7, at: "2026-08-12T06:00:00Z" },
          resultedAt: "2026-08-12T10:00:00Z",
        }}
      />
      <ResultValue
        density={featured ? "default" : "compact"}
        value={{
          id: "card-hb",
          analyte: "HbA1c",
          absent: "specimen-problem",
          absentDetail: "Haemolysed. Recollection requested.",
        }}
      />
    </div>
  ),

  "clinical-status": (featured) => (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: featured ? 8 : 6,
        maxInlineSize: featured ? 300 : 232,
      }}
    >
      <ClinicalStatus
        scale="criticality"
        step="critical"
        density={featured ? "default" : "compact"}
      />
      <ClinicalStatus
        scale="result-status"
        step="preliminary"
        density={featured ? "default" : "compact"}
      />
      <ClinicalStatus scale="access" step="part-2" density={featured ? "default" : "compact"} />
      <ClinicalStatus
        scale="criticality"
        step="not-assessed"
        density={featured ? "default" : "compact"}
      />
      <ClinicalStatus
        scale="data-quality"
        step="stale"
        density={featured ? "default" : "compact"}
      />
      <ClinicalStatus
        scale="engagement"
        step="engaged"
        density={featured ? "default" : "compact"}
      />
    </div>
  ),

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
  "clinical-note": () => <ClinicalNoteArt />,
  tabs: (featured) => <TabsArt featured={featured} />,
  accordion: (featured) => <AccordionArt featured={featured} />,
  "chart-accordion": (featured) => <ChartAccordionArt featured={featured} />,
  "safety-plan": (featured) => <SafetyPlanArt featured={featured} />,
  timeline: (featured) => <TimelineArt featured={featured} />,
  "care-timeline": (featured) => <CareTimelineArt featured={featured} />,

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
  copilot: (featured) => (
    /*
     * Scaled rather than squeezed. The dock carries six controls — shortcut
     * glyph, field, mode chip, mic, send, and the scope strip above it — and at
     * a 280px card width they collide: the placeholder truncates mid-word and
     * the chip sits on top of the field. That is a picture of a broken
     * component, which is the one thing card art must never be.
     *
     * So it renders at the width it was designed for and scales down, the same
     * trick the identity card uses. The card still shows the real component
     * rather than an illustration of it, which is the point of driving these
     * previews live at all.
     */
    <ScaledArt scale={featured ? 0.92 : 0.78} fit={featured ? FEATURED_ART : STANDARD_ART}>
      <div className="w-full" style={{ maxWidth: 420 }}>
        <Copilot provider={CARD_COPILOT_PROVIDER} modes={[lookUp]} anchor="inline" locale="en-GB" />
      </div>
    </ScaledArt>
  ),
};

/**
 * The rail, at card scale.
 *
 * Three nodes rather than ten. The honest thumbnail of a timeline is a shorter
 * timeline, not a picture of one.
 */
function TimelineArt({ featured }: { featured: boolean }) {
  return (
    <ScaledArt scale={featured ? 0.95 : 0.84} fit={featured ? FEATURED_ART : STANDARD_ART}>
      <div className="w-full" style={{ maxWidth: 260 }}>
        <Timeline
          aria-label="Release history"
          items={[
            { key: "a", title: "0.4.0", content: "Timeline." },
            { key: "b", title: "0.3.0", content: "Switch, Tabs." },
            { key: "c", title: "0.2.0", content: "Signature." },
          ]}
        />
      </div>
    </ScaledArt>
  );
}

/**
 * One event, between the two halves of the claim.
 *
 * The card deliberately shows the degraded state rather than the healthy one:
 * a timeline that renders cleanly is what every library ships, and the argument
 * for this one is the banner naming the source that did not answer and the
 * sentence at the bottom saying what the reader is therefore looking at.
 *
 * Both of those are prose, and prose is what makes this the densest preview in
 * the catalog. It used to render three events between them, which came to 605px
 * of component asked to sit in a 148px band — `fit` held it to the band by
 * scaling it to a quarter size, which is a smudge, not a thumbnail. So the part
 * that can be cut is cut: `limit={1}` keeps the newest event and both halves of
 * the claim, and the wider `maxWidth` buys the reduction back out of line wraps
 * rather than out of type size.
 */
function CareTimelineArt({ featured }: { featured: boolean }) {
  return (
    <ScaledArt scale={featured ? 0.72 : 0.58} fit={featured ? FEATURED_ART : STANDARD_ART}>
      <div className="w-full" style={{ maxWidth: 400 }}>
        <CareTimeline
          aria-label="Patient timeline"
          events={TIMELINE_EVENTS.slice(2, 6)}
          now={TIMELINE_NOW}
          layout="card"
          limit={1}
          localeTag="en-GB"
          coverage={{
            order: "newest-first",
            total: 43,
            sources: [
              { id: "ehr", label: "Northside EHR", status: "ok" },
              {
                id: "hie",
                label: "Regional exchange",
                status: "unavailable",
                detail: "Timed out.",
              },
            ],
          }}
        />
      </div>
    </ScaledArt>
  );
}

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
    <ScaledArt scale={featured ? 0.95 : 0.86} fit={featured ? FEATURED_ART : STANDARD_ART}>
      <IdentityProvider now={IDENTITY_NOW} disclosure="clinical" photos="deny">
        <IdentitySet>
          <div className="flex w-full max-w-[280px] flex-col gap-1">
            {IDENTITY_ROWS.map((patient) => (
              <PatientChip key={patient.id} patient={patient} block />
            ))}
          </div>
        </IdentitySet>
      </IdentityProvider>
    </ScaledArt>
  );
}

const CARD_COPILOT_PROVIDER = createStaticProvider({
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

/**
 * The card shows the one thing a still image of an editor cannot: that the same
 * sentence carries different origins, and that the difference is a line style
 * as well as a colour. Mounting the real editor here would load ProseMirror
 * into every catalogue page for a 236px thumbnail.
 */
function ClinicalNoteArt() {
  return (
    <div className="ox-note-doc w-full max-w-[248px] text-[13px] leading-relaxed">
      <p className="mb-2">
        <span className="ox-note-pv ox-note-pv-copied">Six weeks of progressive fatigue</span>{" "}
        <span>and dyspnea.</span>
      </p>
      <p className="mb-2">
        <span className="ox-note-pv ox-note-pv-ai">He denies overt bleeding.</span>{" "}
        <span className="ox-note-pv ox-note-pv-pulled">Hgb 7.1 g/dL</span>
      </p>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full ring-1 ring-inset ring-[var(--ox-border)]">
        <span data-origin="typed" className="ox-note-bar block h-full" style={{ width: "24%" }} />
        <span data-origin="copied" className="ox-note-bar block h-full" style={{ width: "44%" }} />
        <span data-origin="ai" className="ox-note-bar block h-full" style={{ width: "20%" }} />
        <span data-origin="pulled" className="ox-note-bar block h-full" style={{ width: "12%" }} />
      </div>
    </div>
  );
}

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
    <ScaledArt scale={featured ? 0.92 : 0.8} fit={featured ? FEATURED_ART : STANDARD_ART}>
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
    <ScaledArt scale={featured ? 0.92 : 0.8} fit={featured ? FEATURED_ART : STANDARD_ART}>
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
    <ScaledArt scale={featured ? 0.62 : 0.5} fit={featured ? FEATURED_ART : STANDARD_ART}>
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
  const ready = isReady(component.name);
  /*
   * Three facts, not one label.
   *
   * `ready` answers "does it have a page". The badge was reading it as "does
   * it exist" and printing "Coming soon" — on fifteen components that install
   * from the registry today, directly beside a working install button. The
   * label undersold shipped work and contradicted the control next to it.
   */
  const distribution = distributionState(component.name);

  return (
    /*
     * An article with an overlay link, not one big anchor.
     *
     * The card carries a second action now — copy the install command, or open
     * the marketplace — and an interactive element inside an anchor is invalid
     * HTML that browsers resolve by guessing. The title is the real link and
     * its `::after` covers the card; the action row sits above that overlay on
     * `z-10`, so the whole card opens the component and one corner does not.
     */
    <article
      data-reveal
      /*
       * The stable hook the browser suite selects on.
       *
       * It used to select `a[href^='/components/']` and reach *inside* the
       * anchor for the preview frame, which worked only while the whole card
       * was one link. The card grew a second action and became an article with
       * an overlay link, and five browser tests broke on a selector that was
       * describing the implementation rather than the thing.
       */
      data-ox-component-card={component.name}
      style={{ "--reveal-delay": `${(index % 3) * 70}ms` } as React.CSSProperties}
      className={cn(
        "surface-2 group relative flex flex-col overflow-hidden rounded-2xl",
        ready
          ? "lift focus-within:border-oxygen/45 hover:border-oxygen/45"
          : "focus-within:border-oxygen/45",
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
          {/*
            The overlay is what makes the whole card clickable, so an unfinished
            component drops the link rather than styling one to look inert: a
            disabled anchor is still focusable, still announced as a link, and
            still followed by a keyboard user.
          */}
          {ready ? (
            <Link
              href={`/components/${component.name}`}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {component.title}
            </Link>
          ) : (
            component.title
          )}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider",
            ready ? STATUS_STYLE[component.status] : "border-rule text-graphite-soft",
          )}
          title={ready ? STATUS_CONTRACT[component.status] : DISTRIBUTION_CONTRACT[distribution]}
        >
          {ready ? STATUS_LABEL[component.status] : DISTRIBUTION_LABEL[distribution]}
        </span>
      </div>

      {/* Primitives take no FHIR resource; an empty line here would just be a
          gap the reader has to account for. */}
      {component.resource ? (
        <p className="numeric mt-2 text-xs text-oxygen-deep">{component.resource}</p>
      ) : null}

      {/* Not `flex-1`. The summary used to absorb a stretched row's slack and
          open a band of white between the prose and the art; the frame below
          takes it now, which is where the design wanted it — the preview grows
          and the component stays centred in it. */}
      <p
        className={cn("mt-3 leading-relaxed text-graphite", featured ? "body max-w-lg" : "text-sm")}
      >
        {/*
          The card line, not the meta description.

          `summary` is capped at 160 characters because it doubles as the page
          description, which makes it a good description and a poor card: 27 of
          them at a 21-word median rendered as a wall of grey. `tagline` is the
          authored short form; falling back to `summary` keeps a component that
          has not been given one readable rather than blank.
        */}
        {component.tagline ?? component.summary}
      </p>

      {preview ? (
        <div
          data-ox-density="standard"
          // `flex-[1_0_auto]`, not `flex-1`. `flex-1` is `1 1 0%`: the frame
          // contributes nothing to the card's intrinsic height and shrinks
          // freely — and `overflow-hidden` zeroes the automatic minimum size
          // that would otherwise stop it, so the frame silently squeezed below
          // the art band and cut the top line off the densest previews. It
          // still takes whatever slack a stretched row hands it; it just
          // cannot give back what the band needs.
          className="component-preview-frame relative mt-5 flex flex-[1_0_auto] items-center justify-center overflow-hidden rounded-xl p-3"
        >
          {/* Decorative inside the card. aria-hidden alone is a violation here:
              the panel contains a focusable scroll region, and hiding a
              focusable element from AT strands keyboard users on it. `inert`
              removes it from both the a11y tree and the tab order. */}
          <div
            inert
            aria-hidden="true"
            // A fixed band, not a floor. These were `min-h` and nothing set the
            // ceiling, so a preview taller than the band simply made its card
            // taller — and the card set its row, and the row set the grid. The
            // band is what makes a catalog scannable: sixteen previews read as
            // one set of components only if they are drawn at one size.
            style={{ height: featured ? FEATURED_ART : STANDARD_ART }}
            className="pointer-events-none flex w-full items-center justify-center"
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

      {/*
        What it is, and how to get it — on the card rather than one page in.
        A catalogue that answers "what is this" and stops makes the reader open
        a page to find out whether they can even have it.
      */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-3">
        <div className="flex items-center gap-2">
          <PriceTag component={component} />
          <span className="numeric text-[0.6875rem] text-graphite-soft">
            {component.states.length} states
          </span>
        </div>

        <div className="flex items-center gap-2">
          <AcquireAction component={component} />
          {/*
            "View" only where there is something to view.

            The card drops its overlay link when a component has no page, but
            this affordance stayed — so an unopenable card still showed "View →"
            in the corner and read as a link that had stopped working.
          */}
          {ready ? (
            <span
              aria-hidden="true"
              className="inline-flex items-center gap-1 text-xs font-medium text-oxygen-deep"
            >
              View
              <ArrowRight className="size-3.5 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
