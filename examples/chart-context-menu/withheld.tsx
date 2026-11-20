import { ChartContextMenu } from "@/components/zoblocks/chart-context-menu";
import ChartRow from "./_shared/ChartRow";
import { medicationActions, now, order } from "./_shared/chart";
import { Stage, useHostLog } from "./_shared/useHostLog";

export default function WithheldCounted() {
  const { handlers, log } = useHostLog();

  return (
    <Stage log={log}>
      <ChartContextMenu
        subject={order}
        actions={medicationActions}
        policy={{
          role: "a registered nurse",
          permitted: ["open", "copy", "history", "mar"],
          breakGlass: true,
        }}
        now={now}
        {...handlers}
      >
        {(trigger) => <ChartRow trigger={trigger} subject={order} aside="14:00" />}
      </ChartContextMenu>
    </Stage>
  );
}
