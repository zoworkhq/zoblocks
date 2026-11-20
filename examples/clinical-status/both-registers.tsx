import { ClinicalStatus } from "@/components/zoblocks/clinical-status";

export default function BothRegisters() {
  return (
    <div className="grid gap-3.5">
      {(["clinician", "patient"] as const).map((audience) => (
        <div key={audience} className="grid gap-1.5">
          <p className="m-0 font-mono text-xs opacity-70">{audience}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <ClinicalStatus scale="result-status" step="entered-in-error" audience={audience} />
            <ClinicalStatus scale="result-status" step="preliminary" audience={audience} />
            <ClinicalStatus scale="data-quality" step="self-reported" audience={audience} />
            <ClinicalStatus scale="access" step="part-2" audience={audience} />
            <ClinicalStatus scale="criticality" step="critical" audience={audience} />
          </div>
        </div>
      ))}
    </div>
  );
}
