/**
 * Stories for Tabs.
 *
 * Written once, consumed four ways (ADR 0007): as documentation, as the
 * visual-regression fixture, as the accessibility fixture, and — through play
 * functions — as the interaction test.
 *
 * `parameters.state` ties each story to a state declared in
 * `component.meta.ts`. The build asserts the two agree in both directions, so
 * the component cannot claim a state it never demonstrates, and cannot
 * demonstrate one it never declared. Twelve declared states makes that check
 * do real work: the overflow menu, the collapsed picker and the async guard
 * are exactly the states a demo would otherwise skip.
 *
 * The chart these stories render is assembled from `@oxygenui-design/fixtures`
 * rather than typed out, so a count on a tab cannot drift from the data behind
 * it.
 */

import * as React from "react";
import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { allergyList, medicationList, observationPanel } from "@oxygenui-design/fixtures";
import { expect, userEvent, waitFor, within } from "../../../test/story-kit";
import { stubGeometry, triggerResize } from "../test/geometry.js";
import { Tabs, type TabsItemProps } from "./index.js";

/* ------------------------------------------------------------------ */
/* The chart                                                           */
/* ------------------------------------------------------------------ */

/** Critical results, counted from the panel rather than asserted. */
const critical = observationPanel.filter((o) =>
  o.interpretation?.some((i) => i.coding?.some((c) => c.code === "HH" || c.code === "LL")),
);

function Panel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <ul>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

const chart: TabsItemProps[] = [
  {
    value: "summary",
    label: "Summary",
    children: <Panel title="Summary" lines={["Type 2 diabetes review", "Last seen 12 Aug 2026"]} />,
  },
  {
    value: "labs",
    label: "Labs",
    count: critical.length,
    tone: "critical",
    children: (
      <Panel title="Labs" lines={observationPanel.map((o) => o.code?.text ?? o.id ?? "Result")} />
    ),
  },
  {
    value: "meds",
    label: "Medications",
    count: medicationList.length,
    children: (
      <Panel
        title="Medications"
        lines={medicationList.map((m) => m.medicationCodeableConcept?.text ?? "Medication")}
      />
    ),
  },
  {
    value: "allergies",
    label: "Allergies",
    count: allergyList.length,
    tone: "high",
    children: <Panel title="Allergies" lines={allergyList.map((a) => a.code?.text ?? "Allergy")} />,
  },
];

