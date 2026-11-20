import { ChartContextMenu, type ChartMenuAction } from "@/components/zoblocks/chart-context-menu";
import ChartRow from "./_shared/ChartRow";
import { history, now, openOrder, order, pharmacyReview } from "./_shared/chart";
import { Stage, useHostLog } from "./_shared/useHostLog";

const actions: ChartMenuAction[] = [
  openOrder,
  { id: "copy", label: "Copy as text", tier: "routine" },
  history,
  {
    id: "mar",
    label: "Add a note to the MAR",
    tier: "documented",
    applies: ["MedicationRequest"],
    records: "Writes a note on the medication record. Nursing sees it at the next round.",
  },
  pharmacyReview,
  {
    id: "dc",
    label: "Discontinue",
    tier: "clinical",
    applies: ["MedicationRequest"],
    confirm: "The next scheduled dose is 14:00 today. Discontinuing stops it.",
    confirmVerb: "Discontinue",
  },
];

export default function ConsequenceTiers() {
  const { handlers, log } = useHostLog("Try Copy, then the MAR note, then Discontinue.");

  return (
    <Stage log={log}>
      <ChartContextMenu subject={order} actions={actions} now={now} onRun={handlers.onRun}>
        {(trigger) => <ChartRow trigger={trigger} subject={order} aside="14:00" />}
      </ChartContextMenu>
    </Stage>
  );
}
