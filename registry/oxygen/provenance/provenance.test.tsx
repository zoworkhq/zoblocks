import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { observations } from "@oxygenui-design/fixtures";
import { ProvenanceTag } from "./provenance";
import { itMeetsTheContract } from "../../../test/contract";

const TZ = "Asia/Kolkata";

/** Default rendering is an icon-only disclosure; its label is its whole surface. */
const triggerLabel = () => screen.getByRole("button").getAttribute("aria-label") ?? "";

describe("ProvenanceTag", () => {
  itMeetsTheContract("disclosure", () => (
    <ProvenanceTag resource={observations.heartRate} timeZone={TZ} />
  ));

  itMeetsTheContract("inline", () => (
    <ProvenanceTag resource={observations.heartRate} timeZone={TZ} inline />
  ));

  /**
   * "Present vs absent provenance. 'Source not recorded' is stated plainly
   * rather than papered over with a plausible-looking default, because a
   * confident wrong attribution is worse than an honest gap."
   */
  it("states plainly when there is no provenance rather than inventing a source", () => {
    const view = render(<ProvenanceTag timeZone={TZ} inline />);
    const text = view.container.textContent ?? "";
    expect(text).toMatch(/not recorded|unknown|no source|not stated/i);
    expect(text).not.toContain("undefined");
  });

  it("names its own trigger, since the trigger carries no text", () => {
    render(<ProvenanceTag resource={observations.heartRate} subject="Heart rate" timeZone={TZ} />);
    expect(triggerLabel().trim().length).toBeGreaterThan(0);
    expect(triggerLabel()).toMatch(/heart rate/i);
  });

  /**
   * "An amended result that looks identical to the original is a known harm
   * pathway." Amendment is surfaced on the trigger itself, not only inside
   * the popover — a correction nobody opens is a correction nobody saw.
   *
   * Amendment here means the RECORD was revised (versionId past the original,
   * or a revision entity). That is a different fact from a result whose
   * `status` is "corrected", which ObservationRow surfaces separately — a
   * record can be revised without the result changing, and vice versa.
   */
  it("surfaces a revised record on the trigger, not only inside the popover", () => {
    const revised = { ...observations.heartRate, meta: { versionId: "2" } };
    const view = render(<ProvenanceTag resource={revised} timeZone={TZ} />);
    const surface = `${view.container.textContent ?? ""} ${triggerLabel()}`;
    expect(surface).toMatch(/amend|revis|changed/i);
  });

  it("treats the first version as unamended", () => {
    const original = { ...observations.heartRate, meta: { versionId: "1" } };
    const view = render(<ProvenanceTag resource={original} timeZone={TZ} />);
    const surface = `${view.container.textContent ?? ""} ${triggerLabel()}`;
    expect(surface).not.toMatch(/amend|revis/i);
  });

  it("does not mark an unrevised resource as amended", () => {
    const view = render(<ProvenanceTag resource={observations.heartRate} timeZone={TZ} />);
    const surface = `${view.container.textContent ?? ""} ${triggerLabel()}`;
    expect(surface).not.toMatch(/amend|corrected/i);
  });

  it("discloses the detail on demand", async () => {
    render(<ProvenanceTag resource={observations.heartRate} subject="Heart rate" timeZone={TZ} />);
    await userEvent.click(screen.getByRole("button"));
    expect(document.body.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders the subject inline when asked", () => {
    const view = render(
      <ProvenanceTag resource={observations.heartRate} subject="Heart rate" timeZone={TZ} inline />,
    );
    expect((view.container.textContent ?? "").trim().length).toBeGreaterThan(0);
  });

  it("never emits an invalid date", () => {
    for (const inline of [true, false]) {
      const view = render(
        <ProvenanceTag resource={observations.heartRate} timeZone={TZ} inline={inline} />,
      );
      expect(view.container.innerHTML).not.toContain("Invalid Date");
      expect(view.container.innerHTML).not.toContain("NaN");
    }
  });
});