const meta: Meta<typeof Tabs> = {
  title: "Navigation/Tabs",
  component: Tabs,
  args: { as: "tabs", "aria-label": "Chart sections", defaultValue: "summary", items: chart },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

/* ------------------------------------------------------------------ */
/* Selection                                                           */
/* ------------------------------------------------------------------ */

export const Selected: Story = {
  name: "Selected",
  parameters: { state: "Selected" },
  play: async ({ canvasElement }) => {
    const summary = within(canvasElement).getByRole("tab", { name: "Summary" });
    expect(summary.getAttribute("aria-selected")).toBe("true");
    // Roving tabindex: the selected trigger is the group's single tab stop.
    expect(summary.getAttribute("tabindex")).toBe("0");
  },
};

export const Unselected: Story = {
  name: "Unselected",
  parameters: { state: "Unselected" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const meds = canvas.getByRole("tab", { name: /Medications/ });
    expect(meds.getAttribute("aria-selected")).toBe("false");
    expect(meds.getAttribute("tabindex")).toBe("-1");
    // The count reaches the name as a word. A bare "5" beside a label is a
    // colour signal wearing a number.
    expect(meds.getAttribute("aria-label")).toBe(`Medications, ${medicationList.length} items`);
  },
};

/* ------------------------------------------------------------------ */
/* Present but not openable                                            */
/* ------------------------------------------------------------------ */

export const DisabledWithReason: Story = {
  name: "Disabled, with the reason stated",
  parameters: { state: "Disabled with a stated reason" },
  args: {
    items: [
      ...chart,
      {
        value: "imaging",
        label: "Imaging",
        disabled: true,
        disabledReason: "No imaging has been ordered for this patient.",
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const imaging = within(canvasElement).getByRole("tab", { name: "Imaging" });
    // aria-disabled, never the disabled attribute: a keyboard user has to be
    // able to reach it to find out why they cannot open it.
    expect(imaging.getAttribute("aria-disabled")).toBe("true");
    expect(imaging.hasAttribute("disabled")).toBe(false);

    const describedBy = imaging.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(canvasElement.querySelector(`#${describedBy}`)?.textContent).toContain(
      "No imaging has been ordered",
    );
  },
};

export const Restricted: Story = {
  name: "Restricted — present, gated, explained",
  parameters: { state: "Restricted (present, gated, explained)" },
  args: {
    items: [
      ...chart,
      {
        value: "bh",
        label: "Behavioural health",
        disabled: true,
        disabledReason:
          "Restricted under 42 CFR Part 2. Opening it records an access event and notifies the record owner.",
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bh = canvas.getByRole("tab", { name: "Behavioural health" });

    // The whole point of this state: the section is *present*. Omitting it
    // would tell the clinician the patient has no behavioural-health record,
    // which is a different — and false — clinical fact.
    expect(bh).toBeTruthy();
    expect(bh.getAttribute("aria-disabled")).toBe("true");

    const reason = canvasElement.querySelector(`#${bh.getAttribute("aria-describedby")}`);
    expect(reason?.textContent).toContain("42 CFR Part 2");

    // Reachable, and inert when reached.
    await userEvent.click(bh);
    expect(bh.getAttribute("aria-selected")).toBe("false");
  },
};

/* ------------------------------------------------------------------ */
/* Connectivity                                                        */
/* ------------------------------------------------------------------ */

export const Stale: Story = {
  name: "Stale — showing cached data",
  parameters: { state: "Stale — showing cached data" },
  args: {
    items: chart.map((item) =>
      item.value === "labs" ? { ...item, availability: "stale" as const } : item,
    ),
  },
  play: async ({ canvasElement }) => {
    const labs = within(canvasElement).getByRole("tab", { name: /^Labs/ });
    expect(labs.getAttribute("data-ox-availability")).toBe("stale");
    // Not disabled. A clinician looking at cached potassium needs to know it
    // is cached, not that the section has gone away.
    expect(labs.getAttribute("aria-disabled")).toBeNull();
    expect(labs.getAttribute("aria-label")).toContain("showing cached data");
  },
};

export const UnavailableOffline: Story = {
  name: "Unavailable offline",
  parameters: { state: "Unavailable offline" },
  args: {
    items: chart.map((item) =>
      item.value === "meds" ? { ...item, availability: "unavailable" as const } : item,
    ),
  },
  play: async ({ canvasElement }) => {
    const meds = within(canvasElement).getByRole("tab", { name: /Medications/ });
    expect(meds.getAttribute("data-ox-availability")).toBe("unavailable");
    expect(meds.getAttribute("aria-label")).toContain("unavailable");
  },
};

export const UnsavedChanges: Story = {
  name: "Unsaved changes pending",
  parameters: { state: "Unsaved changes pending" },
  args: {
    defaultValue: "note",
    items: [
      ...chart,
      {
        value: "note",
        label: "Progress note",
        dot: "dirty",
        children: <Panel title="Progress note" lines={["Draft"]} />,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const note = within(canvasElement).getByRole("tab", { name: /Progress note/ });
    // The dot itself is aria-hidden; the fact it carries travels in the name.
    expect(note.getAttribute("aria-label")).toBe("Progress note, unsaved changes");
    expect(note.querySelector("[data-ox-dot='dirty']")?.getAttribute("aria-hidden")).toBe("true");
  },
};

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

const intake: TabsItemProps[] = [
  {
    value: "identity",
    label: "Identity",
    state: "done",
    children: <Panel title="Identity" lines={["Confirmed"]} />,
  },
  {
    value: "insurance",
    label: "Insurance",
    state: "current",
    children: <Panel title="Insurance" lines={["In progress"]} />,
  },
  {
    value: "history",
    label: "History",
    state: "locked",
    children: <Panel title="History" lines={["Locked"]} />,
  },
];

export const CompletedStep: Story = {
  name: "Completed step",
  parameters: { state: "Completed step" },
  args: {
    as: "steps",
    variant: "stepper",
    defaultValue: "insurance",
    items: intake,
    "aria-label": "Intake",
  },
  play: async ({ canvasElement }) => {
    const identity = within(canvasElement).getByRole("tab", { name: "Identity" });
    expect(identity.getAttribute("data-ox-state")).toBe("done");
    // Done is not disabled: going back to a finished step is how somebody
    // fixes the name they mistyped two screens ago.
    expect(identity.getAttribute("aria-disabled")).toBeNull();
  },
};

export const LockedStep: Story = {
  name: "Locked step",
  parameters: { state: "Locked step" },
  args: {
    as: "steps",
    variant: "stepper",
    defaultValue: "insurance",
    items: intake,
    "aria-label": "Intake",
  },
  play: async ({ canvasElement }) => {
    const history = within(canvasElement).getByRole("tab", { name: "History" });
    expect(history.getAttribute("data-ox-state")).toBe("locked");
    await userEvent.click(history);
    // A locked step cannot be jumped to, and says so rather than doing nothing.
    expect(history.getAttribute("aria-selected")).toBe("false");
  },
};

/* ------------------------------------------------------------------ */
/* Overflow                                                            */
/*                                                                     */
/* jsdom has no layout engine, so every box measures zero and the      */
/* fitter takes its "nothing to do" branch. `stubGeometry` supplies    */
/* real numbers; the component still does all of its own arithmetic.   */
/* In a browser the same states arrive from CSS width, which is what   */
/* the Playwright suite asserts.                                       */
/* ------------------------------------------------------------------ */

const manySections: TabsItemProps[] = [
  "Summary",
  "Labs",
  "Medications",
  "Allergies",
  "Conditions",
  "Immunisations",
  "Encounters",
  "Documents",
].map((label) => ({
  value: label.toLowerCase(),
  label,
  children: <Panel title={label} lines={[`${label} content`]} />,
}));

async function narrow(canvasElement: HTMLElement, clientWidth: number) {
  const list = canvasElement.querySelector<HTMLElement>("[data-ox-list]");
  if (!list) throw new Error("no tab list rendered");
  stubGeometry(list, { clientWidth, scrollWidth: 8 * 140, tabWidth: 140 });
  triggerResize();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

export const OverflowMenu: Story = {
  name: "Overflowing into a menu",
  parameters: { state: "Overflowing into a menu" },
  args: {
    items: manySections,
    defaultValue: "summary",
    overflow: "menu",
    "aria-label": "Chart sections",
  },
  play: async ({ canvasElement }) => {
    await narrow(canvasElement, 420);
    await waitFor(() => {
      expect(
        canvasElement.querySelector(".ox-tabs__more-button"),
        "no overflow trigger appeared",
      ).toBeTruthy();
    });

    const more = canvasElement.querySelector<HTMLButtonElement>(".ox-tabs__more-button");
    // How many are hidden is in the name, not only in the badge — the badge is
    // aria-hidden precisely so the number is not announced twice.
    expect(more?.textContent).toMatch(/\d+ hidden/);
    // A real menu, not a second tablist: a tablist split across two containers
    // reports an incoherent "n of m".
    expect(more?.getAttribute("aria-haspopup")).toBe("menu");

    await userEvent.click(more as HTMLButtonElement);
    const menu = canvasElement.querySelector<HTMLElement>(".ox-tabs__menu");
    expect(menu?.hidden).toBe(false);
    expect(within(menu as HTMLElement).getAllByRole("menuitem").length).toBeGreaterThan(0);
  },
};

export const CollapsedToPicker: Story = {
  name: "Collapsed to a native picker",
  parameters: { state: "Collapsed to a native picker" },
  args: {
    items: manySections,
    defaultValue: "summary",
    overflow: "collapse",
    "aria-label": "Chart sections",
  },
  play: async ({ canvasElement }) => {
    await narrow(canvasElement, 200);
    await waitFor(() => {
      expect(
        canvasElement.querySelector("select.ox-tabs__select"),
        "the strip did not collapse to a picker",
      ).toBeTruthy();
    });
    const select = canvasElement.querySelector<HTMLSelectElement>("select.ox-tabs__select");
    // A native select, deliberately: it is the only control that already
    // behaves correctly on every mobile platform.
    expect(select?.options.length).toBe(manySections.length);
  },
};

/* ------------------------------------------------------------------ */
/* Async                                                               */
/* ------------------------------------------------------------------ */

/**
 * A guard that does not resolve until the host says the save finished.
 *
 * Declared as a component rather than inlined in `render`: a story's render
 * function is called, not mounted, so a hook inside it is an invalid hook call
 * — and the failure mode is a React error rather than a wrong assertion.
 */
function GuardDemo(props: React.ComponentProps<typeof Tabs>) {
  const [resolve, setResolve] = React.useState<(() => void) | null>(null);
  return (
    <>
      <Tabs
        {...props}
        items={chart}
        onBeforeChange={() =>
          new Promise<boolean>((res) => {
            setResolve(() => () => res(true));
          })
        }
      />
      <button type="button" onClick={() => resolve?.()}>
        Finish saving
      </button>
    </>
  );
}

export const AwaitingGuard: Story = {
  name: "Awaiting an async guard",
  parameters: { state: "Awaiting an async guard" },
  render: (args) => <GuardDemo {...(args as unknown as React.ComponentProps<typeof Tabs>)} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", { name: /^Labs/ }));

    // Selection has not moved: the guard has not answered yet, and moving
    // first would show the clinician a panel the save might still reject.
    await waitFor(() => {
      expect(canvasElement.querySelector("[data-ox-pending]")).toBeTruthy();
    });
    expect(canvas.getByRole("tab", { name: "Summary" }).getAttribute("aria-selected")).toBe("true");

    await userEvent.click(canvas.getByRole("button", { name: "Finish saving" }));
    await waitFor(() => {
      expect(canvas.getByRole("tab", { name: /^Labs/ }).getAttribute("aria-selected")).toBe("true");
    });
  },
};
