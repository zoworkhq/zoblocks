import { ChartContextMenu } from "@/components/zoblocks/chart-context-menu";
import ChartRow from "./_shared/ChartRow";
import { firstOrder, now, otherOrders } from "./_shared/chart";
import { Stage, useHostLog } from "./_shared/useHostLog";

export default function BulkSelection() {
  const { handlers, log } = useHostLog("Right-click the selection. Twelve orders, counted.");

  return (
    <Stage log={log}>
      <ChartContextMenu
        subject={{
          ...firstOrder,
          plural: "orders",
          bulkDetail: "Morning round",
          also: otherOrders.map((order) => ({ resource: "MedicationRequest", id: order.id })),
        }}
        actions={[
          { id: "copy", label: "Copy as text", tier: "routine", shortcut: "⌘C", bulk: "allowed" },
          {
            id: "dc",
            label: "Discontinue",
            tier: "clinical",
            applies: ["MedicationRequest"],
            confirm: "The next scheduled dose is 14:00 today. Discontinuing stops it.",
          },
        ]}
        now={now}
        {...handlers}
      >
        {(trigger) => (
          <ChartRow trigger={trigger} title="12 orders selected" caption="Morning round · Bay 4" />
        )}
      </ChartContextMenu>
    </Stage>
  );
}
