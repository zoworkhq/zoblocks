import { ClinicalStatus, fromInterpretation } from "@/components/zoblocks/clinical-status";
import { observationPotassiumCritical } from "./_shared/observations";

export default function CriticalityFromFhir() {
  const code = observationPotassiumCritical.interpretation?.[0]?.coding?.[0]?.code;
  const step = fromInterpretation(code);

  // null rather than a guess when the code is unrecognised: a visible gap beats
  // a plausible lie.
  return step ? (
    <ClinicalStatus scale="criticality" step={step} qualifier="resulted 41 minutes ago" />
  ) : null;
}
