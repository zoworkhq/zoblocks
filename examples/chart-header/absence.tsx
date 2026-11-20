import { ChartHeader } from "@/components/zoblocks/chart-header";
import { NOW, patient } from "./_shared/patient";

// No `safety` supplied. The strip still shows the two facts whose absence is the finding:
// safetyStrip({})
// → [{ kind: "allergy",     label: "Allergies not asked",     tone: "absent" },
//    { kind: "code-status", label: "Code status not recorded", tone: "absent" }]
export default function AbsenceExample() {
  return (
    <ChartHeader patient={patient} identifiers={[{ kind: "mrn" }, { kind: "nhs" }]} now={NOW} />
  );
}
