/**
 * Stories for ChartContextMenu.
 *
 * `parameters.state` ties each one to a state declared in
 * `chart-context-menu.meta.ts`, and the build asserts the two agree in both
 * directions — which is what makes the declared list honest rather than
 * aspirational.
 *
 * Every story opens the menu in its play function rather than rendering it
 * open, because the opening *is* the component: which gesture summoned it
 * decides whether a row starts highlighted, and where the popup lands decides
 * whether the first thing under the pointer is a verb.
 *
 * The story carrying the argument is "A masked subject". A menu that resolves
 * a name the row was hiding has leaked the record at the exact moment the
 * reader believed the interface was protecting it.
 */

import * as React from "react";
import type { Meta, StoryObj } from "@zoblocks/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import { ChartContextMenu, type ChartMenuAction, type MenuSubject } from "./chart-context-menu";

/** Injected, never read from a clock. See ENGINEERING.md §9. */
const NOW = "2026-08-31T09:24:00-04:00";

const medication: MenuSubject = {
  resource: "MedicationRequest",
  id: "med-4471",
  label: "Lisinopril 10 mg",
  detail: "Oral · daily · started 4 Mar 2026",
};

const openOrder: ChartMenuAction = {
  id: "open",
  label: "Open order",
  tier: "routine",
  shortcut: "↵",
};
const copyAsText: ChartMenuAction = {
  id: "copy",
  label: "Copy as text",
  tier: "routine",
  shortcut: "⌘C",
};
const history: ChartMenuAction = {
  id: "history",
  label: "Administration history",
  tier: "routine",
};

const routine: ChartMenuAction[] = [openOrder, copyAsText, history];

const recorded: ChartMenuAction[] = [
  {
    id: "mar",
    label: "Add a note to the MAR",
    tier: "documented",
    applies: ["MedicationRequest"],
    records: "Writes a note on the medication record. Nursing sees it at the next round.",
  },
  {
    id: "pharmacy",
    label: "Flag for pharmacy review",
    tier: "documented",
    applies: ["MedicationRequest"],
    records: "Creates a Task for pharmacy. It appears in their queue with your name on it.",
  },
];

const clinical: ChartMenuAction[] = [
  {
    id: "hold",
    label: "Hold until reviewed",
    tier: "clinical",
    applies: ["MedicationRequest"],
    confirm: "Holds every remaining dose until a prescriber releases it.",
    confirmVerb: "Hold doses",
  },
  {
    id: "dc",
    label: "Discontinue",
    tier: "clinical",
    applies: ["MedicationRequest"],
    confirm: "The next scheduled dose is 14:00 today. Discontinuing stops it.",
    confirmVerb: "Discontinue",
  },
  {
    id: "renew",
    label: "Renew for 90 days",
    tier: "clinical",
    applies: ["MedicationRequest"],
    confirm: "Issues a new order in your name.",
    availability: {
      status: "unavailable",
      reason: "Prescriber role required — you are signed in as a registered nurse",
    },
  },
];

const disclosive: ChartMenuAction[] = [
  {
    id: "part2",
    label: "Reveal Part 2 content",
    tier: "disclosive",
    applies: ["MedicationRequest", "DocumentReference"],
    reasons: [
      "Treatment of this patient",
      "Medical emergency (42 CFR §2.51)",
      "Written patient consent on file",
    ],
  },
];

const withheld: ChartMenuAction[] = [
  {
    id: "delete",
    label: "Delete order",
    tier: "clinical",
    applies: ["MedicationRequest"],
    confirm: "Removes the order entirely.",
    availability: { status: "withheld" },
  },
];

const everything: ChartMenuAction[] = [
  ...routine,
  ...recorded,
  ...clinical,
  ...disclosive,
  ...withheld,
];

/** Right-click the row the story rendered, and hand back the popup. */
async function openByPointer(canvasElement: HTMLElement) {
  const row = within(canvasElement).getByTestId("row");
  await userEvent.pointer({ keys: "[MouseRight]", target: row });
  return within(canvasElement).findByRole("menu");
}

/**
 * One row, right-clickable, shared by every story.
 *
 * `Meta` carries args but not `render` — that is a per-story field — so this
 * is referenced from each one rather than declared once at the top. The row is
 * the host's markup, which is the whole point of `children` being a render
 * function: nothing here is wrapped in a div the component chose.
 */
const renderRow = (args: React.ComponentProps<typeof ChartContextMenu>) => <StoryRow {...args} />;

