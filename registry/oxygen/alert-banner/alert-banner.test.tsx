import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AlertBanner } from "./alert-banner";
import { itMeetsTheContract } from "../../../test/contract";

const FINDING = "Potassium 6.8 mmol/L — critical high";

describe("AlertBanner", () => {
  itMeetsTheContract("critical", () => <AlertBanner severity="critical" finding={FINDING} />);

  /**
   * Rule 1: the finding is stated, not the category. "Potassium 6.8 — critical
   * high" earns its interruption; "Abnormal result" does not, and teaches
   * people to dismiss without reading.
   */
  it("shows the specific finding it was given", () => {
    const view = render(<AlertBanner severity="critical" finding={FINDING} />);
    expect(view.container.textContent).toContain(FINDING);
  });

  it("announces a critical alert to assistive technology", () => {
    render(<AlertBanner severity="critical" finding={FINDING} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  /** A quiet tier must not seize the same announcement budget as a critical one. */
  it("does not announce a low-severity alert as an interruption", () => {
    render(<AlertBanner severity="low" finding="Flu vaccine due" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  /**
   * Rule 2: an alert everyone silently clears is an alert that should be
   * retired, and you cannot know that without the reasons.
   */
  it("will not dismiss a critical alert without a reason", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <AlertBanner
        severity="critical"
        finding={FINDING}
        dismissReasons={["Acted on", "Not clinically relevant"]}
        onDismiss={onDismiss}
      />,
    );

    await user.click(screen.getByRole("button", { name: /dismiss/i }));
    const confirm = screen.queryByRole("button", { name: /^dismiss$/i });
    if (confirm) await user.click(confirm);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("emits the reason when a critical alert is dismissed", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <AlertBanner
        severity="critical"
        finding={FINDING}
        dismissReasons={["Acted on", "Not clinically relevant"]}
        onDismiss={onDismiss}
      />,
    );

    await user.click(screen.getByRole("button", { name: /dismiss/i }));
    await user.selectOptions(screen.getByLabelText(/reason/i), "Acted on");
    await user.click(screen.getByRole("button", { name: /^dismiss$/i }));

    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledWith(expect.objectContaining({ reason: "Acted on" }));
  });

  it("shows the source so a clinician can judge the alert", () => {
    const view = render(
      <AlertBanner severity="high" finding={FINDING} source="Chemistry, 09:14" />,
    );
    expect(view.container.textContent).toContain("Chemistry, 09:14");
  });

  it("renders inline actions so responding does not require navigating away", () => {
    render(
      <AlertBanner
        severity="high"
        finding={FINDING}
        actions={<button type="button">Order ECG</button>}
      />,
    );
    expect(screen.getByRole("button", { name: /order ecg/i })).toBeInTheDocument();
  });

  it("keeps the severity tiers textually distinguishable", () => {
    const critical = render(<AlertBanner severity="critical" finding={FINDING} />).container
      .textContent;
    const low = render(<AlertBanner severity="low" finding={FINDING} />).container.textContent;
    expect(critical).not.toEqual(low);
  });
});
