import { ResultValue, fromObservation } from "@/components/zoblocks/result-value";
import { observationPotassiumCritical } from "./_shared/observations";

// `now` is the host's, never a clock this component reads: a relative time
// computed at render silently ages on a ward workstation left open all shift.
const serverTime = "2026-08-03T08:21:00Z";

export default function FromFhirExample() {
  return <ResultValue value={fromObservation(observationPotassiumCritical)} now={serverTime} />;
}
