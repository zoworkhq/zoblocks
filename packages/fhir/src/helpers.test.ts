import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  ABSENT_REASON_LABEL,
  calculateAge,
  coverageState,
  formatAppointmentTime,
  formatDosage,
  isMedicationExpired,
  formatComponentValue,
  formatObservationValue,
  formatReferenceRange,
  getComponentInterpretation,
  getInterpretation,
  getPanelInterpretation,
  hasComponents,
  isErrorAbsence,
  isPendingAbsence,
  isRestricted,
  isFutureDate,
  careTeamMembers,
  detectedIssueSeverity,
  doseFormatIssues,
  isFlagActive,
  safeDoseText,
  summariseProvenance,
  weightBasedDose,
  isRestrictedAbsence,
  datePrecision,
  formatAge,
  formatClinicalDate,
  maskIdentifier,
  nameInitials,
  quantityParts,
  rangeGeometry,
  terminologyName,
  resolveAbsentReason,
  resolvePatientName,
  worstInterpretation,
} from "./helpers";
import type {
  CareTeam,
  Coverage,
  MedicationRequest,
  Observation,
  ObservationReferenceRange,
  Patient,
} from "./types";

describe("resolvePatientName", () => {
  it("prefers the official name over a nickname", () => {
    const patient: Patient = {
      name: [
        { use: "nickname", given: ["Robbie"] },
        { use: "official", given: ["Robert"], family: "Chen" },
      ],
    };
    expect(resolvePatientName(patient)).toBe("Robert Chen");
  });

  it("never surfaces an old name", () => {
    const patient: Patient = {
      name: [{ use: "old", given: ["Prior"], family: "Name" }],
    };
    expect(resolvePatientName(patient)).toBeUndefined();
  });

  it("formats official as Family, Given for chart contexts", () => {
    const patient: Patient = { name: [{ given: ["Ana", "Lucia"], family: "Duarte" }] };
    expect(resolvePatientName(patient, "official")).toBe("Duarte, Ana Lucia");
  });

  it("returns undefined rather than a placeholder when there is no name", () => {
    expect(resolvePatientName({})).toBeUndefined();
    expect(resolvePatientName(undefined)).toBeUndefined();
  });
});

describe("calculateAge", () => {
  // Midday UTC, so the calendar date is 3 August in every runtime zone.
  const asOf = new Date("2026-08-03T12:00:00Z");

  it("does not round up before the birthday has passed", () => {
    expect(calculateAge("1990-12-25", asOf)).toBe(35);
  });

  it("counts the birthday itself", () => {
    expect(calculateAge("1990-08-03", asOf)).toBe(36);
  });

  it("returns undefined for missing or unparseable dates", () => {
    expect(calculateAge(undefined, asOf)).toBeUndefined();
    expect(calculateAge("not-a-date", asOf)).toBeUndefined();
  });
});

describe("maskIdentifier", () => {
  it("leaves only the trailing characters visible", () => {
    expect(maskIdentifier("MRN0093412")).toBe("••••••3412");
  });

  it("fully masks values at or below the visible length", () => {
    expect(maskIdentifier("123", 4)).toBe("•••");
  });
});

describe("getInterpretation", () => {
  it("trusts an explicit critical code", () => {
    const observation: Observation = {
      interpretation: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
              code: "HH",
            },
          ],
        },
      ],
    };
    expect(getInterpretation(observation)).toBe("critical-high");
  });

  it("derives from the reference range when no interpretation is stated", () => {
    const observation: Observation = {
      valueQuantity: { value: 156, unit: "mg/dL" },
      referenceRange: [{ low: { value: 70 }, high: { value: 100 } }],
    };
    expect(getInterpretation(observation)).toBe("high");
  });

  it("reports unknown rather than normal when there is nothing to compare against", () => {
    const observation: Observation = { valueQuantity: { value: 156, unit: "mg/dL" } };
    expect(getInterpretation(observation)).toBe("unknown");
  });
});

describe("formatObservationValue", () => {
  it("follows FHIR value[x] precedence", () => {
    expect(formatObservationValue({ valueQuantity: { value: 98.6, unit: "°F" } })).toBe("98.6 °F");
    expect(formatObservationValue({ valueString: "Nonreactive" })).toBe("Nonreactive");
    expect(formatObservationValue({ valueBoolean: false })).toBe("No");
  });

  it("returns undefined when the observation carries no value", () => {
    expect(
      formatObservationValue({ dataAbsentReason: { text: "Specimen unsatisfactory" } }),
    ).toBeUndefined();
  });
});

