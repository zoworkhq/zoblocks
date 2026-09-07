/**
 * Stories for ResultValue.
 *
 * Written once, consumed four ways (ADR 0007). `parameters.state` ties each to
 * a state declared in `result-value.meta.ts`, and the build asserts the two
 * agree in both directions.
 *
 * Eighteen stories, and eight of them are absences. That ratio is the
 * component: every other library ships the first two and calls the rest an
 * edge case, and the rest are where a clinician is misled.
 *
 * `NOW` is frozen so the relative ages say the same thing every day — and
 * because the component takes the clock as a prop precisely so that a story, a
 * test and a ward workstation can each supply their own.
 */

import type { Meta, StoryObj } from "@zoblocks/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import { ResultValue, type ResultValueData } from "./result-value";

const NOW = "2026-08-12T10:41:00Z";
const RESULTED = "2026-08-12T10:00:00Z";
const EARLIER = "2026-08-12T06:00:00Z";

const potassium: ResultValueData = {
  id: "k",
  versionId: "1",
  analyte: "Potassium",
  value: 6.8,
  unit: "mmol/L",
  interpretation: "critical",
  range: { low: 3.5, high: 5.1 },
  status: "final",
  resultedAt: RESULTED,
};

const meta: Meta<typeof ResultValue> = {
  title: "Clinical/Result Value",
  component: ResultValue,
  args: { now: NOW, value: potassium },
};

export default meta;
type Story = StoryObj<typeof ResultValue>;

/* ------------------------------------------------------------------ */
/* Present values                                                      */
/* ------------------------------------------------------------------ */

export const FinalInRange: Story = {
  name: "Final, in range",
  parameters: { state: "Final, in range" },
  args: {
    value: {
      id: "na",
      analyte: "Sodium",
      value: 139,
      unit: "mmol/L",
      range: { low: 135, high: 145 },
      status: "final",
      resultedAt: RESULTED,
    },
  },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group");
    expect(group).toHaveTextContent("139");
    expect(group).toHaveTextContent("135–145");
    // Derived, not stated — and it says "within the reference range" rather
    // than the bare word, because "normal" alone is a claim about a person.
    expect(group.getAttribute("aria-label")).toContain("within the reference range");
  },
};

export const CriticalWithDelta: Story = {
  name: "Critical, with a delta",
  parameters: { state: "Critical, with a delta" },
  args: { value: { ...potassium, prior: { value: 4.7, at: EARLIER } } },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group");
    // Direction is a glyph and a signed number before it is a hue.
    expect(canvasElement.querySelector("[data-zb-direction='up']")).toBeTruthy();
    expect(group.getAttribute("aria-label")).toBe(
      "Potassium 6.8 millimoles per litre, critical, reference 3.5 to 5.1, final, up 2.1 over 4 hours, resulted 41 minutes ago.",
    );
  },
};

export const Preliminary: Story = {
  name: "Preliminary",
  parameters: { state: "Preliminary — not verified by the laboratory" },
  args: {
    value: {
      id: "tsh",
      analyte: "TSH",
      value: 6.4,
      unit: "mIU/L",
      range: { low: 0.4, high: 4.0 },
      status: "preliminary",
      resultedAt: RESULTED,
    },
  },
  play: async ({ canvasElement }) => {
    // The clinician acts on it; the value changes at 04:00. So the status is
    // never implicit, and the word is never left to carry itself.
    expect(within(canvasElement).getByRole("group").getAttribute("aria-label")).toContain(
      "preliminary, not verified by the laboratory",
    );
  },
};

export const Corrected: Story = {
  name: "Corrected",
  parameters: { state: "Corrected — the superseded value is shown" },
  args: {
    value: {
      id: "trop",
      versionId: "2",
      analyte: "Troponin I",
      value: 0.09,
      unit: "ng/mL",
      range: { high: 0.04 },
      status: "corrected",
      superseded: { value: "<0.04", at: "14:22 today" },
      resultedAt: RESULTED,
    },
  },
  play: async ({ canvasElement }) => {
    // The hazard is the reader's memory of the old number, and a badge saying
    // "corrected" does not address it. The old number, struck through, does.
    const struck = canvasElement.querySelector(".zb-rv__superseded s");
    expect(struck).toHaveTextContent("<0.04");
    expect(within(canvasElement).getByRole("group")).toHaveTextContent("14:22 today");
  },
};

