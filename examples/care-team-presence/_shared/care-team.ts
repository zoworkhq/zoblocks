import type { Clinician } from "@/components/zoblocks/care-team-presence";

/** Synthetic clinicians. Ids and names are invented. */
export const marsh: Clinician = { id: "clin-2", display: "L. Marsh, LCSW", role: "Therapist" };
export const vance: Clinician = { id: "clin-4", display: "A. Vance, MD", role: "Attending" };
export const boateng: Clinician = {
  id: "clin-1",
  display: "T. Boateng, MD",
  role: "Night attending",
};
export const okafor: Clinician = {
  id: "clin-3",
  display: "N. Okafor, PMHNP",
  role: "Nurse practitioner",
};

/** The server's clock, not the browser's. */
export const serverTime = "2026-08-24T09:30:00+05:30";

/**
 * A synthetic FHIR CareTeam with a two-hour hole in its rota: nothing covers
 * 07:00–09:00 on the 24th.
 */
export const careTeamCoverageGap = {
  resourceType: "CareTeam",
  id: "syn-careteam-gap",
  status: "active",
  name: "Inpatient psychiatry — coverage with a gap",
  participant: [
    {
      role: [{ text: "Night attending" }],
      member: { reference: "Practitioner/syn-pr-4", display: "A. Vance, MD" },
      period: { start: "2026-08-23T19:00:00+05:30", end: "2026-08-24T07:00:00+05:30" },
    },
    {
      role: [{ text: "Attending" }],
      member: { reference: "Practitioner/syn-pr-1", display: "T. Boateng, MD" },
      period: { start: "2026-08-24T09:00:00+05:30", end: "2026-08-24T19:00:00+05:30" },
    },
  ],
};
