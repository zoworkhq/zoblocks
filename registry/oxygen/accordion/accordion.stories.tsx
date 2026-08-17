/**
 * Stories for Accordion.
 *
 * Written once, consumed four ways (ADR 0007): as documentation, as the
 * visual-regression fixture, as the accessibility fixture, and — through play
 * functions — as the interaction test.
 *
 * `parameters.state` ties each story to a state declared in accordion.meta.ts.
 * The build asserts the two agree in both directions, so the component cannot
 * claim a state it never demonstrates, and cannot demonstrate one it never
 * declared.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import { Accordion } from "./accordion";
import type { AccordionItem } from "@/lib/oxygen-accordion";

const CHART: AccordionItem[] = [
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
];

const meta: Meta<typeof Accordion> = {
  title: "Disclosure/Accordion",
  component: Accordion,
  args: { items: CHART, headingLevel: 3 },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Closed: Story = {
  name: "Closed",
  parameters: { state: "Closed" },
  args: { items: [{ key: "a", label: "Assessments", children: <p>PHQ-9, GAD-7, C-SSRS.</p> }] },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: /Assessments/ });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    // Hidden, but reachable by find-in-page — which is the difference between
    // a chart that answers Ctrl+F and one that lies to it.
    const panel = canvasElement.querySelector(".ox-accordion__panel");
    expect(panel?.getAttribute("hidden")).toBe("until-found");
  },
};

export const Open: Story = {
  name: "Open",
  parameters: { state: "Open" },
  args: { defaultActiveKey: ["risk"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(
      canvas.getByRole("button", { name: /Risk & suicidality/ }).getAttribute("aria-expanded"),
    ).toBe("true");
    await canvas.findByText(/Ideation 3/);
  },
};

export const SummaryInHeader: Story = {
  name: "Summary in the header",
  parameters: { state: "Summary in the header" },
  play: async ({ canvasElement }) => {
    // Every row is readable closed. That is the component's entire argument
    // against the four-identical-headers reference design.
    const triggers = [...canvasElement.querySelectorAll("button.ox-accordion__trigger")];
    expect(triggers).toHaveLength(3);
    for (const trigger of triggers) {
      expect(trigger.querySelector(".ox-accordion__summary")).not.toBeNull();
    }
  },
};

export const Severity: Story = {
  name: "Severity on the leading edge",
  parameters: { state: "Severity on the leading edge" },
  play: async ({ canvasElement }) => {
    // The rail is drawn from data-severity; the words beside it are what
    // survives forced-colors mode and a monochrome print.
    for (const severity of ["critical", "high", "normal"]) {
      const item = canvasElement.querySelector(`[data-severity="${severity}"]`);
      expect(item).not.toBeNull();
      expect(item?.querySelector(".ox-accordion__summary")?.textContent?.length).toBeGreaterThan(0);
    }
  },
};

export const Pinned: Story = {
  name: "Pinned — cannot be closed",
  parameters: { state: "Pinned — cannot be closed" },
  args: {
    items: [
      {
        key: "signs",
        label: "1 · Signs that things are getting harder",
        children: <p>Sleeping less than four hours.</p>,
      },
      {
        key: "crisis",
        label: "2 · If none of that is working",
        pinned: true,
        severity: "critical",
        summary: "Always open",
        children: <p>988 — Suicide &amp; Crisis Lifeline, 24 hours.</p>,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const crisis = canvas.getByRole("button", { name: /If none of that is working/ });
    expect(crisis.getAttribute("aria-expanded")).toBe("true");
    // APG's exact case: the panel is visible and the accordion prevents
    // collapsing it. It still takes focus, so nobody tabs past it.
    expect(crisis.getAttribute("aria-disabled")).toBe("true");
    await canvas.findByText(/988/);
  },
};

export const AdvisoryGate: Story = {
  name: "Advisory gate",
  parameters: { state: "Advisory gate" },
  args: {
    defaultActiveKey: ["note"],
    onDisclose: () => true,
    items: [
      {
        key: "note",
        label: "Your session summary — 13 August",
        access: { kind: "advisory", notice: "This summary talks about self-harm" },
        children: <p>You and Rachel talked about the last two weeks.</p>,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Expanded, and showing the choice rather than the content. Nothing is
    // recorded either way — the point is that the reader decides.
    await canvas.findByText("This summary talks about self-harm");
    expect(canvasElement.textContent).not.toContain("You and Rachel talked");
    expect(canvas.getByRole("button", { name: "Show it" })).toBeTruthy();
  },
};

export const ReasonGate: Story = {
  name: "Reason gate",
  parameters: { state: "Reason gate" },
  args: {
    defaultActiveKey: ["external"],
    onDisclose: () => true,
    items: [
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
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The reason is collected before the access, not after it.
    expect(canvas.getByLabelText("Reason for access")).toBeTruthy();
    await canvas.findByText("Opening this needs a reason");
    await canvas.findByText(/recorded against your account/);
    expect(canvasElement.textContent).not.toContain("Referral letter");
  },
};

export const ConsentGate: Story = {
  name: "Consent gate",
  parameters: { state: "Consent gate" },
  args: {
    defaultActiveKey: ["sud"],
    onDisclose: () => true,
    items: [
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
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The governing policy is named twice on purpose: once in the header, so a
    // closed section still says what governs it, and once in the gate. The
    // expiry is stated before it lapses rather than after.
    expect((await canvas.findAllByText(/42 CFR Part 2/)).length).toBeGreaterThanOrEqual(2);
    await canvas.findByText(/Consent expires 2027-02-02/);
    expect(canvasElement.textContent).not.toContain("Intensive outpatient");
  },
};

export const ConsentRefused: Story = {
  name: "Consent refused",
  parameters: { state: "Consent refused" },
  args: {
    defaultActiveKey: ["sud"],
    // The application refuses. The component's job is to say so and to keep
    // the content where it was.
    onDisclose: () => false,
    items: [
      {
        key: "sud",
        label: "Substance use treatment",
        access: { kind: "consent", policy: "42 CFR Part 2", state: "missing" },
        children: <p>Intensive outpatient programme.</p>,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Request consent" }));
    // Names what did not happen and what is still usable — CONTENT.md §5.
    await canvas.findByText(/was not opened/);
    expect(canvasElement.textContent).not.toContain("Intensive outpatient");
  },
};

export const Withheld: Story = {
  name: "Withheld",
  parameters: { state: "Withheld" },
  args: {
    items: [
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
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The row exists. Deleting it would claim the record is complete.
    await canvas.findByText("Restricted — not shown");
    await canvas.findByText("Kept separately by the author");
    expect(
      canvas.getByRole("button", { name: /Psychotherapy notes/ }).getAttribute("aria-disabled"),
    ).toBe("true");
  },
};

export const SingleOpen: Story = {
  name: "Single open at a time",
  parameters: { state: "Single open at a time" },
  args: { accordion: true, defaultActiveKey: ["risk"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Medications/ }));
    // One boolean, one behaviour change. The roles are identical to the
    // multi-open story — no tablist appears here.
    expect(canvasElement.querySelectorAll('[role="tab"],[role="tablist"]')).toHaveLength(0);
  },
};

export const Nested: Story = {
  name: "Nested, with heading levels",
  parameters: { state: "Nested, with heading levels" },
  args: {
    headingLevel: 2,
    defaultActiveKey: ["plan"],
    items: [
      {
        key: "plan",
        label: "Treatment plan",
        summary: "3 problems · 7 goals",
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
    ],
  },
  play: async ({ canvasElement }) => {
    // The outline is the navigation model. A nested accordion that hardcoded
    // its level would flatten it, and nothing at runtime would complain.
    expect(canvasElement.querySelectorAll("h2.ox-accordion__heading")).toHaveLength(1);
    expect(canvasElement.querySelectorAll("h3.ox-accordion__heading")).toHaveLength(2);
  },
};