describe("formatReferenceRange", () => {
  it("renders bounded, upper-only, and lower-only ranges", () => {
    expect(formatReferenceRange({ low: { value: 70 }, high: { value: 100, unit: "mg/dL" } })).toBe(
      "70 – 100 mg/dL",
    );
    expect(formatReferenceRange({ high: { value: 5.7, unit: "%" } })).toBe("< 5.7 %");
    expect(formatReferenceRange({ low: { value: 12, unit: "g/dL" } })).toBe("> 12 g/dL");
  });
});

describe("Observation.component", () => {
  // FHIR models blood pressure as one Observation with two components and no
  // value on the parent — the shape a component-blind renderer gets wrong.
  const bloodPressure: Observation = {
    code: { text: "Blood pressure" },
    component: [
      {
        code: { text: "Systolic" },
        valueQuantity: { value: 168, unit: "mmHg" },
        referenceRange: [{ low: { value: 90 }, high: { value: 130 } }],
      },
      {
        code: { text: "Diastolic" },
        valueQuantity: { value: 82, unit: "mmHg" },
        referenceRange: [{ low: { value: 60 }, high: { value: 85 } }],
      },
    ],
  };

  it("detects component-carried readings", () => {
    expect(hasComponents(bloodPressure)).toBe(true);
    expect(hasComponents({ valueQuantity: { value: 72 } })).toBe(false);
  });

  it("formats each component's own value", () => {
    expect(formatComponentValue(bloodPressure.component?.[0])).toBe("168 mmHg");
    expect(formatComponentValue(bloodPressure.component?.[1])).toBe("82 mmHg");
  });

  it("interprets each component against its own range", () => {
    expect(getComponentInterpretation(bloodPressure.component?.[0])).toBe("high");
    expect(getComponentInterpretation(bloodPressure.component?.[1])).toBe("normal");
  });

  it("escalates the panel to its worst component", () => {
    // The parent has no value and no interpretation; without this, a raised
    // systolic would render as "Not interpreted".
    expect(getPanelInterpretation(bloodPressure)).toBe("high");
  });

  it("escalates to critical when any component is critical", () => {
    const critical: Observation = {
      component: [
        {
          valueQuantity: { value: 210 },
          interpretation: [{ coding: [{ code: "HH" }] }],
        },
        {
          valueQuantity: { value: 80 },
          referenceRange: [{ low: { value: 60 }, high: { value: 85 } }],
        },
      ],
    };
    expect(getPanelInterpretation(critical)).toBe("critical-high");
  });

  it("leaves single-value observations unchanged", () => {
    const single: Observation = {
      valueQuantity: { value: 72 },
      referenceRange: [{ low: { value: 60 }, high: { value: 100 } }],
    };
    expect(getPanelInterpretation(single)).toBe("normal");
  });

  it("orders severity worst-first", () => {
    expect(worstInterpretation(["normal", "low", "critical-low"])).toBe("critical-low");
    expect(worstInterpretation(["unknown", "normal"])).toBe("normal");
    expect(worstInterpretation([])).toBe("unknown");
  });
});

describe("isRestricted", () => {
  it("detects restricted confidentiality labels", () => {
    expect(isRestricted({ meta: { security: [{ code: "R" }] } })).toBe(true);
    expect(isRestricted({ meta: { security: [{ code: "N" }] } })).toBe(false);
    expect(isRestricted({})).toBe(false);
  });
});

const ABSENT_SYSTEM = "http://terminology.hl7.org/CodeSystem/data-absent-reason";

