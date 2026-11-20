import { ClinicalStatus, StatusLegend } from "@/components/zoblocks/clinical-status";

export default function ThreeShapes() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <ClinicalStatus scale="criticality" step="critical" />
        <ClinicalStatus scale="criticality" step="critical" density="compact" />
        <ClinicalStatus scale="criticality" step="critical" shape="dot" />
        <ClinicalStatus scale="criticality" step="critical" shape="affix" />
      </div>

      <StatusLegend scale="criticality" />
    </div>
  );
}
