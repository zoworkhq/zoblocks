"use client";

/**
 * The Accordion demos, live — the previews behind the examples on its page.
 *
 * Each is the real registry component with synthetic data. The gates call an
 * `onDisclose` that always allows, except the refused-consent demo, whose
 * whole point is the refusal: the component's job there is to say so and keep
 * the content where it was.
 */

import * as React from "react";
import { Accordion, Disclosure } from "@/registry/zoblocks/accordion/accordion";
import type { AccordionItem } from "@/lib/zoblocks-accordion";

const allow = () => true;

/** The chart the playground and the first example share. */
export const CHART_ITEMS: AccordionItem[] = [
  {
    key: "risk",
    label: "Risk & suicidality",
    severity: "critical",
    summary: "C-SSRS positive · 13 Aug",
    children: <p>Ideation 3 — active thoughts, no plan, no intent, no preparatory behaviour.</p>,
  },
  {
    key: "meds",
    label: "Medications",
    severity: "high",
    summary: "Clozapine ANC due 18 Aug",
    children: <p>Clozapine 300 mg nightly. Lithium carbonate 900 mg nightly.</p>,
  },
  {
    key: "plan",
    label: "Safety plan",
    severity: "normal",
    summary: "Current · revised 11 Aug",
    children: <p>Six steps complete. Means restriction reviewed on 11 August.</p>,
  },
  {
    key: "audit",
    label: "AUDIT",
    severity: "unknown",
    summary: "Not asked this visit",
    children: <p>Not administered on 3 August. Last score 14 on 2 February 2026.</p>,
  },
];

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="w-full max-w-xl">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* The record                                                           */
/* ------------------------------------------------------------------ */

export function RecordWhileClosed() {
  return (
    <Frame>
      <Accordion headingLevel={3} items={CHART_ITEMS} />
    </Frame>
  );
}

export function PinnedCrisisStep() {
  return (
    <Frame>
      <Accordion
        headingLevel={3}
        items={[
          {
            key: "signs",
            label: "1 · Signs that things are getting harder",
            children: <p>Sleeping less than four hours. Skipping meals. Not answering texts.</p>,
          },
          {
            key: "coping",
            label: "2 · Things I can do on my own",
            children: <p>Walk to the river. The playlist Sam made.</p>,
          },
          {
            key: "crisis",
            label: "3 · If none of that is working",
            pinned: true,
            severity: "critical",
            summary: "Always open",
            children: <p>988 — Suicide &amp; Crisis Lifeline, 24 hours. Or text HOME to 741741.</p>,
          },
        ]}
      />
    </Frame>
  );
}

