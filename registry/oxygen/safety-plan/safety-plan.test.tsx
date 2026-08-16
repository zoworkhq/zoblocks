import { render, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { SafetyPlan, SAFETY_PLAN_STEP_ORDER, type SafetyPlanSteps } from "./safety-plan";

afterEach(cleanup);

const PLAN: SafetyPlanSteps = {
  warningSigns: {
    entries: ["Sleeping less than four hours", "Not answering messages for two days"],
  },
  internalCoping: { entries: ["Walk to the end of the road and back"] },
  distractions: { entries: ["The cafe on Bell Street before 11am"] },
  supportContacts: {
    contacts: [{ name: "Priya", detail: "Sister", availability: "Any time" }],
  },
  professionals: {
    contacts: [
      { name: "988", detail: "Suicide & Crisis Lifeline", availability: "24 hours" },
      { name: "County crisis team", detail: "555 0148", availability: "24 hours" },
    ],
  },
  environment: { entries: ["Priya is holding the spare keys to the garage"] },
};

const triggers = (c: HTMLElement) => [
  ...c.querySelectorAll<HTMLButtonElement>("button.ox-accordion__trigger"),
];

const crisisItem = (c: HTMLElement) => c.querySelector('[data-pinned="true"]') as HTMLElement;

describe("SafetyPlan", () => {
  it("renders all six steps in the instrument's order", () => {
    const view = render(<SafetyPlan steps={PLAN} />);
    const list = triggers(view.container);
    expect(list).toHaveLength(6);
    // The escalation from what someone can do alone to who they call is the
    // clinical content, so the order is not a layout choice.
    expect(list.map((t) => t.textContent?.trim().slice(0, 1))).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
    ]);
    expect(SAFETY_PLAN_STEP_ORDER).toHaveLength(6);
  });

  it("keeps the crisis numbers on screen without an interaction", () => {
    // The whole design. A person opening this at 2am should not have to make a
    // correct decision about a chevron to reach a phone number.
    const view = render(<SafetyPlan steps={PLAN} />);
    expect(view.getByText("988")).toBeTruthy();
    expect(view.getByText("Suicide & Crisis Lifeline")).toBeTruthy();
  });

  it("pins step five open and says so", () => {
    const view = render(<SafetyPlan steps={PLAN} />);
    const crisis = crisisItem(view.container);
    const button = within(crisis).getByRole("button");
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    // Stated in words, because the tint is discarded in forced-colors mode.
    expect(within(crisis).getByText("Always open")).toBeTruthy();
    expect(view.getByText(/stays open. You do not have to look for it/)).toBeTruthy();
  });

  it("will not close the crisis step, however hard it is pressed", async () => {
    const user = userEvent.setup();
    const view = render(<SafetyPlan steps={PLAN} />);
    const button = within(crisisItem(view.container)).getByRole("button");
    await user.click(button);
    await user.click(button);
    await user.keyboard("{Enter}");
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  it("keeps the crisis step open when another step is opened", async () => {
    const user = userEvent.setup();
    const view = render(<SafetyPlan steps={PLAN} />);
    // The plan is single-open, so this is where a naive implementation would
    // close the one step that must never close.
    await user.click(triggers(view.container)[0] as HTMLElement);
    expect(
      within(crisisItem(view.container)).getByRole("button").getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("shows one non-crisis step at a time", async () => {
    const user = userEvent.setup();
    const view = render(<SafetyPlan steps={PLAN} />);
    const list = triggers(view.container);
    await user.click(list[0] as HTMLElement);
    await user.click(list[1] as HTMLElement);
    expect(list[0]?.getAttribute("aria-expanded")).toBe("false");
    expect(list[1]?.getAttribute("aria-expanded")).toBe("true");
  });

  it("says a step is unfinished rather than dropping it", async () => {
    const user = userEvent.setup();
    // A five-step plan numbered one to five would claim the sixth was never
    // part of the instrument.
    const partial: SafetyPlanSteps = { ...PLAN };
    delete partial.environment;

    const view = render(<SafetyPlan steps={partial} />);
    expect(triggers(view.container)).toHaveLength(6);
    await user.click(triggers(view.container)[5] as HTMLElement);
    expect(view.getByText(/Not filled in yet/)).toBeTruthy();
  });

  it("renders an entirely empty plan as six unfinished steps", () => {
    const view = render(<SafetyPlan steps={{}} />);
    expect(triggers(view.container)).toHaveLength(6);
    // Including the crisis step, which is open and therefore visible.
    expect(view.getAllByText(/Not filled in yet/).length).toBeGreaterThan(0);
  });

  it("marks contacts up as pairs a screen reader can navigate", () => {
    const view = render(<SafetyPlan steps={PLAN} />);
    const crisis = crisisItem(view.container);
    expect(crisis.querySelector("dl")).not.toBeNull();
    expect(crisis.querySelectorAll("dt")).toHaveLength(2);
    expect(crisis.querySelectorAll("dd")).toHaveLength(2);
  });

  it("unpins for a clinician's editing view", async () => {
    const user = userEvent.setup();
    const view = render(<SafetyPlan steps={PLAN} pinCrisisStep={false} />);
    expect(view.container.querySelector('[data-pinned="true"]')).toBeNull();

    const list = triggers(view.container);
    // Every step is now an ordinary one, including the fifth.
    for (const t of list) expect(t.getAttribute("aria-expanded")).toBe("false");
    await user.click(list[4] as HTMLElement);
    expect(list[4]?.getAttribute("aria-expanded")).toBe("true");
    await user.click(list[4] as HTMLElement);
    expect(list[4]?.getAttribute("aria-expanded")).toBe("false");
  });

  it("shows when the plan was last revised, at the precision given", () => {
    const view = render(<SafetyPlan steps={PLAN} revisedAt="2026-08-11" />);
    const time = view.container.querySelector("time");
    expect(time?.getAttribute("datetime")).toBe("2026-08-11");
    expect(view.getByText(/Revised 2026-08-11/)).toBeTruthy();
  });

  it("takes replacement wording without letting the order change", () => {
    const view = render(
      <SafetyPlan steps={PLAN} labels={{ warningSigns: "Señales de advertencia" }} />,
    );
    expect(view.getByText(/1 · Señales de advertencia/)).toBeTruthy();
    // The label changed; the position did not.
    expect(triggers(view.container)[0]?.textContent).toContain("1 ·");
  });

  it("defaults to patient density", () => {
    const view = render(<SafetyPlan steps={PLAN} />);
    expect(
      (view.container.querySelector(".ox-accordion") as HTMLElement).getAttribute(
        "data-ox-density",
      ),
    ).toBe("patient");
  });

  it("uses the heading level it is given", () => {
    const view = render(<SafetyPlan steps={PLAN} headingLevel={2} />);
    expect(view.container.querySelectorAll("h2.ox-accordion__heading")).toHaveLength(6);
  });

  it("emits no tab pattern", () => {
    const view = render(<SafetyPlan steps={PLAN} />);
    expect(
      view.container.querySelectorAll('[role="tab"],[role="tablist"],[role="tabpanel"]'),
    ).toHaveLength(0);
  });
});
