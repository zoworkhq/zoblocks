import { render, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChartAccordion, type ChartSection } from "./chart-accordion";

afterEach(cleanup);

const SECTIONS: ChartSection[] = [
  {
    key: "risk",
    label: "Risk & suicidality",
    severity: "critical",
    status: "C-SSRS positive",
    updatedAt: "2026-08-13T09:12:00+05:30",
    children: <p>Ideation 3, no plan, no intent.</p>,
  },
  {
    key: "meds",
    label: "Medications",
    severity: "high",
    status: "Clozapine ANC due 18 Aug",
    count: "4 active",
    children: <p>Clozapine 300 mg nightly.</p>,
  },
  { key: "notes", label: "Progress notes", count: "142 encounters", children: <p>BIRP.</p> },
  {
    key: "psychotherapy",
    label: "Psychotherapy notes",
    access: { kind: "withheld", reason: "Kept separately by the author" },
  },
];

const triggers = (c: HTMLElement) => [
  ...c.querySelectorAll<HTMLButtonElement>("button.ox-accordion__trigger"),
];

describe("ChartAccordion", () => {
  it("renders every section as a heading-wrapped button", () => {
    const view = render(<ChartAccordion sections={SECTIONS} />);
    const list = triggers(view.container);
    expect(list).toHaveLength(4);
    for (const t of list) expect(t.parentElement?.tagName).toMatch(/^H[1-6]$/);
  });

  it("puts the status in the header, so the section can be read closed", () => {
    const view = render(<ChartAccordion sections={SECTIONS} />);
    // Closed, and the reader already knows to open this one.
    expect(triggers(view.container)[0]?.getAttribute("aria-expanded")).toBe("false");
    expect(view.getByText("C-SSRS positive")).toBeTruthy();
  });

  it("pairs every severity with a chip carrying its words", () => {
    // The rule the type enforces at the call site, checked in the output: a
    // rail with no text is a signal only some readers receive.
    const view = render(<ChartAccordion sections={SECTIONS} />);
    for (const severity of ["critical", "high"]) {
      const item = view.container.querySelector(`[data-severity="${severity}"]`);
      expect(item, severity).not.toBeNull();
      const chip = item?.querySelector(".ox-chip");
      expect(chip, `${severity} has a rail but no chip`).not.toBeNull();
      expect(chip?.textContent?.trim().length, `${severity} chip is empty`).toBeGreaterThan(0);
    }
  });

  it("renders a timestamp at the precision the record holds", () => {
    const view = render(<ChartAccordion sections={SECTIONS} />);
    const time = view.container.querySelector("time");
    // Not widened, not localised, not turned into "3 hours ago".
    expect(time?.getAttribute("datetime")).toBe("2026-08-13T09:12:00+05:30");
    expect(time?.textContent).toBe("2026-08-13T09:12:00+05:30");
  });

  it("renders a count without inventing a status for it", () => {
    const view = render(<ChartAccordion sections={SECTIONS} />);
    const notes = view.getByText("142 encounters");
    expect(notes.className).toContain("ox-chart-accordion__count");
    // No chip, because there is no severity and no status to carry.
    expect(notes.closest(".ox-accordion__item")?.querySelector(".ox-chip")).toBeNull();
  });

  it("expands everything the reader may have", async () => {
    const user = userEvent.setup();
    const view = render(<ChartAccordion sections={SECTIONS} />);
    await user.click(view.getByRole("button", { name: "Expand all" }));

    const expanded = triggers(view.container).filter(
      (t) => t.getAttribute("aria-expanded") === "true",
    );
    // Three of four: the withheld section is not "collapsed", it is absent.
    expect(expanded).toHaveLength(3);
  });

  it("never expands a withheld section", async () => {
    const user = userEvent.setup();
    const view = render(<ChartAccordion sections={SECTIONS} />);
    await user.click(view.getByRole("button", { name: "Expand all" }));

    const withheld = view.container.querySelector('[data-access="withheld"]');
    expect(withheld?.getAttribute("data-open")).toBe("false");
    expect(
      within(withheld as HTMLElement)
        .getByRole("button")
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("collapses everything", async () => {
    const user = userEvent.setup();
    const view = render(<ChartAccordion sections={SECTIONS} defaultOpenKeys={["risk", "meds"]} />);
    await user.click(view.getByRole("button", { name: "Collapse all" }));
    for (const t of triggers(view.container)) {
      expect(t.getAttribute("aria-expanded")).toBe("false");
    }
  });

  it("reports open keys to the caller", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const view = render(<ChartAccordion sections={SECTIONS} onChange={onChange} />);
    await user.click(triggers(view.container)[0] as HTMLElement);
    expect(onChange).toHaveBeenCalledWith(["risk"]);
  });

  it("defaults to clinical density without shrinking the target below the floor", () => {
    const view = render(<ChartAccordion sections={SECTIONS} />);
    const root = view.container.querySelector(".ox-accordion") as HTMLElement;
    expect(root.getAttribute("data-ox-density")).toBe("clinical");
  });

  it("hides the toolbar when asked", () => {
    const view = render(<ChartAccordion sections={SECTIONS} toolbar={false} />);
    expect(view.queryByRole("button", { name: "Expand all" })).toBeNull();
  });

  it("keeps a withheld section's content out of the DOM", async () => {
    const user = userEvent.setup();
    const smuggled = [{ ...SECTIONS[3], children: <p>SECRET</p> }] as unknown as ChartSection[];

    const view = render(<ChartAccordion sections={smuggled} />);
    await user.click(view.getByRole("button", { name: "Expand all" }));
    expect(view.container.innerHTML).not.toContain("SECRET");
  });

  it("renders an empty record without pretending it is a loaded one", () => {
    const view = render(<ChartAccordion sections={[]} toolbarLabel="Ada Lovelace" />);
    // The toolbar still names whose record this is, so an empty chart is
    // distinguishable from a chart that failed to render.
    expect(view.getByText("Ada Lovelace")).toBeTruthy();
    expect(triggers(view.container)).toHaveLength(0);
  });

  it("emits no tab pattern, like the primitive it composes", () => {
    const view = render(<ChartAccordion sections={SECTIONS} />);
    expect(
      view.container.querySelectorAll('[role="tab"],[role="tablist"],[role="tabpanel"]'),
    ).toHaveLength(0);
  });
});