/**
 * A component rather than a bare function, because the popup is portalled and
 * the story needs somewhere of its own to portal it into: the harness audits
 * `view.container`, and a menu rendered into `<body>` is outside it.
 */
function StoryRow(args: React.ComponentProps<typeof ChartContextMenu>) {
  const [host, setHost] = React.useState<HTMLElement | null>(null);
  return (
    <div
      ref={setHost}
      style={{ display: "grid", gap: "0.5rem", padding: "1rem", minInlineSize: "22rem" }}
    >
      <ChartContextMenu {...args} container={host}>
        {(trigger) => (
          <div
            {...trigger}
            data-testid="row"
            style={{
              display: "grid",
              gap: "0.125rem",
              padding: "0.5rem 0.75rem",
              border: "1px solid var(--zb-border, #e2e8f0)",
              borderRadius: "var(--zb-radius, 6px)",
              background: "var(--zb-surface, #fff)",
              cursor: "default",
              userSelect: "none",
            }}
          >
            <strong style={{ fontSize: "0.875rem" }}>{args.subject.label}</strong>
            <span style={{ fontSize: "0.75rem", color: "var(--zb-text-subtle, #94a3b8)" }}>
              {args.subject.detail}
            </span>
          </div>
        )}
      </ChartContextMenu>
      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--zb-text-muted, #64748b)" }}>
        Right-click the row, or focus it and press Shift+F10.
      </p>
    </div>
  );
}

const meta: Meta<typeof ChartContextMenu> = {
  title: "Clinical/Chart Context Menu",
  component: ChartContextMenu,
  args: {
    subject: medication,
    actions: everything,
    now: NOW,
    policy: { role: "a registered nurse", breakGlass: true },
  },
};

export default meta;
type Story = StoryObj<typeof ChartContextMenu>;

/* ------------------------------------------------------------------ */
/* The bands                                                           */
/* ------------------------------------------------------------------ */

export const RoutineOnly: Story = {
  name: "Routine actions only",
  parameters: { state: "Routine actions only" },
  render: renderRow,
  args: { actions: routine, policy: undefined },
  play: async ({ canvasElement }) => {
    const menu = await openByPointer(canvasElement);
    // The common case stays cheap: no separators, no second lines, no ladder.
    expect(menu.querySelectorAll(".zb-menu__separator").length).toBe(0);
    expect(menu.textContent).not.toContain("hidden");
  },
};

export const Recorded: Story = {
  name: "A recorded action, saying what it writes",
  parameters: { state: "A recorded action, saying what it writes" },
  render: renderRow,
  args: { actions: [...routine, ...recorded], policy: undefined },
  play: async ({ canvasElement }) => {
    const menu = await openByPointer(canvasElement);
    // Before it is chosen, not in a toast afterwards.
    expect(menu.textContent).toContain("Nursing sees it at the next round");
  },
};

export const ClinicalFirstActivation: Story = {
  name: "A clinical action, first activation",
  parameters: { state: "A clinical action, first activation" },
  render: renderRow,
  play: async ({ canvasElement }) => {
    const menu = await openByPointer(canvasElement);
    const dc = within(menu).getByRole("menuitem", { name: /Discontinue/ });
    await userEvent.click(dc);
    // Still open, nothing run, and the sentence names the specific consequence.
    expect(menu.textContent).toContain("next scheduled dose is 14:00 today");
  },
};

export const ClinicalSecondStep: Story = {
  name: "A clinical action, second step",
  parameters: { state: "A clinical action, second step" },
  render: renderRow,
  play: async ({ canvasElement }) => {
    const menu = await openByPointer(canvasElement);
    await userEvent.click(within(menu).getByRole("menuitem", { name: /Discontinue/ }));
    // The confirm control carries the verb, never "OK", and Keep is always there.
    expect(within(menu).getByRole("button", { name: "Discontinue" })).toBeTruthy();
    expect(within(menu).getByRole("button", { name: "Keep" })).toBeTruthy();
  },
};

export const DisclosureReasons: Story = {
  name: "A disclosure, reasons offered",
  parameters: { state: "A disclosure, reasons offered" },
  render: renderRow,
  play: async ({ canvasElement }) => {
    const menu = await openByPointer(canvasElement);
    await userEvent.click(within(menu).getByRole("menuitem", { name: /Reveal Part 2/ }));
    expect(
      within(menu).getByRole("button", { name: "Medical emergency (42 CFR §2.51)" }),
    ).toBeTruthy();
    // The one fact a reader needs before deciding: the record already exists.
    expect(menu.textContent).toContain("Recorded either way");
  },
};

