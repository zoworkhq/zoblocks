import { SafetyPlan } from "@/components/zoblocks/safety-plan";
import { steps } from "./_shared/steps";

export default function CompletePatientPlanExample() {
  return <SafetyPlan steps={steps} revisedAt="2026-08-11" headingLevel={3} />;
}