describe("resolveAbsentReason", () => {
  it("returns unstated when there is no reason at all", () => {
    // The most common real case, and the one that must not be promoted to
    // "unknown" — that would assert the value was expected.
    expect(resolveAbsentReason(undefined)).toBe("unstated");
    expect(resolveAbsentReason({})).toBe("unstated");
    expect(resolveAbsentReason({ coding: [] })).toBe("unstated");
  });

  it("maps every code group to the reason a reader must act on", () => {
    const cases: Array<[string, string]> = [
      ["unknown", "unknown"],
      ["asked-unknown", "unknown"],
      ["temp-unknown", "pending"],
      ["not-asked", "not-collected"],
      ["asked-declined", "declined"],
      ["masked", "masked"],
      ["not-permitted", "not-permitted"],
      ["not-applicable", "not-applicable"],
      ["not-performed", "not-performed"],
      ["as-text", "as-text"],
      ["error", "error"],
      ["unsupported", "error"],
      ["not-a-number", "error"],
    ];
    for (const [code, expected] of cases) {
      expect(resolveAbsentReason({ coding: [{ system: ABSENT_SYSTEM, code }] })).toBe(expected);
    }
  });

  it("keeps masked separate from not-collected", () => {
    // The distinction this component exists for: withheld is not absent.
    const masked = resolveAbsentReason({ coding: [{ code: "masked" }] });
    const notAsked = resolveAbsentReason({ coding: [{ code: "not-asked" }] });
    expect(masked).not.toBe(notAsked);
    expect(isRestrictedAbsence(masked)).toBe(true);
    expect(isRestrictedAbsence(notAsked)).toBe(false);
  });

  it("falls back to unknown when the source said something uncategorisable", () => {
    // Text-only, or a code from a system we do not recognise. Something was
    // stated, so it is not "unstated" — the caller surfaces the text.
    expect(resolveAbsentReason({ text: "Specimen hemolyzed" })).toBe("unknown");
    expect(resolveAbsentReason({ coding: [{ code: "local-weirdness" }] })).toBe("unknown");
  });

  it("reads the first recognised coding and ignores unrecognised ones", () => {
    expect(resolveAbsentReason({ coding: [{ code: "vendor-specific" }, { code: "masked" }] })).toBe(
      "masked",
    );
  });

  it("classifies pending and error absences", () => {
    expect(isPendingAbsence(resolveAbsentReason({ coding: [{ code: "temp-unknown" }] }))).toBe(
      true,
    );
    expect(isPendingAbsence(resolveAbsentReason({ coding: [{ code: "not-asked" }] }))).toBe(false);
    expect(isErrorAbsence(resolveAbsentReason({ coding: [{ code: "unsupported" }] }))).toBe(true);
    expect(isErrorAbsence(resolveAbsentReason({ coding: [{ code: "unknown" }] }))).toBe(false);
  });

  it("labels every reason with a full statement, never an empty string", () => {
    // A label that renders as "" puts us back to a blank cell.
    for (const [reason, label] of Object.entries(ABSENT_REASON_LABEL)) {
      expect(label.length, reason).toBeGreaterThan(0);
      expect(label.trim(), reason).toBe(label);
    }
  });
});

describe("quantityParts", () => {
  it("preserves the comparator, because <0.01 is not 0.01", () => {
    expect(quantityParts({ value: 0.01, comparator: "<", unit: "ng/mL" })).toEqual({
      comparator: "<",
      value: "0.01",
      unit: "ng/mL",
    });
  });

  it("falls back to the UCUM code when there is no display unit", () => {
    expect(quantityParts({ value: 72, code: "/min" })?.unit).toBe("/min");
  });

  it("returns undefined rather than a blank for a value-less quantity", () => {
    expect(quantityParts(undefined)).toBeUndefined();
    expect(quantityParts({ unit: "mg/dL" })).toBeUndefined();
    expect(quantityParts({ value: Number.NaN })).toBeUndefined();
  });
});

