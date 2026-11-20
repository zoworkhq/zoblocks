import { ChartContextMenu } from "@/components/zoblocks/chart-context-menu";
import ChartRow from "./_shared/ChartRow";
import { now, potassium } from "./_shared/chart";
import { Stage, useHostLog } from "./_shared/useHostLog";

export default function SubmenuBeside() {
  const { handlers, log } = useHostLog("Right-click the result and open Trend.");

  return (
    <Stage log={log}>
      <ChartContextMenu
        subject={potassium}
        actions={[
          { id: "open", label: "Open result", tier: "routine", shortcut: "↵" },
          { id: "range", label: "Show reference range", tier: "routine" },
          {
            id: "trend",
            label: "Trend",
            tier: "routine",
            submenu: [
              { id: "t7", label: "Last 7 days", tier: "routine" },
              { id: "t30", label: "Last 30 days", tier: "routine" },
              { id: "t365", label: "Last year", tier: "routine" },
            ],
          },
        ]}
        now={now}
        {...handlers}
      >
        {(trigger) => <ChartRow trigger={trigger} subject={potassium} aside="09:12" />}
      </ChartContextMenu>
    </Stage>
  );
}
