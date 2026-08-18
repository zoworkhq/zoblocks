/**
 * Stories for Care Timeline.
 *
 * Each one is a chart a clinician would actually meet, and the set is chosen so
 * that the states nobody demos — lapsed, entered in error, restricted, a source
 * that failed — outnumber the ordinary ones. The point they collectively make:
 * whatever else is on screen, the reader is always told what this is a view of.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import { CareTimeline } from "./care-timeline";
import { COVERAGE, EVENTS, HEALTHY_COVERAGE, NOW, SEEN_THROUGH } from "./care-timeline.fixtures";

const meta: Meta<typeof CareTimeline> = {
  title: "Clinical/Care Timeline",
  component: CareTimeline,
  args: {
    "aria-label": "Care timeline for Ada Lovelace",
    events: EVENTS,
    now: NOW,
    coverage: COVERAGE,
    localeTag: "en-GB",
    filters: false,
  },
};

export default meta;
type Story = StoryObj<typeof CareTimeline>;

export const Default: Story = {
  name: "Newest first, grouped by month",
  parameters: { state: "Newest first, grouped by month" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The claim is in the footer, in words, and it is there before anything
    // else on the page has been read.
    await canvas.findByText(/Showing \d+ of 43 events/);
    expect(canvasElement.textContent).toContain("newest first");
    expect(canvasElement.querySelectorAll("ol.ox-timeline").length).toBeGreaterThan(1);
  },
};

export const Planned: Story = {
  name: "Planned, above the now marker",
  parameters: { state: "Planned, above the now marker" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Endocrinology review");
    // Planned sits above `now`, and `now` came from the caller — not the clock.
    const text = canvasElement.textContent ?? "";
    expect(text.indexOf("Endocrinology review")).toBeLessThan(text.indexOf("Now —"));
  },
};

export const Lapsed: Story = {
  name: "Lapsed — planned, and nothing recorded against it",
  parameters: { state: "Lapsed — planned, and nothing recorded against it" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Diabetic retinal screening");
    // It says what is not known. "Missed" and "no-show" are conclusions the
    // record cannot support, so the component does not draw them.
    expect(canvasElement.textContent).toContain("no encounter has been recorded against it");
    expect(canvasElement.textContent).not.toContain("no-show");
  },
};

export const Cancelled: Story = {
  name: "Cancelled",
  parameters: { state: "Cancelled" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Podiatry review");
    // Someone decided. That is a different fact from an attempt that failed,
    // and the two must not share a chip.
    expect(canvasElement.textContent).toContain("Cancelled");
  },
};

export const NotDone: Story = {
  name: "Attempted and did not connect",
  parameters: { state: "Attempted and did not connect" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Follow-up call");
    expect(canvasElement.textContent).toContain("Did not connect");
    // Actor and recipient are separate fields, so the reminder cannot end up
    // addressed to the doctor.
    expect(canvasElement.textContent).toContain("Priya Menon");
    expect(canvasElement.textContent).toContain("The patient");
  },
};

export const Amended: Story = {
  name: "Amended, with what changed",
  parameters: { state: "Amended, with what changed" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("HbA1c — 8.9%");
    // An amendment chip with no delta tells the reader something changed and
    // denies them the one thing they need.
    expect(canvasElement.textContent).toContain("9.4%");
  },
};

export const InError: Story = {
  name: "Entered in error, retained and struck",
  parameters: { state: "Entered in error, retained and struck" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Retained and marked. Filtering it out of the query is the one behaviour
    // the record's own rules forbid.
    await canvas.findByText("Emergency department attendance");
    expect(canvasElement.textContent).toContain("Entered in error");
    expect(canvasElement.querySelector(".ox-care-timeline__item--in-error")).not.toBeNull();
  },
};

export const Restricted: Story = {
  name: "Restricted — it exists and you may not read it",
  parameters: { state: "Restricted — it exists and you may not read it" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/do not have access to it/);
    // It says that something is here without saying what. Filtering it would
    // misrepresent the record to a reader with no way to know.
    expect(canvasElement.textContent).not.toContain("Discharge summary");
  },
};

export const ConsentGated: Story = {
  name: "Consent-gated",
  parameters: { state: "Consent-gated" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Record a reason and open");
    // The gated title is a prefix of the withheld one — both rows are on this
    // chart, and that is the point: they are different states of the same fact.
    expect(canvas.getAllByText(/A record exists on this date/).length).toBeGreaterThanOrEqual(2);
    expect(canvasElement.textContent).not.toContain("Psychotherapy progress note");
  },
};

export const Thread: Story = {
  name: "A thread with its own steps",
  parameters: { state: "A thread with its own steps" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Pre-visit medical history");
    // Sent, returned, reviewed happened on different days. Flattening them into
    // one sentence loses the only question anyone asks of an intake form.
    expect(canvasElement.textContent).toContain("Sent to the patient");
    expect(canvasElement.textContent).toContain("Returned by the patient");
    expect(canvasElement.textContent).toContain("Not yet reviewed");
  },
};

export const Clustered: Story = {
  name: "A cluster, and a critical event promoted out of one",
  parameters: { state: "A cluster, and a critical event promoted out of one" },
  args: { cluster: { kinds: ["observation"], within: "P3D", min: 3 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = await canvas.findByRole("button", { name: /observation records/i });
    // The critical potassium is a laboratory result and outside the clustered
    // kinds; the invariant that protects it regardless is in the engine's own
    // test. What this checks is that the cluster is a real disclosure.
    expect(canvasElement.textContent).toContain("Potassium 6.8 mmol/L");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await userEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  },
};

export const Gap: Story = {
  name: "A stated gap in coverage",
  parameters: { state: "A stated gap in coverage" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The affordance antd spends on "whichever item rendered last", spent on
    // something a reader can act on instead.
    await canvas.findByText(/Records may be missing here/);
  },
};

export const SourceDown: Story = {
  name: "A source that could not be reached",
  parameters: { state: "A source that could not be reached" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // This is the repeat-CT case, caught. It interrupts rather than sitting in
    // grey at the bottom, because the reader is about to convert an absence
    // into a clinical fact.
    const alert = await canvas.findByRole("alert");
    expect(alert.textContent).toContain("could not be reached");
    expect(alert.textContent).toContain("not a statement that no such records exist");
  },
};

export const Filtered: Story = {
  name: "Filtered, with the hidden count stated",
  parameters: { state: "Filtered, with the hidden count stated" },
  args: { filters: true, defaultRegisters: ["clinical"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A filter that hides events and says so only inside its own popover —
    // which is usually off screen — has not said so.
    await canvas.findByText(/hidden by the/);
    const clinical = canvas.getByRole("button", { name: "Clinical" });
    expect(clinical.getAttribute("aria-pressed")).toBe("true");
  },
};

export const NewSinceLastReview: Story = {
  name: "New since last reviewed",
  parameters: { state: "New since last reviewed" },
  args: { seenThrough: SEEN_THROUGH },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/New since you last reviewed this chart/);
    // The divider is a real structural break: two named lists, not a rule
    // floating inside one.
    expect(canvasElement.querySelectorAll("ol.ox-timeline").length).toBeGreaterThan(2);
  },
};

export const ImpreciseDate: Story = {
  name: "An imprecise date, kept imprecise",
  parameters: { state: "An imprecise date, kept imprecise" },
  args: { group: "none", coverage: HEALTHY_COVERAGE },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const gdm = await canvas.findByText("Gestational diabetes");
    const time = gdm.closest("li")?.querySelector("time");
    // A FHIR `2019` means 2019. Widening it to 1 January invents a precision
    // nobody recorded.
    expect(time?.getAttribute("datetime")).toBe("2019");
    expect(time?.textContent).toBe("2019");
  },
};

export const Empty: Story = {
  name: "No record · none in this window · none you may see",
  parameters: { state: "No record · none in this window · none you may see" },
  render: () => (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <CareTimeline
        aria-label="No record at all"
        events={[]}
        now={NOW}
        filters={false}
        coverage={{
          order: "newest-first",
          sources: [{ id: "ehr", label: "Northside EHR", status: "ok" }],
        }}
      />
      <CareTimeline
        aria-label="Nothing in this window"
        events={[]}
        now={NOW}
        filters={false}
        coverage={{
          order: "newest-first",
          window: { from: "2025-01-01", to: "2025-12-31" },
          sources: [{ id: "ehr", label: "Northside EHR", status: "ok" }],
        }}
      />
      <CareTimeline
        aria-label="Nothing you may see"
        events={[]}
        now={NOW}
        filters={false}
        coverage={{
          order: "newest-first",
          hidden: [{ reason: "access", count: 3 }],
          sources: [{ id: "ehr", label: "Northside EHR", status: "ok" }],
        }}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Three facts, three next actions. Rendering them as one empty card is the
    // ambiguity this library exists to prevent, and the one that produces a
    // repeat scan.
    const text = canvasElement.textContent ?? "";
    expect(text).toContain("no records for this person in any source");
    expect(text).toContain("This window was searched and returned nothing");
    expect(text).toContain("none of them are ones you have access to read");
  },
};

export const PatientFacing: Story = {
  name: "Patient-facing, with a result not yet reviewed",
  parameters: { state: "Patient-facing, with a result not yet reviewed" },
  args: {
    audience: "patient",
    coverage: HEALTHY_COVERAGE,
    events: [
      {
        id: "lab-tft",
        kind: "laboratory",
        occurred: "2026-08-17T22:41:00+05:30",
        title: "Thyroid function",
        detail: "Released to you at the same time as your care team. Nobody has looked at it yet.",
        status: "in-progress",
      },
      ...EVENTS.slice(2, 6),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Since April 2021 a result reaches the patient when it reaches the
    // ordering clinician. Different words, not a softer tone.
    await canvas.findByText("Thyroid function");
    expect(canvasElement.textContent).toContain("Test result");
    expect(canvasElement.textContent).toContain("Visit");
  },
};
