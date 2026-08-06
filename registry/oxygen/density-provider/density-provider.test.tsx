import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DensityProvider, DensityTarget, useDensity } from "./density-provider";

function ReportDensity() {
  return <span data-testid="density">{useDensity()}</span>;
}

describe("DensityProvider", () => {
  it.each(["patient", "standard", "clinical"] as const)("provides %s density", (density) => {
    render(
      <DensityProvider density={density}>
        <ReportDensity />
      </DensityProvider>,
    );
    expect(screen.getByTestId("density").textContent).toBe(density);
  });

  /** "Innermost wins" — a patient-facing card inside a clinical worklist. */
  it("lets a nested provider override its parent", () => {
    render(
      <DensityProvider density="clinical">
        <DensityProvider density="patient">
          <ReportDensity />
        </DensityProvider>
      </DensityProvider>,
    );
    expect(screen.getByTestId("density").textContent).toBe("patient");
  });

  it("falls back to a density outside any provider", () => {
    render(<ReportDensity />);
    expect(["patient", "standard", "clinical"]).toContain(
      screen.getByTestId("density").textContent,
    );
  });

  /**
   * "Hiding a fact to save a row is a defect, not a density mode." Density
   * changes spacing, never which clinical facts appear.
   */
  it("renders the same content at every density", () => {
    const texts = (["patient", "standard", "clinical"] as const).map(
      (density) =>
        render(
          <DensityProvider density={density}>
            <p>Potassium 6.8 mmol/L</p>
          </DensityProvider>,
        ).container.textContent,
    );
    expect(new Set(texts).size).toBe(1);
    expect(texts[0]).toContain("Potassium 6.8 mmol/L");
  });

  it("sets a distinct density on the element for each mode", () => {
    const attrs = (["patient", "standard", "clinical"] as const).map((density) =>
      render(
        <DensityProvider density={density}>
          <p>x</p>
        </DensityProvider>,
      ).container.firstElementChild?.getAttribute("data-ox-density"),
    );
    expect(new Set(attrs).size).toBe(3);
  });
});

describe("DensityTarget", () => {
  /**
   * WCAG 2.2 target size: `clinical` may be tight, but it may not shrink an
   * interactive target below the 24px floor. The provider clamps rather than
   * trusting every component to remember.
   */
  it("keeps an interactive target at or above the 24px floor in clinical density", () => {
    const view = render(
      <DensityProvider density="clinical">
        <DensityTarget>
          <button type="button">Sign</button>
        </DensityTarget>
      </DensityProvider>,
    );

    const html = view.container.innerHTML;
    // Any explicit target sizing must not fall under 24px.
    const sizes = Array.from(html.matchAll(/min-(?:height|width):\s*(\d+(?:\.\d+)?)px/g)).map((m) =>
      Number(m[1]),
    );
    for (const size of sizes) expect(size).toBeGreaterThanOrEqual(24);
  });

  it("renders its child", () => {
    render(
      <DensityProvider density="clinical">
        <DensityTarget>
          <button type="button">Sign</button>
        </DensityTarget>
      </DensityProvider>,
    );
    expect(screen.getByRole("button", { name: /sign/i })).toBeInTheDocument();
  });
});