export const NoRange: Story = {
  name: "No reference range",
  parameters: { state: "No reference range for this patient" },
  args: {
    value: {
      id: "fer",
      analyte: "Ferritin",
      value: 212,
      unit: "ng/mL",
      noRangeReason: "Lab supplied no range · not asserted normal",
      status: "final",
    },
  },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group");
    // Silence is not a normal result. Nothing beside a number reads as in range.
    expect(group).toHaveTextContent("not asserted normal");
    expect(group.getAttribute("aria-label")).toContain("not interpreted");
  },
};

export const QualifiedRange: Story = {
  name: "A range that needs its qualification",
  parameters: { state: "A range that needs its qualification" },
  args: {
    value: {
      id: "li",
      analyte: "Lithium level",
      value: 0.9,
      unit: "mmol/L",
      range: { low: 0.6, high: 1.2, appliesTo: "maintenance" },
      status: "final",
      notes: ["12 h post-dose · trough assumed"],
    },
  },
  play: async ({ canvasElement }) => {
    // 0.9 is therapeutic for maintenance and low for acute mania. A bare
    // 0.6–1.2 cannot tell a reader which one they are looking at.
    const group = within(canvasElement).getByRole("group");
    expect(group).toHaveTextContent("maintenance");
    expect(group.getAttribute("aria-label")).toContain("reference 0.6 to 1.2, maintenance");
  },
};

export const DeltaSuppressed: Story = {
  name: "Delta suppressed",
  parameters: { state: "Delta suppressed — the method changed" },
  args: {
    value: {
      id: "tsh2",
      analyte: "TSH",
      value: 6.4,
      unit: "mIU/L",
      range: { low: 0.4, high: 4.0 },
      status: "final",
      prior: { value: 3.1, at: EARLIER, differentMethod: true },
    },
  },
  play: async ({ canvasElement }) => {
    // Two numbers from two assays subtracted from each other is not a delta,
    // and an annotated wrong number still gets read as a number.
    expect(canvasElement.querySelector(".zb-rv__delta")).toBeNull();
    expect(within(canvasElement).getByRole("group").getAttribute("aria-label")).not.toContain("up");
  },
};

export const PatientReported: Story = {
  name: "Patient-reported",
  parameters: { state: "Patient-reported" },
  args: {
    value: {
      id: "bp",
      analyte: "Home systolic",
      value: 148,
      unit: "mmHg",
      provenance: "patient-reported",
      status: "final",
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("[data-zb-provenance='patient-reported']")).toBeTruthy();
    expect(within(canvasElement).getByRole("group").getAttribute("aria-label")).toContain(
      "patient-reported",
    );
  },
};

export const AiExtracted: Story = {
  name: "Extracted by a model",
  parameters: { state: "Extracted by a model" },
  args: {
    value: {
      id: "ef",
      analyte: "Ejection fraction",
      value: 42,
      unit: "%",
      provenance: "ai-extracted",
      status: "preliminary",
      notes: ["From an outside echocardiography report"],
    },
  },
  play: async ({ canvasElement }) => {
    // Where a number came from changes how much it is worth, and a value a
    // model lifted out of a PDF is not the same as one a lab released.
    expect(canvasElement.querySelector("[data-zb-provenance='ai-extracted']")).toBeTruthy();
  },
};

/* ------------------------------------------------------------------ */
/* Absence — seven reasons, seven sentences, no em dash                */
/* ------------------------------------------------------------------ */

type ResultAbsence = NonNullable<ResultValueData["absent"]>;

function absence(id: string, analyte: string, absent: ResultAbsence, detail?: string) {
  const value: ResultValueData = { id, analyte, absent };
  if (detail) value.absentDetail = detail;
  return value;
}

export const NotOrdered: Story = {
  name: "Never ordered",
  parameters: { state: "Absent — never ordered" },
  args: {
    value: absence(
      "a1",
      "HbA1c",
      "not-ordered",
      "No HbA1c has ever been ordered for this patient.",
    ),
  },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group");
    expect(group.textContent).not.toContain("—");
    expect(group).toHaveTextContent("has ever been ordered");
  },
};

export const Awaiting: Story = {
  name: "Awaiting a result",
  parameters: { state: "Absent — awaiting a result" },
  args: {
    value: absence("a2", "Chemistry panel", "awaiting", "Collected 09:14. Expected by 15:00."),
  },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole("group")).toHaveTextContent("Expected by 15:00");
  },
};

