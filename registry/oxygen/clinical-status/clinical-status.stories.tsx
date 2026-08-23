/**
 * Stories for ClinicalStatus.
 *
 * Written once, consumed four ways (ADR 0007): as documentation, as the
 * visual-regression fixture, as the accessibility fixture, and — through play
 * functions — as the interaction test.
 *
 * `parameters.state` ties each story to a state declared in
 * `clinical-status.meta.ts`, and the build asserts the two agree in both
 * directions. The exhaustive per-step coverage lives in the unit suite, which
 * walks all forty; these are the eighteen a reader needs to *see*, because
 * seeing them side by side is the only way the component's argument lands —
 * that the shape and the word carry the state once the hue is gone.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import { ClinicalStatus, SCALES, StatusLegend } from "./clinical-status";

const meta: Meta<typeof ClinicalStatus> = {
  title: "Clinical/Clinical Status",
  component: ClinicalStatus,
  args: { scale: "criticality", step: "critical" },
};

export default meta;
type Story = StoryObj<typeof ClinicalStatus>;

/* ------------------------------------------------------------------ */
/* Criticality — the scale every product gets wrong first              */
/* ------------------------------------------------------------------ */

export const Critical: Story = {
  name: "Critical — the panic value",
  parameters: { state: "Critical — the panic value" },
  args: { scale: "criticality", step: "critical", qualifier: "resulted 41 minutes ago" },
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole("img");
    // The whole sentence, not five nodes for a screen reader to assemble.
    expect(chip.getAttribute("aria-label")).toBe("Criticality: Critical, resulted 41 minutes ago");
    // A filled triangle. Remove the hue and this is what is left.
    expect(chip.querySelector("[data-ox-glyph='alert']")).toBeTruthy();
  },
};

export const High: Story = {
  name: "High — outside the range, not dangerous",
  parameters: { state: "High — outside the range, not dangerous" },
  args: { scale: "criticality", step: "high" },
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole("img");
    // A hollow triangle against critical's filled one. `H` and `HH` are
    // different clinical facts, and an alert list that flattens them is noise.
    expect(chip.querySelector("[data-ox-glyph='caution']")).toBeTruthy();
    expect(chip.getAttribute("data-ox-tone")).toBe("high");
  },
};

export const Normal: Story = {
  name: "Normal",
  parameters: { state: "Normal" },
  args: { scale: "criticality", step: "normal" },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole("img")).toHaveTextContent("Normal");
  },
};

export const NotAssessed: Story = {
  name: "Not assessed",
  parameters: { state: "Not assessed — absence as a fact" },
  args: { scale: "criticality", step: "not-assessed" },
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole("img");
    // Hatched, not blank. "Nobody checked" is a finding, and rendering it as
    // an em dash makes it indistinguishable from a rendering bug.
    expect(chip.querySelector("[data-ox-glyph='unknown']")).toBeTruthy();
    expect(chip.getAttribute("aria-label")).toBe("Criticality: Not assessed");
  },
};

/* ------------------------------------------------------------------ */
/* Result lifecycle                                                    */
/* ------------------------------------------------------------------ */

export const Preliminary: Story = {
  name: "Preliminary — in flight",
  parameters: { state: "Preliminary — in flight" },
  args: { scale: "result-status", step: "preliminary" },
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole("img");
    expect(chip.querySelector("[data-ox-glyph='pending']")).toBeTruthy();
    // Not focusable: there is nothing to open unless the host says so.
    expect(within(canvasElement).queryByRole("button")).toBeNull();
  },
};

export const Corrected: Story = {
  name: "Corrected — the value changed",
  parameters: { state: "Corrected — the value changed" },
  args: { scale: "result-status", step: "corrected", qualifier: "was 4.1 at 06:20" },
  play: async ({ canvasElement }) => {
    // The qualifier carries what changed, inside the name, because the
    // clinician's memory of the old number is the actual hazard.
    expect(within(canvasElement).getByRole("img").getAttribute("aria-label")).toContain(
      "was 4.1 at 06:20",
    );
  },
};

export const EnteredInError: Story = {
  name: "Entered in error",
  parameters: { state: "Entered in error" },
  args: { scale: "result-status", step: "entered-in-error", audience: "patient" },
  play: async ({ canvasElement }) => {
    // In the patient register, because this is the state most likely to be
    // read by the person the record is about — and "entered in error" is a
    // system word, not a sentence.
    expect(within(canvasElement).getByRole("img")).toHaveTextContent("Recorded by mistake");
  },
};

/* ------------------------------------------------------------------ */
/* Access                                                              */
/* ------------------------------------------------------------------ */

export const Restricted: Story = {
  name: "Restricted",
  parameters: { state: "Restricted — present, gated, explained" },
  args: { scale: "access", step: "restricted" },
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole("img");
    expect(chip.querySelector("[data-ox-glyph='locked']")).toBeTruthy();
    expect(chip.getAttribute("data-ox-tone")).toBe("restricted");
  },
};

export const Part2: Story = {
  name: "Part 2 segmented",
  parameters: { state: "Part 2 segmented" },
  args: { scale: "access", step: "part-2" },
  play: async ({ canvasElement }) => {
    // Its own step, not a flavour of restricted: 42 CFR Part 2 has a different
    // re-disclosure rule from HIPAA minimum-necessary, and a UI that renders
    // them the same teaches staff that they are the same.
    expect(within(canvasElement).getByRole("img")).toHaveTextContent("Part 2 segmented");
  },
};

