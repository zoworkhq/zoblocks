import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AbsentValue } from "./absent-value";
import { itMeetsTheContract } from "../../../test/contract";

describe("AbsentValue", () => {
  itMeetsTheContract("default", () => <AbsentValue field="Potassium" />);

  /**
   * Absence with no stated reason is still a state. Rendering nothing here is
   * how "we never asked" becomes indistinguishable from "the value is normal".
   */
  it("renders a stated absence when given no reason at all", () => {
    const view = render(<AbsentValue field="Potassium" />);
    expect(view.container.textContent).toMatch(/not recorded/i);
  });

  it.each([
    ["unknown", /not known/i],
    ["pending", /result pending/i],
    ["not-collected", /not asked/i],
    ["declined", /declined/i],
    ["not-performed", /not performed/i],
    ["not-applicable", /not applicable/i],
  ] as const)("distinguishes the %s reason", (reason, expected) => {
    const view = render(<AbsentValue reason={reason} field="Potassium" />);
    expect(view.container.textContent).toMatch(expected);
  });

  it("keeps the distinct reasons distinct from one another", () => {
    const declined = render(<AbsentValue reason="declined" />).container.textContent;
    const notCollected = render(<AbsentValue reason="not-collected" />).container.textContent;
    expect(declined).not.toEqual(notCollected);
  });

  it("announces the field name alongside the absence", () => {
    const view = render(<AbsentValue reason="not-collected" field="Potassium" />);
    expect(view.container.textContent).toMatch(/potassium/i);
  });

  it("accepts a FHIR CodeableConcept as the reason", () => {
    const view = render(<AbsentValue reason={{ coding: [{ code: "masked" }] }} />);
    expect(view.container.textContent).toMatch(/hidden|restricted/i);
  });

  /**
   * Source text on a masked value can itself describe what was masked. The
   * component drops it deliberately; this test is what keeps that deliberate.
   */
  it("suppresses source detail on a restricted reason", () => {
    const view = render(<AbsentValue reason="masked" detail="Positive HIV serology" />);
    expect(view.container.textContent).not.toMatch(/HIV/i);
  });

  it("shows source detail on a non-restricted reason", () => {
    const view = render(<AbsentValue reason="error" detail="Specimen hemolyzed" />);
    expect(view.container.textContent).toMatch(/specimen hemolyzed/i);
  });

  it("offers access request only where there is access to request", async () => {
    const onRequestAccess = vi.fn();
    const { rerender } = render(
      <AbsentValue reason="masked" onRequestAccess={onRequestAccess} field="Potassium" />,
    );
    const button = screen.getByRole("button");
    await userEvent.click(button);
    expect(onRequestAccess).toHaveBeenCalledOnce();

    // Nothing to request when the data genuinely does not exist.
    rerender(<AbsentValue reason="not-collected" onRequestAccess={onRequestAccess} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
