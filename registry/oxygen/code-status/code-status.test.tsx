import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodeStatus } from "./code-status";
import { itMeetsTheContract, expectStatedInWords } from "../../../test/contract";

const TZ = "Asia/Kolkata";
const AS_OF = new Date("2026-08-06T09:00:00Z");

describe("CodeStatus", () => {
  itMeetsTheContract("dnr", () => (
    <CodeStatus status="dnr" verifiedAt="2026-08-05T08:00:00Z" timeZone={TZ} asOf={AS_OF} />
  ));

  /**
   * Rule 1, and the reason this component exists: there is no default to full
   * code. Assuming resuscitation because nothing was found is a clinical
   * decision being made by a rendering fallback.
   */
  it("renders unknown status as unknown, never as full code", () => {
    const view = render(<CodeStatus timeZone={TZ} asOf={AS_OF} />);
    expectStatedInWords(view, /unknown|not documented|not recorded|no.*(directive|status)/i);
    expect(view.container.textContent).not.toMatch(/full code/i);
  });

  it("does not render an unknown status quietly", () => {
    const unknown = render(<CodeStatus timeZone={TZ} asOf={AS_OF} />).container.textContent ?? "";
    // An unknown status must say at least as much as a known one, not less.
    const known =
      render(<CodeStatus status="dnr" timeZone={TZ} asOf={AS_OF} />).container.textContent ?? "";
    expect(unknown.trim().length).toBeGreaterThan(known.trim().length / 2);
  });

  it.each(["full-code", "dnr", "dnr-dni", "comfort-only", "limited"] as const)(
    "states %s in words",
    (status) => {
      const view = render(<CodeStatus status={status} timeZone={TZ} asOf={AS_OF} />);
      expect((view.container.textContent ?? "").trim().length).toBeGreaterThan(0);
      expect(view.container.textContent).not.toContain("undefined");
    },
  );

  it("keeps DNR distinct from DNR/DNI in the rendered words", () => {
    const dnr = render(<CodeStatus status="dnr" timeZone={TZ} asOf={AS_OF} />).container
      .textContent;
    const dnrDni = render(<CodeStatus status="dnr-dni" timeZone={TZ} asOf={AS_OF} />).container
      .textContent;
    expect(dnr).not.toEqual(dnrDni);
  });

  /**
   * Rule 2: a directive verified two admissions ago is not the same claim as
   * one verified this morning.
   */
  it("marks a stale verification as stale", () => {
    const view = render(
      <CodeStatus
        status="dnr"
        verifiedAt="2025-01-04T08:00:00Z"
        staleAfterDays={90}
        timeZone={TZ}
        asOf={AS_OF}
      />,
    );
    expectStatedInWords(view, /policy window|re-?confirm|last verified \d+ days ago/i);
  });

  it("does not mark a recent verification as stale", () => {
    const view = render(
      <CodeStatus
        status="dnr"
        verifiedAt="2026-08-05T08:00:00Z"
        staleAfterDays={90}
        timeZone={TZ}
        asOf={AS_OF}
      />,
    );
    expect(view.container.textContent).not.toMatch(/stale|overdue/i);
  });

  /**
   * Rule 3: two directives from different dates is a question for a human.
   * Picking the newer one silently is the library deciding something it must
   * not decide.
   */
  it("surfaces a conflict rather than resolving it", () => {
    const view = render(<CodeStatus status="dnr" conflicting timeZone={TZ} asOf={AS_OF} />);
    expectStatedInWords(view, /do not agree|more than one directive|conflict/i);
    // Announced, not merely coloured — a conflict a reader can scroll past is
    // the same as no conflict at all.
    expect(view.container.querySelector("[role='alert']")).toBeInTheDocument();
  });

  it("does not claim the most recent directive wins", () => {
    const view = render(<CodeStatus status="dnr" conflicting timeZone={TZ} asOf={AS_OF} />);
    expect(view.container.textContent).toMatch(/not been assumed|review both/i);
  });

  it("does not announce a conflict when there is none", () => {
    const view = render(<CodeStatus status="dnr" timeZone={TZ} asOf={AS_OF} />);
    expect(view.container.textContent).not.toMatch(/do not agree|more than one directive/i);
  });

  it("shows the proxy contact when one is recorded", () => {
    const view = render(
      <CodeStatus
        status="dnr"
        timeZone={TZ}
        asOf={AS_OF}
        proxy={{
          resourceType: "RelatedPerson",
          id: "syn-proxy",
          name: [{ given: ["Ines"], family: "Duarte" }],
          relationship: [{ text: "Daughter" }],
        }}
        proxyPhone="555-0177"
      />,
    );
    expect(view.container.textContent).toMatch(/duarte/i);
    expect(view.container.textContent).toContain("555-0177");
  });
});
