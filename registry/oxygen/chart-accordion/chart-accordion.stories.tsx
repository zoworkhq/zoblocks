/**
 * Stories for Chart Accordion.
 *
 * Each one is a record a clinician would actually meet. The point the stories
 * are collectively making: every section is legible while closed, and the two
 * sections that are not ordinary — governed and withheld — say what they are
 * without saying what they contain.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import { ChartAccordion, type ChartSection } from "./chart-accordion";

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

const meta: Meta<typeof ChartAccordion> = {
  title: "Disclosure/Chart Accordion",
  component: ChartAccordion,
  args: { sections: RECORD, toolbarLabel: "Ada Lovelace · 38 · MRN 4471902", headingLevel: 3 },
};

export default meta;
type Story = StoryObj<typeof ChartAccordion>;

export const ClosedWithSummaries: Story = {
  name: "Closed, with summaries",
  parameters: { state: "Closed, with summaries" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Five sections, nothing open, and the reader already knows which one to
    // open first. That is the whole difference from a generic accordion.
    await canvas.findByText("C-SSRS positive");
    await canvas.findByText("PHQ-9 21 · severe");
    const triggers = [...canvasElement.querySelectorAll("button.ox-accordion__trigger")];
    expect(triggers.every((t) => t.getAttribute("aria-expanded") === "false")).toBe(true);
  },
};

export const Expanded: Story = {
  name: "Expanded",
  parameters: { state: "Expanded" },
  args: { defaultOpenKeys: ["risk", "assessments"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Ideation 3/);
    // Expand all is how a record becomes printable and searchable in one press.
    await userEvent.click(canvas.getByRole("button", { name: "Expand all" }));
  },
};

export const SeverityScale: Story = {
  name: "Severity across the scale",
  parameters: { state: "Severity across the scale" },
  play: async ({ canvasElement }) => {
    // Every rail has words beside it. The type made that impossible to forget
    // at the call site; this is the same rule checked in the output.
    for (const severity of ["critical", "high", "normal", "unknown"]) {
      const item = canvasElement.querySelector(`[data-severity="${severity}"]`);
      expect(item, severity).not.toBeNull();
      const chip = item?.querySelector(".ox-chip");
      expect(chip?.textContent?.trim().length, severity).toBeGreaterThan(0);
    }
  },
};

export const ConsentGate: Story = {
  name: "Consent gate",
  parameters: { state: "Consent gate" },
  args: {
    defaultOpenKeys: ["sud"],
    onDisclose: () => true,
    sections: [
      ...RECORD.slice(0, 2),
      {
        key: "sud",
        label: "Substance use treatment",
        status: "42 CFR Part 2",
        severity: "unknown",
        access: { kind: "consent", policy: "42 CFR Part 2", state: "granted" },
        children: <p>Intensive outpatient programme, three sessions weekly.</p>,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Named while closed, explained while open, revealed only after the
    // application says yes — so the policy appears in both the header chip and
    // the gate.
    expect((await canvas.findAllByText(/42 CFR Part 2/)).length).toBeGreaterThanOrEqual(2);
    expect(canvasElement.textContent).not.toContain("Intensive outpatient");
  },
};

export const WithheldSection: Story = {
  name: "Withheld section",
  parameters: { state: "Withheld section" },
  args: {
    sections: [
      ...RECORD.slice(0, 2),
      {
        key: "psychotherapy",
        label: "Psychotherapy notes",
        access: { kind: "withheld", reason: "Kept separately by the author" },
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Restricted — not shown");
    // Expand all does not reach it, because there is nothing behind it.
    await userEvent.click(canvas.getByRole("button", { name: "Expand all" }));
    expect(canvasElement.querySelector('[data-access="withheld"]')?.getAttribute("data-open")).toBe(
      "false",
    );
  },
};

export const FailedSection: Story = {
  name: "Section that failed to load",
  parameters: { state: "Section that failed to load" },
  args: {
    defaultOpenKeys: ["team"],
    sections: [
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
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Failure is contained to its section, and it says whether what is still
    // on screen is complete — CONTENT.md §5.
    await canvas.findByText(/may be incomplete/);
    await canvas.findByText("Could not load");
  },
};

export const NoSections: Story = {
  name: "No sections",
  parameters: { state: "No sections" },
  args: { sections: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // An empty record still names whose it is, so it cannot be mistaken for a
    // component that failed to render.
    await canvas.findByText(/Ada Lovelace/);
    expect(canvasElement.querySelectorAll("button.ox-accordion__trigger")).toHaveLength(0);
  },
};