describe("rangeGeometry", () => {
  it("centres an in-range value inside the normal band", () => {
    const g = rangeGeometry(4.3, { low: { value: 3.5 }, high: { value: 5.1 } })!;
    expect(g.offScale).toBe(false);
    expect(g.oneSided).toBe(false);
    expect(g.position).toBeGreaterThan(g.band[0]);
    expect(g.position).toBeLessThan(g.band[1]);
  });

  it("marks an extreme value as off scale instead of pinning it silently", () => {
    // A potassium of 12 must not render as merely "at the edge".
    const g = rangeGeometry(12, { low: { value: 3.5 }, high: { value: 5.1 } })!;
    expect(g.offScale).toBe(true);
    expect(g.position).toBe(1);
  });

  it("grows the scale so a moderately-out value is distinguishable", () => {
    // Regression: 6.8 and 12.0 both pinned to the same edge and read as the
    // same result, which throws away the distinction the bar exists for.
    const moderate = rangeGeometry(6.8, { low: { value: 3.5 }, high: { value: 5.1 } })!;
    const extreme = rangeGeometry(12, { low: { value: 3.5 }, high: { value: 5.1 } })!;
    expect(moderate.offScale).toBe(false);
    expect(moderate.position).toBeLessThan(extreme.position);
    expect(moderate.position).toBeGreaterThan(moderate.band[1]);
  });

  it("keeps the normal band visible even when the value is extreme", () => {
    // Growing without a ceiling would squash the band to a hairline.
    const g = rangeGeometry(400, { low: { value: 3.5 }, high: { value: 5.1 } })!;
    expect(g.band[1] - g.band[0]).toBeGreaterThan(0.1);
    expect(g.offScale).toBe(true);
  });

  it("refuses to draw when the range states no numeric bound", () => {
    // A text-only range cannot be positioned, and a drawn scale would imply
    // bounds nobody stated.
    expect(rangeGeometry(5, { text: "See report" })).toBeUndefined();
    expect(rangeGeometry(5, undefined)).toBeUndefined();
    expect(rangeGeometry(undefined, { low: { value: 1 } })).toBeUndefined();
  });

  it("flags one-sided ranges so the inferred end can be marked", () => {
    expect(rangeGeometry(4.9, { high: { value: 5.7 } })?.oneSided).toBe(true);
    expect(rangeGeometry(14, { low: { value: 12 } })?.oneSided).toBe(true);
  });

  it("refuses a malformed range rather than inverting it", () => {
    expect(rangeGeometry(5, { low: { value: 10 }, high: { value: 2 } })).toBeUndefined();
  });

  it("keeps the band and position inside the drawable space", () => {
    const g = rangeGeometry(0, { low: { value: 3.5 }, high: { value: 5.1 } })!;
    expect(g.position).toBeGreaterThanOrEqual(0);
    expect(g.position).toBeLessThanOrEqual(1);
    expect(g.band[0]).toBeGreaterThanOrEqual(0);
    expect(g.band[1]).toBeLessThanOrEqual(1);
  });
});

describe("datePrecision and formatClinicalDate", () => {
  it("reads the precision actually present", () => {
    expect(datePrecision("2026")).toBe("year");
    expect(datePrecision("2026-08")).toBe("month");
    expect(datePrecision("2026-08-03")).toBe("day");
    expect(datePrecision("2026-08-03T07:40:00Z")).toBe("time");
    expect(datePrecision("nonsense")).toBeUndefined();
  });

  it("never invents a day that was not recorded", () => {
    // The bug: rendering a year-only date as 1 January.
    expect(formatClinicalDate("2026", "America/New_York")).toBe("2026");
    expect(formatClinicalDate("2026-08", "America/New_York")).toBe("August 2026");
  });

  it("does not let a zone shift a date-only value across midnight", () => {
    // Read in a UTC-negative zone, a naive implementation renders 2 August.
    expect(formatClinicalDate("2026-08-03", "America/New_York", "en-US")).toContain("Aug 3");
  });

  it("applies the zone to a real instant", () => {
    const utc = formatClinicalDate("2026-08-03T02:00:00Z", "UTC", "en-US");
    const ny = formatClinicalDate("2026-08-03T02:00:00Z", "America/New_York", "en-US");
    expect(utc).not.toBe(ny);
    expect(ny).toContain("Aug 2"); // 02:00 UTC is the previous evening in New York
  });

  it("survives an invalid time zone instead of taking the screen down", () => {
    expect(formatClinicalDate("2026-08-03T07:40:00Z", "Not/AZone")).toBeTruthy();
  });

  it("detects future timestamps, which usually mean a data error", () => {
    const asOf = new Date("2026-08-03T00:00:00Z");
    expect(isFutureDate("2026-09-01T00:00:00Z", asOf)).toBe(true);
    expect(isFutureDate("2026-07-01T00:00:00Z", asOf)).toBe(false);
    expect(isFutureDate(undefined, asOf)).toBe(false);
  });
});

describe("formatAge", () => {
  const asOf = new Date("2026-08-03T12:00:00Z");

  it("uses days for a neonate rather than reporting zero years", () => {
    // A heart rate of 150 is an emergency in an adult and normal here, so
    // "0 y" is not an acceptable rendering.
    expect(formatAge("2026-07-28", asOf)).toBe("6 d");
  });

  it("uses months through infancy", () => {
    expect(formatAge("2025-10-03", asOf)).toBe("10 mo");
  });

  it("uses years from two onward", () => {
    expect(formatAge("1991-08-14", asOf)).toBe("34 y");
  });

  it("returns undefined rather than guessing", () => {
    expect(formatAge(undefined, asOf)).toBeUndefined();
    expect(formatAge("not-a-date", asOf)).toBeUndefined();
    expect(formatAge("2027-01-01", asOf)).toBeUndefined(); // born in the future
  });
});

