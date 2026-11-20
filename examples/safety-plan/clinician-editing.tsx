import { SafetyPlan } from "@/components/zoblocks/safety-plan";
import { steps } from "./_shared/steps";

export default function ClinicianEditingExample() {
  return (
    <SafetyPlan
      steps={steps}
      revisedAt="2026-08-11"
      headingLevel={3}
      pinCrisisStep={false}
      density="standard"
    />
  );
}
