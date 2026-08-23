/**
 * ResultValue — the four lies, and one test class per lie.
 *
 * Every assertion here traces to a way a rendered number misleads a clinician
 * on a screen that looks perfect. The absence suite is exhaustive across all
 * seven reasons for the same reason ClinicalStatus walks all forty steps: the
 * failure mode is a reason nobody wrote a case for rendering as a blank.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ABSENCE,
  ABSENT_REASONS,
  ResultValue,
  describeElapsed,
  describeRange,
  describeResult,
  formatRange,
  fromDataAbsentReason,
  fromObservation,
  resolveDelta,
  resolveInterpretation,
  type ResultValueData,
} from "./result-value";

const NOW = "2026-08-12T10:41:00Z";

const potassium: ResultValueData = {
  id: "k",
  versionId: "1",
  analyte: "Potassium",
  value: 6.8,
  unit: "mmol/L",
  interpretation: "critical",
  range: { low: 3.5, high: 5.1 },
  status: "final",
  resultedAt: "2026-08-12T10:00:00Z",
};

describe("the value line", () => {
  it("renders the number, the unit and nothing implied", () => {
    render(<ResultValue value={potassium} />);
    const group = screen.getByRole("group");
    expect(group).toHaveTextContent("6.8");
    expect(group).toHaveTextContent("mmol/L");
    expect(group).toHaveTextContent("3.5–5.1");
  });

  it("keeps a comparator rather than dropping it", () => {
    // "<0.04" and "0.04" are different results, and the second is a claim the
    // assay did not make.
    render(
      <ResultValue
        value={{ id: "t", analyte: "Troponin", value: 0.04, comparator: "<", unit: "ng/mL" }}
      />,
    );
    expect(screen.getByRole("group")).toHaveTextContent("<");
    expect(screen.getByRole("group").getAttribute("aria-label")).toContain("< 0.04");
  });

  it("never colours the number itself by interpretation", () => {
    // The chip carries the interpretation. A red number is colour-alone and
    // disappears in greyscale, which is the whole thing the library refuses.
    const { container } = render(<ResultValue value={potassium} />);
    const number = container.querySelector(".ox-rv__number") as HTMLElement;
    expect(number.style.color).toBe("");
    expect(container.querySelector("[data-ox-status][data-ox-scale='criticality']")).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/* Lie 1 — a preliminary result that looks final                       */
/* ------------------------------------------------------------------ */

describe("status is never implicit", () => {
  it("renders the status chip whenever a status is known", () => {
    const { container } = render(<ResultValue value={{ ...potassium, status: "preliminary" }} />);
    expect(
      container.querySelector("[data-ox-scale='result-status'][data-ox-step='preliminary']"),
    ).toBeTruthy();
  });

  it("says what preliminary means in the accessible name", () => {
    render(<ResultValue value={{ ...potassium, status: "preliminary" }} />);
    // Not the word alone: "preliminary" is a term of art, and the sentence has
    // to survive being the only thing a reader hears.
    expect(screen.getByRole("group").getAttribute("aria-label")).toContain(
      "preliminary, not verified by the laboratory",
    );
  });
});

/* ------------------------------------------------------------------ */
/* Lie 2 — a rangeless result that looks normal                        */
/* ------------------------------------------------------------------ */

describe("an absent range is stated", () => {
  it("derives not-assessed rather than normal when there is no range", () => {
    // Silence is not a normal result. This is the single most consequential
    // line in the file.
    const resolved = resolveInterpretation({ id: "f", analyte: "Ferritin", value: 212 });
    expect(resolved).toEqual({ step: "not-assessed", derived: true });
  });

  it("prints the lab's reason when it supplied no range", () => {
    render(
      <ResultValue
        value={{
          id: "f",
          analyte: "Ferritin",
          value: 212,
          unit: "ng/mL",
          noRangeReason: "No range for this patient",
        }}
      />,
    );
    const group = screen.getByRole("group");
    expect(group).toHaveTextContent("No range for this patient");
    expect(group.getAttribute("aria-label")).toContain("No range for this patient");
  });

  it("keeps a range's qualification, because a range without it is a different range", () => {
    // Lithium at 0.9 is therapeutic for maintenance and low for acute mania.
    const range = { low: 0.6, high: 1.2, appliesTo: "maintenance" };
    expect(describeRange(range)).toBe("0.6 to 1.2, maintenance");
    render(<ResultValue value={{ id: "li", analyte: "Lithium", value: 0.9, range }} />);
    expect(screen.getByRole("group")).toHaveTextContent("maintenance");
  });

  it("never derives critical from arithmetic", () => {
    // A panic threshold is a laboratory policy, not a distance from the range.
    const far = resolveInterpretation({
      id: "k",
      analyte: "K",
      value: 99,
      range: { low: 3.5, high: 5.1 },
    });
    expect(far?.step).toBe("high");
    expect(far?.derived).toBe(true);
  });

  it("lets a stated interpretation beat a derived one", () => {
    // The lab's judgement accounts for the assay, the collection and the
    // patient's history. The range is a population statistic.
    const stated = resolveInterpretation({
      id: "k",
      analyte: "K",
      value: 4.0,
      range: { low: 3.5, high: 5.1 },
      interpretation: "critical",
    });
    expect(stated).toEqual({ step: "critical", derived: false });
  });
});

