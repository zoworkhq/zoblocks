import { ChartContextMenu } from "@/components/zoblocks/chart-context-menu";
import ChartRow from "./_shared/ChartRow";
import { now, order } from "./_shared/chart";
import { Stage, useHostLog } from "./_shared/useHostLog";

export default function MedicationRow() {
  const { handlers, log } = useHostLog();

  return (
    <Stage log={log}>
      <ChartContextMenu
        subject={{
          resource: "MedicationRequest",
          id: order.id,
          label: "Lisinopril 10 mg",
          detail: "Oral · daily · started 4 Mar 2026",
        }}
        actions={[
          { id: "open", label: "Open order", tier: "routine", shortcut: "↵" },
          { id: "copy", label: "Copy as text", tier: "routine", shortcut: "⌘C" },
          { id: "history", label: "Administration history", tier: "routine" },
          {
            id: "mar",
            label: "Add a note to the MAR",
            tier: "documented",
            applies: ["MedicationRequest"],
            records: "Writes a note on the medication record. Nursing sees it at the next round.",
          },
        ]}
        now={now}
        onRun={handlers.onRun}
      >
        {(trigger) => <ChartRow trigger={trigger} subject={order} aside="14:00" />}
      </ChartContextMenu>
    </Stage>
  );
}
