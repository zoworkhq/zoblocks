import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  DensityProvider,
  DensityTarget,
  useDensity,
  useRegister,
  useSurface,
  useTerm,
} from "./density-provider";

function ReportDensity() {
  return <span data-testid="density">{useDensity()}</span>;
}

function ReportRegister() {
  return <span data-testid="register">{useRegister()}</span>;
}

function ReportDisclosure() {
  return <span data-testid="disclosure">{useSurface().disclosure}</span>;
}

function ReportTerm() {
  return <span data-testid="term">{useTerm({ clinician: "K+", patient: "Potassium" })}</span>;
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

describe("surface profile", () => {
  /**
   * The whole reason register is bound to the profile: a patient surface must
   * not inherit clinical shorthand just because nobody remembered to set it.
   */
  it("speaks the patient vocabulary at patient density", () => {
    render(
      <DensityProvider density="patient">
        <ReportRegister />
        <ReportTerm />
      </DensityProvider>,
    );
    expect(screen.getByTestId("register").textContent).toBe("patient");
    expect(screen.getByTestId("term").textContent).toBe("Potassium");
  });

  it.each(["standard", "clinical"] as const)(
    "speaks the clinician vocabulary at %s density",
    (density) => {
      render(
        <DensityProvider density={density}>
          <ReportRegister />
          <ReportTerm />
        </DensityProvider>,
      );
      expect(screen.getByTestId("register").textContent).toBe("clinician");
      expect(screen.getByTestId("term").textContent).toBe("K+");
    },
  );

  /** A clinician previewing exactly what the patient will see. */
  it("allows register to be overridden independently of density", () => {
    render(
      <DensityProvider density="clinical" register="patient">
        <ReportDensity />
        <ReportRegister />
        <ReportTerm />
      </DensityProvider>,
    );
    expect(screen.getByTestId("density").textContent).toBe("clinical");
    expect(screen.getByTestId("register").textContent).toBe("patient");
    expect(screen.getByTestId("term").textContent).toBe("Potassium");
  });

  it("exposes the register on the element for assertion", () => {
    const view = render(
      <DensityProvider density="patient">
        <p>x</p>
      </DensityProvider>,
    );
    expect(view.container.firstElementChild?.getAttribute("data-ox-register")).toBe("patient");
  });

  it("gives clinical density full disclosure and patient density progressive", () => {
    // Scoped to each render's own container: RTL binds its queries to
    // document.body, so two renders in one test would match twice.
    const read = (density: "patient" | "clinical") =>
      within(
        render(
          <DensityProvider density={density}>
            <ReportDisclosure />
          </DensityProvider>,
        ).container,
      ).getByTestId("disclosure").textContent;

    expect(read("clinical")).toBe("full");
    expect(read("patient")).toBe("progressive");
  });

  it("carries register down through a nested provider that only changes density", () => {
    render(
      <DensityProvider density="patient">
        <DensityProvider density="patient" register="clinician">
          <ReportRegister />
        </DensityProvider>
      </DensityProvider>,
    );
    expect(screen.getByTestId("register").textContent).toBe("clinician");
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