/* ------------------------------------------------------------------ */
/* Lie 3 — a correction that replaced what you read                    */
/* ------------------------------------------------------------------ */

describe("a correction shows the value it replaced", () => {
  it("renders the superseded number struck through, with the time", () => {
    const { container } = render(
      <ResultValue
        value={{
          ...potassium,
          status: "corrected",
          superseded: { value: "<0.04", at: "14:22 today" },
        }}
      />,
    );
    const line = container.querySelector(".ox-rv__superseded")!;
    expect(line.querySelector("s")).toHaveTextContent("<0.04");
    expect(line).toHaveTextContent("14:22 today");
  });

  it("puts the replacement in the accessible name before the timing", () => {
    render(
      <ResultValue
        value={{ ...potassium, status: "corrected", superseded: { value: "<0.04", at: "14:22" } }}
      />,
    );
    const label = screen.getByRole("group").getAttribute("aria-label")!;
    expect(label).toContain("replaces <0.04, changed 14:22");
  });

  it("re-renders on a version change and not on an unrelated one", () => {
    // A results grid re-renders on every filter keystroke, and hosts rebuild
    // these objects from a query response — so the reference always changes
    // even when nothing did. `versionId` is what actually moves.
    const { rerender } = render(<ResultValue value={{ ...potassium, value: 6.8 }} />);
    expect(screen.getByRole("group")).toHaveTextContent("6.8");

    // Same id and version, different object: memo holds, old value stays.
    rerender(<ResultValue value={{ ...potassium, value: 9.9 }} />);
    expect(screen.getByRole("group")).toHaveTextContent("6.8");

    // Version moves: the correction lands.
    rerender(<ResultValue value={{ ...potassium, value: 9.9, versionId: "2" }} />);
    expect(screen.getByRole("group")).toHaveTextContent("9.9");
  });
});

/* ------------------------------------------------------------------ */
/* Lie 4 — an absence rendered as an em dash                           */
/* ------------------------------------------------------------------ */

describe("absence", () => {
  it("covers seven reasons", () => {
    expect(ABSENT_REASONS).toHaveLength(7);
    expect(Object.keys(ABSENCE)).toHaveLength(7);
  });

  it.each(ABSENT_REASONS)("%s renders a word and a sentence, never an em dash", (reason) => {
    const { container } = render(
      <ResultValue value={{ id: "x", analyte: "HbA1c", absent: reason }} />,
    );
    const group = screen.getByRole("group");
    expect(group.getAttribute("data-ox-absent")).toBe(reason);
    expect(container.querySelector(".ox-rv__absent-word")).toHaveTextContent(ABSENCE[reason].short);
    expect(container.querySelector(".ox-rv__absent-detail")!.textContent!.length).toBeGreaterThan(
      10,
    );
    // The specific character this component exists to eliminate.
    expect(group.textContent).not.toContain("—");
    expect(group.getAttribute("aria-label")).not.toContain("—");
  });

  it.each(ABSENT_REASONS)("%s reads as a sentence to a screen reader", (reason) => {
    render(<ResultValue value={{ id: "x", analyte: "HbA1c", absent: reason }} />);
    const label = screen.getByRole("group").getAttribute("aria-label")!;
    expect(label.startsWith("HbA1c: ")).toBe(true);
    expect(label.endsWith(".")).toBe(true);
  });

  it("distinguishes restricted from missing", () => {
    // A value exists and the reader may not see it. Rendering it as "not
    // ordered" would be a lie about the record, not merely a vague one.
    render(<ResultValue value={{ id: "x", analyte: "Toxicology", absent: "masked" }} />);
    expect(screen.getByRole("group").getAttribute("aria-label")).toContain(
      "A result exists and you are not permitted to see it",
    );
  });

  it("calls an unmapped absence a data-quality defect", () => {
    render(<ResultValue value={{ id: "x", analyte: "TSH", absent: "unknown" }} />);
    expect(screen.getByRole("group").getAttribute("aria-label")).toContain("data-quality defect");
  });

  it("lets a host replace the sentence with a specific one", () => {
    render(
      <ResultValue
        value={{
          id: "x",
          analyte: "TSH",
          absent: "specimen-problem",
          absentDetail: "Haemolysed. Recollection requested.",
        }}
      />,
    );
    expect(screen.getByRole("group")).toHaveTextContent("Haemolysed. Recollection requested.");
  });
});

