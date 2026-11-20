import { ClinicalStatus } from "@/components/zoblocks/clinical-status";

function Chips() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ClinicalStatus scale="criticality" step="critical" />
      <ClinicalStatus scale="criticality" step="high" />
      <ClinicalStatus scale="criticality" step="normal" />
      <ClinicalStatus scale="criticality" step="not-assessed" />
      <ClinicalStatus scale="access" step="restricted" />
      <ClinicalStatus scale="result-status" step="preliminary" />
    </div>
  );
}

export default function HueRemoved() {
  return (
    <div className="grid gap-3.5">
      <div className="grid gap-1.5">
        <p className="m-0 font-mono text-xs opacity-70">In colour</p>
        <Chips />
      </div>
      <div className="grid gap-1.5">
        <p className="m-0 font-mono text-xs opacity-70">Desaturated</p>
        <div style={{ filter: "grayscale(1)" }}>
          <Chips />
        </div>
      </div>
    </div>
  );
}
