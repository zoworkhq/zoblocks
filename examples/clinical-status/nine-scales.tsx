import { ClinicalStatus, SCALES, SCALE_NAMES } from "@/components/zoblocks/clinical-status";

export default function NineScales() {
  return (
    <div className="grid w-full gap-4">
      {SCALE_NAMES.map((scale) => (
        <section key={scale} className="grid gap-1.5">
          <h3 className="m-0 font-mono text-xs font-normal opacity-70">{SCALES[scale].label}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            {SCALES[scale].steps.map((step) => (
              <ClinicalStatus key={step.id} scale={scale} step={step.id} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
