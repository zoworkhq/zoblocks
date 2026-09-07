/**
 * Stories for Copilot.
 *
 * Written once, consumed four ways (ADR 0007): documentation, the
 * visual-regression fixture, the accessibility fixture, and — through play
 * functions — the interaction test.
 *
 * Every story drives a `createStaticProvider`, so none of this touches a model.
 * That is what makes a copilot demonstrable at all: the states worth capturing
 * are the ones a live model would give you only by luck, and the ones that
 * matter most (crisis, refusal, an answer whose sources do not support it) are
 * the ones you never want to wait for.
 */

import type { Meta, StoryObj } from "@zoblocks/component-meta";
import { expect, waitFor, within } from "../../../test/story-kit";
import {
  createStaticProvider,
  lookUp,
  minimalDisclosure,
  prepare,
  type CopilotEvent,
  type Source,
} from "@zoblocks/copilot-core";
import { Copilot } from "./copilot";

const disclosure = minimalDisclosure("demo-model@1", {
  developer: "Zowork",
  knowledgeCutoff: "2025-10",
});

const guideline: Source = {
  id: "acc-aha-af",
  title: "2023 ACC/AHA/HRS AF Guideline",
  passage:
    "In patients with atrial fibrillation and rapid ventricular response, rate control is a reasonable initial approach for those without severe symptoms.",
  highlight: [40, 106],
  kind: "guideline",
  version: "2023.1",
  retrievedAt: "2026-08-16T09:00:00.000Z",
  score: 0.91,
};

const groundedStream: CopilotEvent[] = [
  {
    type: "delta",
    text: "Rate control is a reasonable initial approach for most patients without severe symptoms.",
  },
  { type: "citation", marker: 1, source: guideline },
  { type: "claim", claim: { span: [0, 86], markers: [1] } },
  { type: "done", finish: "stop" },
];

const uncitedStream: CopilotEvent[] = [
  {
    type: "delta",
    text: "Rhythm control is often preferred in younger, more symptomatic patients.",
  },
  { type: "done", finish: "stop" },
];

const provider = (events: CopilotEvent[], phiPermitted = false) =>
  createStaticProvider({ events, disclosure, phiPermitted });

const resolver = {
  resolve: () =>
    Promise.resolve({
      resources: [],
      // The disclosure that turns a redaction into an honest one.
      withheld: [{ reason: "part2" as const, count: 2, disclosable: true }],
      asOf: "2026-08-16T09:00:00.000Z",
    }),
};

const meta: Meta<typeof Copilot> = {
  title: "Patterns/Copilot",
  component: Copilot,
  args: {
    provider: provider(groundedStream),
    modes: [lookUp, prepare],
    anchor: "inline",
    actor: { display: "Dr Amara Okafor", credential: "MD", reference: "Practitioner/7" },
    locale: "en-GB",
  },
};

export default meta;
type Story = StoryObj<typeof Copilot>;

const field = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("combobox", { name: "Clinical assistant" });

/** Put text in the field without submitting it. */
function type(canvasElement: HTMLElement, text: string) {
  const input = field(canvasElement) as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, text);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  return input;
}

/** Type and send. Separate from `type` because the shortcut menu owns Enter. */
async function ask(canvasElement: HTMLElement, question: string) {
  const input = type(canvasElement, question);
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
}

/* ------------------------------------------------------------------ */

export const Rest: Story = {
  name: "Rest",
  parameters: { state: "Rest" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The dock is findable and skippable, not a bare floating div.
    expect(canvas.getByRole("complementary", { name: "Clinical assistant" })).toBeTruthy();
    // Not "Ask anything" — the placeholder must not promise a scope the
    // component will refuse.
    expect(field(canvasElement).getAttribute("placeholder")).not.toMatch(/ask anything/i);
  },
};

