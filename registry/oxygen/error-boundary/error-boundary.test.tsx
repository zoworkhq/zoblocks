import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { ClinicalErrorBoundary, type ErrorReport } from "./error-boundary";

const PHI = "Okonkwo, Amara — MRN 093-441-208";

function Explode({ message = "boom" }: { message?: string }): never {
  throw new Error(message);
}

/** Narrows the first reported call, so the assertions below need no `!`. */
function firstReport(onError: Mock): ErrorReport {
  const call = onError.mock.calls[0];
  if (!call) throw new Error("onError was never called");
  return call[0] as ErrorReport;
}

/** React logs caught errors to console.error; silence it so the run stays readable. */
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("ClinicalErrorBoundary", () => {
  it("renders its children when nothing throws", () => {
    const view = render(
      <ClinicalErrorBoundary label="Medications">
        <p>Amoxicillin 500 mg</p>
      </ClinicalErrorBoundary>,
    );
    expect(view.container.textContent).toContain("Amoxicillin 500 mg");
  });

  /**
   * "A blank screen is obviously broken; a partial render looks complete and
   * gets acted on." There is no render-nothing-and-move-on path.
   */
  it("refuses to be silent when a section throws", () => {
    const view = render(
      <ClinicalErrorBoundary label="Medications">
        <Explode />
      </ClinicalErrorBoundary>,
    );
    const text = view.container.textContent ?? "";
    expect(text.trim().length).toBeGreaterThan(0);
    expect(text).toMatch(/could not|failed|unavailable|error|problem/i);
  });

  it("names the section that failed, so the gap is locatable", () => {
    const view = render(
      <ClinicalErrorBoundary label="Medications">
        <Explode />
      </ClinicalErrorBoundary>,
    );
    expect(view.container.textContent).toContain("Medications");
  });

  it("contains the failure rather than taking down its siblings", () => {
    const view = render(
      <div>
        <ClinicalErrorBoundary label="Medications">
          <Explode />
        </ClinicalErrorBoundary>
        <p>Allergies: penicillin</p>
      </div>,
    );
    expect(view.container.textContent).toContain("Allergies: penicillin");
  });

  /** A critical boundary's absence changes what the reader can conclude. */
  it("marks a critical boundary differently from an ordinary one", () => {
    const ordinary = render(
      <ClinicalErrorBoundary label="Medications">
        <Explode />
      </ClinicalErrorBoundary>,
    ).container.textContent;
    const critical = render(
      <ClinicalErrorBoundary label="Code status" critical>
        <Explode />
      </ClinicalErrorBoundary>,
    ).container.textContent;
    expect(ordinary).not.toEqual(critical);
  });

  /**
   * The report is an allowlist, and this test is the lock on it. The props
   * that caused the throw are patient data and must never be attached — so a
   * later `props`, `error`, or `stack` field fails here rather than shipping.
   *
   * Note what this does NOT claim: `message` and `componentStack` DO leave, by
   * design. An application routing `onError` to third-party telemetry is
   * therefore forwarding whatever a thrown Error says, and app-authored
   * messages can contain patient data.
   */
  it("attaches nothing to the report beyond the allowlisted fields", () => {
    const onError = vi.fn();
    render(
      <ClinicalErrorBoundary label="Medications" onError={onError}>
        <Explode />
      </ClinicalErrorBoundary>,
    );

    expect(onError).toHaveBeenCalled();
    expect(Object.keys(firstReport(onError)).sort()).toEqual([
      "boundary",
      "componentStack",
      "message",
      "reference",
    ]);
  });

  it("does not attach the props that caused the throw", () => {
    const onError = vi.fn();
    // Takes patient props and throws without mentioning them — the report must
    // still not carry them, because React's error info knows the props even
    // when the message does not.
    function ExplodeWithPatient({ patient }: { patient: { name: string; mrn: string } }): never {
      if (patient) throw new Error("render failed");
      throw new Error("unreachable");
    }
    render(
      <ClinicalErrorBoundary label="Medications" onError={onError}>
        <ExplodeWithPatient patient={{ name: "Okonkwo, Amara", mrn: "093-441-208" }} />
      </ClinicalErrorBoundary>,
    );

    const serialised = JSON.stringify(firstReport(onError));
    expect(serialised).not.toContain("Okonkwo");
    expect(serialised).not.toContain("093-441-208");
  });

  it("keeps PHI out of the rendered fallback", () => {
    const view = render(
      <ClinicalErrorBoundary label="Medications">
        <Explode message={PHI} />
      </ClinicalErrorBoundary>,
    );
    expect(view.container.textContent).not.toContain("Okonkwo");
    expect(view.container.textContent).not.toContain("093-441-208");
  });

  it("reports a boundary name and reference so the failure can be traced", () => {
    const onError = vi.fn();
    render(
      <ClinicalErrorBoundary label="Medications" onError={onError}>
        <Explode />
      </ClinicalErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ boundary: "Medications" }));
    expect(String(firstReport(onError).reference ?? "").length).toBeGreaterThan(0);
  });

  it("shows the reference id to the reader, so they can quote it", () => {
    const onError = vi.fn();
    const view = render(
      <ClinicalErrorBoundary label="Medications" onError={onError}>
        <Explode />
      </ClinicalErrorBoundary>,
    );
    const id = String(firstReport(onError).reference ?? "");
    expect(view.container.textContent).toContain(id);
  });

  it("offers a retry when one is supplied", async () => {
    const onRetry = vi.fn();
    render(
      <ClinicalErrorBoundary label="Medications" onRetry={onRetry}>
        <Explode />
      </ClinicalErrorBoundary>,
    );
    await userEvent.click(screen.getByRole("button", { name: /retry|try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });
});
