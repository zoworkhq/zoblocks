import type { GridValue } from "@/lib/zoblocks-grid";

export interface CaseloadRow {
  name: string;
  mrn: string;
  program: "IOP" | "PHP" | "Outpatient" | "ACT";
  phq9: GridValue;
  previousPhq9?: number;
  cssrs: GridValue;
  risk: number;
  due: string;
  clinician: string;
  photo: string;
}

export const CASELOAD: CaseloadRow[] = [
  {
    name: "Novak, K.",
    mrn: "5518203",
    program: "Outpatient",
    phq9: 11,
    previousPhq9: 13,
    cssrs: "Passive ideation",
    risk: 0.52,
    due: "Thu 16:00",
    clinician: "T. Boateng",
    photo: "/fixtures/patients/5518203.jpg",
  },
  {
    name: "Adeyemi, R.",
    mrn: "4471902",
    program: "IOP",
    phq9: 22,
    previousPhq9: 17,
    cssrs: "Ideation with plan",
    risk: 0.82,
    due: "Today 14:00",
    clinician: "A. Vance",
    photo: "/fixtures/patients/4471902.jpg",
  },
  {
    name: "Haddad, N.",
    mrn: "6690321",
    program: "IOP",
    phq9: 7,
    previousPhq9: 11,
    cssrs: "None reported",
    risk: 0.41,
    due: "Fri 18:20",
    clinician: "K. Marsh",
    photo: "/fixtures/patients/6690321.jpg",
  },
  {
    name: "Raman, A.",
    mrn: "3320145",
    program: "PHP",
    phq9: 18,
    previousPhq9: 15,
    cssrs: "Ideation, no plan",
    risk: 0.68,
    due: "Today 15:30",
    clinician: "A. Vance",
    photo: "/fixtures/patients/3320145.jpg",
  },
  {
    name: "Vasquez, I.",
    mrn: "2214870",
    program: "PHP",
    phq9: {
      absent: "awaiting",
      detail: "Assessment booked; the client has not completed it.",
    },
    cssrs: "Ideation, no plan",
    risk: 0.39,
    due: "Today 17:10",
    clinician: "S. Okafor",
    photo: "/fixtures/patients/2214870.jpg",
  },
  {
    name: "Lindqvist, S.",
    mrn: "7745012",
    program: "Outpatient",
    phq9: {
      absent: "restricted",
      detail: "Part 2 is restricted.",
    },
    cssrs: {
      absent: "restricted",
      detail: "Part 2 is restricted.",
    },
    risk: 0.19,
    due: "Mon 19:00",
    clinician: "T. Boateng",
    photo: "/fixtures/patients/7745012.jpg",
  },
];

export const ABSENCE_CASELOAD: CaseloadRow[] = [
  {
    name: "Petrov, D.",
    mrn: "8812034",
    program: "Outpatient",
    phq9: {
      absent: "not-recorded",
    },
    cssrs: "Passive ideation",
    risk: 0.35,
    due: "Tue 10:00",
    clinician: "T. Boateng",
    photo: "/fixtures/patients/8812034.jpg",
  },
  {
    name: "Nakamura, Y.",
    mrn: "9124501",
    program: "PHP",
    phq9: {
      absent: "refused",
    },
    cssrs: "None reported",
    risk: 0.31,
    due: "Tue 13:00",
    clinician: "K. Marsh",
    photo: "/fixtures/patients/9124501.jpg",
  },
  {
    name: "Adebayo, K.",
    mrn: "7352108",
    program: "IOP",
    phq9: {
      absent: "unknown",
    },
    cssrs: "None reported",
    risk: 0.28,
    due: "Wed 09:30",
    clinician: "S. Okafor",
    photo: "/fixtures/patients/7352108.jpg",
  },
];
