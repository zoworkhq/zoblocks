import { RecentPatientStack, type OpenChart } from "@/components/zoblocks/recent-patient-stack";

const now = "2026-08-24T10:20:00Z";

// "J. Okonkwo" and "J. Okonjo" look alike, so needsIdentifier() marks both,
// and both rows show their MRN. "T. Boateng" stays as it is.
const charts: OpenChart[] = [
  { id: "a", display: "J. Okonkwo", identifier: "093-441-208", reason: "Ward round" },
  { id: "b", display: "J. Okonjo", identifier: "093-118-774", reason: "Triage" },
  { id: "c", display: "T. Boateng", identifier: "093-772-115", reason: "Med review" },
];

export default function SimilarExample() {
  return <RecentPatientStack charts={charts} activeId="a" now={now} />;
}