describe("nameInitials", () => {
  it("takes first and last, skipping honorifics", () => {
    expect(nameInitials("Marisol Reyes-Okonkwo")).toBe("MO");
    expect(nameInitials("Dr Ana Lucia Duarte")).toBe("AD");
  });

  it("handles a single name and non-Latin scripts", () => {
    expect(nameInitials("Prince")).toBe("P");
    expect(nameInitials("张 伟")).toBe("张伟");
  });

  it("returns undefined rather than a placeholder glyph", () => {
    expect(nameInitials(undefined)).toBeUndefined();
    expect(nameInitials("   ")).toBeUndefined();
  });
});

describe("terminologyName", () => {
  it("names the systems it recognises", () => {
    expect(terminologyName("http://loinc.org")).toBe("LOINC");
    expect(terminologyName("http://snomed.info/sct")).toBe("SNOMED CT");
  });

  it("returns undefined for an unrecognised system rather than echoing the URI", () => {
    // Echoing the URI as a friendly name hides exactly the mapping problem
    // that is worth seeing.
    expect(terminologyName("http://example.org/local-codes")).toBeUndefined();
    expect(terminologyName(undefined)).toBeUndefined();
  });
});

describe("doseFormatIssues", () => {
  it("catches the two ISMP patterns behind tenfold errors", () => {
    // "1.0 mg" read past the point is 10 mg; ".5 mg" is 5 mg.
    expect(doseFormatIssues("1.0")).toContain("trailing-zero");
    expect(doseFormatIssues(".5")).toContain("naked-decimal");
    expect(doseFormatIssues("2.50")).toContain("trailing-zero");
  });

  it("passes a well-formed dose", () => {
    for (const value of ["1", "0.5", "2.5", "12.75", "100"]) {
      expect(doseFormatIssues(value), value).toEqual([]);
    }
  });

  it("treats empty as nothing to check, not as an error", () => {
    expect(doseFormatIssues("")).toEqual([]);
    expect(doseFormatIssues(undefined)).toEqual([]);
  });

  it("rejects non-numeric input outright", () => {
    expect(doseFormatIssues("ten")).toEqual(["not-a-number"]);
    expect(doseFormatIssues("1.2.3")).toEqual(["not-a-number"]);
  });

  it("offers the corrected form without applying it", () => {
    expect(safeDoseText("1.0")).toBe("1");
    expect(safeDoseText(".5")).toBe("0.5");
    expect(safeDoseText("2.50")).toBe("2.5");
    expect(safeDoseText("nonsense")).toBeUndefined();
  });
});

describe("weightBasedDose", () => {
  it("keeps the arithmetic, not just the answer", () => {
    const result = weightBasedDose(15, 3.2)!;
    expect(result.total).toBe(48);
    expect(result.workings).toBe("15 × 3.2 kg = 48");
  });

  it("caps at a documented maximum and says it capped", () => {
    const result = weightBasedDose(15, 90, 1000)!;
    expect(result.total).toBe(1000);
    expect(result.cappedAt).toBe(1000);
    expect(result.workings).toContain("capped at 1000");
  });

  it("refuses to calculate without a weight", () => {
    // Substituting an average weight turns a paediatric dose into an adult one.
    expect(weightBasedDose(15, undefined)).toBeUndefined();
    expect(weightBasedDose(15, 0)).toBeUndefined();
    expect(weightBasedDose(undefined, 70)).toBeUndefined();
    expect(weightBasedDose(15, Number.NaN)).toBeUndefined();
  });
});