export const BreakGlass: Story = {
  name: "Break-glass open",
  parameters: { state: "Break-glass open" },
  args: { scale: "access", step: "break-glass" },
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole("img");
    // The open shackle is offset rather than merely rotated — the difference
    // between locked and unlocked has to survive at 8px.
    expect(chip.querySelector("[data-ox-glyph='unlocked']")).toBeTruthy();
    expect(chip.getAttribute("data-ox-tone")).toBe("critical");
  },
};

/* ------------------------------------------------------------------ */
/* Data quality                                                        */
/* ------------------------------------------------------------------ */

export const Stale: Story = {
  name: "Stale — true once",
  parameters: { state: "Stale — true once" },
  args: { scale: "data-quality", step: "stale", qualifier: "last confirmed 14 months ago" },
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole("img");
    expect(chip.querySelector("[data-ox-glyph='stale']")).toBeTruthy();
    expect(chip.getAttribute("aria-label")).toContain("14 months ago");
  },
};

export const SelfReported: Story = {
  name: "Self-reported",
  parameters: { state: "Self-reported" },
  args: { scale: "data-quality", step: "self-reported" },
  play: async ({ canvasElement }) => {
    // Half-filled: the record exists, and the system of record did not make it.
    expect(
      within(canvasElement).getByRole("img").querySelector("[data-ox-glyph='reported']"),
    ).toBeTruthy();
  },
};

/* ------------------------------------------------------------------ */
/* AI and behavioral health — the two no generic library models        */
/* ------------------------------------------------------------------ */

export const AiDraft: Story = {
  name: "AI draft",
  parameters: { state: "AI draft, awaiting a clinician" },
  args: { scale: "ai-verification", step: "ai-draft" },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole("img").getAttribute("aria-label")).toBe(
      "AI verification: AI draft",
    );
  },
};

export const Disengaged: Story = {
  name: "Disengaged",
  parameters: { state: "Disengaged — behavioral health" },
  args: { scale: "engagement", step: "disengaged", qualifier: "4 missed appointments" },
  play: async ({ canvasElement }) => {
    // Engagement drives outreach, and no generic component library ships it.
    expect(within(canvasElement).getByRole("img").getAttribute("aria-label")).toBe(
      "Engagement: Disengaged, 4 missed appointments",
    );
  },
};

/* ------------------------------------------------------------------ */
/* Presentations                                                       */
/* ------------------------------------------------------------------ */

export const Dot: Story = {
  name: "Dot, in a status column",
  parameters: { state: "Dot, in a status column" },
  render: (args) => (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {SCALES.criticality.steps.map((step) => (
          <ClinicalStatus key={step.id} {...args} scale="criticality" step={step.id} shape="dot" />
        ))}
      </div>
      {/* Never without one of these. A dot carries a single visible channel,
          and the legend is what makes that safe. */}
      <StatusLegend scale="criticality" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dots = canvas.getAllByRole("img");
    expect(dots.length).toBeGreaterThanOrEqual(SCALES.criticality.steps.length);
    // No visible word, and the full word still in the name.
    expect(dots[0]?.textContent).toBe("");
    expect(dots[0]?.getAttribute("aria-label")).toBe("Criticality: Critical");
    expect(canvas.getByLabelText("Criticality legend")).toBeTruthy();
  },
};

export const GridAffix: Story = {
  name: "Grid affix, at forty rows",
  parameters: { state: "Grid affix, at forty rows" },
  render: (args) => (
    <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
      <caption style={{ captionSide: "top", textAlign: "left", paddingBlockEnd: 8 }}>
        Chemistry panel
      </caption>
      <tbody>
        {[
          ["Sodium", "139 mmol/L", "final"],
          ["Potassium", "6.8 mmol/L", "final"],
          ["TSH", "3.1 mIU/L", "preliminary"],
          ["HbA1c", "52 mmol/mol", "corrected"],
        ].map(([analyte, value, step]) => (
          <tr key={analyte}>
            <td style={{ padding: "4px 12px 4px 0" }}>{analyte}</td>
            <td style={{ padding: "4px 12px 4px 0", fontVariantNumeric: "tabular-nums" }}>
              {value}
            </td>
            <td style={{ padding: "4px 0" }}>
              <ClinicalStatus
                {...args}
                scale="result-status"
                step={step as string}
                shape="affix"
                density="compact"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  play: async ({ canvasElement }) => {
    // At forty rows, forty chips is a colour field with a table behind it.
    const affixes = within(canvasElement).getAllByRole("img");
    expect(affixes).toHaveLength(4);
    expect(affixes[0]).toHaveTextContent("FIN");
    expect(affixes[2]).toHaveTextContent("PREL");
  },
};

export const Compact: Story = {
  name: "Compact density",
  parameters: { state: "Compact density" },
  args: { scale: "criticality", step: "moderate", density: "compact" },
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole("img");
    expect(chip.getAttribute("data-ox-density")).toBe("compact");
    // Density changes the chip, never the word.
    expect(chip).toHaveTextContent("Moderate");
  },
};

export const Explainable: Story = {
  name: "Explainable",
  parameters: { state: "Explainable — the chip is a button" },
  args: { scale: "result-status", step: "preliminary" },
  render: (args) => (
    <ClinicalStatus
      {...args}
      onExplain={(step) => {
        // A real host opens a definition. The story asserts the affordance
        // rather than the panel, which belongs to the surface around it.
        const target = document.getElementById("ox-cs-explain");
        if (target) target.textContent = step.clinician;
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Result status: Preliminary" });
    expect(button.tagName).toBe("BUTTON");

    // Keyboard, because the reason the affordance exists — that guessing what
    // "preliminary" means is a clinical act — applies to every reader.
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
  },
};
