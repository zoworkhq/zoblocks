import { describe, expect, it } from "vitest";
import {
  calculateAge,
  formatComponentValue,
  formatObservationValue,
  formatReferenceRange,
  getComponentInterpretation,
  getInterpretation,
  getPanelInterpretation,
  hasComponents,
  isRestricted,
  maskIdentifier,
  resolvePatientName,
  worstInterpretation,
} from "./helpers";
import type { Observation, Patient } from "./types";

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
  const asOf = new Date("2026-08-03T00:00:00Z");

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
        { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "HH" }] },
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
    expect(formatObservationValue({ dataAbsentReason: { text: "Specimen unsatisfactory" } })).toBeUndefined();
  });
});

describe("formatReferenceRange", () => {
  it("renders bounded, upper-only, and lower-only ranges", () => {
    expect(formatReferenceRange({ low: { value: 70 }, high: { value: 100, unit: "mg/dL" } })).toBe("70 – 100 mg/dL");
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
        { valueQuantity: { value: 80 }, referenceRange: [{ low: { value: 60 }, high: { value: 85 } }] },
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
