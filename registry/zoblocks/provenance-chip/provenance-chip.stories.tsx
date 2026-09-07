/**
 * Stories for ProvenanceChip.
 *
 * `parameters.state` ties each to a state declared in
 * `provenance-chip.meta.ts`, and the build asserts the two agree in both
 * directions.
 *
 * Every story renders the chip beside a value, because that is the only place
 * it belongs: it is an affix, and shown on its own it reads as a badge with a
 * meaning of its own rather than a qualifier on somebody else's number.
 */

import type { Meta, StoryObj } from "@zoblocks/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import {
  ProvenanceChip,
  ledgerFrom,
  type ProvenanceRecord,
  type StalenessPolicy,
} from "./provenance-chip";

const NOW = "2026-08-12T10:00:00Z";

/** Two days for a device reading, a month for self-report, silence otherwise. */
const POLICY: StalenessPolicy = (record) => {
  if (record.source === "device") return 48 * 3_600_000;
  if (record.source === "patient-reported") return 30 * 86_400_000;
  return null;
};

/** The chip never appears alone, so neither does it here. */
function Value({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 17, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        128/76
      </span>
      {children}
    </span>
  );
}

const meta: Meta<typeof ProvenanceChip> = {
  title: "Clinical/Provenance Chip",
  component: ProvenanceChip,
  args: { now: NOW, stalenessPolicy: POLICY },
};

export default meta;
type Story = StoryObj<typeof ProvenanceChip>;

const story = (record: ProvenanceRecord): Story["render"] =>
  function Render(args) {
    return (
      <Value>
        <ProvenanceChip {...args} record={record} />
      </Value>
    );
  };

/* ------------------------------------------------------------------ */
/* Six sources                                                         */
/* ------------------------------------------------------------------ */

export const Clinic: Story = {
  name: "Clinic",
  parameters: { state: "Clinic — measured in the room" },
  render: story({
    source: "clinic",
    observedAt: "2026-08-12T09:48:00Z",
    performer: { display: "M. Adeyemi", role: "MA" },
    device: "Welch Allyn 6000",
  }),
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole("img");
    expect(chip.getAttribute("aria-label")).toContain("observed by M. Adeyemi, MA");
    expect(chip.getAttribute("aria-label")).toContain("Welch Allyn 6000");
  },
};

export const HomeDevice: Story = {
  name: "Home device",
  parameters: { state: "Home device, with its caveats" },
  render: story({
    source: "device",
    observedAt: "2026-08-08T08:10:00Z",
    device: "Omron BP7450",
    deviceNote: "unvalidated cuff size, median of 3",
  }),
  play: async ({ canvasElement }) => {
    // The caveats are why a home reading is not a clinic reading.
    expect(within(canvasElement).getByRole("img").getAttribute("aria-label")).toContain(
      "unvalidated cuff size",
    );
    expect(canvasElement.querySelector("[data-zb-staleness='stale']")).toBeTruthy();
  },
};

export const PatientReported: Story = {
  name: "Patient-reported",
  parameters: { state: "Patient-reported — the instrument" },
  render: story({ source: "patient-reported", observedAt: "2026-08-11T20:00:00Z" }),
  play: async ({ canvasElement }) => {
    // Self-report is the primary instrument in behavioral health. Styling it
    // as a defect teaches staff to distrust the right answer.
    const chip = within(canvasElement).getByRole("img");
    expect(chip.hasAttribute("data-zb-unconfirmed")).toBe(false);
    expect(chip.textContent).not.toMatch(/unreviewed/i);
  },
};

export const External: Story = {
  name: "External",
  parameters: { state: "External, with the exchange named" },
  render: story({
    source: "external",
    organisation: "Northgate Family Med",
    exchange: "Carequality",
    document: "C-CDA, authored 11 Mar",
    observedAt: "2026-01-14T09:00:00Z",
    recordedAt: "2026-03-11T00:00:00Z",
  }),
  play: async ({ canvasElement }) => {
    // "External" alone tells a reader nothing they can act on.
    expect(within(canvasElement).getByRole("img").getAttribute("aria-label")).toContain(
      "Northgate Family Med via Carequality",
    );
  },
};

export const Extracted: Story = {
  name: "AI-extracted, unconfirmed",
  parameters: { state: "AI-extracted, unconfirmed" },
  render: (args) => (
    <Value>
      <ProvenanceChip
        {...args}
        record={{
          source: "ai-extracted",
          model: "oxy-extract-3",
          span: { document: "Scanned referral", page: 2, line: 14 },
          confirmed: false,
        }}
        onOpenSpan={() => {}}
      />
    </Value>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The row that will matter most in three years: it names the model, links
    // the span, and states that no human has confirmed it.
    expect(canvas.getByRole("img")).toHaveTextContent("unreviewed");
    const span = canvas.getByRole("button", { name: /View the source span/ });
    await userEvent.click(span);
  },
};

export const ExtractedConfirmed: Story = {
  name: "AI-extracted, confirmed",
  parameters: { state: "AI-extracted, confirmed by a clinician" },
  render: story({
    source: "ai-extracted",
    model: "oxy-extract-3",
    span: { document: "Scanned referral", page: 2, line: 14 },
    confirmed: true,
    confirmedBy: { display: "Dr Warren" },
  }),
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole("img");
    expect(chip.textContent).not.toMatch(/unreviewed/i);
    expect(chip.getAttribute("aria-label")).toContain("confirmed by Dr Warren");
  },
};

