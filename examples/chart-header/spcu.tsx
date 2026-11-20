import { useState } from "react";
import { ChartHeader, resolveSpcu } from "@/components/zoblocks/chart-header";
import { NOW, patientWithSpcu as patient } from "./_shared/patient";

type Surface = "orders" | "overview";

export default function SpcuExample() {
  const [surface, setSurface] = useState<Surface>("orders");

  // "orders"   → { value: "female", context: "for medication dosing", recorded: true }
  // "overview" → null — not a demographic
  const reading = resolveSpcu(patient, surface);

  return (
    <div className="grid gap-2.5">
      <div className="flex gap-2 text-[13px]">
        {(["orders", "overview"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSurface(s)}
            aria-pressed={surface === s}
            className={surface === s ? "font-semibold" : undefined}
          >
            {s === "orders" ? "Orders" : "Overview"}
          </button>
        ))}
      </div>
      <ChartHeader
        key={surface}
        patient={patient}
        identifiers={[{ kind: "mrn" }, { kind: "nhs" }]}
        now={NOW}
        surface={surface}
      />
      <span className="text-xs opacity-60">
        {reading
          ? "Orders: the sex parameter shows, with what it applies to."
          : "Overview: the same patient, the same field — not shown at all."}
      </span>
    </div>
  );
}