describe("summariseProvenance", () => {
  it("separates when it happened from when it was written", () => {
    const summary = summariseProvenance({
      occurredDateTime: "2026-08-03T08:00:00Z",
      recorded: "2026-08-03T11:20:00Z",
      agent: [{ type: { coding: [{ code: "author" }] }, who: { display: "A. Bensouda" } }],
    });
    expect(summary.occurredAt).toBe("2026-08-03T08:00:00Z");
    expect(summary.recordedAt).toBe("2026-08-03T11:20:00Z");
    expect(summary.author).toBe("A. Bensouda");
    expect(summary.method).toBe("clinician");
  });

  it("distinguishes patient-reported and device data from clinician entry", () => {
    expect(
      summariseProvenance({ agent: [{ type: { coding: [{ code: "informant" }] } }] }).method,
    ).toBe("patient-reported");
    expect(
      summariseProvenance({ agent: [{ who: { reference: "Device/bp-monitor-4" } }] }).method,
    ).toBe("device");
  });

  it("says the source is unknown rather than guessing", () => {
    // A confident wrong attribution is worse than an honest gap.
    const summary = summariseProvenance(undefined);
    expect(summary.method).toBe("unknown");
    expect(summary.author).toBeUndefined();
    expect(summary.amended).toBe(false);
  });

  it("detects amendment from a version bump or a revision entity", () => {
    // A corrected result that looks identical to the original is a known harm.
    expect(summariseProvenance(undefined, { meta: { versionId: "3" } }).amended).toBe(true);
    expect(summariseProvenance(undefined, { meta: { versionId: "1" } }).amended).toBe(false);
    expect(summariseProvenance({ entity: [{ role: "revision" }] }).amended).toBe(true);
  });

  it("does not read an opaque or timestamp versionId as a revision count", () => {
    // Many servers stamp versionId with a time; every record would read amended.
    expect(summariseProvenance(undefined, { meta: { versionId: "1723456789012" } }).amended).toBe(
      false,
    );
    expect(summariseProvenance(undefined, { meta: { versionId: "20260803101500" } }).amended).toBe(
      false,
    );
    expect(summariseProvenance(undefined, { meta: { versionId: "2" } }).amended).toBe(true);
  });
});

describe("isFlagActive", () => {
  const asOf = new Date("2026-08-03T12:00:00Z");

  it("requires both an active status and a current period", () => {
    expect(isFlagActive({ status: "active" }, asOf)).toBe(true);
    expect(isFlagActive({ status: "inactive" }, asOf)).toBe(false);
    expect(isFlagActive({ status: "entered-in-error" }, asOf)).toBe(false);
  });

  it("drops a lapsed precaution rather than showing it greyed", () => {
    // A stale precaution on screen teaches staff to ignore all of them.
    expect(isFlagActive({ status: "active", period: { end: "2026-07-01" } }, asOf)).toBe(false);
  });

  it("ignores a precaution that has not started", () => {
    expect(isFlagActive({ status: "active", period: { start: "2026-09-01" } }, asOf)).toBe(false);
  });
});

describe("careTeamMembers", () => {
  const asOf = new Date("2026-08-03T00:00:00Z");
  const team = {
    participant: [
      { member: { display: "A. Bensouda" }, role: [{ text: "Psychiatrist" }] },
      {
        member: { display: "J. Whitfield" },
        role: [{ text: "Therapist" }],
        period: { end: "2026-03-01" },
      },
      { role: [{ text: "Unnamed" }] },
    ],
  };

  it("keeps ended memberships as history rather than deleting them", () => {
    // "Who was looking after them in March" is a question reviews ask.
    const members = careTeamMembers(team, asOf);
    expect(members).toHaveLength(2);
    expect(members.find((m) => m.name === "J. Whitfield")?.current).toBe(false);
    expect(members.find((m) => m.name === "A. Bensouda")?.current).toBe(true);
  });

  it("skips a participant it cannot name rather than inventing one", () => {
    expect(careTeamMembers(team, asOf).some((m) => m.role === "Unnamed")).toBe(false);
  });

  it("returns an empty list for a missing team", () => {
    expect(careTeamMembers(undefined)).toEqual([]);
  });
});