export const ModeTray: Story = {
  name: "Mode tray",
  parameters: { state: "Mode tray" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("button", { name: "Look up" }).click();
    await waitFor(() => expect(canvas.getByRole("group", { name: "Change mode" })).toBeTruthy());
    // Each suggestion declares the data it will read, at the point of choice.
    expect(canvas.getAllByText("Formulary only").length).toBeGreaterThan(0);
  },
};

export const Shortcuts: Story = {
  name: "Shortcuts",
  parameters: { state: "Shortcuts" },
  args: {
    shortcuts: [
      { id: "prep", label: "Prep", question: "Prepare me for this encounter." },
      { id: "questions", label: "Questions", question: "What should I ask about?" },
    ],
  },
  play: async ({ canvasElement }) => {
    type(canvasElement, "/");
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByRole("listbox")).toBeTruthy());
    // Focus stays in the field; the active option is pointed at, not focused.
    expect(field(canvasElement).getAttribute("aria-activedescendant")).toBeTruthy();
  },
};

export const Dictating: Story = {
  name: "Dictating",
  parameters: { state: "Dictating" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("button", { name: "Start dictation" }).click();
    await waitFor(() => {
      const stop = canvas.getByRole("button", { name: "Stop dictation" });
      // Never colour alone. In a consulting room this is a privacy control.
      expect(within(stop).getByText("Microphone is live")).toBeTruthy();
    });
  },
};

export const Streaming: Story = {
  name: "Streaming",
  parameters: {
    state: "Streaming",
    skipVrt: true,
    a11yReason: "Mid-stream frame is timing-dependent; the completed answer is captured instead.",
  },
  args: { provider: provider(groundedStream) },
  play: async ({ canvasElement }) => {
    await ask(canvasElement, "First line for new onset AF?");
    const canvas = within(canvasElement);
    // The panel replaces the dock once a thread opens, so the landmark to look
    // for is the conversation rather than the complementary dock region.
    await waitFor(() =>
      expect(canvas.getByRole("region", { name: "Assistant conversation" })).toBeTruthy(),
    );
  },
};

export const GroundedAnswer: Story = {
  name: "Grounded answer",
  parameters: { state: "Grounded answer" },
  play: async ({ canvasElement }) => {
    await ask(canvasElement, "First line for new onset AF?");
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText(/Rate control is a reasonable/)).toBeTruthy());
    // Named, not numbered.
    expect(canvas.getByRole("button", { name: /Source 1, 2023 ACC\/AHA/ })).toBeTruthy();
  },
};

export const GeneralKnowledgeAnswer: Story = {
  name: "General-knowledge answer",
  parameters: { state: "General-knowledge answer" },
  args: { provider: provider(uncitedStream) },
  play: async ({ canvasElement }) => {
    await ask(canvasElement, "Rhythm or rate control?");
    const canvas = within(canvasElement);
    // Visibly different from grounded, not merely labelled differently.
    await waitFor(() => expect(canvas.getByText("General knowledge")).toBeTruthy());
    expect(canvasElement.querySelector('[data-register="general"]')).toBeTruthy();
  },
};

export const SourcesOpen: Story = {
  name: "Sources open",
  parameters: { state: "Sources open" },
  play: async ({ canvasElement }) => {
    await ask(canvasElement, "First line for new onset AF?");
    const canvas = within(canvasElement);
    await waitFor(() => canvas.getByRole("button", { name: "Show sources" }));
    canvas.getByRole("button", { name: "Show sources" }).click();

    const panel = await waitFor(() => canvas.getByRole("region", { name: "Basis of this answer" }));

    /*
     * Asserted on `textContent` rather than with `getByText`, because the
     * passage is deliberately split across nodes: the clause that supports the
     * claim is wrapped in `<mark>`, which is what turns a citation into a
     * verification a clinician can make at a glance. A matcher that required
     * one unbroken text node would fail precisely because the feature works.
     *
     * And waited for rather than read once: the landmark exists a render before
     * its passage does, so reading `textContent` the moment the region appears
     * is a race that only shows up on a loaded machine.
     */
    await waitFor(() =>
      expect(panel.textContent).toMatch(/rate control is a reasonable initial approach/i),
    );

    // And the mark is on the supporting clause, not the whole passage.
    const mark = panel.querySelector("mark");
    expect(mark?.textContent?.length).toBeGreaterThan(0);
    expect(mark?.textContent?.length).toBeLessThan(panel.textContent?.length ?? 0);
  },
};