/* ------------------------------------------------------------------ */
/* Delta                                                               */
/* ------------------------------------------------------------------ */

describe("delta", () => {
  it("reports magnitude, direction and interval", () => {
    const delta = resolveDelta({
      ...potassium,
      prior: { value: 4.7, at: "2026-08-12T06:00:00Z" },
    });
    expect(delta).toMatchObject({ direction: "up" });
    expect(delta?.change).toBeCloseTo(2.1, 5);
    expect(describeElapsed(delta!.sinceMs)).toBe("4 hours");
  });

  it("is suppressed when the method changed", () => {
    // Two numbers from two scales subtracted from each other is not a delta,
    // and an annotated wrong number still gets read as a number.
    expect(
      resolveDelta({ ...potassium, prior: { value: 4.7, at: NOW, differentMethod: true } }),
    ).toBeNull();
  });

  it("is suppressed when the analyte changed under the same name", () => {
    expect(
      resolveDelta({ ...potassium, prior: { value: 4.7, at: NOW, differentAnalyte: true } }),
    ).toBeNull();
  });

  it("draws no arrow when nothing moved", () => {
    const { container } = render(
      <ResultValue value={{ ...potassium, prior: { value: 6.8, at: "2026-08-12T06:00:00Z" } }} />,
    );
    expect(container.querySelector(".ox-rv__delta")).toBeNull();
  });

  it("carries direction as a glyph and a word, not a hue", () => {
    const { container } = render(
      <ResultValue value={{ ...potassium, prior: { value: 4.7, at: "2026-08-12T06:00:00Z" } }} />,
    );
    expect(container.querySelector("[data-ox-direction='up']")).toBeTruthy();
    expect(screen.getByRole("group").getAttribute("aria-label")).toContain("up 2.1 over");
  });
});

/* ------------------------------------------------------------------ */
/* The sentence                                                        */
/* ------------------------------------------------------------------ */

