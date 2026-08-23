/**
 * Stories for RiskIndicator.
 *
 * `parameters.state` ties each to a state declared in
 * `risk-indicator.meta.ts`, and the build asserts the two agree in both
 * directions.
 *
 * `NOW` is frozen so the ages say the same thing every day — and because the
 * component takes the clock as a prop precisely so that a story, a test and a
 * ward workstation can each supply their own.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import { RiskIndicator, type RiskAssessment } from "./risk-indicator";

const NOW = "2026-08-12T10:00:00Z";
const COMPUTED = "2026-08-12T04:12:00Z";
const FRAMING =
  "A statistical estimate from historical patterns. Not a diagnosis, and not a substitute for assessment.";

const readmission: RiskAssessment = {
  id: "r1",
  outcome: "30-day readmission",
  band: "high",
  probability: 0.31,
  percentile: 94,
  cohort: "adult medicine",
  computedAt: COMPUTED,
  validUntil: "2026-08-13T04:12:00Z",
  drivers: [
    { label: "3 admissions / 6 mo", weight: 11.2 },
    { label: "Lives alone", weight: 4.8 },
    { label: "No PCP visit < 90 d", weight: 3.9 },
    { label: "Adherent to statin", weight: -2.1 },
  ],
  model: { name: "Readmit-v4", auc: 0.71 },
};

const meta: Meta<typeof RiskIndicator> = {
  title: "Clinical/Risk Indicator",
  component: RiskIndicator,
  args: { assessment: readmission, now: NOW, notADiagnosis: FRAMING },
};

export default meta;
type Story = StoryObj<typeof RiskIndicator>;

/* ------------------------------------------------------------------ */
/* Bands                                                               */
/* ------------------------------------------------------------------ */

