/**
 * Stories for Switch.
 *
 * Written once, consumed four ways (ADR 0007): as documentation, as the
 * visual-regression fixture, as the accessibility fixture, and — through play
 * functions — as the interaction test.
 *
 * `parameters.state` ties each story to a state declared in switch.meta.ts.
 * The build asserts the two agree in both directions, so the component cannot
 * claim a state it never demonstrates, and cannot demonstrate one it never
 * declared. With sixteen declared states that check is doing real work: every
 * phase of the commit machine has to be reachable in a fixture.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { act, expect, within } from "../../../test/story-kit";
import { Switch, SwitchField, SwitchList } from "./switch";

const NOW = "2026-08-16T14:00:00.000Z";

const meta: Meta<typeof Switch> = {
  title: "Forms/Switch",
  component: Switch,
  args: { label: "Contact precautions", stateLabels: "in-effect" },
};

export default meta;
type Story = StoryObj<typeof Switch>;

/* ------------------------------------------------------------------ */
/* Value                                                               */
/* ------------------------------------------------------------------ */

export const On: Story = {
  name: "On",
  parameters: { state: "On" },
  args: { checked: true },
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole("switch");
    expect(control.getAttribute("aria-checked")).toBe("true");
    // The word carries the state as well as the colour does — on-track and
    // off-track sit within about 1.2:1 of each other in luminance.
    expect(canvasElement.textContent).toContain("In effect");
  },
};

export const Off: Story = {
  name: "Off",
  parameters: { state: "Off" },
  args: { checked: false },
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole("switch");
    expect(control.getAttribute("aria-checked")).toBe("false");
    expect(canvasElement.textContent).toContain("Not in effect");
  },
};

export const Unknown: Story = {
  name: "Unknown — an absence that says which kind it is",
  parameters: { state: "Unknown (absence, with a reason)" },
  args: {
    label: "Advance directive on file",
    stateLabels: "yes-no",
    checked: "unknown",
    absentReason: "not-collected",
  },
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole("switch");
    expect(control.getAttribute("aria-checked")).toBe("mixed");
    // Not a shrug. "Not asked" and "Declined" are different clinical facts.
    expect(canvasElement.textContent).toContain("Not asked");
    // A user may leave unknown; a user may never enter it. The negative path
    // is a real, keyboard-reachable control rather than a third click position.
    expect(within(canvasElement).getByRole("button", { name: /record no for/i })).toBeTruthy();
  },
};

/* ------------------------------------------------------------------ */
/* Commit phases                                                       */
/* ------------------------------------------------------------------ */

export const Pending: Story = {
  name: "Pending — the write is in flight",
  parameters: { state: "Pending — the write is in flight" },
  args: { checked: false, loading: true },
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole("switch");
    // A spinner that removes the control is a disabled state in a costume.
    expect(control.getAttribute("aria-busy")).toBe("true");
    expect(control.hasAttribute("disabled")).toBe(false);
    expect(control.hasAttribute("aria-disabled")).toBe(false);
  },
};

export const Committed: Story = {
  name: "Committed",
  parameters: { state: "Committed" },
  args: { checked: true },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole("switch").getAttribute("aria-checked")).toBe("true");
  },
};

export const Reverted: Story = {
  name: "Reverted — the write failed",
  parameters: { state: "Reverted — the write failed" },
  args: {
    checked: false,
    onCommit: () => Promise.reject(new Error("Could not reach the record.")),
  },
  play: async ({ canvasElement }) => {
    // The fixture renders the resting state; the revert transition itself is
    // asserted in switch.test.tsx, where timers can be controlled.
    expect(within(canvasElement).getByRole("switch").getAttribute("aria-checked")).toBe("false");
  },
};

export const Blocked: Story = {
  name: "Blocked — refused before trying",
  parameters: { state: "Blocked — refused before trying" },
  args: {
    checked: false,
    readOnly: true,
    lockedReason: "Your role cannot change precautions on this unit.",
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent).toContain("Your role cannot change precautions");
  },
};

export const Queued: Story = {
  name: "Queued — offline",
  parameters: { state: "Queued — offline" },
  args: { label: "Falls risk", checked: false, online: false },
  play: async ({ canvasElement }) => {
    // Queued is not pending: nothing has been sent, and the user may still
    // change their mind.
    expect(within(canvasElement).getByRole("switch").getAttribute("aria-busy")).toBe("false");
  },
};

export const Stale: Story = {
  name: "Stale — changed by someone else",
  parameters: { state: "Stale — changed by someone else" },
  args: { checked: true, serverValue: false },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group", { name: /conflicting change/i });
    const buttons = within(group).getAllByRole("button");
    // Two choices and no default: a conflict between two clinicians is not a
    // merge problem, and picking a winner discards somebody's reasoning.
    expect(buttons.length).toBe(2);
    expect(buttons.filter((b) => b.getAttribute("aria-pressed") === "true").length).toBe(0);
  },
};

/* ------------------------------------------------------------------ */
/* Availability                                                        */
/* ------------------------------------------------------------------ */

export const ReadOnly: Story = {
  name: "Read-only, with a reason",
  parameters: { state: "Read-only, with a reason" },
  args: {
    label: "Consent to share with GP",
    stateLabels: "given-declined",
    checked: true,
    readOnly: true,
    lockedReason: "Encounter signed 14:32 by Dr Okafor.",
  },
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole("switch");
    expect(control.getAttribute("aria-readonly")).toBe("true");
    // Still in the tab order — `disabled` would remove it from a screen-reader
    // user's world entirely, reason and all.
    expect(control.hasAttribute("disabled")).toBe(false);
    expect(canvasElement.textContent).toContain("Encounter signed 14:32");
  },
};

