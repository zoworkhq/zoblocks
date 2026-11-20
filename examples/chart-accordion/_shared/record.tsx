import type { ChartSection } from "@/components/zoblocks/chart-accordion";

/** Whose record is open. Synthetic. */
export const TOOLBAR_LABEL = "Ada Lovelace · 38 · MRN 4471902";

/** A behavioural-health record with every severity the closed header can carry. */
export const sections: ChartSection[] = [
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