export const High: Story = {
  name: "High, with weighted drivers",
  parameters: { state: "High, with weighted drivers" },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group");
    // The band leads; the numeral is demoted and rounded.
    expect(canvasElement.querySelector(".ox-risk__head [data-ox-scale='risk']")).toBeTruthy();
    expect(canvasElement.querySelector(".ox-risk__probability")).toHaveTextContent("31");
    // And the sentence ends with the framing rather than opening with it.
    expect(group.getAttribute("aria-label")).toMatch(
      new RegExp(`${FRAMING.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
    );
  },
};

export const Moderate: Story = {
  name: "Moderate",
  parameters: { state: "Moderate" },
  args: { assessment: { ...readmission, band: "moderate", probability: 0.14, percentile: 61 } },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole("group").getAttribute("data-ox-band")).toBe("moderate");
  },
};

export const Low: Story = {
  name: "Low",
  parameters: { state: "Low" },
  args: { assessment: { ...readmission, band: "low", probability: 0.04, percentile: 18 } },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole("group").getAttribute("data-ox-band")).toBe("low");
  },
};

export const Imminent: Story = {
  name: "Imminent",
  parameters: { state: "Imminent" },
  args: {
    assessment: {
      id: "r2",
      outcome: "Deterioration within 24 h",
      band: "imminent",
      probability: 0.72,
      computedAt: COMPUTED,
      validUntil: "2026-08-12T16:12:00Z",
      drivers: [
        { label: "NEWS2 rose 3 → 7 in 4 h", weight: 18.4 },
        { label: "Lactate 3.1", weight: 6.2 },
      ],
      model: { name: "Deteriorate-v2", auc: 0.83 },
    },
  },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole("group").getAttribute("aria-label")).toContain(
      "Imminent risk",
    );
  },
};

export const NotScored: Story = {
  name: "Not scored",
  parameters: { state: "Not scored — the model could not" },
  args: {
    assessment: { id: "r3", outcome: "30-day readmission", band: "unknown", computedAt: COMPUTED },
  },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group");
    // Rendering this as the bottom band is how a patient the model cannot see
    // becomes a patient the panel does not call.
    expect(group).toHaveTextContent("This is not a low score");
    expect(group.getAttribute("data-ox-band")).toBe("unknown");
  },
};

/* ------------------------------------------------------------------ */
/* Freshness                                                           */
/* ------------------------------------------------------------------ */

export const Expired: Story = {
  name: "Expired",
  parameters: { state: "Expired — past its validity window" },
  args: { now: "2026-08-14T09:00:00Z" },
  render: (args) => <RiskIndicator {...args} onRecompute={() => {}} onAcknowledge={() => {}} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("group").getAttribute("data-ox-freshness")).toBe("expired");
    // Two ways out, and dismissal is not one of them: a score somebody waved
    // away stays on the panel looking current.
    expect(canvas.getByRole("button", { name: "Recompute" })).toBeTruthy();
    expect(canvas.getByRole("button", { name: "Acknowledge as expired" })).toBeTruthy();
    expect(canvas.queryByRole("button", { name: /dismiss/i })).toBeNull();
  },
};

export const Unbounded: Story = {
  name: "No validity window",
  parameters: { state: "Unbounded — no validity window declared" },
  args: {
    assessment: {
      id: "r4",
      outcome: "Care-gap likelihood",
      band: "moderate",
      probability: 0.22,
      computedAt: COMPUTED,
      model: { name: "Gap-v1" },
    },
  },
  play: async ({ canvasElement }) => {
    // Honest, and it means nothing can ever expire — which is why the window
    // is data the model supplies rather than a shared constant.
    expect(within(canvasElement).getByRole("group").getAttribute("data-ox-freshness")).toBe(
      "unbounded",
    );
  },
};

/* ------------------------------------------------------------------ */
/* Attribution                                                         */
/* ------------------------------------------------------------------ */

export const Concentrated: Story = {
  name: "One factor dominates",
  parameters: { state: "One factor dominates the score" },
  args: {
    assessment: {
      ...readmission,
      drivers: [
        { label: "ED visit, 18 months ago", weight: 14 },
        { label: "Lives alone", weight: 2.1 },
        { label: "No PCP visit < 90 d", weight: 1.8 },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    // A model whose top driver carries most of the attribution is not
    // modelling a patient; it is reporting one event.
    expect(within(canvasElement).getByRole("group")).toHaveTextContent(
      /\d+% of this score comes from one factor/,
    );
  },
};

export const UnweightedDrivers: Story = {
  name: "Drivers with no weights",
  parameters: { state: "Drivers with no weights, from basis[]" },
  args: {
    assessment: {
      ...readmission,
      drivers: [
        { label: "Encounter, 3 Aug" },
        { label: "Discharge summary, 28 Jul" },
        { label: "Observation, potassium" },
      ].map((d) => ({ ...d, weight: 0 })),
    },
  },
  play: async ({ canvasElement }) => {
    // `basis[]` names references with no attribution. Drawing a bar for them
    // would be inventing one.
    expect(canvasElement.querySelector(".ox-risk__driver-bar")).toBeNull();
    expect(canvasElement.querySelector("[data-ox-unweighted]")).toBeTruthy();
  },
};

export const PercentileWithCohort: Story = {
  name: "Percentile with its cohort",
  parameters: { state: "Percentile with its cohort" },
  play: async ({ canvasElement }) => {
    // "94th percentile" of an unnamed population is routinely read as "94th
    // percentile of people like this patient", which is a claim nobody made.
    expect(within(canvasElement).getByRole("group")).toHaveTextContent("94th pct · adult medicine");
  },
};

/* ------------------------------------------------------------------ */
/* Model card and density                                              */
/* ------------------------------------------------------------------ */

export const ModelCard: Story = {
  name: "Model card reachable",
  parameters: { state: "Model card reachable" },
  render: (args) => <RiskIndicator {...args} onOpenModel={() => {}} />,
  play: async ({ canvasElement }) => {
    // An AUC of 0.63 trusted by clinicians who were never shown it is the
    // specific failure. The number is on the face and the card is one tab away.
    const button = within(canvasElement).getByRole("button", { name: /Readmit-v4/ });
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
  },
};

export const Compact: Story = {
  name: "Compact, in a panel list",
  parameters: { state: "Compact, in a panel list" },
  render: (args) => (
    <div style={{ display: "grid", gap: 8, maxInlineSize: 420 }}>
      {(
        [
          readmission,
          { ...readmission, id: "p2", band: "moderate", probability: 0.14, percentile: 61 },
          { ...readmission, id: "p3", band: "unknown", probability: undefined },
        ] as RiskAssessment[]
      ).map((assessment) => (
        <RiskIndicator key={assessment.id} {...args} assessment={assessment} density="compact" />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cards = within(canvasElement).getAllByRole("group");
    expect(cards).toHaveLength(3);
    expect(cards[0]?.getAttribute("data-ox-density")).toBe("compact");
    // Forty of these are read in a sitting, and the staleness signal is the
    // one that has to survive the density change.
    for (const card of cards) expect(card).toHaveTextContent(/Computed .* ago/);
  },
};
