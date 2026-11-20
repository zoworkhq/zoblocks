export interface Observation {
  id: string;
  name: string;
  value: string;
  status: "normal" | "critical";
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
}

export interface Allergy {
  id: string;
  name: string;
  reaction: string;
}

// Eight observations in the latest Labs panel.
export const observationPanel: Observation[] = [
  {
    id: "obs-01",
    name: "Haemoglobin",
    value: "13.8 g/dL",
    status: "normal",
  },
  {
    id: "obs-02",
    name: "White blood cell count",
    value: "12.5 × 10⁹/L",
    status: "critical",
  },
  {
    id: "obs-03",
    name: "Platelets",
    value: "245 × 10⁹/L",
    status: "normal",
  },
  {
    id: "obs-04",
    name: "C-reactive protein",
    value: "86 mg/L",
    status: "critical",
  },
  {
    id: "obs-05",
    name: "Sodium",
    value: "139 mmol/L",
    status: "normal",
  },
  {
    id: "obs-06",
    name: "Potassium",
    value: "4.2 mmol/L",
    status: "normal",
  },
  {
    id: "obs-07",
    name: "Creatinine",
    value: "0.9 mg/dL",
    status: "normal",
  },
  {
    id: "obs-08",
    name: "Glucose",
    value: "98 mg/dL",
    status: "normal",
  },
];

// Critical status is derived from the observation data.
export function isCritical(observation: Observation): boolean {
  return observation.status === "critical";
}

// Five active medications.
export const medicationList: Medication[] = [
  {
    id: "med-01",
    name: "Paracetamol",
    dosage: "500 mg",
  },
  {
    id: "med-02",
    name: "Amoxicillin",
    dosage: "500 mg",
  },
  {
    id: "med-03",
    name: "Omeprazole",
    dosage: "20 mg",
  },
  {
    id: "med-04",
    name: "Cetirizine",
    dosage: "10 mg",
  },
  {
    id: "med-05",
    name: "Vitamin D",
    dosage: "1000 IU",
  },
];

// Four recorded allergies.
export const allergyList: Allergy[] = [
  {
    id: "allergy-01",
    name: "Penicillin",
    reaction: "Rash",
  },
  {
    id: "allergy-02",
    name: "Latex",
    reaction: "Contact dermatitis",
  },
  {
    id: "allergy-03",
    name: "Peanuts",
    reaction: "Swelling",
  },
  {
    id: "allergy-04",
    name: "Sulfonamides",
    reaction: "Rash",
  },
];

// Example identity.
export const patientRoutine = {
  id: "patient-routine",
  title: "Chart sections",
};
