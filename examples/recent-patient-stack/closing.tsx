import { useState } from "react";
import { RecentPatientStack, type OpenChart } from "@/components/zoblocks/recent-patient-stack";

const now = "2026-08-24T10:20:00Z";

const clean: OpenChart = { id: "clean", display: "A. Okonkwo", reason: "Ward round" };
const withNote: OpenChart = {
  id: "with-note",
  display: "T. Boateng",
  reason: "Discharge summary",
  work: [{ kind: "unsigned-note", label: "Progress note" }],
};
const withOrder: OpenChart = {
  id: "with-order",
  display: "L. Marsh",
  reason: "Triage",
  work: [{ kind: "draft-order", label: "Lithium level" }],
};

// canClose(clean)     → { kind: "close" }
// canClose(withNote)  → { kind: "confirm", reason: "… Close and lose the draft?" }
// canClose(withOrder) → { kind: "refuse",  reason: "… Sign it or discard it first." }
export default function ClosingExample() {
  const [open, setOpen] = useState([clean, withNote, withOrder]);
  const [last, setLast] = useState<string | null>(null);

  return (
    <div className="grid gap-1.5">
      <RecentPatientStack
        charts={open}
        activeId="clean"
        now={now}
        expanded
        onClose={(chart) => {
          setLast(`Closed — ${chart.display} had nothing to lose.`);
          setOpen((current) => current.filter((c) => c.id !== chart.id));
        }}
      />
      <span className="text-xs opacity-60">
        {last ??
          "Close each: the clean one closes, the unsigned note asks first, the draft order refuses outright."}
      </span>
    </div>
  );
}
