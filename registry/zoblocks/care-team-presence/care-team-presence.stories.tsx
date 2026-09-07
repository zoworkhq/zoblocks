/**
 * Stories for CareTeamPresence.
 *
 * `parameters.state` ties each to a state declared in
 * `care-team-presence.meta.ts`, and the build asserts the two agree in both
 * directions.
 *
 * The first three are the argument, and they have to be read together: three
 * people who are all at a computer, all online, and all a different answer to
 * "can I contact them". Every presence system draws them as the same green dot.
 */

import type { Meta, StoryObj } from "@zoblocks/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import {
  ChartCoPresence,
  CoverageCard,
  PresenceChip,
  type Clinician,
  type CoverageWindow,
} from "./care-team-presence";

const vance: Clinician = { id: "clin-4", display: "A. Vance, MD", role: "Attending" };
const boateng: Clinician = {
  id: "clin-1",
  display: "T. Boateng, MD",
  role: "Night attending",
  contact: "pager 4471",
};
const marsh: Clinician = {
  id: "clin-5",
  display: "L. Marsh, LCSW",
  role: "Therapist",
  assignedTherapist: true,
};
const okafor: Clinician = { id: "clin-7", display: "N. Okafor, PMHNP", role: "Nurse practitioner" };

/** Fixed, because a story that reads the wall clock renders differently at 03:00. */
const NOW = "2026-08-24T02:30:00+05:30";

const rota: CoverageWindow[] = [
  {
    clinician: vance,
    start: "2026-08-23T09:00:00+05:30",
    end: "2026-08-23T19:00:00+05:30",
    reason: "Day service",
  },
  {
    clinician: boateng,
    start: "2026-08-23T19:00:00+05:30",
    end: "2026-08-24T09:00:00+05:30",
    reason: "Night coverage for A. Vance",
  },
];

const meta: Meta<typeof PresenceChip> = {
  title: "Clinical/Care Team Presence",
  component: PresenceChip,
  args: { presence: { clinician: vance, state: "available" }, now: NOW },
};

export default meta;
type Story = StoryObj<typeof PresenceChip>;

/* ------------------------------------------------------------------ */
/* The nine states — the argument                                      */
/* ------------------------------------------------------------------ */

export const Available: Story = {
  name: "Available",
  parameters: { state: "Available" },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group");
    expect(group.getAttribute("aria-label")).toBe("A. Vance, MD. Attending. Available.");
    // The only state that means what a green dot means.
    expect(canvasElement.querySelector("[data-zb-ring='solid']")).toBeTruthy();
  },
};

export const InSession: Story = {
  name: "In session — do not disturb",
  parameters: { state: "In session — do not disturb" },
  args: {
    presence: {
      clinician: marsh,
      state: "in-session",
      until: "15:50",
      detail: "Individual therapy",
    },
  },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group");
    // At a desk, online, and must not be interrupted. Said in words, because
    // the amber ring cannot be the only channel that carries it.
    expect(group.getAttribute("aria-label")).toContain("Do not disturb");
    expect(group.getAttribute("data-zb-dnd")).toBe("");
  },
};

export const InGroup: Story = {
  name: "In group — eight patients, not one",
  parameters: { state: "In group — eight patients, not one" },
  args: {
    presence: {
      clinician: marsh,
      state: "in-group",
      detail: "IOP group · 8 members",
      until: "11:30",
    },
    onContact: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Nobody covering, so the only way through is an explicit override.
    const button = canvas.getByRole("button");
    expect(button.getAttribute("data-zb-escalation")).toBe("override-required");
    expect(button.textContent).toContain("Interrupt");
    await userEvent.click(button);
  },
};

export const OnCrisisLine: Story = {
  name: "On crisis line",
  parameters: { state: "On crisis line" },
  args: {
    presence: { clinician: okafor, state: "on-crisis-line", detail: "Regional line" },
  },
  play: async ({ canvasElement }) => {
    // A slow breath rather than a flash: the line is staffed for a whole
    // shift, and prefers-reduced-motion removes it entirely.
    expect(canvasElement.querySelector("[data-zb-ring='pulse']")).toBeTruthy();
  },
};

export const OnCall: Story = {
  name: "On call",
  parameters: { state: "On call" },
  args: { presence: { clinician: boateng, state: "on-call", until: "07:00" } },
  play: async ({ canvasElement }) => {
    const label = within(canvasElement).getByRole("group").getAttribute("aria-label") ?? "";
    expect(label).toContain("On call");
    expect(label).toContain("Until 07:00");
    // The pager reaches the accessible name; a contact nobody can hear is not
    // a contact.
    expect(label).toContain("Pager 4471");
  },
};

export const SignedOut: Story = {
  name: "Signed out, with the cover named",
  parameters: { state: "Signed out, with the cover named" },
  args: {
    presence: { clinician: vance, state: "signed-out", coveredBy: boateng, until: "07:00" },
    onContact: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Online, and the wrong person. The redirect is on the face rather than
    // in a tooltip, and the button already points at the right person.
    expect(canvas.getByText(/covered by T\. Boateng, MD/)).toBeTruthy();
    expect(canvas.getByRole("button").textContent).toContain("Page T. Boateng, MD");
  },
};

export const OffShift: Story = {
  name: "Off shift, nobody covering",
  parameters: { state: "Off shift, nobody covering" },
  args: { presence: { clinician: marsh, state: "off-shift" } },
  play: async ({ canvasElement }) => {
    // Different from signed out: nobody took the handover, and the missing
    // ring says so before the words do.
    expect(canvasElement.querySelector("[data-zb-ring='none']")).toBeTruthy();
    expect(within(canvasElement).getByText("Off shift")).toBeTruthy();
  },
};

