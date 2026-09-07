/**
 * Stories for Safety Plan.
 *
 * The state that matters most is the one you cannot interact with: step five
 * renders open and stays open. Every story here is a check on that, from a
 * different direction.
 */

import type { Meta, StoryObj } from "@zoblocks/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import { SafetyPlan, type SafetyPlanSteps } from "./safety-plan";

const PLAN: SafetyPlanSteps = {
  warningSigns: {
    entries: [
      "Sleeping less than four hours",
      "Not answering messages for two days",
      "The thought that everyone would manage without me",
    ],
  },
  internalCoping: {
    entries: [
      "Walk to the end of the road and back",
      "Cold water on my wrists",
      "The breathing count Rachel showed me — four in, six out, ten times",
    ],
  },
  distractions: {
    entries: ["The cafe on Bell Street before 11am", "The Sunday running group"],
  },
  supportContacts: {
    contacts: [
      { name: "Priya", detail: "Sister", availability: "Any time" },
      { name: "Marcus", detail: "Flatmate", availability: "Home most evenings" },
    ],
  },
  professionals: {
    contacts: [
      { name: "988", detail: "Suicide & Crisis Lifeline", availability: "24 hours" },
      { name: "Rachel Okafor", detail: "Your therapist", availability: "Mon–Thu, 9–5" },
      { name: "County crisis team", detail: "555 0148", availability: "24 hours" },
    ],
  },
  environment: {
    entries: ["Priya is holding the paracetamol and the spare keys to the garage"],
  },
};

const meta: Meta<typeof SafetyPlan> = {
  title: "Clinical/Safety Plan",
  component: SafetyPlan,
  args: { steps: PLAN, revisedAt: "2026-08-11", headingLevel: 3 },
};

export default meta;
type Story = StoryObj<typeof SafetyPlan>;

export const Complete: Story = {
  name: "Complete plan",
  parameters: { state: "Complete plan" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Six steps, in the instrument's order. Nothing here sorts or filters,
    // because the escalation is the clinical content.
    expect(canvasElement.querySelectorAll("button.zb-accordion__trigger")).toHaveLength(6);
    await canvas.findByText(/Revised 2026-08-11/);
  },
};

export const CrisisPinned: Story = {
  name: "Crisis step pinned open",
  parameters: { state: "Crisis step pinned open" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Reachable without an interaction. A person opening this at 2am does not
    // scroll, and should not have to decide anything about a chevron.
    await canvas.findByText("988");
    await canvas.findByText("Suicide & Crisis Lifeline");

    const crisis = canvasElement.querySelector('[data-pinned="true"]') as HTMLElement;
    const trigger = within(crisis).getByRole("button");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-disabled")).toBe("true");

    // Pressing it does nothing, and the header says why rather than looking broken.
    await userEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(within(crisis).getByText("Always open")).toBeTruthy();
  },
};

export const Unfinished: Story = {
  name: "Unfinished step",
  parameters: { state: "Unfinished step" },
  args: {
    steps: {
      warningSigns: PLAN.warningSigns as SafetyPlanSteps["warningSigns"],
      professionals: PLAN.professionals as SafetyPlanSteps["professionals"],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Still six steps. A four-step plan numbered one to four would claim the
    // others were never part of the instrument.
    expect(canvasElement.querySelectorAll("button.zb-accordion__trigger")).toHaveLength(6);
    await userEvent.click(canvas.getByRole("button", { name: /Making home safer/ }));
    await canvas.findByText(/Not filled in yet/);
  },
};

export const Empty: Story = {
  name: "Empty plan",
  parameters: { state: "Empty plan" },
  args: { steps: {}, revisedAt: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvasElement.querySelectorAll("button.zb-accordion__trigger")).toHaveLength(6);
    // Even with nothing written, the crisis step is present and open — so the
    // scaffold reads as a plan to finish rather than as a broken screen.
    await canvas.findByText(/Not filled in yet/);
    expect(canvasElement.querySelector('[data-pinned="true"]')).not.toBeNull();
  },
};

export const ClinicianEditing: Story = {
  name: "Clinician editing view, nothing pinned",
  parameters: { state: "Clinician editing view, nothing pinned" },
  args: { pinCrisisStep: false, density: "standard" },
  play: async ({ canvasElement }) => {
    // The one surface where pinning is wrong: every step is being worked on,
    // and none of them is the emergency.
    expect(canvasElement.querySelector('[data-pinned="true"]')).toBeNull();
    const triggers = [...canvasElement.querySelectorAll("button.zb-accordion__trigger")];
    expect(triggers.every((t) => t.getAttribute("aria-expanded") === "false")).toBe(true);
    expect(triggers.every((t) => t.getAttribute("aria-disabled") === null)).toBe(true);
  },
};
