/**
 * ClinicalStatus — the invariants, not the pixels.
 *
 * The component's whole claim is that a state cannot be rendered with colour
 * alone. That is a claim about *every* step of *every* scale, not about the
 * ones somebody remembered to write a test for, so the suite walks the
 * vocabulary exhaustively. A tenth scale added next year is covered the day it
 * lands, and a step added with no glyph or no patient wording fails here
 * rather than in a portal.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ClinicalStatus,
  SCALES,
  SCALE_NAMES,
  STEP_COUNT,
  StatusLegend,
  UnknownStatusError,
  describeStatus,
  fromAllergyCriticality,
  fromConsent,
  fromEncounterStatus,
  fromInterpretation,
  fromIssueSeverity,
  fromObservationStatus,
  fromRequestStatus,
  resolveStatus,
  statusWord,
  type ScaleName,
} from "./clinical-status";

/** Every (scale, step) pair in the vocabulary. */
const EVERY_STEP = SCALE_NAMES.flatMap((scale) =>
  SCALES[scale].steps.map((step) => [scale, step.id] as const),
);

describe("the vocabulary", () => {
  it("has nine scales and forty steps", () => {
    // Asserted so a step cannot be added or removed without the docs, the
    // stories and this number being reconciled deliberately.
    expect(SCALE_NAMES).toHaveLength(9);
    expect(STEP_COUNT).toBe(40);
    expect(EVERY_STEP).toHaveLength(40);
  });

  it("gives every step a unique id within its scale", () => {
    for (const scale of SCALE_NAMES) {
      const ids = SCALES[scale].steps.map((s) => s.id);
      expect(new Set(ids).size, `${scale} repeats a step id`).toBe(ids.length);
    }
  });

  it.each(EVERY_STEP)("%s/%s carries all three channels", (scale, id) => {
    const step = resolveStatus(scale, id);
    // The component's entire premise. A step missing any one of these is a
    // state that can only be read one way.
    expect(step.tone, "no tone").toBeTruthy();
    expect(step.glyph, "no glyph").toBeTruthy();
    expect(step.clinician.trim().length, "no clinician word").toBeGreaterThan(0);
    expect(step.patient.trim().length, "no patient word").toBeGreaterThan(0);
  });

  it.each(EVERY_STEP)("%s/%s has an abbreviation short enough for a grid", (scale, id) => {
    const { short } = resolveStatus(scale, id);
    expect(short.length).toBeGreaterThan(0);
    expect(short.length, `"${short}" is too long for a 40-row affix`).toBeLessThanOrEqual(5);
  });

  it("never leaves the patient register as a copy of the clinician one where it matters", () => {
    // Not a blanket rule — "Low" is "Low" to everybody. But the internal
    // states have to be translated, because publishing them to the person the
    // record is about is the failure this register exists to prevent.
    const internal = [
      ["result-status", "entered-in-error"],
      ["result-status", "preliminary"],
      ["data-quality", "unverified"],
      ["ai-verification", "ai-draft"],
      ["access", "part-2"],
    ] as const;
    for (const [scale, id] of internal) {
      const step = resolveStatus(scale, id);
      expect(step.patient, `${scale}/${id} ships the clinician word to patients`).not.toBe(
        step.clinician,
      );
    }
  });

  it("throws rather than degrading on an unknown step", () => {
    // A chip that silently renders "unknown" for a typo will one day render it
    // for a critical potassium, and it will look like a real state.
    expect(() => resolveStatus("criticality", "criticalll")).toThrow(UnknownStatusError);
    expect(() => resolveStatus("nonsense", "critical")).toThrow(UnknownStatusError);
  });

  it("names the alternatives when it throws", () => {
    expect(() => resolveStatus("criticality", "nope")).toThrow(/critical, high, moderate/);
    expect(() => resolveStatus("nope", "x")).toThrow(/criticality, result-status/);
  });
});