export const Refused: Story = {
  name: "Refused",
  parameters: { state: "Refused" },
  play: async ({ canvasElement }) => {
    await ask(canvasElement, "what are this patient's current medications");
    const canvas = within(canvasElement);
    // A redirect rather than a dead end.
    await waitFor(() =>
      expect(canvas.getByText("Outside what this assistant answers")).toBeTruthy(),
    );
  },
};

export const Crisis: Story = {
  name: "Crisis",
  parameters: { state: "Crisis" },
  args: { locale: "en-US" },
  play: async ({ canvasElement }) => {
    await ask(canvasElement, "I want to kill myself");
    const canvas = within(canvasElement);
    const alert = await waitFor(() => canvas.getByRole("alert"));

    // The answer is replaced, not annotated — a hotline appended to a helpful
    // answer is something people scroll past.
    expect(within(alert).getByText("This needs a person, not a model")).toBeTruthy();
    expect(canvas.queryByText(/Rate control/)).toBeNull();
    // Locale-resolved, because 988 works in the US and nowhere else.
    expect(within(alert).getByRole("link", { name: /988/ })).toBeTruthy();
  },
};

export const ErrorState: Story = {
  name: "Error",
  parameters: { state: "Error" },
  args: {
    provider: {
      ...provider([]),
      // eslint-disable-next-line require-yield
      async *send() {
        throw new Error("socket hang up");
      },
    },
  },
  play: async ({ canvasElement }) => {
    await ask(canvasElement, "First line for new onset AF?");
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText("The assistant could not answer")).toBeTruthy());
  },
};

export const Suppressed: Story = {
  name: "Suppressed",
  parameters: {
    state: "Suppressed",
    skipVrt: true,
    skipA11y: true,
    a11yReason: "Renders null by design — there is no tree to audit, which is the point.",
  },
  args: { suppressed: true },
  play: async ({ canvasElement }) => {
    // Law 5, and the FDA's time-critical clause. The most valuable thing this
    // component does is disappear.
    expect(canvasElement.querySelector("[data-zb-copilot]")).toBeNull();
  },
};

/**
 * The controls the other stories do not reach.
 *
 * Grouped into one story rather than scattered, because each is a one-line
 * interaction and twelve near-identical stories would make the gallery worse
 * without making the component better tested.
 */
