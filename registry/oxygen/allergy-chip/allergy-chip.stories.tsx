/**
 * Stories for AllergyChip.
 *
 * `parameters.state` ties each to a state declared in `allergy-chip.meta.ts`,
 * and the build asserts the two agree in both directions.
 *
 * The first two stories are the argument. Same substance class, same
 * manifestation, same severity, opposite consequences — and only the
 * criticality field separates them, which is the field most implementations
 * drop. Seeing them adjacent is the only way that lands.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import { AllergyChip, AllergyList, type AllergyRecord } from "./allergy-chip";

const penicillin: AllergyRecord = {
  id: "1",
  substance: "Penicillin G",
  kind: "allergy",
  criticality: "high",
  verification: "confirmed",
  reactions: [{ manifestation: "Urticaria", severity: "mild", onset: "1998", note: "age 6" }],
};

const betaLactam = (substance: string) =>
  substance.startsWith("Penicillin") ? { label: "beta-lactam", count: 12 } : null;

const meta: Meta<typeof AllergyChip> = {
  title: "Clinical/Allergy Chip",
  component: AllergyChip,
  args: { record: penicillin },
};

export default meta;
type Story = StoryObj<typeof AllergyChip>;

/* ------------------------------------------------------------------ */
/* The argument                                                        */
/* ------------------------------------------------------------------ */

export const HighCriticality: Story = {
  name: "High criticality, mild past reaction",
  parameters: { state: "High criticality, mild past reaction" },
  args: { record: penicillin },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group");
    // Future risk is a chip with a shape; the past is plain secondary text.
    expect(canvasElement.querySelector("[data-ox-step='critical']")).toBeTruthy();
    expect(group).toHaveTextContent("Urticaria");
    expect(group.getAttribute("aria-label")).toContain("high criticality");
  },
};

export const LowCriticality: Story = {
  name: "Low criticality, same manifestation",
  parameters: { state: "Low criticality, same manifestation" },
  args: {
    record: {
      id: "2",
      substance: "Amoxicillin",
      kind: "allergy",
      criticality: "low",
      verification: "unconfirmed",
      reactions: [{ manifestation: "Urticaria", severity: "mild", onset: "2019" }],
    },
  },
  play: async ({ canvasElement }) => {
    // Same reaction as the story above, opposite consequence. If these two
    // render alike, the component has failed at the only thing it is for.
    const group = within(canvasElement).getByRole("group");
    expect(group.getAttribute("data-ox-criticality")).toBe("low");
    expect(group).toHaveTextContent("Urticaria");
  },
};

export const Intolerance: Story = {
  name: "Intolerance, not an allergy",
  parameters: { state: "Intolerance, not an allergy" },
  args: {
    record: {
      id: "3",
      substance: "Lithium carbonate",
      kind: "intolerance",
      criticality: "unable-to-assess",
      verification: "confirmed",
      reactions: [
        {
          manifestation: "Tremor, polyuria",
          severity: "moderate",
          note: "ongoing at therapeutic level",
        },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    // The entries most often lost from a psychotropic history, because
    // somebody decided they were not real allergies.
    expect(within(canvasElement).getByRole("group").getAttribute("aria-label")).toMatch(
      /^Intolerance: Lithium carbonate/,
    );
  },
};

export const Refuted: Story = {
  name: "Refuted after a rechallenge",
  parameters: { state: "Refuted after a rechallenge" },
  args: {
    record: {
      id: "4",
      substance: "Sulfa drugs",
      kind: "allergy",
      verification: "refuted",
      note: "Rechallenged 2024 · tolerated · refuted by allergist",
    },
  },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group");
    // Kept, not deleted. A refuted allergy that vanishes gets re-reported at
    // the next intake, and the rechallenge is the most useful thing here.
    expect(group.hasAttribute("data-ox-inactive")).toBe(true);
    expect(group).toHaveTextContent("Rechallenged 2024");
  },
};

export const EnteredInError: Story = {
  name: "Entered in error",
  parameters: { state: "Entered in error" },
  args: {
    record: {
      id: "5",
      substance: "Iodine contrast",
      kind: "allergy",
      verification: "entered-in-error",
      note: "Recorded against the wrong patient",
    },
  },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole("group").hasAttribute("data-ox-inactive")).toBe(true);
  },
};

export const Unconfirmed: Story = {
  name: "Unconfirmed",
  parameters: { state: "Unconfirmed — reported at intake" },
  args: {
    record: {
      id: "6",
      substance: "Shellfish",
      kind: "allergy",
      criticality: "low",
      verification: "unconfirmed",
      note: "Reported by patient at intake",
      reactions: [{ manifestation: "Lip swelling", severity: "mild" }],
    },
  },
  play: async ({ canvasElement }) => {
    // Changes what you do — a conversation rather than a contraindication —
    // so it is present, and it is a hairline affix rather than a second chip.
    expect(canvasElement.querySelector(".ox-allergy__verification")).toHaveTextContent(
      "Unconfirmed",
    );
  },
};

