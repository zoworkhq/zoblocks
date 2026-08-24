/**
 * ChartHeader — the three things a heading gets wrong.
 *
 * It scrolls away, it shows the wrong sex field, and it treats the encounter
 * as decoration. The suite is organised around the three, plus the strip that
 * has to survive all of them.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Patient } from "@oxygenui-design/fhir";
import { patientRoutine } from "@oxygenui-design/fixtures";
import {
  ChartHeader,
  SAFETY_ORDER,
  SPCU_SURFACES,
  describeEncounterContext,
  describeProgram,
  describeSafety,
  describeSpcu,
  hasExpired,
  programFromEpisode,
  resolveEncounterContext,
  resolveSpcu,
  safetyStrip,
  type EncounterOption,
  type SafetyInput,
} from "./chart-header";

const NOW = "2026-08-24T10:00:00Z";

/**
 * The shared fixture with a second identifier, because two is what the banner
 * requires before a care action — and `gender` is on it, which is the point:
 * the header must never render it.
 */
const patient: Patient = {
  ...patientRoutine,
  identifier: [
    ...(patientRoutine.identifier ?? []),
    { use: "official", system: "https://fhir.nhs.uk/Id/nhs-number", value: "943 476 5919" },
  ],
};

const identifiers = [{ kind: "mrn" }, { kind: "nhs" }] as const;

const withSpcu: Patient = {
  ...patient,
  extension: [
    {
      url: "http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse",
      extension: [
        { url: "value", valueCodeableConcept: { text: "female" } },
        { url: "comment", valueString: "for medication dosing" },
      ],
    },
  ],
};

const encounters: EncounterOption[] = [
  { id: "enc-1", label: "Inpatient — Ward 4B", type: "inpatient" },
  { id: "enc-2", label: "Outpatient — 24 Aug, 09:00", type: "ambulatory" },
  { id: "enc-3", label: "Telehealth — 24 Aug, 14:00", type: "virtual" },
];

/* ------------------------------------------------------------------ */
/* Claim 1 — the sex field                                             */
/* ------------------------------------------------------------------ */

describe("sex parameter for clinical use", () => {
  it("appears on an order or a result screen and nowhere else", () => {
    expect([...SPCU_SURFACES]).toEqual(["orders", "results"]);
    expect(resolveSpcu(withSpcu, "orders")).not.toBeNull();
    expect(resolveSpcu(withSpcu, "results")).not.toBeNull();
    // Out of context it is a demographic wearing a clinical name.
    expect(resolveSpcu(withSpcu, "overview")).toBeNull();
    expect(resolveSpcu(withSpcu, "documentation")).toBeNull();
  });

  it("carries the context, because the value without it is the field it replaced", () => {
    const reading = resolveSpcu(withSpcu, "orders");
    if (!reading) throw new Error("expected a reading on an order screen");

    expect(reading).toEqual({ value: "female", context: "for medication dosing", recorded: true });
    expect(describeSpcu(reading)).toBe(
      "Sex parameter for clinical use: female, for medication dosing",
    );
  });

  it("says not recorded rather than leaving the space blank", () => {
    const reading = resolveSpcu(patient, "orders");
    if (!reading) throw new Error("expected a reading on an order screen");

    expect(reading.recorded).toBe(false);
    // The sentence names the wrong answer so nobody reaches for it.
    expect(describeSpcu(reading)).toContain("Do not substitute the administrative gender");
  });

  it("never reads Patient.gender, on any surface", () => {
    for (const surface of ["overview", "orders", "results", "documentation"] as const) {
      const reading = resolveSpcu(patient, surface);
      expect(reading?.value).not.toBe("female");
    }
    // And the whole rendered header does not contain it either.
    const { container } = render(
      <ChartHeader patient={patient} identifiers={identifiers} surface="orders" now={NOW} />,
    );
    expect(container.textContent).not.toMatch(/\bfemale\b/i);
  });

  it("ignores a parameter whose period has passed", () => {
    const expired: Patient = {
      ...patient,
      extension: [
        {
          url: "http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse",
          extension: [
            { url: "value", valueCodeableConcept: { text: "male" } },
            { url: "period", valuePeriod: { end: "2026-01-01T00:00:00Z" } },
          ],
        },
      ],
    };
    expect(resolveSpcu(expired, "orders", NOW)?.recorded).toBe(false);
  });

  it("reads the simple valueCodeableConcept form too", () => {
    const simple: Patient = {
      ...patient,
      extension: [
        {
          url: "http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse",
          valueCodeableConcept: { coding: [{ code: "specified", display: "Specified" }] },
        },
      ],
    };
    expect(resolveSpcu(simple, "results")).toEqual({
      value: "Specified",
      context: null,
      recorded: true,
    });
  });
});

