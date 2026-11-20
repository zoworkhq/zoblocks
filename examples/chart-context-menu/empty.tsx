import { ChartContextMenu } from "@/components/zoblocks/chart-context-menu";
import ChartRow from "./_shared/ChartRow";
import { medicationActions, now, order } from "./_shared/chart";
import { Stage, useHostLog } from "./_shared/useHostLog";

export default function TwoEmpties() {
  const { handlers, log } = useHostLog("Right-click each row. Two empty menus, two sentences.");

  return (
    <Stage log={log}>
      <ChartContextMenu subject={order} actions={[]} now={now} {...handlers}>
        {(trigger) => <ChartRow trigger={trigger} subject={order} caption="No actions defined" />}
      </ChartContextMenu>

      <ChartContextMenu
        subject={order}
        actions={medicationActions}
        policy={{ role: "a scheduling clerk", permitted: [], breakGlass: false }}
        now={now}
        {...handlers}
      >
        {(trigger) => (
          <ChartRow trigger={trigger} subject={order} caption="Signed in as a scheduling clerk" />
        )}
      </ChartContextMenu>
    </Stage>
  );
}
