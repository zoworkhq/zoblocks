import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Flag } from "@oxygenui-design/fhir";
import { PrecautionsBar } from "./precautions-bar";
import { itMeetsTheContract } from "../../../test/contract";

const AS_OF = new Date("2026-08-06T09:00:00Z");

function flag(overrides: Partial<Flag> & { id: string }): Flag {
  return {
    resourceType: "Flag",
    status: "active",
    code: { text: "Contact precautions" },
    subject: { reference: "Patient/syn-patient-routine" },
    ...overrides,
  } as Flag;
}

describe("PrecautionsBar", () => {
  itMeetsTheContract("isolation", () => (
    <PrecautionsBar
      precautions={[{ kind: "isolation", label: "Contact precautions", action: "Gown and gloves" }]}
      asOf={AS_OF}
    />
  ));

  /**
   * "'Contact precautions' is a label; 'gown and gloves' is an instruction."
   * This is read on the way through a door.
   */
  it("names the required action, not only the category", () => {
    const view = render(
      <PrecautionsBar
        precautions={[
          { kind: "isolation", label: "Contact precautions", action: "Gown and gloves" },
        ]}
        asOf={AS_OF}
      />,
    );
    expect(view.container.textContent).toContain("Gown and gloves");
  });

  /**
   * "A stale precaution left on screen is how staff learn to ignore all of
   * them, and the credibility of the whole bar depends on nothing false being
   * on it." Lapsed precautions are dropped, not greyed out.
   */
  it("drops a lapsed precaution rather than greying it out", () => {
    const view = render(
      <PrecautionsBar
        flags={[
          flag({
            id: "expired",
            code: { text: "Droplet precautions" },
            period: { start: "2026-01-01", end: "2026-02-01" },
          }),
        ]}
        asOf={AS_OF}
      />,
    );
    expect(view.container.textContent).not.toMatch(/droplet/i);
  });

  it("keeps a precaution that is still in force", () => {
    const view = render(
      <PrecautionsBar
        flags={[
          flag({
            id: "current",
            code: { text: "Droplet precautions" },
            period: { start: "2026-08-01", end: "2026-09-01" },
          }),
        ]}
        asOf={AS_OF}
      />,
    );
    expect(view.container.textContent).toMatch(/droplet/i);
  });

  it("drops an inactive flag", () => {
    const view = render(
      <PrecautionsBar
        flags={[flag({ id: "old", status: "inactive", code: { text: "Airborne precautions" } })]}
        asOf={AS_OF}
      />,
    );
    expect(view.container.textContent).not.toMatch(/airborne/i);
  });

  /**
   * "'Two staff for personal care' is actionable and carries no judgement;
   * 'aggressive' is a label that follows someone through the record." The
   * component renders a category without an approach rather than inventing a
   * characterisation.
   */
  it("does not invent a characterisation for a behavioral flag with no stated approach", () => {
    const view = render(
      <PrecautionsBar precautions={[{ kind: "behavioral", label: "Behavioral" }]} asOf={AS_OF} />,
    );
    const text = view.container.textContent ?? "";
    expect(text).not.toMatch(/aggressive|violent|difficult|combative|non-?compliant/i);
    expect(text.trim().length).toBeGreaterThan(0);
  });

  it("renders the approach when one is supplied", () => {
    const view = render(
      <PrecautionsBar
        precautions={[
          { kind: "behavioral", label: "Behavioral", action: "Two staff for personal care" },
        ]}
        asOf={AS_OF}
      />,
    );
    expect(view.container.textContent).toContain("Two staff for personal care");
  });

  it("renders nothing loud when there are no precautions", () => {
    const view = render(<PrecautionsBar precautions={[]} flags={[]} asOf={AS_OF} />);
    expect(view.container.textContent ?? "").not.toMatch(/precaution.*required/i);
  });
});
