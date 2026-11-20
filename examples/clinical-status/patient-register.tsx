import { ClinicalStatus } from "@/components/zoblocks/clinical-status";

export default function PatientRegister() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ClinicalStatus scale="result-status" step="entered-in-error" />
      {/* renders "Recorded by mistake" */}
      <ClinicalStatus scale="result-status" step="entered-in-error" audience="patient" />
    </div>
  );
}