describe("date-only period bounds", () => {
  // 21:00 on 3 August in New York is already 4 August in UTC.
  const lastEvening = new Date("2026-08-04T01:00:00Z");
  const nextMorning = new Date("2026-08-04T13:00:00Z");
  const lastAfternoon = new Date("2026-08-03T15:00:00Z");

  it("keeps coverage active through the whole of its last day", () => {
    const coverage: Coverage = { status: "active", period: { end: "2026-08-03" } };
    expect(coverageState(coverage, lastAfternoon, "UTC")).toBe("active");
    expect(coverageState(coverage, lastEvening, "America/New_York")).toBe("active");
    expect(coverageState(coverage, nextMorning, "America/New_York")).toBe("lapsed");
  });

  it("starts coverage at the start of its first day in the evaluation zone", () => {
    const coverage: Coverage = { status: "active", period: { start: "2026-08-04" } };
    expect(coverageState(coverage, lastEvening, "America/New_York")).toBe("not-yet-effective");
    expect(coverageState(coverage, lastEvening, "UTC")).toBe("active");
  });

  it("keeps a flag and a care-team member current on their last day", () => {
    expect(
      isFlagActive({ status: "active", period: { end: "2026-08-03" } }, lastAfternoon, "UTC"),
    ).toBe(true);
    const team: CareTeam = {
      participant: [{ member: { display: "A. Bensouda" }, period: { end: "2026-08-03" } }],
    };
    expect(careTeamMembers(team, lastAfternoon, "UTC")[0]?.current).toBe(true);
    expect(careTeamMembers(team, nextMorning, "UTC")[0]?.current).toBe(false);
  });

  it("does not expire a prescription on its last valid day", () => {
    const request: MedicationRequest = {
      dispenseRequest: { validityPeriod: { end: "2026-08-03" } },
    };
    expect(isMedicationExpired(request, lastAfternoon, "UTC")).toBe(false);
    expect(isMedicationExpired(request, nextMorning, "UTC")).toBe(true);
  });

  it("reads a month-only end as the whole month", () => {
    const coverage: Coverage = { status: "active", period: { end: "2026-08" } };
    expect(coverageState(coverage, new Date("2026-08-31T12:00:00Z"), "UTC")).toBe("active");
    expect(coverageState(coverage, new Date("2026-09-01T12:00:00Z"), "UTC")).toBe("lapsed");
  });

  it("still compares a full instant as an instant", () => {
    const coverage: Coverage = { status: "active", period: { end: "2026-08-03T10:00:00Z" } };
    expect(coverageState(coverage, lastAfternoon, "UTC")).toBe("lapsed");
  });

  it("ignores an impossible calendar date rather than rolling it into March", () => {
    // V8 parses "2026-02-30" as 2 March.
    const coverage: Coverage = { status: "active", period: { end: "2026-02-30" } };
    expect(coverageState(coverage, new Date("2026-03-02T12:00:00Z"), "UTC")).toBe("active");
  });
});

describe("in a UTC-negative runtime zone", () => {
  const original = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = "America/New_York";
  });
  afterAll(() => {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  });

  it("does not age a patient on the evening before their birthday", () => {
    const eve = new Date(2026, 7, 2, 21); // 21:00 on 2 August, local
    expect(calculateAge("1990-08-03", eve)).toBe(35);
    expect(calculateAge("1990-08-03", new Date(2026, 7, 3, 9))).toBe(36);
  });

  it("counts a neonate's days by calendar date", () => {
    expect(formatAge("2026-07-28", new Date(2026, 7, 2, 21))).toBe("5 d");
  });

  it("reads age in a stated zone", () => {
    const at = new Date("2026-08-03T02:00:00Z"); // 22:00 on 2 August in New York
    expect(calculateAge("1990-08-03", at, "America/New_York")).toBe(35);
    expect(calculateAge("1990-08-03", at, "Asia/Kolkata")).toBe(36);
  });

  it("rejects an impossible birth date", () => {
    expect(calculateAge("1990-02-30", new Date(2026, 7, 3))).toBeUndefined();
  });

  it("shows an instant in marked UTC, never the runtime zone, when the zone is invalid", () => {
    // New York would read 03:40.
    const appointment = formatAppointmentTime(
      { start: "2026-08-03T07:40:00Z" },
      "Not/AZone",
      "en-US",
    );
    expect(appointment).toContain("7:40");
    expect(appointment).toContain("UTC");
    const clinical = formatClinicalDate("2026-08-03T07:40:00Z", "Not/AZone", "en-US");
    expect(clinical).toContain("7:40");
    expect(clinical).toContain("UTC");
  });

  it("evaluates a date-only bound in UTC, not the runtime zone, when the zone is invalid", () => {
    // 22:00 on 3 August in New York; 4 August in UTC.
    const coverage: Coverage = { status: "active", period: { end: "2026-08-03" } };
    expect(coverageState(coverage, new Date("2026-08-04T02:00:00Z"), "Not/AZone")).toBe("lapsed");
  });
});

