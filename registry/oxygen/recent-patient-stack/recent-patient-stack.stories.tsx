/**
 * Stories for RecentPatientStack.
 *
 * `parameters.state` ties each to a state declared in
 * `recent-patient-stack.meta.ts`, and the build asserts the two agree in both
 * directions.
 *
 * The three closing stories have to be read together: clean closes, an
 * unsigned note asks, a draft order refuses. Grading them is the component's
 * whole opinion about losing work.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import { RecentPatientStack, type OpenChart } from "./recent-patient-stack";

const NOW = "2026-08-24T10:00:00Z";

const charts: OpenChart[] = [
  {
    id: "chart-okonkwo",
    display: "A. Okonkwo",
    identifier: "093-441-208",
    reason: "Ward round",
    lastActiveAt: "2026-08-24T09:58:00Z",
  },
  {
    id: "chart-boateng",
    display: "T. Boateng",
    identifier: "093-118-774",
    reason: "Discharge summary",
    lastActiveAt: "2026-08-24T09:30:00Z",
    work: [{ kind: "unsigned-note", label: "Progress note", since: "2026-08-21T09:00:00Z" }],
  },
  {
    id: "chart-marsh",
    display: "L. Marsh",
    identifier: "093-772-115",
    reason: "Triage",
    lastActiveAt: "2026-08-24T08:00:00Z",
    work: [{ kind: "draft-order", label: "Lithium level" }],
  },
  {
    id: "chart-vance",
    display: "R. Vance",
    identifier: "093-004-661",
    reason: "Med review",
    pinned: true,
    lastActiveAt: "2026-08-23T17:00:00Z",
  },
];

const meta: Meta<typeof RecentPatientStack> = {
  title: "Clinical/Recent Patient Stack",
  component: RecentPatientStack,
  args: { charts, activeId: "chart-okonkwo", now: NOW },
};

export default meta;
type Story = StoryObj<typeof RecentPatientStack>;

/* ------------------------------------------------------------------ */
/* The stack                                                           */
/* ------------------------------------------------------------------ */

export const FourCharts: Story = {
  name: "Four charts, one active",
  parameters: { state: "Four charts, one active" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getAllByRole("tab")).toHaveLength(4);
    // The set is visible without being opened, which is the thing a dropdown
    // cannot do.
    expect(canvas.getByRole("tab", { selected: true }).textContent).toContain("A. Okonkwo");
  },
};

export const OneChart: Story = {
  name: "One chart",
  parameters: { state: "One chart" },
  args: { charts: [charts[0] as OpenChart] },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getAllByRole("tab")).toHaveLength(1);
  },
};

export const Pinned: Story = {
  name: "A pinned chart",
  parameters: { state: "A pinned chart" },
  play: async ({ canvasElement }) => {
    // Pinned first, then most recently active. The pin is a dot as well as a
    // position, because a position is only readable against the others.
    const tabs = within(canvasElement).getAllByRole("tab");
    expect(tabs[0]?.textContent).toContain("R. Vance");
    expect(tabs[0]?.hasAttribute("data-ox-pinned")).toBe(true);
  },
};

/* ------------------------------------------------------------------ */
/* What is owed                                                        */
/* ------------------------------------------------------------------ */

export const UnsignedNote: Story = {
  name: "An unsigned note",
  parameters: { state: "An unsigned note" },
  play: async ({ canvasElement }) => {
    const tab = within(canvasElement).getByRole("tab", { name: /T\. Boateng/ });
    expect(tab.getAttribute("data-ox-work")).toBe("unsigned-note");
    // A screen-reader user should not have to open a chart to learn there is
    // something owed on it.
    expect(tab.getAttribute("aria-label")).toContain("Unsigned note");
  },
};

export const DraftOrder: Story = {
  name: "A draft order",
  parameters: { state: "A draft order" },
  play: async ({ canvasElement }) => {
    const tab = within(canvasElement).getByRole("tab", { name: /L\. Marsh/ });
    // Ranked above the unsigned note, because an order somebody believes they
    // placed is invisibly absent.
    expect(tab.getAttribute("data-ox-work")).toBe("draft-order");
  },
};

export const NotesOwed: Story = {
  name: "Notes owed across the caseload",
  parameters: { state: "Notes owed across the caseload" },
  args: { onExpandedChange: () => {} },
  play: async ({ canvasElement }) => {
    // The number that decides whether the week ends on time.
    expect(canvasElement.textContent).toContain("1 unsigned note, oldest 3 days");
  },
};

