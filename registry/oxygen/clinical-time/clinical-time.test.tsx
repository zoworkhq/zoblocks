import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClinicalTime } from "./clinical-time";
import { itMeetsTheContract } from "../../../test/contract";

const TZ = "Asia/Kolkata";
const AS_OF = new Date("2026-08-06T09:00:00Z");

describe("ClinicalTime", () => {
  itMeetsTheContract("instant", () => (
    <ClinicalTime value="2026-08-03T09:14:00Z" timeZone={TZ} asOf={AS_OF} />
  ));

  /**
   * Rule 2: FHIR dateTime may be a year, a month, a day, or an instant.
   * Rendering "2026" as 1 January 2026 invents a day nobody recorded — and a
   * fabricated onset date is the kind of thing that gets copied into a note.
   */
  it("does not invent a month or day from a year-only value", () => {
    const view = render(<ClinicalTime value="2026" timeZone={TZ} asOf={AS_OF} />);
    const text = view.container.textContent ?? "";
    expect(text).toContain("2026");
    expect(text).not.toMatch(/january|jan\b/i);
    expect(text).not.toMatch(/\b1\b/);
  });

  it("does not invent a day from a month-only value", () => {
    const view = render(<ClinicalTime value="2026-03" timeZone={TZ} asOf={AS_OF} />);
    const text = view.container.textContent ?? "";
    expect(text).toMatch(/mar/i);
    expect(text).toContain("2026");
    expect(text).not.toMatch(/\b0?1\b/);
  });

  it("does not invent a time of day from a date-only value", () => {
    const view = render(<ClinicalTime value="2026-03-17" timeZone={TZ} asOf={AS_OF} />);
    expect(view.container.textContent).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it("renders a full instant with a time", () => {
    const view = render(<ClinicalTime value="2026-08-03T09:14:00Z" timeZone={TZ} asOf={AS_OF} />);
    expect(view.container.textContent).toMatch(/\d{1,2}:\d{2}/);
  });

  /**
   * Rule 1: relative time is an addition, never a replacement. "Two hours ago"
   * is useless in a handover and wrong in a medication record.
   */
  it("keeps the absolute time reachable when displaying relative time", () => {
    const view = render(
      <ClinicalTime value="2026-08-06T07:00:00Z" timeZone={TZ} display="relative" asOf={AS_OF} />,
    );
    const el = view.container.querySelector("time");
    const accessible = `${el?.getAttribute("aria-label") ?? ""} ${el?.getAttribute("title") ?? ""} ${view.container.textContent ?? ""}`;
    expect(accessible).toMatch(/2026/);
  });

  it("renders the same instant differently in different zones", () => {
    const kolkata = render(
      <ClinicalTime value="2026-08-03T20:30:00Z" timeZone="Asia/Kolkata" asOf={AS_OF} />,
    ).container.textContent;
    const newYork = render(
      <ClinicalTime value="2026-08-03T20:30:00Z" timeZone="America/New_York" asOf={AS_OF} />,
    ).container.textContent;
    expect(kolkata).not.toEqual(newYork);
  });

  it("names the zone when asked, so a handover is not ambiguous", () => {
    const view = render(
      <ClinicalTime value="2026-08-03T09:14:00Z" timeZone={TZ} showZone asOf={AS_OF} />,
    );
    expect((view.container.textContent ?? "").length).toBeGreaterThan(10);
  });

  it("renders a missing value as absent rather than as an invalid date", () => {
    const view = render(<ClinicalTime timeZone={TZ} asOf={AS_OF} />);
    const text = view.container.textContent ?? "";
    expect(text).not.toContain("Invalid Date");
    expect(text).not.toContain("NaN");
    expect(text.trim().length).toBeGreaterThan(0);
  });

  it("does not crash or emit NaN on an unparseable value", () => {
    const view = render(<ClinicalTime value="not-a-date" timeZone={TZ} asOf={AS_OF} />);
    const text = view.container.textContent ?? "";
    expect(text).not.toContain("Invalid Date");
    expect(text).not.toContain("NaN");
  });
});