export const ControlsWalkthrough: Story = {
  name: "Controls walkthrough",
  parameters: {
    state: "Mode tray",
    skipVrt: true,
    a11yReason: "Composite interaction story; each state it passes through is audited elsewhere.",
  },
  args: {
    shortcuts: [
      {
        id: "history",
        label: "Patient history",
        modeId: "prepare",
        question: "Summarise the history.",
      },
    ],
    // The walkthrough switches into Prepare, which reads the record — so it
    // needs a covered provider and a resolver, exactly as a real deployment
    // would. Without them the exchange correctly fails as context-unavailable.
    provider: provider(groundedStream, true),
    subject: { reference: "Patient/1", display: "Amara Okonkwo" },
    context: resolver,
    onInsert: () => {},
    onRiskProtocol: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Mode tray: switch mode from a chip, then pick a suggestion.
    canvas.getByRole("button", { name: "Look up" }).click();
    await waitFor(() => canvas.getByRole("group", { name: "Change mode" }));
    within(canvas.getByRole("group", { name: "Change mode" }))
      .getByRole("button", { name: "Prepare" })
      .click();
    await waitFor(() =>
      expect(canvas.getAllByRole("button", { name: "Prepare" }).length).toBeGreaterThan(0),
    );
    canvas.getByRole("button", { name: /Patient history/ }).click();
    await waitFor(() => expect((field(canvasElement) as HTMLInputElement).value).toBeTruthy());

    // Shortcut menu: select by click, which also applies the shortcut's mode.
    type(canvasElement, "/");
    await waitFor(() => canvas.getByRole("listbox"));
    canvas.getAllByRole("option")[0]?.click();

    // Dictation: start and stop.
    canvas.getByRole("button", { name: "Start dictation" }).click();
    await waitFor(() => canvas.getByRole("button", { name: "Stop dictation" }));
    canvas.getByRole("button", { name: "Stop dictation" }).click();
    await waitFor(() => canvas.getByRole("button", { name: "Start dictation" }));

    // Answer actions: feedback, insert, sources, close, new thread.
    await ask(canvasElement, "First line for new onset AF?");
    await waitFor(() => canvas.getByRole("button", { name: "Show sources" }));

    canvas.getByRole("button", { name: "Helpful" }).click();
    canvas.getByRole("button", { name: "Not helpful" }).click();
    canvas.getByRole("button", { name: "Insert into note" }).click();

    canvas.getByRole("button", { name: "Show sources" }).click();
    await waitFor(() => canvas.getByRole("region", { name: "Basis of this answer" }));
    canvas.getByRole("button", { name: "Close" }).click();
    await waitFor(() =>
      expect(canvas.queryByRole("region", { name: "Basis of this answer" })).toBeNull(),
    );

    canvas.getByRole("button", { name: "New chat" }).click();
    await waitFor(() => expect(canvas.queryByText(/Rate control/)).toBeNull());
  },
};

export const CrisisEscalation: Story = {
  name: "Crisis escalation",
  parameters: {
    state: "Crisis",
    skipVrt: true,
    a11yReason: "Same tree as the Crisis story, which is audited.",
  },
  args: { locale: "en-US", onRiskProtocol: () => {} },
  play: async ({ canvasElement }) => {
    await ask(canvasElement, "I want to kill myself");
    const canvas = within(canvasElement);
    const alert = await waitFor(() => canvas.getByRole("alert"));
    // The escalation hook the host wired, ahead of the hotline.
    within(alert).getByRole("button", { name: "Open risk protocol" }).click();
  },
};

export const Retrying: Story = {
  name: "Retrying",
  parameters: {
    state: "Error",
    skipVrt: true,
    a11yReason: "Same tree as the Error story, which is audited.",
  },
  args: {
    provider: {
      ...provider([]),
      // eslint-disable-next-line require-yield
      async *send() {
        throw new Error("socket hang up");
      },
    },
  },
  play: async ({ canvasElement }) => {
    await ask(canvasElement, "First line for new onset AF?");
    const canvas = within(canvasElement);
    await waitFor(() => canvas.getByRole("button", { name: "Try again" }));
    // Retry re-sends the last question, not the draft — which submit cleared.
    canvas.getByRole("button", { name: "Try again" }).click();
  },
};

export const KeyboardSummon: Story = {
  name: "Keyboard summon",
  parameters: {
    state: "Rest",
    skipVrt: true,
    a11yReason: "Same tree as Rest, which is audited.",
  },
  play: async ({ canvasElement }) => {
    // Cmd+K from outside the field. Law 6: the fast path is keyboard-complete.
    document.body.focus();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
    );
    await waitFor(() => expect(document.activeElement).toBe(field(canvasElement)));
  },
};

export const WithheldRecords: Story = {
  name: "Withheld records",
  parameters: {
    state: "Rest",
    skipVrt: true,
  },
  args: {
    provider: provider(groundedStream, true),
    initialModeId: "prepare",
    subject: { reference: "Patient/1", display: "Amara Okonkwo" },
    context: resolver,
  },
  play: async ({ canvasElement }) => {
    await ask(canvasElement, "summarise the record");
    const canvas = within(canvasElement);
    // "2 records withheld" is the difference between a redaction and a lie.
    await waitFor(() => expect(canvas.getByText(/2 records withheld/)).toBeTruthy());
  },
};