/* ------------------------------------------------------------------ */
/* Availability                                                        */
/* ------------------------------------------------------------------ */

export const UnavailableInPlace: Story = {
  name: "Unavailable, with the reason in place",
  parameters: { state: "Unavailable, with the reason in place" },
  render: renderRow,
  play: async ({ canvasElement }) => {
    const menu = await openByPointer(canvasElement);
    const renew = within(menu).getByRole("menuitem", { name: /Renew/ });
    // Reachable, so a keyboard user can read it, and the reason is text.
    expect(renew.getAttribute("aria-disabled")).toBe("true");
    expect(renew.textContent).toContain("Prescriber role required");
    expect(renew.getAttribute("title")).toBeNull();
  },
};

export const WithheldCounted: Story = {
  name: "Withheld by policy, counted",
  parameters: { state: "Withheld by policy, counted" },
  render: renderRow,
  play: async ({ canvasElement }) => {
    const menu = await openByPointer(canvasElement);
    // A row inside the menu, not a footnote under it.
    expect(menu.textContent).toContain("1 further action on this record");
    expect(menu.textContent).toContain("break-glass required");
    expect(within(menu).queryByRole("menuitem", { name: /Delete order/ })).toBeNull();
  },
};

export const Pending: Story = {
  name: "An availability check still pending",
  parameters: { state: "An availability check still pending" },
  render: renderRow,
  args: {
    actions: [openOrder, { ...copyAsText, availability: { status: "pending" } }, history],
    policy: undefined,
  },
  play: async ({ canvasElement }) => {
    const menu = await openByPointer(canvasElement);
    const rows = within(menu).getAllByRole("menuitem");
    // Three rows, in their final order, before any answer has arrived.
    expect(rows.length).toBe(3);
    const pending = rows.at(1);
    expect(pending?.getAttribute("aria-disabled")).toBe("true");
    expect(pending?.textContent).toContain("Checking");
  },
};

/* ------------------------------------------------------------------ */
/* Disclosure and identity — the argument                              */
/* ------------------------------------------------------------------ */

export const MaskedSubject: Story = {
  name: "A masked subject",
  parameters: { state: "A masked subject" },
  render: renderRow,
  args: {
    subject: {
      resource: "DocumentReference",
      id: "doc-9911",
      label: "Group therapy note — Nwosu, C.",
      detail: "Signed by R. Adeyemi, LPC",
      masked: true,
    },
    actions: [...routine, ...disclosive],
    policy: undefined,
  },
  play: async ({ canvasElement }) => {
    const menu = await openByPointer(canvasElement);
    // The menu may say less than its trigger. It may never say more.
    expect(menu.textContent).toContain("Restricted record");
    expect(menu.textContent).not.toContain("Nwosu");
    expect(menu.textContent).not.toContain("Adeyemi");
  },
};

export const BulkSelection: Story = {
  name: "A multiple selection",
  parameters: { state: "A multiple selection" },
  render: renderRow,
  args: {
    subject: {
      ...medication,
      plural: "orders",
      bulkDetail: "Morning round",
      also: Array.from({ length: 11 }, (_, index) => ({
        resource: "MedicationRequest",
        id: `med-${index}`,
      })),
    },
    actions: [{ ...copyAsText, bulk: "allowed" }, ...clinical.slice(1, 2)],
    policy: undefined,
  },
  play: async ({ canvasElement }) => {
    const menu = await openByPointer(canvasElement);
    // Counts rather than lists — twelve names in a floating layer is a
    // disclosure surface nobody asked for.
    expect(menu.textContent).toContain("12 orders selected");
    expect(menu.textContent).not.toContain("med-4471");
    const dc = within(menu).getByRole("menuitem", { name: /Discontinue/ });
    expect(dc.textContent).toContain("Not available for a multiple selection");
  },
};

/* ------------------------------------------------------------------ */
/* View state, submenus, and the two empties                           */
/* ------------------------------------------------------------------ */

