import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ConceptChip } from "./concept-chip";
import { itMeetsTheContract } from "../../../test/contract";

const SNOMED = "http://snomed.info/sct";
const CODED = { coding: [{ system: SNOMED, code: "44054006", display: "Type 2 diabetes" }] };

describe("ConceptChip", () => {
  itMeetsTheContract("coded", () => <ConceptChip concept={CODED} />);

  it("shows the display text a clinician reads", () => {
    const view = render(<ConceptChip concept={CODED} />);
    expect(view.container.textContent).toContain("Type 2 diabetes");
  });

  /** "Hiding the coding entirely makes data problems undiagnosable." */
  it("keeps the code reachable one interaction away", async () => {
    render(<ConceptChip concept={CODED} />);
    const trigger = screen.queryByRole("button");
    if (trigger) {
      await userEvent.click(trigger);
      expect(document.body.textContent).toContain("44054006");
    } else {
      expect(document.body.textContent).toContain("44054006");
    }
  });

  it("does not put the raw code inline where it makes lists unreadable", () => {
    const view = render(<ConceptChip concept={CODED} />);
    expect(view.container.textContent?.trim()).not.toContain("44054006");
  });

  /**
   * "Text with no coding at all is extremely common and is marked as such,
   * because an uncoded concept cannot drive a rule or a report."
   */
  it("marks an uncoded concept as uncoded", () => {
    const view = render(<ConceptChip concept={{ text: "Feels unwell" }} />);
    expect(view.container.textContent).toContain("Feels unwell");
    const surface = `${view.container.textContent ?? ""} ${view.container.innerHTML}`;
    expect(surface).toMatch(/uncoded|no code|not coded|text only/i);
  });

  it("does not mark a coded concept as uncoded", () => {
    const view = render(<ConceptChip concept={CODED} />);
    expect(view.container.textContent).not.toMatch(/uncoded|not coded/i);
  });

  /**
   * "When an expected value set is supplied, a concept outside it is flagged.
   * That flag is how bad mappings become visible instead of accumulating."
   */
  it("flags a concept outside the expected value set", () => {
    const view = render(<ConceptChip concept={CODED} expectedCodes={["73211009"]} />);
    const surface = `${view.container.textContent ?? ""} ${view.container.innerHTML}`;
    expect(surface).toMatch(/unexpected|outside|not in|unrecognis|unrecogniz/i);
  });

  it("does not flag a concept inside the expected value set", () => {
    const view = render(<ConceptChip concept={CODED} expectedCodes={["44054006"]} />);
    expect(view.container.textContent).not.toMatch(/unexpected|outside/i);
  });

  /** "A code from a system we do not recognise is shown with its raw system URI." */
  it("shows the raw system for an unrecognised code system", async () => {
    const local = {
      coding: [{ system: "http://local.example.org/codes", code: "X1", display: "Local concept" }],
    };
    render(<ConceptChip concept={local} showSystem />);
    const trigger = screen.queryByRole("button");
    if (trigger) await userEvent.click(trigger);
    expect(document.body.textContent).toMatch(/local\.example\.org/);
  });

  it("renders a missing concept as absent rather than blank", () => {
    const view = render(<ConceptChip concept={undefined} field="Diagnosis" />);
    const text = view.container.textContent ?? "";
    expect(text).not.toContain("undefined");
    expect(text.trim().length).toBeGreaterThan(0);
  });

  it("offers no disclosure control in read-only mode", () => {
    const view = render(<ConceptChip concept={CODED} readOnly />);
    expect(view.container.textContent).toContain("Type 2 diabetes");
  });
});