/* ------------------------------------------------------------------ */
/* Claim 2 — the encounter                                             */
/* ------------------------------------------------------------------ */

describe("encounter context", () => {
  it("chooses the only open encounter, because there is nothing to choose between", () => {
    const one = encounters.slice(0, 1);
    expect(resolveEncounterContext(one)).toEqual({ kind: "selected", encounter: one[0] });
  });

  it("refuses to choose between three", () => {
    const context = resolveEncounterContext(encounters);
    expect(context.kind).toBe("none");
    if (context.kind !== "none") throw new Error("expected none");
    expect(context.reason).toContain("3 encounters are open");
  });

  it("says so when nothing is open at all", () => {
    const context = resolveEncounterContext([]);
    expect(context).toEqual({ kind: "none", reason: "No encounter is open" });
  });

  it("falls back to none when the selection no longer matches, not to the first", () => {
    const context = resolveEncounterContext(encounters, "enc-closed");
    expect(context.kind).toBe("none");
    if (context.kind !== "none") throw new Error("expected none");
    expect(context.reason).toBe("The selected encounter is no longer open");
  });

  it("renders a select the host can change, and announces the reason when none is chosen", () => {
    render(
      <ChartHeader
        patient={patient}
        identifiers={identifiers}
        encounters={encounters}
        onSelectEncounter={vi.fn()}
      />,
    );

    const select = screen.getByRole("combobox", { name: /documenting into/i });
    expect(select).toHaveValue("");
    expect(select).toHaveAttribute("data-ox-encounter", "none");
    expect(screen.getByRole("status")).toHaveTextContent("3 encounters are open");
  });

  it("reports the change rather than applying it, so the host can re-guard its forms", async () => {
    const onSelectEncounter = vi.fn();
    render(
      <ChartHeader
        patient={patient}
        identifiers={identifiers}
        encounters={encounters}
        onSelectEncounter={onSelectEncounter}
      />,
    );

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /documenting into/i }),
      "enc-2",
    );
    expect(onSelectEncounter).toHaveBeenCalledWith("enc-2");
  });

  it("renders static text rather than a disabled control when there is no handler", () => {
    render(
      <ChartHeader
        patient={patient}
        identifiers={identifiers}
        encounters={encounters}
        selectedEncounterId="enc-1"
      />,
    );

    // A disabled select leaves the tab order, taking the one fact that says
    // where the note is going with it.
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByText("Inpatient — Ward 4B")).toBeInTheDocument();
  });

  it("speaks the context as a whole sentence", () => {
    expect(describeEncounterContext(resolveEncounterContext(encounters, "enc-3"))).toBe(
      "Documenting into Telehealth — 24 Aug, 14:00",
    );
    expect(describeEncounterContext(resolveEncounterContext([]))).toBe(
      "No encounter selected. No encounter is open.",
    );
  });
});

/* ------------------------------------------------------------------ */
/* Claim 3 — the collapse                                              */
/* ------------------------------------------------------------------ */