export const UnableToAssess: Story = {
  name: "Unable to assess",
  parameters: { state: "Unable to assess" },
  args: {
    record: {
      id: "7",
      substance: "Unknown antibiotic",
      kind: "adverse-reaction",
      criticality: "unable-to-assess",
      verification: "unable-to-verify",
      note: "Patient recalls a reaction in childhood; agent unknown",
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("[data-ox-step='not-assessed']")).toBeTruthy();
  },
};

export const NoReactionRecorded: Story = {
  name: "No reaction recorded",
  parameters: { state: "No reaction recorded" },
  args: {
    record: {
      id: "8",
      substance: "Codeine",
      kind: "allergy",
      criticality: "high",
      verification: "confirmed",
    },
  },
  play: async ({ canvasElement }) => {
    // High risk with nothing behind it reads as a contradiction until you know
    // the two fields answer different questions, so the gap is stated.
    expect(within(canvasElement).getByRole("group")).toHaveTextContent("No reaction recorded");
  },
};

export const ClassExpansion: Story = {
  name: "Substance class expansion",
  parameters: { state: "Substance class expansion" },
  args: { record: penicillin, expandClass: betaLactam },
  play: async ({ canvasElement }) => {
    // Injected, never bundled: knowing that a cephalosporin implicates the
    // beta-lactams requires a terminology service, which is a deployment's
    // concern rather than a chip's.
    expect(within(canvasElement).getByRole("group")).toHaveTextContent("beta-lactam · 12 members");
  },
};

export const Contraindication: Story = {
  name: "Contraindication",
  parameters: { state: "Contraindication" },
  args: {
    record: {
      id: "9",
      substance: "NSAIDs",
      kind: "contraindication",
      criticality: "high",
      verification: "confirmed",
      note: "Stage 4 CKD",
    },
  },
  play: async ({ canvasElement }) => {
    // Neither an allergy nor an intolerance: a reason not to prescribe that
    // has nothing to do with the immune system.
    expect(canvasElement.querySelector(".ox-allergy__kind")).toHaveTextContent("Contraindication");
  },
};

/* ------------------------------------------------------------------ */
/* The two absences                                                    */
/* ------------------------------------------------------------------ */

export const NoKnownAllergies: Story = {
  name: "No known allergies",
  parameters: { state: "No known allergies — asserted" },
  render: () => (
    <AllergyList
      noneKnown={{
        asserter: "R. Okafor, RN",
        assertedAt: "14 Aug 2026",
        context: "reconciled at intake",
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group");
    // A positive clinical finding with an author and a date. Safe to
    // prescribe against, and that is exactly what the author and date buy.
    expect(group).toHaveTextContent("No known allergies");
    expect(group).toHaveTextContent("R. Okafor, RN");
  },
};

export const NotRecorded: Story = {
  name: "Allergy status not recorded",
  parameters: { state: "Allergy status not recorded" },
  render: () => <AllergyList onAsk={() => {}} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Not an empty list. A gap, and a gate.
    expect(canvas.getByRole("group")).toHaveTextContent("Allergy status not recorded");
    const ask = canvas.getByRole("button", { name: "Ask and record" });
    await userEvent.click(ask);
  },
};

export const AssertionWithoutAuthor: Story = {
  name: "An assertion with no author",
  parameters: { state: "An assertion with no author degrades" },
  render: () => <AllergyList noneKnown={{ assertedAt: "14 Aug 2026" }} />,
  play: async ({ canvasElement }) => {
    // An unattributed assertion of absence is not an assertion, and it is the
    // one that gets prescribed against.
    expect(within(canvasElement).getByRole("group")).toHaveTextContent(
      "Allergy status not recorded",
    );
  },
};

/* ------------------------------------------------------------------ */
/* Presentation                                                        */
/* ------------------------------------------------------------------ */

export const Compact: Story = {
  name: "Compact, in a banner",
  parameters: { state: "Compact, in a banner" },
  render: (args) => (
    <AllergyList
      density="compact"
      expandClass={betaLactam}
      records={[
        penicillin,
        {
          id: "2",
          substance: "Amoxicillin",
          kind: "allergy",
          criticality: "low",
          verification: "unconfirmed",
          reactions: [{ manifestation: "Urticaria", severity: "mild", onset: "2019" }],
        },
        {
          id: "3",
          substance: "Lithium carbonate",
          kind: "intolerance",
          criticality: "unable-to-assess",
          verification: "confirmed",
          reactions: [{ manifestation: "Tremor, polyuria", severity: "moderate" }],
        },
      ]}
      {...(args.onOpenDetail ? { onOpenDetail: args.onOpenDetail } : {})}
    />
  ),
  play: async ({ canvasElement }) => {
    const rows = within(canvasElement).getAllByRole("group");
    expect(rows).toHaveLength(3);
    expect(rows[0]?.getAttribute("data-ox-density")).toBe("compact");
  },
};

export const OpensTheHistory: Story = {
  name: "Opens the history",
  parameters: { state: "Interactive — opens the history" },
  render: (args) => <AllergyChip {...args} record={penicillin} onOpenDetail={() => {}} />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button");
    expect(button.tagName).toBe("BUTTON");
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
  },
};