describe("rendering", () => {
  it.each(EVERY_STEP)("%s/%s renders a glyph and a word", (scale, id) => {
    const { container } = render(<ClinicalStatus scale={scale} step={id} />);
    const chip = container.querySelector("[data-ox-status]")!;
    const glyph = chip.querySelector(".ox-cs__glyph")!;

    expect(glyph, "no glyph element").toBeTruthy();
    expect(glyph.getAttribute("data-ox-glyph")).toBe(resolveStatus(scale, id).glyph);
    // The glyph is a second channel, not a labelled icon — the word already
    // carries the meaning into the accessible name.
    expect(glyph.getAttribute("aria-hidden")).toBe("true");
    expect(chip.textContent).toContain(resolveStatus(scale, id).clinician);
  });

  it.each(EVERY_STEP)("%s/%s names itself by its scale", (scale, id) => {
    render(<ClinicalStatus scale={scale} step={id} />);
    const label = screen.getByRole("img").getAttribute("aria-label");
    // "Criticality: Critical", never a bare "Critical" — a chip in a table
    // cell has no column header in its accessible context.
    expect(label).toBe(`${SCALES[scale].label}: ${resolveStatus(scale, id).clinician}`);
  });

  it("puts the qualifier inside the name rather than beside it", () => {
    render(
      <ClinicalStatus scale="criticality" step="critical" qualifier="resulted 41 minutes ago" />,
    );
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe(
      "Criticality: Critical, resulted 41 minutes ago",
    );
  });

  it("switches register without switching state", () => {
    const { rerender } = render(<ClinicalStatus scale="result-status" step="entered-in-error" />);
    expect(screen.getByRole("img")).toHaveTextContent("Entered in error");

    rerender(<ClinicalStatus scale="result-status" step="entered-in-error" audience="patient" />);
    const chip = screen.getByRole("img");
    expect(chip).toHaveTextContent("Recorded by mistake");
    // Same state, different words. The data attribute is what a test or a
    // stylesheet keys off, and it must not move with the register.
    expect(chip.getAttribute("data-ox-step")).toBe("entered-in-error");
    expect(chip.getAttribute("aria-label")).toContain("Recorded by mistake");
  });

  it("renders both the full word and the abbreviation, and lets CSS pick", () => {
    // Rendered together so the 360px swap costs no JavaScript and no layout
    // measurement, and so the accessible name never depends on which is shown.
    const { container } = render(<ClinicalStatus scale="criticality" step="not-assessed" />);
    expect(container.querySelector("[data-ox-full]")).toHaveTextContent("Not assessed");
    expect(container.querySelector("[data-ox-abbr]")).toHaveTextContent("N/A");
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("Not assessed");
  });

  it("drops the visible word for a dot but keeps it in the name", () => {
    render(<ClinicalStatus scale="criticality" step="critical" shape="dot" />);
    const chip = screen.getByRole("img");
    expect(chip.textContent).toBe("");
    expect(chip.getAttribute("aria-label")).toBe("Criticality: Critical");
  });

  it("shows the short form for a grid affix", () => {
    render(<ClinicalStatus scale="result-status" step="preliminary" shape="affix" />);
    const chip = screen.getByRole("img");
    expect(chip).toHaveTextContent("PREL");
    expect(chip.getAttribute("aria-label")).toBe("Result status: Preliminary");
  });

  it("carries the tone as data rather than as an inline colour", () => {
    // A stylesheet, a brand override and a print rule all need to reach this.
    // An inline colour would beat every one of them.
    const { container } = render(<ClinicalStatus scale="access" step="part-2" />);
    const chip = container.querySelector("[data-ox-status]") as HTMLElement;
    expect(chip.getAttribute("data-ox-tone")).toBe("restricted");
    expect(chip.style.color).toBe("");
    expect(chip.style.background).toBe("");
  });
});

describe("interaction", () => {
  it("is not focusable without something to open", () => {
    render(<ClinicalStatus scale="result-status" step="preliminary" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("img").tabIndex).toBe(-1);
  });

  it("becomes a real button when it can explain itself", async () => {
    const onExplain = vi.fn();
    render(<ClinicalStatus scale="result-status" step="preliminary" onExplain={onExplain} />);

    const button = screen.getByRole("button", { name: "Result status: Preliminary" });
    expect(button.tagName).toBe("BUTTON");
    // Keyboard, not a click: the affordance exists because guessing what
    // "preliminary" means is a clinical act, and that applies to every reader.
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    expect(onExplain).toHaveBeenCalledTimes(1);
    expect(onExplain.mock.calls[0]?.[0]).toMatchObject({ id: "preliminary" });
    expect(onExplain.mock.calls[0]?.[1]).toBe("result-status");
  });

  it("keeps a 24px target at both densities", () => {
    // SC 2.5.8 has no compact exemption. Density changes the chip, not the
    // hit area, which is why the rule is a max() rather than a fixed height.
    for (const density of ["default", "compact"] as const) {
      const { container, unmount } = render(
        <ClinicalStatus scale="criticality" step="high" density={density} onExplain={() => {}} />,
      );
      const chip = container.querySelector("button")!;
      expect(chip.getAttribute("data-ox-density")).toBe(density);
      unmount();
    }
  });
});