describe("getInterpretation — what the payload does not prove", () => {
  const range = [{ low: { value: 70, unit: "mg/dL" }, high: { value: 100, unit: "mg/dL" } }];
  const potassium: ObservationReferenceRange[] = [{ low: { value: 3.5 }, high: { value: 5.1 } }];

  it("never reads an unrecognised interpretation as normal", () => {
    const value = { value: 85, unit: "mg/dL" };
    expect(
      getInterpretation({
        valueQuantity: value,
        referenceRange: range,
        interpretation: [{ coding: [{ code: "IND" }] }],
      }),
    ).toBe("unknown");
    expect(
      getInterpretation({
        valueQuantity: value,
        referenceRange: range,
        interpretation: [{ text: "Borderline" }],
      }),
    ).toBe("unknown");
  });

  it("does not judge a censored value in range unless it provably is", () => {
    const at = (quantity: Observation["valueQuantity"], ranges = potassium) =>
      getInterpretation({ valueQuantity: quantity, referenceRange: ranges });
    // "<5" could be below the low bound.
    expect(at({ value: 5, comparator: "<" })).toBe("unknown");
    expect(at({ value: 4, comparator: ">" })).toBe("unknown");
    // Everything below 0.01 is below 0.04.
    expect(at({ value: 0.01, comparator: "<" }, [{ high: { value: 0.04 } }])).toBe("normal");
    expect(at({ value: 10, comparator: ">" })).toBe("high");
    expect(at({ value: 2, comparator: "<=" })).toBe("low");
    expect(at({ value: 4, comparator: ">=" }, [{ low: { value: 3.5 } }])).toBe("normal");
  });

  it("leaves a value uninterpreted when its unit differs from the range's", () => {
    expect(
      getInterpretation({ valueQuantity: { value: 5.5, unit: "mmol/L" }, referenceRange: range }),
    ).toBe("unknown");
    expect(
      getComponentInterpretation({
        valueQuantity: { value: 85, unit: "mmol/L" },
        referenceRange: range,
      }),
    ).toBe("unknown");
  });

  it("matches units by UCUM code when both sides carry one", () => {
    const ucum = "http://unitsofmeasure.org";
    expect(
      getInterpretation({
        valueQuantity: { value: 85, unit: "mg/dl", system: ucum, code: "mg/dL" },
        referenceRange: [
          {
            low: { value: 70, unit: "mg/dL", system: ucum, code: "mg/dL" },
            high: { value: 100, unit: "mg/dL", system: ucum, code: "mg/dL" },
          },
        ],
      }),
    ).toBe("normal");
  });
});

describe("formatDosage", () => {
  it("renders a dose range", () => {
    expect(
      formatDosage({
        doseAndRate: [
          { doseRange: { low: { value: 1, unit: "tablet" }, high: { value: 2, unit: "tablet" } } },
        ],
      }),
    ).toBe("1 – 2 tablet");
  });

  it("renders a timing code such as BID", () => {
    expect(
      formatDosage({
        doseAndRate: [{ doseQuantity: { value: 500, unit: "mg" } }],
        timing: { code: { coding: [{ code: "BID" }] } },
      }),
    ).toBe("500 mg · BID");
  });

  it("renders an infusion rate", () => {
    expect(
      formatDosage({
        route: { text: "IV" },
        doseAndRate: [{ rateQuantity: { value: 100, unit: "mL/h" } }],
      }),
    ).toBe("IV · at 100 mL/h");
  });

  it("renders the maximum dose per period", () => {
    expect(
      formatDosage({
        doseAndRate: [{ doseQuantity: { value: 1, unit: "g" } }],
        asNeededBoolean: true,
        maxDosePerPeriod: {
          numerator: { value: 4, unit: "g" },
          denominator: { value: 1, code: "d" },
        },
      }),
    ).toBe("1 g · as needed · max 4 g per day");
    expect(
      formatDosage({
        maxDosePerPeriod: {
          numerator: { value: 4, unit: "g" },
          denominator: { value: 24, unit: "h" },
        },
      }),
    ).toBe("max 4 g per 24 h");
  });
});

describe("detectedIssueSeverity", () => {
  it("maps to the tiers that decide whether an alert may interrupt", () => {
    expect(detectedIssueSeverity({ severity: "high" })).toBe("critical");
    expect(detectedIssueSeverity({ severity: "moderate" })).toBe("high");
    expect(detectedIssueSeverity({ severity: "low" })).toBe("low");
  });

  it("defaults to info rather than assuming urgency", () => {
    expect(detectedIssueSeverity({})).toBe("info");
    expect(detectedIssueSeverity(undefined)).toBe("info");
  });
});
