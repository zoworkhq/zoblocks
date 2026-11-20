import { SafetyPlan } from "@/components/zoblocks/safety-plan";
import { steps } from "./_shared/steps";

// Two of six steps filled in. The other four still render, marked unfinished.
export default function UnfinishedPlanExample() {
  return (
    <SafetyPlan
      steps={{
        warningSigns: steps.warningSigns,
        professionals: steps.professionals,
      }}
      revisedAt="2026-08-11"
      headingLevel={3}
    />
  );
}
