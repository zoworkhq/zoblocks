"use client";

import * as React from "react";
import {
  ChartAccordion,
  type ChartSection,
} from "@/registry/zoblocks/chart-accordion/chart-accordion";

const TOOLBAR_LABEL = "Ada Lovelace · 38 · MRN 4471902";

const RECORD: ChartSection[] = [
  {
    key: "risk",
    label: "Risk & suicidality",
    severity: "critical",
    status: "C-SSRS positive",
    updatedAt: "2026-08-13T09:12:00+05:30",
    children: <p>Ideation 3 — active thoughts, no plan, no intent, no preparatory behaviour.</p>,
  },
  {
    key: "assessments",
    label: "Assessments",
    severity: "high",
    status: "PHQ-9 21 · severe",
    updatedAt: "2026-08-03",
    children: <p>PHQ-9 21 of 27. GAD-7 16 of 21. Item 9 endorsed.</p>,
  },
  {
    key: "plan",
    label: "Safety plan",
    severity: "normal",
    status: "Current",
    updatedAt: "2026-08-11",
    children: <p>Six steps complete.</p>,
  },
  {
    key: "notes",
    label: "Progress notes",
    count: "142 encounters",
    updatedAt: "2026-08-13",
    children: <p>BIRP format.</p>,
  },
  {
    key: "audit",
    label: "AUDIT",
    severity: "unknown",
    status: "Not asked this visit",
    updatedAt: "2026-02-02",
    children: <p>Not administered on 3 August. Last score 14 on 2 February 2026.</p>,
  },
];

export function ClosedWithSummaries() {
  return <ChartAccordion sections={RECORD} toolbarLabel={TOOLBAR_LABEL} headingLevel={3} />;
}

export function Expanded() {
  return (
    <ChartAccordion
      sections={RECORD}
      toolbarLabel={TOOLBAR_LABEL}
      headingLevel={3}
      defaultOpenKeys={["risk", "assessments"]}
    />
  );
}

export function SeverityScale() {
  return <ChartAccordion sections={RECORD} toolbarLabel={TOOLBAR_LABEL} headingLevel={3} />;
}

export function ExpandCollapseAll() {
  const sections: ChartSection[] = [
    ...RECORD.slice(0, 2),
    {
      key: "psychotherapy",
      label: "Psychotherapy notes",
      access: {
        kind: "withheld",
        reason: "Kept separately by the author",
      },
    },
  ];

  return <ChartAccordion sections={sections} toolbarLabel={TOOLBAR_LABEL} headingLevel={3} />;
}

export function ConsentGate() {
  const sections: ChartSection[] = [
    ...RECORD.slice(0, 2),
    {
      key: "sud",
      label: "Substance use treatment",
      status: "42 CFR Part 2",
      severity: "unknown",
      access: {
        kind: "consent",
        policy: "42 CFR Part 2",
        state: "granted",
      },
      children: <p>Intensive outpatient programme, three sessions weekly.</p>,
    },
  ];

  return (
    <ChartAccordion
      sections={sections}
      toolbarLabel={TOOLBAR_LABEL}
      headingLevel={3}
      defaultOpenKeys={["sud"]}
      onDisclose={() => true}
    />
  );
}

export function WithheldSection() {
  const sections: ChartSection[] = [
    ...RECORD.slice(0, 2),
    {
      key: "psychotherapy",
      label: "Psychotherapy notes",
      access: {
        kind: "withheld",
        reason: "Kept separately by the author",
      },
    },
  ];

  return <ChartAccordion sections={sections} toolbarLabel={TOOLBAR_LABEL} headingLevel={3} />;
}

export function FailedSection() {
  const sections: ChartSection[] = [
    ...RECORD.slice(0, 2),
    {
      key: "team",
      label: "Care team",
      severity: "critical",
      status: "Could not load",
      children: (
        <p>
          <strong>Could not load the care team.</strong> This list may be incomplete. The rest of
          this record loaded normally.
        </p>
      ),
    },
  ];

  return (
    <ChartAccordion
      sections={sections}
      toolbarLabel={TOOLBAR_LABEL}
      headingLevel={3}
      defaultOpenKeys={["team"]}
    />
  );
}

export function NoSections() {
  return <ChartAccordion sections={[]} toolbarLabel={TOOLBAR_LABEL} headingLevel={3} />;
}
