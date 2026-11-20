import { ChartContextMenu, type ChartMenuAction } from "@/components/zoblocks/chart-context-menu";
import ChartRow from "./_shared/ChartRow";
import { copyAsText, now, nurse, openOrder, order, potassium } from "./_shared/chart";
import { Stage, useHostLog } from "./_shared/useHostLog";

const renew: ChartMenuAction = {
  id: "renew",
  label: "Renew for 90 days",
  tier: "clinical",
  applies: ["MedicationRequest"],
  confirm: "Issues a new order in your name.",
  availability: {
    status: "unavailable",
    reason: "Prescriber role required — you are signed in as a registered nurse",
  },
};

const releaseToPortal: ChartMenuAction = {
  id: "portal",
  label: "Release to patient portal",
  tier: "documented",
  applies: ["Observation"],
  records: "Publishes the value to the patient's portal immediately.",
  availability: {
    status: "unavailable",
    reason: "Preliminary results are not released. The lab has not verified this one.",
  },
};

export default function UnavailableInPlace() {
  const { handlers, log } = useHostLog();

  return (
    <Stage log={log}>
      <ChartContextMenu
        subject={order}
        actions={[openOrder, copyAsText, renew]}
        policy={nurse}
        now={now}
        {...handlers}
      >
        {(trigger) => <ChartRow trigger={trigger} subject={order} aside="14:00" />}
      </ChartContextMenu>

      <ChartContextMenu
        subject={potassium}
        actions={[{ id: "open", label: "Open result", tier: "routine" }, releaseToPortal]}
        now={now}
        {...handlers}
      >
        {(trigger) => <ChartRow trigger={trigger} subject={potassium} aside="09:12" />}
      </ChartContextMenu>
    </Stage>
  );
}