export const ViewState: Story = {
  name: "Checkbox and radio view state",
  parameters: { state: "Checkbox and radio view state" },
  render: renderRow,
  args: {
    subject: {
      resource: "Encounter",
      id: "col-vitals",
      label: "Vitals column",
      detail: "Flowsheet",
    },
    actions: [
      { id: "pin", label: "Pin this column", tier: "routine", kind: "checkbox", checked: true },
      {
        id: "abn",
        label: "Abnormal values only",
        tier: "routine",
        kind: "checkbox",
        checked: false,
      },
      {
        id: "d-comfy",
        label: "Comfortable",
        tier: "routine",
        kind: "radio",
        radioGroup: "density",
        checked: true,
        group: "Density",
      },
      {
        id: "d-compact",
        label: "Compact",
        tier: "routine",
        kind: "radio",
        radioGroup: "density",
        checked: false,
        group: "Density",
      },
    ],
    policy: undefined,
  },
  play: async ({ canvasElement }) => {
    const menu = await openByPointer(canvasElement);
    expect(within(menu).getAllByRole("menuitemcheckbox").length).toBe(2);
    expect(within(menu).getAllByRole("menuitemradio").length).toBe(2);
    // A toggle is view state and cannot be a clinical act: the validator
    // refuses anything above tier="routine" here.
    await userEvent.click(within(menu).getByRole("menuitemcheckbox", { name: /Abnormal/ }));
    expect(within(canvasElement).getByRole("menu")).toBeTruthy();
  },
};

export const Submenu: Story = {
  name: "A submenu, open beside its row",
  parameters: { state: "A submenu, open beside its row" },
  render: renderRow,
  args: {
    subject: {
      resource: "Observation",
      id: "obs-8812",
      label: "Potassium 6.8 mmol/L",
      detail: "Critical high · preliminary",
    },
    actions: [
      { id: "open", label: "Open result", tier: "routine" },
      {
        id: "trend",
        label: "Trend",
        tier: "routine",
        submenu: [
          { id: "t7", label: "Last 7 days", tier: "routine" },
          { id: "t30", label: "Last 30 days", tier: "routine" },
        ],
      },
    ],
    policy: undefined,
  },
  play: async ({ canvasElement }) => {
    const menu = await openByPointer(canvasElement);
    const trend = within(menu).getByRole("menuitem", { name: /Trend/ });
    expect(trend.getAttribute("aria-haspopup")).toBe("menu");
    expect(trend.getAttribute("aria-expanded")).toBe("false");

    /*
     * Opened, not merely announced. The first version of this story asserted
     * `aria-haspopup` and nothing else, and passed for a component whose
     * submenu did not exist — the row ran as a command and the children were
     * never rendered.
     */
    await userEvent.click(trend);
    const menus = within(canvasElement).getAllByRole("menu");
    expect(menus).toHaveLength(2);
    const child = menus.at(-1) ?? canvasElement;
    expect(within(child).getByRole("menuitem", { name: "Last 7 days" })).toBeTruthy();
    expect(trend.getAttribute("aria-expanded")).toBe("true");
  },
};

export const NoActions: Story = {
  name: "This record supports no actions",
  parameters: { state: "This record supports no actions" },
  render: renderRow,
  args: { actions: [], policy: undefined },
  play: async ({ canvasElement }) => {
    const menu = await openByPointer(canvasElement);
    expect(menu.textContent).toContain("This record supports no actions");
  },
};

export const AllWithheld: Story = {
  name: "Every action withheld from this role",
  parameters: { state: "Every action withheld from this role" },
  render: renderRow,
  args: { policy: { permitted: [], role: "a scheduling clerk", breakGlass: false } },
  play: async ({ canvasElement }) => {
    const menu = await openByPointer(canvasElement);
    // Deliberately a different sentence from the one above: verbs exist,
    // none of them are yours.
    expect(menu.textContent).toContain("No action on this record is available to you");
    expect(menu.textContent).toContain("hidden for a scheduling clerk");
  },
};

/* ------------------------------------------------------------------ */
/* Keyboard — not a declared state, but the one path that must not rot */
/* ------------------------------------------------------------------ */

export const KeyboardOnly: Story = {
  name: "Opened and driven from the keyboard",
  render: renderRow,
  play: async ({ canvasElement }) => {
    const row = within(canvasElement).getByTestId("row");
    row.focus();
    await userEvent.keyboard("{Shift>}{F10}{/Shift}");
    const menu = await within(canvasElement).findByRole("menu");

    // A keyboard open arms the first verb — never the subject header, which
    // is exactly the row a pointer lands on and a keyboard should skip.
    expect(document.activeElement?.textContent).toContain("Open order");
    expect(menu.getAttribute("aria-labelledby")).toBeTruthy();

    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(row);
  },
};