export const Cancelled: Story = {
  name: "Cancelled",
  parameters: { state: "Absent — cancelled" },
  args: {
    value: absence("a3", "Chest X-ray", "cancelled", "Cancelled by ordering provider, 08:40."),
  },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole("group")).toHaveTextContent("ordering provider");
  },
};

export const SpecimenProblem: Story = {
  name: "Specimen problem",
  parameters: { state: "Absent — specimen problem" },
  args: {
    value: absence("a4", "Potassium", "specimen-problem", "Haemolysed. Recollection requested."),
  },
  play: async ({ canvasElement }) => {
    // Haemolysis raises potassium. Rendering this as a blank beside a normal
    // sodium invites the reader to assume the potassium was normal too.
    expect(within(canvasElement).getByRole("group")).toHaveTextContent("Haemolysed");
  },
};

export const Declined: Story = {
  name: "Patient declined",
  parameters: { state: "Absent — patient declined" },
  args: { value: absence("a5", "Toxicology", "declined", "Patient declined the draw on 3 Aug.") },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole("group")).toHaveTextContent("declined the draw");
  },
};

export const Masked: Story = {
  name: "Restricted",
  parameters: { state: "Absent — restricted, and a value exists" },
  args: { value: absence("a6", "Substance use screen", "masked") },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group");
    // The one absence that is not a gap. Rendering it as "not ordered" would
    // be a lie about the record rather than merely a vague answer.
    expect(group.getAttribute("data-zb-absent")).toBe("masked");
    expect(group).toHaveTextContent("A result exists and you are not permitted to see it");
  },
};

export const NoReason: Story = {
  name: "No value and no reason",
  parameters: { state: "Absent — no value and no reason" },
  args: { value: absence("a7", "TSH", "unknown") },
  play: async ({ canvasElement }) => {
    // A source system that sent neither has a defect, and the interface says
    // so rather than absorbing it into a blank cell.
    expect(within(canvasElement).getByRole("group")).toHaveTextContent("data-quality defect");
  },
};

/* ------------------------------------------------------------------ */
/* Presentation                                                        */
/* ------------------------------------------------------------------ */

export const InAGrid: Story = {
  name: "Compact, in a grid",
  parameters: { state: "Compact, in a grid" },
  render: (args) => (
    <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 420 }}>
      <thead>
        <tr>
          <th
            style={{ textAlign: "left", padding: "4px 16px 8px 0", fontWeight: 500, opacity: 0.6 }}
          >
            Analyte
          </th>
          <th style={{ textAlign: "left", padding: "4px 0 8px", fontWeight: 500, opacity: 0.6 }}>
            Result
          </th>
        </tr>
      </thead>
      <tbody>
        {(
          [
            {
              id: "na",
              analyte: "Sodium",
              value: 139,
              unit: "mmol/L",
              range: { low: 135, high: 145 },
              status: "final",
            },
            { ...potassium, prior: { value: 4.7, at: EARLIER } },
            {
              id: "tsh",
              analyte: "TSH",
              value: 6.4,
              unit: "mIU/L",
              range: { low: 0.4, high: 4 },
              status: "preliminary",
            },
            { id: "hba1c", analyte: "HbA1c", absent: "not-ordered" },
          ] as ResultValueData[]
        ).map((row) => (
          <tr key={row.id}>
            <td style={{ padding: "6px 16px 6px 0", verticalAlign: "top", opacity: 0.85 }}>
              {row.analyte}
            </td>
            <td style={{ padding: "6px 0", verticalAlign: "top" }}>
              <ResultValue {...args} value={row} density="compact" hideAnalyte />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  play: async ({ canvasElement }) => {
    const rows = within(canvasElement).getAllByRole("group");
    expect(rows).toHaveLength(4);
    // The analyte is hidden because the column header carries it — and the
    // accessible name still opens with it, because a cell has no header in
    // its accessible context.
    expect(rows[0]?.getAttribute("aria-label")).toContain("Sodium");
    expect(rows[0]?.textContent).not.toContain("Sodium");
  },
};

export const OpensTheReport: Story = {
  name: "Opens the report",
  parameters: { state: "Interactive — opens the report" },
  args: { value: potassium },
  render: (args) => <ResultValue {...args} onOpenReport={() => {}} />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button");
    expect(button.tagName).toBe("BUTTON");
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
  },
};