export const Amended: Story = {
  name: "Amended",
  parameters: { state: "Amended — the original retained" },
  render: story({
    source: "amended",
    recordedAt: "2026-08-12T09:20:00Z",
    supersedes: { value: "182/76", reason: "corrected by the author 40 min later as a typo" },
  }),
  play: async ({ canvasElement }) => {
    // Both versions retained: the correction is the record, not a replacement
    // of it.
    expect(within(canvasElement).getByRole("img").getAttribute("aria-label")).toContain(
      "originally 182/76",
    );
  },
};

/* ------------------------------------------------------------------ */
/* Dates and staleness                                                 */
/* ------------------------------------------------------------------ */

export const Stale: Story = {
  name: "Stale against its policy",
  parameters: { state: "Stale against a per-datum policy" },
  render: story({ source: "device", observedAt: "2026-08-05T08:00:00Z", device: "Omron BP7450" }),
  play: async ({ canvasElement }) => {
    // Four days is nothing for a problem list and a lot for a blood pressure,
    // so the threshold is injected rather than shared.
    const age = canvasElement.querySelector("[data-zb-staleness='stale']");
    expect(age).toBeTruthy();
    expect(within(canvasElement).getByRole("img").getAttribute("aria-label")).toContain("stale");
  },
};

export const DocumentVintage: Story = {
  name: "Observed long before recorded",
  parameters: { state: "Observed long before it was recorded" },
  render: (args) => (
    <Value>
      <ProvenanceChip
        {...args}
        stalenessPolicy={() => 7 * 86_400_000}
        record={{
          source: "external",
          organisation: "Northgate Family Med",
          exchange: "Carequality",
          document: "C-CDA, authored 11 Mar",
          observedAt: "2026-01-14T09:00:00Z",
          recordedAt: "2026-03-11T00:00:00Z",
        }}
      />
    </Value>
  ),
  play: async ({ canvasElement }) => {
    // Seven months from the observation, not five from the document. Measuring
    // from the receipt is how a nine-week-old reading is acted on as current.
    expect(canvasElement.querySelector(".zb-prov__age")).toHaveTextContent("7 mo");
  },
};

/* ------------------------------------------------------------------ */
/* Presentation and plumbing                                           */
/* ------------------------------------------------------------------ */

export const GlyphOnly: Story = {
  name: "Glyph only",
  parameters: { state: "Glyph only, in a dense grid" },
  render: (args) => (
    <div style={{ display: "grid", gap: 6 }}>
      {(
        [
          { source: "clinic", observedAt: "2026-08-12T09:48:00Z" },
          { source: "device", observedAt: "2026-08-08T08:10:00Z" },
          { source: "patient-reported", observedAt: "2026-08-11T20:00:00Z" },
          { source: "ai-extracted", model: "oxy-extract-3", confirmed: false },
        ] as ProvenanceRecord[]
      ).map((record, index) => (
        <Value key={index}>
          <ProvenanceChip {...args} record={record} glyphOnly />
        </Value>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const chips = within(canvasElement).getAllByRole("img");
    expect(chips).toHaveLength(4);
    // The word is gone from the face and still in the name.
    expect(chips[0]?.textContent).not.toContain("Clinic");
    expect(chips[0]?.getAttribute("aria-label")).toContain("clinic");
  },
};

export const Chain: Story = {
  name: "Chain reachable",
  parameters: { state: "Chain reachable" },
  render: (args) => (
    <Value>
      <ProvenanceChip
        {...args}
        record={{
          source: "clinic",
          observedAt: "2026-08-12T09:48:00Z",
          performer: { display: "M. Adeyemi", role: "MA" },
          recorder: { display: "J. Ruiz, RN" },
          device: "Welch Allyn 6000",
        }}
        onOpenChain={() => {}}
      />
    </Value>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button");
    expect(button.tagName).toBe("BUTTON");
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
  },
};

export const SpanReachable: Story = {
  name: "Span reachable",
  parameters: { state: "Span reachable" },
  render: (args) => (
    <Value>
      <ProvenanceChip
        {...args}
        record={{
          source: "ai-extracted",
          model: "oxy-extract-3",
          span: { document: "Scanned referral", page: 2, line: 14 },
          confirmed: false,
        }}
        onOpenChain={() => {}}
        onOpenSpan={() => {}}
      />
    </Value>
  ),
  play: async ({ canvasElement }) => {
    // Two affordances, and the span is its own because jumping to it is the
    // single most requested behaviour from clinicians reviewing extraction.
    const canvas = within(canvasElement);
    expect(canvas.getAllByRole("button")).toHaveLength(2);
    await userEvent.click(canvas.getByRole("button", { name: /View the source span/ }));
  },
};

export const NoLedgerEntry: Story = {
  name: "No ledger entry",
  parameters: {
    state: "No ledger entry — renders nothing",
    // The one story that deliberately renders no component. A chip reading
    // "unknown" beside every unmapped value teaches readers to ignore the
    // whole column, so absence is the designed behaviour rather than a gap.
    skipVrt: true,
  },
  // Deliberately renders nothing: a chip reading "unknown" beside every
  // unmapped value teaches readers to ignore the whole column.
  render: (args) => (
    <Value>
      <ProvenanceChip
        {...args}
        resourceId="missing"
        ledger={ledgerFrom({ "obs-1": { source: "clinic" } })}
      />
    </Value>
  ),
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).queryByRole("img")).toBeNull();
    // The value is still there. Only the affix is absent, which is the point.
    expect(canvasElement.textContent).toContain("128/76");
  },
};