describe("the accessible name", () => {
  it("is the whole clinical statement in one string", () => {
    render(<ResultValue value={potassium} now={NOW} />);
    expect(screen.getByRole("group").getAttribute("aria-label")).toBe(
      "Potassium 6.8 millimoles per litre, critical, reference 3.5 to 5.1, final, resulted 41 minutes ago.",
    );
  });

  it("speaks units rather than spelling them", () => {
    // Left as a symbol it is read character by character or skipped, and a
    // value without its unit is not a result.
    expect(describeResult({ id: "a", analyte: "Sodium", value: 139, unit: "mmol/L" })).toContain(
      "millimoles per litre",
    );
  });

  it("hides every inner node from the accessibility tree", () => {
    // Six separately-labelled nodes are read as six fragments with pauses,
    // and the clinical meaning is in the combination.
    const { container } = render(<ResultValue value={potassium} now={NOW} />);
    for (const selector of [".ox-rv__line", ".ox-rv__qualifiers"]) {
      expect(container.querySelector(selector)?.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("renders no age at all without `now`", () => {
    // Correct: a result with no age is less misleading than one whose age is
    // wrong, and the component never reads a clock.
    render(<ResultValue value={potassium} />);
    expect(screen.getByRole("group").getAttribute("aria-label")).not.toContain("ago");
  });
});

/* ------------------------------------------------------------------ */
/* Interaction                                                         */
/* ------------------------------------------------------------------ */

describe("interaction", () => {
  it("has no tab stop when there is no report", () => {
    render(<ResultValue value={potassium} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("becomes a button that opens the report", async () => {
    const onOpenReport = vi.fn();
    render(<ResultValue value={potassium} onOpenReport={onOpenReport} />);
    const button = screen.getByRole("button");

    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    expect(onOpenReport).toHaveBeenCalledWith(potassium);
  });
});

/* ------------------------------------------------------------------ */
/* FHIR                                                                */
/* ------------------------------------------------------------------ */

describe("fromObservation", () => {
  it("reads value, unit, range and status", () => {
    const data = fromObservation({
      id: "obs-1",
      meta: { versionId: "3" },
      status: "final",
      code: { text: "Potassium" },
      valueQuantity: { value: 6.8, unit: "mmol/L" },
      interpretation: [{ coding: [{ code: "HH" }] }],
      referenceRange: [{ low: { value: 3.5 }, high: { value: 5.1 } }],
      issued: "2026-08-12T10:00:00Z",
    });
    expect(data).toMatchObject({
      id: "obs-1",
      versionId: "3",
      analyte: "Potassium",
      value: 6.8,
      unit: "mmol/L",
      interpretation: "critical",
      status: "final",
      range: { low: 3.5, high: 5.1 },
    });
  });

  it("maps every dataAbsentReason onto one of the seven", () => {
    expect(fromDataAbsentReason("not-asked")).toBe("not-ordered");
    expect(fromDataAbsentReason("asked-declined")).toBe("declined");
    expect(fromDataAbsentReason("masked")).toBe("masked");
    // `not-performed` and `not-permitted` differ in whether a result exists,
    // which is exactly the distinction that matters to the reader.
    expect(fromDataAbsentReason("not-performed")).toBe("not-ordered");
    expect(fromDataAbsentReason("not-permitted")).toBe("masked");
  });

  it("calls an unrecognised absent reason unknown rather than dropping it", () => {
    // An unmapped code is itself a data-quality defect, and the component
    // says so rather than absorbing it into a blank.
    expect(fromDataAbsentReason("something-new")).toBe("unknown");
    expect(fromDataAbsentReason(undefined)).toBe("unknown");
  });

  it("treats an absent reason as beating a value", () => {
    // A record carrying both is malformed, and rendering the value would
    // publish something the source said is not there.
    const data = fromObservation({
      id: "x",
      valueQuantity: { value: 5 },
      dataAbsentReason: { coding: [{ code: "masked" }] },
    });
    expect(data.value).toBeUndefined();
    expect(data.absent).toBe("masked");
  });

  it("leaves a missing range undefined rather than empty", () => {
    // An empty range would derive "normal" from nothing at all.
    const data = fromObservation({
      id: "x",
      code: { text: "Ferritin" },
      valueQuantity: { value: 212 },
    });
    expect(data.range).toBeUndefined();
    expect(resolveInterpretation(data)?.step).toBe("not-assessed");
  });

  it("carries the range's appliesTo through", () => {
    const data = fromObservation({
      id: "li",
      code: { text: "Lithium" },
      valueQuantity: { value: 0.9 },
      referenceRange: [
        { low: { value: 0.6 }, high: { value: 1.2 }, appliesTo: [{ text: "maintenance" }] },
      ],
    });
    expect(data.range?.appliesTo).toBe("maintenance");
  });
});

describe("formatting helpers", () => {
  it("prints one-sided ranges honestly", () => {
    expect(formatRange({ high: 0.04 })).toBe("<0.04");
    expect(formatRange({ low: 10 })).toBe(">10");
    expect(formatRange({ low: 3.5, high: 5.1 })).toBe("3.5–5.1");
    expect(formatRange(undefined)).toBeNull();
  });

  it("coarsens elapsed time, because precision here implies freshness", () => {
    expect(describeElapsed(30_000)).toBe("just now");
    expect(describeElapsed(41 * 60_000)).toBe("41 minutes");
    expect(describeElapsed(4 * 3_600_000)).toBe("4 hours");
    expect(describeElapsed(9 * 86_400_000)).toBe("9 days");
    expect(describeElapsed(420 * 86_400_000)).toBe("14 months");
  });
});