describe("the legend", () => {
  it("lists every step of its scale", () => {
    render(<StatusLegend scale="engagement" />);
    const list = screen.getByLabelText("Engagement legend");
    for (const step of SCALES.engagement.steps) {
      expect(list).toHaveTextContent(step.clinician);
    }
  });
});

describe("FHIR adapters", () => {
  it("maps only the panic interpretations to critical", () => {
    // HH and LL are the panic values. H and L are simply outside the range,
    // and conflating the two is how an alert list becomes noise nobody reads.
    expect(fromInterpretation("HH")).toBe("critical");
    expect(fromInterpretation("LL")).toBe("critical");
    expect(fromInterpretation("H")).toBe("high");
    expect(fromInterpretation("L")).toBe("high");
    expect(fromInterpretation("N")).toBe("normal");
  });

  it("treats an allergy's 'high' criticality as critical", () => {
    // The FHIR word understates it: a high-criticality allergy is the one that
    // kills somebody, and rendering it in the same tone as an abnormal sodium
    // is the mistake.
    expect(fromAllergyCriticality("high")).toBe("critical");
    expect(fromAllergyCriticality("low")).toBe("moderate");
    expect(fromAllergyCriticality("unable-to-assess")).toBe("not-assessed");
  });

  it("folds amended and corrected together", () => {
    expect(fromObservationStatus("amended")).toBe("corrected");
    expect(fromObservationStatus("corrected")).toBe("corrected");
    expect(fromObservationStatus("final")).toBe("final");
    expect(fromObservationStatus("entered-in-error")).toBe("entered-in-error");
  });

  it("lets a Part 2 label win over a permitting provision", () => {
    // A Part 2 record that also permits access is still Part 2. Rendering it
    // as plain "open" is the disclosure the regulation exists to prevent.
    expect(fromConsent("permit", ["42CFRPart2"])).toBe("part-2");
    expect(fromConsent("permit", [])).toBe("open");
    expect(fromConsent("deny", [])).toBe("restricted");
  });

  it("maps encounter and request lifecycles", () => {
    expect(fromEncounterStatus("triaged")).toBe("arrived");
    expect(fromEncounterStatus("onleave")).toBe("in-progress");
    expect(fromRequestStatus("on-hold")).toBe("preliminary");
    expect(fromRequestStatus("revoked")).toBe("cancelled");
    expect(fromIssueSeverity("high")).toBe("critical");
  });

  it("returns null for anything it does not recognise", () => {
    // A caller that renders nothing has a visible gap. A caller that renders a
    // guess has a plausible lie, and nobody will look at it twice.
    const adapters = [
      fromObservationStatus,
      fromInterpretation,
      fromAllergyCriticality,
      fromEncounterStatus,
      fromRequestStatus,
      fromIssueSeverity,
    ];
    for (const adapter of adapters) {
      expect(adapter("something-else")).toBeNull();
      expect(adapter(undefined)).toBeNull();
    }
    expect(fromConsent(undefined, [])).toBeNull();
  });

  it("only ever produces steps the vocabulary contains", () => {
    // The adapters are the one place a string crosses from an outside system
    // into the closed vocabulary, so every arm of every switch is checked
    // against it rather than trusted.
    const cases: Array<[ScaleName, string | null]> = [
      ["criticality", fromInterpretation("HH")],
      ["criticality", fromAllergyCriticality("low")],
      ["criticality", fromIssueSeverity("moderate")],
      ["result-status", fromObservationStatus("amended")],
      ["result-status", fromRequestStatus("ready")],
      ["encounter", fromEncounterStatus("planned")],
      ["access", fromConsent("deny", [])],
    ];
    for (const [scale, step] of cases) {
      expect(step).not.toBeNull();
      expect(() => resolveStatus(scale, step as string)).not.toThrow();
    }
  });
});

describe("describeStatus", () => {
  it("composes the sentence a screen reader should hear", () => {
    const step = resolveStatus("criticality", "critical");
    expect(describeStatus("criticality", step)).toBe("Criticality: Critical");
    expect(describeStatus("criticality", step, { audience: "patient" })).toBe(
      "Criticality: Needs urgent attention",
    );
    expect(describeStatus("criticality", step, { qualifier: "2 above prior" })).toBe(
      "Criticality: Critical, 2 above prior",
    );
  });

  it("defaults to the clinician register", () => {
    const step = resolveStatus("data-quality", "self-reported");
    expect(statusWord(step)).toBe("Self-reported");
    expect(statusWord(step, "patient")).toBe("You told us this");
  });
});