describe("collapse", () => {
  const safety: SafetyInput = {
    allergies: { label: "Penicillin — anaphylaxis", tone: "critical" },
    codeStatus: { label: "DNR" },
  };

  it("keeps the detail in the DOM behind a disclosure", () => {
    const { container, rerender } = render(
      <ChartHeader patient={patient} identifiers={identifiers} safety={safety} />,
    );

    const detail = container.querySelector(".ox-chart-header__detail");
    expect(detail).not.toBeNull();
    expect(detail).not.toHaveAttribute("hidden");

    rerender(<ChartHeader patient={patient} identifiers={identifiers} safety={safety} collapsed />);

    // Hidden, not unmounted. A screen-reader user is never worse off than a
    // sighted one — the content is one disclosure away for both.
    expect(container.querySelector(".ox-chart-header__detail")).toHaveAttribute("hidden");
  });

  it("wires the toggle to the region it governs, in both heights", () => {
    const { container, rerender } = render(
      <ChartHeader patient={patient} identifiers={identifiers} safety={safety} />,
    );

    const toggle = screen.getByRole("button", { name: /collapse/i });
    const detail = container.querySelector(".ox-chart-header__detail");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle.getAttribute("aria-controls")).toBe(detail?.id);

    rerender(<ChartHeader patient={patient} identifiers={identifiers} safety={safety} collapsed />);
    expect(screen.getByRole("button", { name: /show patient details/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("reports the toggle rather than owning the state", async () => {
    const onCollapsedChange = vi.fn();
    render(
      <ChartHeader
        patient={patient}
        identifiers={identifiers}
        safety={safety}
        onCollapsedChange={onCollapsedChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /collapse/i }));
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
  });

  it("makes the collapsed strip a tab stop, because it is the one that scrolls", () => {
    const { rerender } = render(
      <ChartHeader patient={patient} identifiers={identifiers} safety={safety} />,
    );

    // Expanded, it wraps — no scroll, so no extra stop on the most-read
    // eighty pixels of the screen.
    expect(screen.getByRole("list", { name: "Safety" })).not.toHaveAttribute("tabindex");

    rerender(<ChartHeader patient={patient} identifiers={identifiers} safety={safety} collapsed />);
    // Collapsed, it scrolls sideways — and a scrollable region a keyboard user
    // cannot reach is a region whose content they cannot read.
    expect(screen.getByRole("list", { name: "Safety" })).toHaveAttribute("tabindex", "0");
  });

  it("draws the same strip at both heights", () => {
    const { container, rerender } = render(
      <ChartHeader patient={patient} identifiers={identifiers} safety={safety} />,
    );
    const expanded = container.querySelector(".ox-chart-header__strip")?.textContent;

    rerender(<ChartHeader patient={patient} identifiers={identifiers} safety={safety} collapsed />);
    const collapsed = container.querySelector(".ox-chart-header__strip")?.textContent;

    // The whole value of collapsing is that the row you must not act without
    // stays exactly where your eye already is.
    expect(collapsed).toBe(expanded);
    expect(collapsed).toContain("Penicillin");
  });
});

/* ------------------------------------------------------------------ */
/* The strip                                                           */
/* ------------------------------------------------------------------ */

describe("the safety strip", () => {
  it("always carries allergy status and code status, recorded or not", () => {
    const facts = safetyStrip({});
    expect(facts.map((f) => f.kind)).toEqual(["allergy", "code-status"]);
    expect(facts.every((f) => f.tone === "absent")).toBe(true);
    expect(facts[0]?.label).toBe("Allergies not asked");
  });

  it("omits the rest until they exist, so the two that matter stay findable", () => {
    const facts = safetyStrip({ isolation: { label: "Contact precautions" } });
    expect(facts.map((f) => f.kind)).toEqual(["allergy", "code-status", "isolation"]);
  });

  it("keeps a fixed order whatever the input order", () => {
    const facts = safetyStrip({
      alerts: [{ label: "Interpreter required" }],
      legalStatus: { label: "Section 2" },
      fallRisk: { label: "High falls risk" },
      isolation: { label: "Droplet precautions" },
      codeStatus: { label: "Full code", tone: "info" },
      allergies: { label: "No known allergies", tone: "info" },
    });

    const order = facts.map((f) => f.kind);
    const positions = order.map((kind) => SAFETY_ORDER.indexOf(kind));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("treats an isolation precaution as critical without being told", () => {
    const [, , isolation] = safetyStrip({ isolation: { label: "Airborne precautions" } });
    expect(isolation?.tone).toBe("critical");
  });

  it("knows whether a dated fact has lapsed", () => {
    const hold = safetyStrip({
      legalStatus: { label: "Involuntary hold", until: "2026-08-24T09:00:00Z" },
    }).find((fact) => fact.kind === "legal-status");
    if (!hold) throw new Error("expected a legal-status fact");

    expect(hasExpired(hold, NOW)).toBe(true);
    expect(hasExpired(hold, "2026-08-24T08:00:00Z")).toBe(false);
    // Without a clock it makes no claim either way.
    expect(hasExpired(hold)).toBe(false);
  });

  it("shows an expired hold as expired rather than removing it", () => {
    render(
      <ChartHeader
        patient={patient}
        identifiers={identifiers}
        now={NOW}
        safety={{ legalStatus: { label: "Involuntary hold", until: "2026-08-24T09:00:00Z" } }}
      />,
    );

    const fact = screen.getByText("Involuntary hold").closest(".ox-chart-header__fact");
    expect(fact).toHaveAttribute("data-ox-expired", "");
    expect(fact).toHaveAttribute("data-ox-tone", "critical");
    expect(fact).toHaveTextContent("expired");
  });

  it("names every fact in the banner's accessible label, in reading order", () => {
    render(
      <ChartHeader
        patient={patient}
        identifiers={identifiers}
        now={NOW}
        safety={{
          allergies: { label: "Penicillin — anaphylaxis", tone: "critical" },
          codeStatus: { label: "DNR" },
          isolation: { label: "Contact precautions" },
        }}
      />,
    );

    const label = screen.getByRole("banner").getAttribute("aria-label") ?? "";
    expect(label.indexOf("Penicillin")).toBeLessThan(label.indexOf("DNR"));
    expect(label.indexOf("DNR")).toBeLessThan(label.indexOf("Contact precautions"));
  });

  it("says something rather than nothing for an empty strip", () => {
    expect(describeSafety([])).toBe("No safety information recorded.");
  });

  it("distinguishes an expired fact from a running one in the sentence", () => {
    const facts = safetyStrip({
      legalStatus: { label: "Involuntary hold", until: "2026-08-24T09:00:00Z" },
    });
    // A clock time, not the instant — the raw field is what the reader was
    // meant to be spared.
    expect(describeSafety(facts, NOW)).toContain("expired 09:00");
    expect(describeSafety(facts, "2026-08-24T08:00:00Z")).toContain("until 09:00");
    expect(describeSafety(facts, NOW)).not.toContain("2026-08-24T09");
  });

  it("is a list, so a screen reader can count what it is about to read", () => {
    render(<ChartHeader patient={patient} identifiers={identifiers} />);
    const list = screen.getByRole("list", { name: "Safety" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
  });
});

/* ------------------------------------------------------------------ */
/* Program                                                             */
/* ------------------------------------------------------------------ */

describe("program", () => {
  it("reads as a week within a course", () => {
    expect(describeProgram({ name: "IOP", week: 3, of: 8 })).toBe("IOP · week 3 of 8");
    expect(describeProgram({ name: "IOP", week: 3 })).toBe("IOP · week 3");
    expect(describeProgram({ name: "IOP" })).toBe("IOP");
  });

  it("computes the week from a real start date", () => {
    expect(
      programFromEpisode(
        {
          status: "active",
          type: [{ text: "Intensive outpatient" }],
          period: { start: "2026-08-03T00:00:00Z", end: "2026-09-28T00:00:00Z" },
        },
        NOW,
      ),
    ).toEqual({ name: "Intensive outpatient", week: 4, of: 8 });
  });

  it("gives no week rather than a guessed one when the episode has no start", () => {
    expect(programFromEpisode({ status: "active", type: [{ text: "IOP" }] }, NOW)).toEqual({
      name: "IOP",
    });
  });

  it("drops an episode that is not active", () => {
    expect(programFromEpisode({ status: "finished", type: [{ text: "IOP" }] }, NOW)).toBeNull();
  });

  it("drops an episode with no type, rather than naming it after nothing", () => {
    expect(programFromEpisode({ status: "active" }, NOW)).toBeNull();
  });

  it("renders on the header", () => {
    render(
      <ChartHeader
        patient={patient}
        identifiers={identifiers}
        program={{ name: "IOP", week: 3, of: 8 }}
      />,
    );
    expect(screen.getByText("IOP · week 3 of 8")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* The shell                                                           */
/* ------------------------------------------------------------------ */

describe("the header itself", () => {
  it("is a banner landmark", () => {
    render(<ChartHeader patient={patient} identifiers={identifiers} />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders the screen inside the patient context the banner establishes", () => {
    render(
      <ChartHeader patient={patient} identifiers={identifiers}>
        <p>Order form</p>
      </ChartHeader>,
    );
    expect(screen.getByText("Order form")).toBeInTheDocument();
  });

  it("passes actions through to the banner rather than inventing its own", () => {
    render(
      <ChartHeader
        patient={patient}
        identifiers={identifiers}
        actions={<button type="button">Print</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Print" })).toBeInTheDocument();
  });

  it("passes no ward and no actions through when the host supplied neither", () => {
    // Spreading `{}` rather than `ward={undefined}`: the banner's own prop
    // types distinguish absent from explicitly-undefined, and the common case
    // — a chart screen with neither — has to be the one that works.
    const { container } = render(<ChartHeader patient={patient} identifiers={identifiers} />);

    expect(container.querySelector('[data-ox-field="ward"]')).toBeNull();
    expect(screen.queryByRole("button", { name: "Print" })).toBeNull();
  });

  it("renders a ward without actions", () => {
    render(<ChartHeader patient={patient} identifiers={identifiers} ward="Ward 4B" />);
    expect(screen.getByText(/Ward 4B/)).toBeInTheDocument();
  });

  it("shows the selected encounter in the select when the host can change it", async () => {
    render(
      <ChartHeader
        patient={patient}
        identifiers={identifiers}
        encounters={encounters}
        selectedEncounterId="enc-2"
        onSelectEncounter={vi.fn()}
      />,
    );

    const select = screen.getByRole("combobox", { name: /documenting into/i });
    expect(select).toHaveValue("enc-2");
    expect(select).toHaveAttribute("data-ox-encounter", "selected");
    // A selection means no reason to explain.
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("clears the selection back to none when the reader picks the blank option", async () => {
    const onSelectEncounter = vi.fn();
    render(
      <ChartHeader
        patient={patient}
        identifiers={identifiers}
        encounters={encounters}
        selectedEncounterId="enc-2"
        onSelectEncounter={onSelectEncounter}
      />,
    );

    await userEvent.selectOptions(screen.getByRole("combobox", { name: /documenting into/i }), "");
    // Undefined, not the empty string: "nothing chosen" is a state, not a value.
    expect(onSelectEncounter).toHaveBeenCalledWith(undefined);
  });

  it("reads none as the static value when there is no handler and nothing open", () => {
    render(<ChartHeader patient={patient} identifiers={identifiers} />);
    expect(screen.getByText("No encounter selected")).toBeInTheDocument();
  });

  it("carries the surface on the bar, so a stylesheet can react without a class", () => {
    render(<ChartHeader patient={patient} identifiers={identifiers} surface="results" />);
    expect(screen.getByRole("banner")).toHaveAttribute("data-ox-surface", "results");
  });
});