export const Degraded: Story = {
  name: "Presence degraded, with its age",
  parameters: { state: "Presence degraded, with its age" },
  args: {
    presence: { clinician: vance, state: "degraded", since: "2026-08-23T23:30:00+05:30" },
  },
  play: async ({ canvasElement }) => {
    // A dot that froze three hours ago and still looks live is the failure
    // this state exists to prevent, so the age is on the face.
    expect(within(canvasElement).getByText(/Last seen 3 h ago/)).toBeTruthy();
  },
};

export const Unknown: Story = {
  name: "Presence unknown",
  parameters: { state: "Presence unknown" },
  args: { presence: { clinician: okafor, state: "unknown" } },
  play: async ({ canvasElement }) => {
    // Never reported, which is not the same as offline.
    expect(canvasElement.querySelector("[data-zb-ring='dotted']")).toBeTruthy();
  },
};

/* ------------------------------------------------------------------ */
/* Presentation                                                        */
/* ------------------------------------------------------------------ */

export const AssignedTherapist: Story = {
  name: "Assigned therapist",
  parameters: { state: "Assigned therapist" },
  args: { presence: { clinician: marsh, state: "available" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A different fact from care-team membership: in behavioral health this
    // is the person a disclosure decision routes through.
    expect(canvas.getByText("assigned therapist")).toBeTruthy();
    expect(canvas.getByRole("group").getAttribute("aria-label")).toContain("Assigned therapist");
  },
};

export const Compact: Story = {
  name: "Compact — avatar only",
  parameters: { state: "Compact — avatar only" },
  args: { presence: { clinician: vance, state: "available" }, compact: true },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group");
    // The name leaves the screen and stays in the label. Dropping both is how
    // an avatar stack becomes unreadable to a screen reader.
    expect(canvasElement.textContent).not.toContain("A. Vance, MD");
    expect(group.getAttribute("aria-label")).toContain("A. Vance, MD");
  },
};

/* ------------------------------------------------------------------ */
/* Coverage — the question the shared-drive PDF answers today          */
/* ------------------------------------------------------------------ */

export const CoverageResolved: Story = {
  name: "Coverage resolved",
  parameters: { state: "Coverage resolved" },
  render: () => <CoverageCard windows={rota} now={NOW} backup={okafor} onPage={() => {}} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByRole("group").getAttribute("aria-label") ?? "";
    // 02:30 falls inside the night window, not the day one.
    expect(label).toContain("T. Boateng, MD");
    expect(label).toContain("Back-up N. Okafor, PMHNP");
    await userEvent.click(canvas.getByRole("button"));
  },
};

export const CoverageGap: Story = {
  name: "Coverage gap",
  parameters: { state: "Coverage gap" },
  render: () => (
    // Both windows end before this moment. Filling the hole with the nearest
    // plausible name is how a page goes to somebody who is asleep.
    <CoverageCard windows={[rota[0] as CoverageWindow]} now={NOW} onPage={() => {}} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    expect(alert.getAttribute("data-zb-coverage")).toBe("gap");
    // Nobody to page, so no page button — the escalation is named instead.
    expect(canvas.queryByRole("button")).toBeNull();
  },
};

/* ------------------------------------------------------------------ */
/* Co-presence — told before you type, not at save                     */
/* ------------------------------------------------------------------ */

export const SomeoneDocumenting: Story = {
  name: "Someone else is documenting",
  parameters: { state: "Someone else is documenting" },
  render: () => (
    <ChartCoPresence
      others={[
        {
          clinician: marsh,
          activity: "documenting",
          since: "2026-08-24T02:20:00+05:30",
          target: "Progress note",
          unsigned: true,
        },
      ]}
      now={NOW}
      onOpenTheirs={() => {}}
      onRequestHandoff={() => {}}
      onSeparateAddendum={() => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Three options, none of them "carry on anyway", and none of them a
    // highlighted default.
    expect(canvas.getAllByRole("button")).toHaveLength(3);
    expect(canvasElement.textContent).toContain("duplicate");
    await userEvent.click(canvas.getByRole("button", { name: /read-only/i }));
  },
};

export const SomeoneSigning: Story = {
  name: "Someone else is signing",
  parameters: { state: "Someone else is signing" },
  render: () => (
    <ChartCoPresence
      others={[
        {
          clinician: vance,
          activity: "signing",
          since: "2026-08-24T02:29:00+05:30",
          target: "Discharge summary",
        },
      ]}
      now={NOW}
      onRequestHandoff={() => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    // Signing is a conflict, and it is not the duplicate-note one.
    expect(canvasElement.textContent).toContain("is signing in this encounter");
    expect(canvasElement.textContent).not.toContain("duplicate");
  },
};

export const ViewingOnly: Story = {
  name: "Four in the chart, viewing only",
  parameters: { state: "Four in the chart, viewing only" },
  render: () => (
    <ChartCoPresence
      others={[vance, boateng, marsh, okafor].map((clinician) => ({
        clinician,
        activity: "viewing" as const,
        since: "2026-08-24T02:25:00+05:30",
      }))}
      now={NOW}
    />
  ),
  play: async ({ canvasElement }) => {
    // Reading is not a conflict. Warning about it would train people to
    // dismiss the warning that matters.
    expect(canvasElement.querySelectorAll(".zb-presence__avatar")).toHaveLength(4);
    expect(within(canvasElement).queryByRole("button")).toBeNull();
  },
};