export const Disabled: Story = {
  name: "Disabled — the last resort",
  parameters: { state: "Disabled" },
  args: { checked: true, disabled: true },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole("switch").getAttribute("aria-disabled")).toBe("true");
  },
};

/* ------------------------------------------------------------------ */
/* Time-boxing and confirmation                                        */
/* ------------------------------------------------------------------ */

export const TimeBoxed: Story = {
  name: "Time-boxed — an on that is not forever",
  parameters: { state: "Time-boxed (until)" },
  args: {
    label: "Nil by mouth",
    tone: "caution",
    checked: true,
    until: "2026-08-16T14:30:00.000Z",
    now: NOW,
    untilWarnMs: 10 * 60 * 1000,
  },
  play: async ({ canvasElement }) => {
    // The window is beside the state, not in a tooltip. A flag that turns on
    // forever is how somebody stays nil-by-mouth for three days.
    expect(canvasElement.textContent).toMatch(/until/i);
    expect(canvasElement.textContent).toMatch(/ends/i);
  },
};

export const AwaitingConfirmation: Story = {
  name: "Awaiting confirmation",
  parameters: { state: "Awaiting confirmation" },
  args: {
    label: "Bypass allergy check for this order",
    tone: "critical",
    checked: false,
    confirm: "dialog",
    confirmCopy: {
      consequence:
        "Ada Lovelace's recorded penicillin allergy will not be checked. Recorded against your login.",
      subject: "Ada Lovelace",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await act(async () => {
      canvas.getByRole("switch").click();
    });
    const dialog = await canvas.findByRole("alertdialog");
    // Names the consequence and the patient. Never "Are you sure?", which asks
    // the reader to re-derive the thing they were unsure about — CONTENT.md §4.
    expect(dialog.textContent).toContain("Ada Lovelace");
    expect(/are you sure/i.test(dialog.textContent ?? "")).toBe(false);
  },
};

/* ------------------------------------------------------------------ */
/* Appearances                                                         */
/* ------------------------------------------------------------------ */

export const Segmented: Story = {
  name: "Segmented — both answers visible",
  parameters: { state: "Segmented — both answers visible" },
  args: {
    label: "Latex allergy",
    stateLabels: "yes-no",
    appearance: "segmented",
    checked: "unknown",
    absentReason: "not-collected",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Two labelled cells that both look pressable ARE a radio group. This is
    // the one appearance that changes the ARIA role, and it does so on purpose.
    expect(canvas.queryByRole("switch")).toBeNull();
    expect(canvas.getAllByRole("radio").length).toBe(2);
    expect(canvasElement.textContent).toContain("Not asked");
  },
};

export const Chip: Story = {
  name: "Chip — a filter bar",
  parameters: { state: "Chip — a filter bar" },
  args: {
    label: "Unacknowledged results",
    appearance: "chip",
    checked: true,
    stateLabels: "on-off",
  },
  play: async ({ canvasElement }) => {
    // A filter that says "Isolation" names a persistent state, not an action,
    // so it stays a switch rather than becoming a button.
    expect(
      within(canvasElement).getByRole("switch", { name: "Unacknowledged results" }),
    ).toBeTruthy();
  },
};

export const Row: Story = {
  name: "Row — the whole row is the target",
  parameters: { state: "Row — the whole row is the target" },
  args: {
    label: "Text me when my results are ready",
    description: "To the mobile ending 4471. Standard rates apply.",
    appearance: "row",
    audience: "patient",
    checked: true,
  },
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole("switch");
    expect(control.textContent).toContain("Text me when my results are ready");
    // Nothing interactive is nested inside the row target.
    expect(within(control).queryAllByRole("button").length).toBe(0);
  },
};

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

export const Precautions: StoryObj = {
  name: "A real panel — five rows, five different situations",
  parameters: {
    state: "On",
    // The state is already covered by the On story; this one exists as the
    // composition fixture and the VRT baseline for SwitchList.
    skipVrt: false,
  },
  render: () => (
    <SwitchList
      title="Isolation precautions"
      counts={{ on: 2, total: 4, unknown: 1 }}
      provenance={{ by: "S. Mehta", at: NOW }}
    >
      <SwitchField
        label="Contact"
        description="Gown and gloves on entry."
        stateLabels="in-effect"
        tone="caution"
        checked
      />
      <SwitchField
        label="Droplet"
        description="Surgical mask within two metres."
        stateLabels="in-effect"
        tone="caution"
        checked
      />
      <SwitchField
        label="Airborne"
        description="Negative-pressure room and N95."
        stateLabels="in-effect"
        checked={false}
        readOnly
        lockedReason="No negative-pressure room available on this unit."
      />
      <SwitchField
        label="Enteric"
        description="Dedicated commode; soap and water, not alcohol gel."
        stateLabels="in-effect"
        checked="unknown"
        absentReason="not-collected"
      />
    </SwitchList>
  ),
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group", { name: "Isolation precautions" });
    expect(within(group).getAllByRole("switch").length).toBe(4);
    // Unknown is counted separately from off. A count that folds "not asked"
    // into "off" is this component's headline failure at group scale.
    expect(canvasElement.textContent).toContain("2 of 4 in effect");
    expect(canvasElement.textContent).toContain("1 not asked");
  },
};