export function SingleOpen() {
  return (
    <Frame>
      <Accordion accordion headingLevel={3} defaultActiveKey={["risk"]} items={CHART_ITEMS} />
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* Governed sections                                                    */
/* ------------------------------------------------------------------ */

export function AdvisoryGate() {
  return (
    <Frame>
      <Accordion
        headingLevel={3}
        defaultActiveKey={["note"]}
        onDisclose={allow}
        items={[
          {
            key: "note",
            label: "Your session summary — 13 August",
            access: { kind: "advisory", notice: "This summary talks about self-harm" },
            children: <p>You and Rachel talked about the last two weeks.</p>,
          },
        ]}
      />
    </Frame>
  );
}

export function ReasonGate() {
  return (
    <Frame>
      <Accordion
        headingLevel={3}
        defaultActiveKey={["external"]}
        onDisclose={allow}
        items={[
          {
            key: "external",
            label: "Records from another organisation",
            severity: "high",
            summary: "Access is recorded",
            access: {
              kind: "reason",
              reasons: [
                { code: "emergency", label: "Emergency treatment" },
                { code: "covering", label: "Covering clinician" },
                { code: "coordination", label: "Care coordination" },
              ],
            },
            children: <p>Referral letter, 2 February 2026.</p>,
          },
        ]}
      />
    </Frame>
  );
}

export function ConsentGate() {
  return (
    <Frame>
      <Accordion
        headingLevel={3}
        defaultActiveKey={["sud"]}
        onDisclose={allow}
        items={[
          {
            key: "sud",
            label: "Substance use treatment",
            summary: "42 CFR Part 2",
            access: {
              kind: "consent",
              policy: "42 CFR Part 2",
              state: "granted",
              expiresAt: "2027-02-02",
            },
            children: <p>Intensive outpatient programme, three sessions weekly.</p>,
          },
          {
            key: "notes",
            label: "Progress notes",
            summary: "142 encounters",
            children: <p>BIRP format.</p>,
          },
        ]}
      />
    </Frame>
  );
}

export function ConsentRefused() {
  return (
    <Frame>
      <Accordion
        headingLevel={3}
        defaultActiveKey={["sud"]}
        onDisclose={() => false}
        items={[
          {
            key: "sud",
            label: "Substance use treatment",
            access: { kind: "consent", policy: "42 CFR Part 2", state: "missing" },
            children: <p>Intensive outpatient programme.</p>,
          },
        ]}
      />
    </Frame>
  );
}

export function Withheld() {
  return (
    <Frame>
      <Accordion
        headingLevel={3}
        items={[
          {
            key: "notes",
            label: "Progress notes",
            summary: "142 encounters",
            children: <p>BIRP format.</p>,
          },
          {
            key: "psychotherapy",
            label: "Psychotherapy notes",
            access: { kind: "withheld", reason: "Kept separately by the author" },
          },
          {
            key: "sealed",
            label: "Adolescent visit, 2019",
            access: {
              kind: "withheld",
              reason: "Sealed under state minor-consent law. Not releasable to this account.",
            },
          },
        ]}
      />
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* Structure                                                            */
/* ------------------------------------------------------------------ */

export function Nested() {
  return (
    <Frame>
      <Accordion
        headingLevel={2}
        defaultActiveKey={["plan"]}
        items={[
          {
            key: "plan",
            label: "Treatment plan",
            summary: "2 problems · 5 goals",
            children: (
              <Accordion
                headingLevel={3}
                variant="ghost"
                items={[
                  {
                    key: "mdd",
                    label: "Major depressive disorder, recurrent, severe",
                    summary: "3 goals",
                    children: <p>Reduce PHQ-9 below 10 by 1 November 2026.</p>,
                  },
                  {
                    key: "aud",
                    label: "Alcohol use disorder, moderate",
                    summary: "2 goals",
                    children: <p>Abstinence maintained 90 days.</p>,
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </Frame>
  );
}

const TWO: AccordionItem[] = [
  { key: "a", label: "Allergies", summary: "2 recorded", children: <p>Penicillin, latex.</p> },
  { key: "b", label: "Immunisations", summary: "Up to date", children: <p>Influenza 2026.</p> },
];

export function Variants() {
  return (
    <div className="grid w-full max-w-xl gap-6">
      {(["bordered", "separate", "ghost"] as const).map((variant) => (
        <div key={variant} className="flex flex-col gap-2">
          <code className="font-mono text-xs text-graphite">{variant}</code>
          <Accordion headingLevel={3} variant={variant} items={TWO} />
        </div>
      ))}
    </div>
  );
}

export function Density() {
  return (
    <div className="grid w-full max-w-xl gap-6">
      {(["patient", "standard", "clinical"] as const).map((density) => (
        <div key={density} className="flex flex-col gap-2">
          <code className="font-mono text-xs text-graphite">{density}</code>
          <Accordion headingLevel={3} density={density} items={TWO} />
        </div>
      ))}
    </div>
  );
}

export function SingleDisclosure() {
  return (
    <Frame>
      <Disclosure
        headingLevel={3}
        item={{
          key: "why",
          label: "Why are we asking this?",
          children: (
            <p>
              Your answers help your care team spot changes early. They are not shared with your
              employer or your insurer.
            </p>
          ),
        }}
      />
    </Frame>
  );
}