/* ------------------------------------------------------------------ */
/* Two names that look alike                                           */
/* ------------------------------------------------------------------ */

export const SimilarNames: Story = {
  name: "Two charts with similar names",
  parameters: { state: "Two charts with similar names" },
  args: {
    charts: [
      { id: "a", display: "J. Okonkwo", identifier: "093-441-208", reason: "Ward round" },
      { id: "b", display: "J. Okonjo", identifier: "093-118-774", reason: "Triage" },
      { id: "c", display: "T. Boateng", identifier: "093-772-115" },
    ],
    activeId: "a",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Both sides grow an identifier; the unrelated chart does not.
    expect(canvas.getByText("093-441-208")).toBeTruthy();
    expect(canvas.getByText("093-118-774")).toBeTruthy();
    expect(canvas.queryByText("093-772-115")).toBeNull();
  },
};

/* ------------------------------------------------------------------ */
/* Closing — the three verdicts                                        */
/* ------------------------------------------------------------------ */

export const ClosingClean: Story = {
  name: "Closing a clean chart",
  parameters: { state: "Closing a clean chart" },
  args: { expanded: true, onClose: () => {} },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Close R. Vance" }));
    // Nothing outstanding, so nothing to ask about.
    expect(canvas.queryByRole("alertdialog")).toBeNull();
  },
};

export const ClosingWithNote: Story = {
  name: "Closing one with an unsigned note",
  parameters: { state: "Closing one with an unsigned note" },
  args: { expanded: true, onClose: () => {} },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Close T. Boateng" }));

    const dialog = canvas.getByRole("alertdialog");
    expect(dialog.getAttribute("data-ox-verdict")).toBe("confirm");
    // A real question: two ways out, and losing the draft is one of them.
    expect(within(dialog).getAllByRole("button")).toHaveLength(2);
  },
};

export const ClosingWithOrder: Story = {
  name: "Closing one with a draft order",
  parameters: { state: "Closing one with a draft order" },
  args: { expanded: true, onClose: () => {} },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Close L. Marsh" }));

    const dialog = canvas.getByRole("alertdialog");
    expect(dialog.getAttribute("data-ox-verdict")).toBe("refuse");
    // One way out. A dialogue with a single exit that offers two is how people
    // learn to click through the ones that matter.
    expect(within(dialog).getAllByRole("button")).toHaveLength(1);
  },
};

/* ------------------------------------------------------------------ */
/* Coming back, and the keyboard                                       */
/* ------------------------------------------------------------------ */

export const ReturningAfterFifteen: Story = {
  name: "Returning after fifteen minutes",
  parameters: { state: "Returning after fifteen minutes" },
  args: { onActivate: () => {} },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // R. Vance was last touched yesterday; the host is told to confirm before
    // showing the chart.
    await userEvent.click(canvas.getByRole("tab", { name: /R\. Vance/ }));
  },
};

export const ExpandedPanel: Story = {
  name: "Expanded panel",
  parameters: { state: "Expanded panel" },
  args: { expanded: true, onPin: () => {}, onClose: () => {}, onExpandedChange: () => {} },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Per-chart actions live here rather than on the tab: on the tab a close
    // affordance is one mis-tap from losing a draft.
    expect(canvas.getAllByRole("button", { name: /^Close / })).toHaveLength(4);
    expect(canvas.getByRole("button", { name: "Unpin" }).getAttribute("aria-pressed")).toBe("true");
  },
};

export const KeyboardReorder: Story = {
  name: "Keyboard reordering",
  parameters: { state: "Keyboard reordering" },
  args: { onReorder: () => {} },
  play: async ({ canvasElement }) => {
    const tab = within(canvasElement).getByRole("tab", { name: /T\. Boateng/ });
    tab.focus();
    // Alt with the arrows moves the chart rather than the focus — the WCAG
    // 2.5.7 equivalent of the drag.
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(document.activeElement).toBe(tab);
  },
};

export const RovingFocus: Story = {
  name: "Roving focus across the stack",
  parameters: { state: "Roving focus across the stack" },
  play: async ({ canvasElement }) => {
    const tabs = within(canvasElement).getAllByRole("tab");
    // One tab stop for the whole stack. Eleven would be a workspace a keyboard
    // user leaves.
    expect(tabs.filter((tab) => tab.getAttribute("tabindex") === "0")).toHaveLength(1);

    tabs[0]?.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tabs[1]);
  },
};
