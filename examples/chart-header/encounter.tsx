import { ChartHeader, type EncounterOption } from "@/components/zoblocks/chart-header";
import { NOW, patient } from "./_shared/patient";

// Three open encounters: none is chosen for you.
// resolveEncounterContext(three)
// → { kind: "none", reason: "3 encounters are open — choose one before documenting" }
const three: EncounterOption[] = [
  { id: "enc-1", label: "Inpatient — Ward 4B", type: "inpatient" },
  { id: "enc-2", label: "Outpatient — 24 Aug, 09:00", type: "ambulatory" },
  { id: "enc-3", label: "Telehealth — 24 Aug, 14:00", type: "virtual" },
];

export default function EncounterExample() {
  return (
    <ChartHeader
      patient={patient}
      identifiers={[{ kind: "mrn" }, { kind: "nhs" }]}
      now={NOW}
      encounters={three}
    />
  );
}
